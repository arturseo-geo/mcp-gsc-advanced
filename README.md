# mcp-gsc-advanced

> Built by **[Artur Ferreira](https://github.com/arturseo-geo)** @ **[The GEO Lab](https://thegeolab.net)**
> [𝕏 @TheGEO_Lab](https://x.com/TheGEO_Lab) · [LinkedIn](https://linkedin.com/in/arturgeo) · [Reddit](https://www.reddit.com/user/Alternative_Teach_74/)

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Licence](https://img.shields.io/badge/licence-MIT-green)
![Claude Code](https://img.shields.io/badge/Claude_Code-MCP_Server-blueviolet)

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

---

## Attributions & Licence

Built and maintained by **[Artur Ferreira](https://github.com/arturseo-geo)** @ **[The GEO Lab](https://thegeolab.net)**.

Email: artur@thegeolab.net

### Best Practice Attribution

This MCP server was built following the open source Best Practice Approach —
reading community work for inspiration, then writing original content,
and crediting every source.

**Based on:**
- [Model Context Protocol specification](https://modelcontextprotocol.io) by Anthropic
- [MCP SDK](https://github.com/modelcontextprotocol/sdk) (MIT)

**GSC analysis concepts inspired by:**
- [Google Search Console API](https://developers.google.com/webmaster-tools/v1/api_reference_index) — official documentation
- [Aleyda Solís](https://aleydasolis.com/) — GSC cannibalization detection methodology
- [Kevin Indig / Growth Memo](https://growth-memo.com/) — GSC query analysis for AI search

**Dependencies:**
- [googleapis](https://github.com/googleapis/google-api-nodejs-client) — Google APIs Node.js client (Apache 2.0)

All server code is original writing. No files were copied or adapted from any source. MIT licence.

---

Found this useful? ⭐ Star the repo and connect:
[🌐 thegeolab.net](https://thegeolab.net) · [𝕏 @TheGEO_Lab](https://x.com/TheGEO_Lab) · [LinkedIn](https://linkedin.com/in/arturgeo) · [Reddit](https://www.reddit.com/user/Alternative_Teach_74/)

## Licence

MIT — see LICENSE
