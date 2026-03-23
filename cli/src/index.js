import { parseArgs } from 'node:util';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { exec } from 'node:child_process';
import { createInterface } from 'node:readline';
import { renderMarkdown } from './render.js';
import { wrapHtml } from './template.js';
import { upload, listPages, deletePage } from './upload.js';
import { loadConfig, saveConfig } from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));

const THEMES = ['clean', 'brutalist', 'terminal', 'academic', 'playful'];

const HELP = `
mdrop — share markdown files as styled HTML pages

Usage:
  mdrop <file.md>                    Share with defaults (clean theme, 7d expiry)
  mdrop <file.md> --theme brutalist  Choose a theme
  mdrop <file.md> --expires 30d      Set link expiry
  mdrop <file.md> --expires never    Permanent link
  mdrop init                         Configure worker URL and API key
  mdrop list                         List shared pages
  mdrop delete <id>                  Delete a shared page
  mdrop preview <file.md>            Preview rendered HTML locally

Themes: ${THEMES.join(', ')}
Expiry: 1h, 6h, 12h, 1d, 7d, 30d, 90d, 365d, never (default: 7d)
`;

async function main() {
	const { values, positionals } = parseArgs({
		allowPositionals: true,
		options: {
			theme: { type: 'string', short: 't', default: 'clean' },
			expires: { type: 'string', short: 'e', default: '7d' },
			help: { type: 'boolean', short: 'h', default: false },
			version: { type: 'boolean', short: 'v', default: false },
		},
	});

	if (values.version) {
		console.log(`mdrop ${pkg.version}`);
		return;
	}

	if (values.help || positionals.length === 0) {
		console.log(HELP);
		return;
	}

	const command = positionals[0];

	if (command === 'init') {
		await runInit();
		return;
	}

	if (command === 'list') {
		await runList();
		return;
	}

	if (command === 'delete' && positionals[1]) {
		await runDelete(positionals[1]);
		return;
	}

	if (command === 'preview') {
		const file = positionals[1];
		if (!file) {
			console.error('Usage: mdrop preview <file.md>');
			process.exit(1);
		}
		await runPreview(file, values.theme);
		return;
	}

	// Default: share a file
	await runShare(command, values.theme, values.expires);
}

async function runInit() {
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	const ask = (q) => new Promise((res) => rl.question(q, res));

	console.log('mdrop setup\n');

	const workerUrl = await ask('Worker URL (e.g., https://mdrop.your-subdomain.workers.dev): ');
	const apiKey = await ask('API key: ');

	rl.close();

	if (!workerUrl || !apiKey) {
		console.error('Both fields are required.');
		process.exit(1);
	}

	// Validate URL
	try {
		new URL(workerUrl);
	} catch {
		console.error('Invalid URL. Please enter a valid Worker URL.');
		process.exit(1);
	}

	saveConfig({
		workerUrl: workerUrl.replace(/\/+$/, ''),
		apiKey,
	});

	console.log('\nConfiguration saved. You can now run `mdrop <file.md>` to share.');
}

async function runShare(filePath, themeName, expiresStr) {
	if (!THEMES.includes(themeName)) {
		console.error(`Unknown theme: ${themeName}. Available: ${THEMES.join(', ')}`);
		process.exit(1);
	}

	const absPath = resolve(filePath);
	if (!existsSync(absPath)) {
		console.error(`File not found: ${filePath}`);
		process.exit(1);
	}

	const ttl = parseTtl(expiresStr);
	const source = readFileSync(absPath, 'utf-8');

	console.log(`Rendering with ${themeName} theme...`);
	const { content, title } = await renderMarkdown(source);
	const html = wrapHtml(content, title, themeName);

	console.log('Uploading...');
	const result = await upload(html, { ttl, title, theme: themeName });

	console.log(`\n${result.url}`);
}

async function runList() {
	const config = loadConfig();
	const pages = await listPages();

	if (pages.length === 0) {
		console.log('No shared pages.');
		return;
	}

	console.log(`\n${'ID'.padEnd(10)} ${'Title'.padEnd(30)} ${'Theme'.padEnd(12)} ${'Created'.padEnd(22)} Size`);
	console.log('─'.repeat(85));

	for (const page of pages) {
		const created = page.created ? new Date(page.created).toLocaleString() : '—';
		const size = page.size ? formatSize(page.size) : '—';
		const title = (page.title || 'Untitled').slice(0, 28);
		const theme = page.theme || '—';

		console.log(
			`${page.id.padEnd(10)} ${title.padEnd(30)} ${theme.padEnd(12)} ${created.padEnd(22)} ${size}`
		);
	}

	console.log(`\nView: ${config.workerUrl}/<id>`);
}

async function runDelete(id) {
	loadConfig(); // validates config exists
	await deletePage(id);
	console.log(`Deleted: ${id}`);
}

async function runPreview(filePath, themeName) {
	if (!THEMES.includes(themeName)) {
		console.error(`Unknown theme: ${themeName}. Available: ${THEMES.join(', ')}`);
		process.exit(1);
	}

	const absPath = resolve(filePath);
	if (!existsSync(absPath)) {
		console.error(`File not found: ${filePath}`);
		process.exit(1);
	}

	const source = readFileSync(absPath, 'utf-8');

	console.log(`Rendering with ${themeName} theme...`);
	const { content, title } = await renderMarkdown(source);
	const html = wrapHtml(content, title, themeName);

	const tmpFile = join(tmpdir(), `mdrop-preview-${Date.now()}.html`);
	writeFileSync(tmpFile, html);

	const openCmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
	exec(`${openCmd} "${tmpFile}"`);

	console.log(`Preview: ${tmpFile}`);
}

function parseTtl(str) {
	if (!str || str === 'never') return 0;

	const match = str.match(/^(\d+)(h|d)$/);
	if (!match) {
		console.error(`Invalid expiry: ${str}. Use e.g., 1h, 7d, 30d, or never.`);
		process.exit(1);
	}

	const num = parseInt(match[1], 10);
	const unit = match[2];

	if (unit === 'h') return num * 3600;
	if (unit === 'd') return num * 86400;
	return 604800; // fallback: 7 days
}

function formatSize(bytes) {
	if (bytes < 1024) return `${bytes}B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

main().catch((err) => {
	console.error(`Error: ${err.message}`);
	process.exit(1);
});
