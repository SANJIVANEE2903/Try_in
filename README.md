# RepoForge — ngrok Setup

Expose your local **LM Studio** (port 1234) and **n8n** (port 5678) to the internet using a single ngrok config file.

---

## 1. Install ngrok

**Mac (Homebrew)**
```bash
brew install ngrok
```

**Windows (Chocolatey)**
```powershell
choco install ngrok
```

**Linux**
```bash
curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok
```

Or download the binary directly from [ngrok.com/download](https://ngrok.com/download).

---

## 2. Add your Auth Token

Sign up at [ngrok.com](https://ngrok.com), then run:

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
```

Your token is available at: [dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)

---

## 3. Start Both Tunnels

Make sure **LM Studio** is running on port `1234` and **n8n** is running on port `5678`, then run:

```bash
ngrok start --all --config=ngrok.yml
```

---

## 4. Use the Startup Scripts

**Mac / Linux**
```bash
chmod +x start-ngrok.sh
./start-ngrok.sh
```

**Windows**
```powershell
start-ngrok.bat
```

---

## Tunnel Map

| Service   | Local Port | ngrok URL              |
|-----------|------------|------------------------|
| LM Studio | 1234       | shown in terminal      |
| n8n       | 5678       | shown in terminal      |

Copy the generated URLs and paste them into your `~/.repoforge/config.json`:
- `llm.endpoint` → LM Studio ngrok URL + `/v1`
- `n8n.webhook_base_url` → n8n ngrok URL + `/webhook-test`

---

## Troubleshooting

- **ERR_NGROK_108** — only one tunnel allowed on free plan. Upgrade to a paid plan or use two separate terminal sessions.
- **Browser warning page** — add the header `ngrok-skip-browser-warning: true` to your requests (RepoForge does this automatically).
- **Tunnel disconnects** — ngrok free sessions expire after ~2 hours. Restart the script when needed.
