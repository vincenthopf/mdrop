---
name: mdrop
description: Share markdown files as styled HTML pages with a shareable link. Use /mdrop to share a file or set up mDrop.
user_invocable: true
---

# mDrop

Share any markdown file as a beautifully styled HTML page with one command.

## When to Use

- User says "share this markdown", "publish this", "mdrop this", or similar
- User wants to set up mDrop
- User asks to share a file as a webpage

## Check if Ready

```bash
mdrop --version 2>/dev/null && cat ~/.config/mdrop/config.json 2>/dev/null
```

**If both succeed** → Share the file (see below).

**If either fails** → Read `setup.md` in this skill directory for the full setup guide, then follow it.

## Share a File

```bash
mdrop <file> --theme <theme> --expires <duration>
```

**Themes:** clean (default), brutalist, terminal, academic, playful

**Expiry:** 1h, 7d, 30d, never (default: 7d)

If the user didn't specify a file, ask which one. If no theme specified, use the default. Return the URL.

## Other Commands

| Command | What it does |
|---------|-------------|
| `mdrop <file>` | Share with defaults (clean theme, 7d expiry) |
| `mdrop <file> -t brutalist -e 30d` | Share with theme + expiry |
| `mdrop preview <file>` | Preview locally before uploading |
| `mdrop list` | List all shared pages |
| `mdrop delete <id>` | Delete a shared page |

## Notes

- Always verify the file exists before running mdrop
- The CLI pre-renders HTML locally — only the final HTML is uploaded
- If sharing fails with 401, the API key is wrong — re-run setup
- If sharing fails with network error, the Worker URL is wrong
