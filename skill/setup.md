# mDrop Setup Guide

Follow these steps to set up mDrop from scratch. This guide is for the agent — walk the user through each step.

## Step 1: Install the CLI

```bash
npm install -g mdrop
```

Verify:
```bash
mdrop --version
```

If npm is not available, check for pnpm, yarn, or bun and use whichever is installed.

## Step 2: Deploy a Worker

Ask the user if they already have an mDrop Worker deployed.

### If no — they need to deploy one

**Option A: One-click deploy (recommended)**

Tell the user to open this URL in their browser:

```
https://deploy.workers.cloudflare.com/?url=https://github.com/vincenthopf/mdrop/tree/main/worker
```

Walk them through:
1. Click "Deploy" — Cloudflare forks the repo, creates a Worker, provisions KV storage
2. Set their `API_KEY` secret when prompted — tell them to choose a strong random string and save it
3. After deploy completes, they'll see their Worker URL (e.g., `https://mdrop.username.workers.dev`)

Ask them to share the Worker URL and API key they chose.

**Option B: Manual deploy via wrangler**

If the user prefers CLI or the button doesn't work:

```bash
npx wrangler login
git clone https://github.com/vincenthopf/mdrop /tmp/mdrop-setup
cd /tmp/mdrop-setup/worker
npx wrangler kv namespace create "PAGES"
```

The output will contain a namespace ID. Update `wrangler.toml`:
```bash
sed -i '' "s/id = \"mdrop-pages\"/id = \"ACTUAL_ID_HERE\"/" wrangler.toml
```

Then deploy:
```bash
npx wrangler secret put API_KEY
# User enters their chosen key when prompted
npx wrangler deploy
```

The Worker URL is shown in the deploy output.

## Step 3: Configure the CLI

Write the config file directly (don't use interactive `mdrop init` — it doesn't work in non-TTY contexts):

```bash
mkdir -p ~/.config/mdrop
cat > ~/.config/mdrop/config.json << CONF
{
  "workerUrl": "WORKER_URL_HERE",
  "apiKey": "API_KEY_HERE"
}
CONF
chmod 600 ~/.config/mdrop/config.json
```

Replace `WORKER_URL_HERE` and `API_KEY_HERE` with the actual values from step 2. Strip any trailing slash from the Worker URL.

## Step 4: Verify

```bash
echo "# Test" > /tmp/mdrop-test.md
echo "Hello from mDrop" >> /tmp/mdrop-test.md
mdrop /tmp/mdrop-test.md
```

If this returns a URL, setup is complete. Clean up:
```bash
rm /tmp/mdrop-test.md
```

## Step 5: Custom Domain (optional)

If the user wants their pages at a custom domain:

1. The domain must be on Cloudflare DNS
2. Go to **Workers & Pages → mDrop Worker → Settings → Domains & Routes**
3. Click **Add → Custom Domain**
4. Enter the subdomain (e.g., `share.example.com`)

Then update the config:
```bash
cat > ~/.config/mdrop/config.json << CONF
{
  "workerUrl": "https://share.example.com",
  "apiKey": "THEIR_API_KEY"
}
CONF
chmod 600 ~/.config/mdrop/config.json
```

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `mdrop: command not found` | CLI not installed | `npm install -g mdrop` |
| `mdrop is not configured` | No config file | Run setup step 3 |
| `Upload failed (401)` | Wrong API key | Check key matches what was set in Worker |
| `Upload failed (fetch failed)` | Wrong Worker URL | Verify URL in config |
| `Payload too large (413)` | File > 5 MB | Split the file or reduce content |
