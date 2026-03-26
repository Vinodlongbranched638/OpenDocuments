# OpenDocs

> Self-hosted open-source RAG platform that unifies scattered organizational documents and answers natural language queries with accurate, source-cited responses.

## Quick Start

```bash
npm install -g @opendocs/cli
opendocs init
opendocs start
```

Then open http://localhost:3000 in your browser.

## CLI Commands

```bash
opendocs init              # Interactive setup wizard
opendocs start             # Start server (Web UI + API + MCP)
opendocs start --mcp-only  # MCP server for Claude Code / Cursor
opendocs index ./docs      # Index local files
opendocs ask "question"    # Ask from CLI
opendocs doctor            # System health check
opendocs config            # View configuration
```

## Supported File Formats

| Format | Extension |
|--------|-----------|
| Markdown | .md, .mdx |
| Plain Text | .txt |
| PDF | .pdf |
| Word | .docx |
| Excel/CSV | .xlsx, .xls, .csv |
| HTML | .html, .htm |
| Jupyter | .ipynb |

## Model Providers

- **Ollama** (local) -- default
- **OpenAI** (GPT-4o)
- **Anthropic** (Claude)
- **Google** (Gemini)
- **Grok** (xAI)

## Development

```bash
git clone https://github.com/opendocs/opendocs
cd opendocs
npm run setup    # Install + build
npm run test     # Run all tests
```

## License

MIT
