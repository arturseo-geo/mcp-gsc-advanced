#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const server = new Server(
  { name: 'mcp-gsc-advanced', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

function getAuth() {
  const keyFile = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (keyFile && fs.existsSync(keyFile)) {
    return new google.auth.GoogleAuth({ keyFile, scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
  }
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (clientEmail && privateKey) {
    return new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey.replace(/\\n/g, '\n') },
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
    });
  }
  throw new Error('Set GOOGLE_SERVICE_ACCOUNT_KEY (path) or GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY env vars');
}

function getSiteUrl() {
  return process.env.GSC_SITE_URL || 'https://thegeolab.net/';
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'detect_cannibalization',
      description: 'Detect keyword cannibalization — finds queries where 2+ pages compete for the same keyword. Shows impressions split, severity (Critical/Warning/Minor), and recommends which page to keep.',
      inputSchema: { type: 'object', properties: { site_url: { type: 'string', description: 'GSC site URL (default: from env)' }, days: { type: 'number', description: 'Lookback days (default 28)', default: 28 } }, required: [] }
    },
    {
      name: 'page_queries',
      description: 'Get all GSC queries driving traffic to a specific page — sorted by impressions. Shows clicks, CTR, position for each query.',
      inputSchema: { type: 'object', properties: { page_url: { type: 'string', description: 'Full page URL to analyze' }, days: { type: 'number', description: 'Lookback days (default 28)', default: 28 } }, required: ['page_url'] }
    },
    {
      name: 'rank_changes',
      description: 'Compare position changes between two periods. Finds queries that gained or lost significant positions.',
      inputSchema: { type: 'object', properties: { site_url: { type: 'string', description: 'GSC site URL' }, days: { type: 'number', description: 'Period length in days (default 7)', default: 7 } }, required: [] }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const auth = getAuth();
    const sc = google.searchconsole({ version: 'v1', auth });
    const siteUrl = args.site_url || getSiteUrl();
    const days = args.days || 28;
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

    if (name === 'detect_cannibalization') {
      const r = await sc.searchanalytics.query({ siteUrl, requestBody: {
        startDate, endDate, dimensions: ['query', 'page'], rowLimit: 25000
      }});

      const groups = {};
      (r.data.rows || []).forEach(row => {
        const q = row.keys[0];
        if (!groups[q]) groups[q] = [];
        groups[q].push({ page: row.keys[1], impressions: row.impressions || 0, clicks: row.clicks || 0, position: row.position || 0 });
      });

      const cannibalizations = [];
      for (const [query, pages] of Object.entries(groups)) {
        if (pages.length < 2) continue;
        const sig = pages.filter(p => p.impressions > 10);
        let severity = 'Minor';
        if (sig.length >= 3) severity = 'Critical';
        else if (sig.length >= 2) severity = 'Warning';

        const sorted = pages.sort((a, b) => b.impressions - a.impressions);
        cannibalizations.push({
          query, severity,
          totalImpressions: pages.reduce((s, p) => s + p.impressions, 0),
          totalClicks: pages.reduce((s, p) => s + p.clicks, 0),
          pageCount: pages.length, pages: sorted,
          recommendation: `Keep: ${sorted[0].page}`
        });
      }

      cannibalizations.sort((a, b) => b.totalImpressions - a.totalImpressions);

      return { content: [{ type: 'text', text: JSON.stringify({
        siteUrl, period: `${startDate} to ${endDate}`,
        total: cannibalizations.length,
        summary: {
          critical: cannibalizations.filter(c => c.severity === 'Critical').length,
          warning: cannibalizations.filter(c => c.severity === 'Warning').length,
          minor: cannibalizations.filter(c => c.severity === 'Minor').length
        },
        cannibalizations: cannibalizations.slice(0, 50)
      }, null, 2) }] };
    }

    if (name === 'page_queries') {
      const r = await sc.searchanalytics.query({ siteUrl, requestBody: {
        startDate, endDate, dimensions: ['query'],
        dimensionFilterGroups: [{ filters: [{ dimension: 'page', operator: 'equals', expression: args.page_url }] }],
        rowLimit: 25000
      }});

      const rows = (r.data.rows || []).sort((a, b) => b.impressions - a.impressions);
      return { content: [{ type: 'text', text: JSON.stringify({
        page: args.page_url, period: `${startDate} to ${endDate}`, total_queries: rows.length,
        queries: rows.map(row => ({
          query: row.keys[0], impressions: row.impressions, clicks: row.clicks,
          ctr: (row.ctr * 100).toFixed(2) + '%', position: row.position.toFixed(1)
        }))
      }, null, 2) }] };
    }

    if (name === 'rank_changes') {
      const prevStart = new Date(Date.now() - days * 2 * 86400000).toISOString().split('T')[0];
      const prevEnd = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

      const [current, previous] = await Promise.all([
        sc.searchanalytics.query({ siteUrl, requestBody: { startDate, endDate, dimensions: ['query'], rowLimit: 25000 } }),
        sc.searchanalytics.query({ siteUrl, requestBody: { startDate: prevStart, endDate: prevEnd, dimensions: ['query'], rowLimit: 25000 } })
      ]);

      const prevMap = {};
      (previous.data.rows || []).forEach(r => { prevMap[r.keys[0]] = r.position; });

      const changes = (current.data.rows || []).map(r => {
        const query = r.keys[0];
        const prevPos = prevMap[query];
        if (!prevPos) return null;
        const delta = prevPos - r.position;
        if (Math.abs(delta) < 2) return null;
        return { query, current_position: r.position.toFixed(1), previous_position: prevPos.toFixed(1), change: delta.toFixed(1), direction: delta > 0 ? 'improved' : 'declined', impressions: r.impressions };
      }).filter(Boolean).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

      return { content: [{ type: 'text', text: JSON.stringify({
        siteUrl, current_period: `${startDate} to ${endDate}`, previous_period: `${prevStart} to ${prevEnd}`,
        total_changes: changes.length,
        improved: changes.filter(c => c.direction === 'improved').length,
        declined: changes.filter(c => c.direction === 'declined').length,
        changes: changes.slice(0, 50)
      }, null, 2) }] };
    }

    return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('mcp-gsc-advanced running on stdio');
}

main().catch(console.error);
