# Deployment

## Quick Start (npm)

```bash
npm install -g opendocuments
opendocuments init
opendocuments start --port 3000
```

## Docker

### Cloud LLM

```bash
docker compose up -d
```

### Local LLM (Ollama)

```bash
docker compose --profile with-ollama up -d
```

### With Environment Variables

```bash
# Pass .env file
docker compose --env-file .env up -d

# Or set individually
OPENAI_API_KEY=sk-... docker compose up -d
```

### Custom Config

```bash
docker run -d \
  -v ./opendocuments.config.ts:/app/opendocuments.config.ts \
  -v opendocuments-data:/data \
  -p 3000:3000 \
  opendocuments
```

## Production Checklist

### Reverse Proxy (nginx)

```nginx
server {
    listen 443 ssl;
    server_name docs.company.com;

    ssl_certificate /etc/ssl/cert.pem;
    ssl_certificate_key /etc/ssl/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE streaming support
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
    }
}
```

### Security

- [ ] Enable `mode: 'team'` for multi-user deployments
- [ ] Set up HTTPS via reverse proxy
- [ ] Configure PII redaction if indexing sensitive documents
- [ ] Enable audit logging
- [ ] Set appropriate rate limits
- [ ] Use `.env` for all API keys (never commit to git)

### Data Persistence

| Data | Default Location | Docker Volume |
|------|-----------------|---------------|
| SQLite DB | `~/.opendocuments/opendocuments.db` | `opendocuments-data` |
| Vector DB | `~/.opendocuments/vectors/` | `opendocuments-data` |
| Config | `./opendocuments.config.ts` | Bind mount |

### Server Management

```bash
opendocuments start              # Start server
opendocuments start --port 8080  # Custom port
opendocuments stop               # Stop server
opendocuments doctor             # Health check
```

## MCP Server

Run as an MCP server for AI coding tools:

```bash
opendocuments start --mcp-only
```

Add to your AI tool's MCP config:

```json
{
  "mcpServers": {
    "opendocuments": {
      "command": "opendocuments",
      "args": ["start", "--mcp-only"]
    }
  }
}
```

Compatible with Claude Code, Cursor, Windsurf, and any MCP client.
