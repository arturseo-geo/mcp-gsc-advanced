# mcp-gsc-advanced

MCP server for advanced Google Search Console analysis — keyword cannibalization detection, page-level query deep dive, and rank change tracking.

Extends basic GSC data into actionable SEO intelligence.

## Tools

| Tool | Description |
|------|-------------|
| `detect_cannibalization` | Find queries where 2+ pages compete — severity scoring, impressions split, consolidation recommendations |
| `page_queries` | All queries driving traffic to a specific page — sorted by impressions with CTR and position |
| `rank_changes` | Period-over-period position changes — finds significant gains and losses |

## Install

```bash
# Claude Code (service account key file)
claude mcp add gsc-advanced \
  -e GOOGLE_SERVICE_ACCOUNT_KEY=/path/to/service-account.json \
  -e GSC_SITE_URL=https://yoursite.com/ \
  -- npx mcp-gsc-advanced

# Or in .mcp.json
{
  "mcpServers": {
    "gsc-advanced": {
      "command": "npx",
      "args": ["mcp-gsc-advanced"],
      "env": {
        "GOOGLE_SERVICE_ACCOUNT_KEY": "/path/to/service-account.json",
        "GSC_SITE_URL": "https://yoursite.com/"
      }
    }
  }
}
```

## Authentication

Requires a Google service account with Search Console access.

**Option A:** Set `GOOGLE_SERVICE_ACCOUNT_KEY` to the path of your service account JSON file.

**Option B:** Set `GOOGLE_CLIENT_EMAIL` and `GOOGLE_PRIVATE_KEY` env vars directly.

Then add the service account email as a Full user in Google Search Console.

## Usage

```
> detect keyword cannibalization on my site
> what queries drive traffic to /geo-stack/ page?
> show rank changes in the last 7 days
```

## By [The GEO Lab](https://thegeolab.net)

Built by Artur Ferreira. Part of the GEO Lab SEO intelligence toolkit.
