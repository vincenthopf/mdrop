import { parseArgs } from 'node:util';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { exec } from 'node:child_process';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { renderMarkdown } from './render.js';
import { wrapHtml } from './template.js';
import { upload, listPages, deletePage } from './upload.js';
import { loadConfig, saveConfig } from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));

const THEMES = ['clean', 'brutalist', 'terminal', 'academic', 'playful'];
const isTTY = process.stdout.isTTY;

function createSpinner() {
	if (!isTTY) return { start() {}, message() {}, stop() {} };
	return p.spinner();
}

const HELP = `
${pc.bold('mDrop')} ${pc.dim(`v${pkg.version}`)} — share markdown files as styled HTML pages

${pc.bold('Usage:')}
  ${pc.blue('mdrop')} <file.md>                    Share with defaults (clean theme, 7d expiry)
  ${pc.blue('mdrop')} <file.md> --theme brutalist  Choose a theme
  ${pc.blue('mdrop')} <file.md> --expires 30d      Set link expiry
  ${pc.blue('mdrop')} <file.md> --expires never    Permanent link
  ${pc.blue('mdrop init')}                         Configure worker URL and API key
  ${pc.blue('mdrop list')}                         List shared pages
  ${pc.blue('mdrop delete')} <id>                  Delete a shared page
  ${pc.blue('mdrop preview')} <file.md>            Preview rendered HTML locally

${pc.bold('Themes:')} ${THEMES.join(', ')}
${pc.bold('Expiry:')} 1h, 6h, 12h, 1d, 7d, 30d, 90d, 365d, never ${pc.dim('(default: 7d)')}
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
		console.log(`mDrop ${pkg.version}`);
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
		if (!positionals[1]) throw new Error('Usage: mdrop preview <file.md>');
		await runPreview(positionals[1], values.theme);
		return;
	}

	// Default: share a file
	await runShare(command, values.theme, values.expires);
}

async function runInit() {
	p.intro(pc.bold('mDrop setup'));

	const workerUrl = await p.text({
		message: 'Worker URL',
		placeholder: 'https://mdrop.your-subdomain.workers.dev',
		validate(value) {
			if (!value) return 'Worker URL is required.';
			try {
				new URL(value);
			} catch {
				return 'Invalid URL.';
			}
		},
	});

	if (p.isCancel(workerUrl)) {
		p.cancel('Setup cancelled.');
		process.exit(0);
	}

	const apiKey = await p.password({
		message: 'API key',
		mask: '*',
		validate(value) {
			if (!value) return 'API key is required.';
		},
	});

	if (p.isCancel(apiKey)) {
		p.cancel('Setup cancelled.');
		process.exit(0);
	}

	saveConfig({
		workerUrl: workerUrl.replace(/\/+$/, ''),
		apiKey,
	});

	p.outro(`Configuration saved. Run ${pc.blue('mdrop <file.md>')} to share.`);
}

async function runShare(filePath, themeName, expiresStr) {
	if (!THEMES.includes(themeName)) {
		throw new Error(`Unknown theme: ${themeName}. Available: ${THEMES.join(', ')}`);
	}

	const absPath = resolve(filePath);
	if (!existsSync(absPath)) {
		throw new Error(`File not found: ${filePath}`);
	}

	const ttl = parseTtl(expiresStr);
	const source = readFileSync(absPath, 'utf-8');

	const s = createSpinner();

	s.start(`Rendering with ${pc.blue(themeName)} theme`);
	const { content, title } = await renderMarkdown(source);
	const html = wrapHtml(content, title, themeName);

	s.message('Uploading');
	const result = await upload(html, { ttl, title, theme: themeName });
	s.stop(pc.green('Done'));

	console.log(result.url);

	if (isTTY) {
		const expiryLabel = expiresStr === 'never' ? 'never' : expiresStr;
		p.log.info(`${pc.dim('Theme:')} ${themeName}  ${pc.dim('Expires:')} ${expiryLabel}`);
	}
}

async function runList() {
	loadConfig();
	const pages = await listPages();

	if (pages.length === 0) {
		if (isTTY) p.log.info('No shared pages.');
		else console.log('No shared pages.');
		return;
	}

	const header = `${'ID'.padEnd(10)} ${'Title'.padEnd(30)} ${'Theme'.padEnd(12)} ${'Created'.padEnd(22)} Size`;

	if (isTTY) {
		console.log();
		console.log(pc.bold(header));
		console.log(pc.dim('─'.repeat(85)));
	} else {
		console.log(header);
		console.log('─'.repeat(85));
	}

	for (const page of pages) {
		const created = page.created ? new Date(page.created).toLocaleString() : '—';
		const size = page.size ? formatSize(page.size) : '—';
		const title = (page.title || 'Untitled').slice(0, 28);
		const theme = page.theme || '—';

		if (isTTY) {
			console.log(
				`${pc.blue(page.id.padEnd(10))} ${title.padEnd(30)} ${pc.dim(theme.padEnd(12))} ${pc.dim(created.padEnd(22))} ${pc.dim(size)}`
			);
		} else {
			console.log(
				`${page.id.padEnd(10)} ${title.padEnd(30)} ${theme.padEnd(12)} ${created.padEnd(22)} ${size}`
			);
		}
	}

	if (isTTY) {
		const config = loadConfig();
		console.log();
		p.log.info(`View: ${pc.underline(config.workerUrl + '/<id>')}`);
	}
}

async function runDelete(id) {
	loadConfig();

	if (isTTY) {
		const confirmed = await p.confirm({
			message: `Delete page ${pc.blue(id)}?`,
			initialValue: false,
		});

		if (p.isCancel(confirmed) || !confirmed) {
			p.cancel('Cancelled.');
			process.exit(0);
		}
	}

	await deletePage(id);

	if (isTTY) p.log.success(`Deleted ${pc.blue(id)}`);
	else console.log(`Deleted: ${id}`);
}

async function runPreview(filePath, themeName) {
	if (!THEMES.includes(themeName)) {
		throw new Error(`Unknown theme: ${themeName}. Available: ${THEMES.join(', ')}`);
	}

	const absPath = resolve(filePath);
	if (!existsSync(absPath)) {
		throw new Error(`File not found: ${filePath}`);
	}

	const source = readFileSync(absPath, 'utf-8');

	const s = createSpinner();
	s.start(`Rendering with ${pc.blue(themeName)} theme`);

	const { content, title } = await renderMarkdown(source);
	const html = wrapHtml(content, title, themeName);

	s.stop('Rendered');

	const tmpFile = join(tmpdir(), `mdrop-preview-${Date.now()}.html`);
	writeFileSync(tmpFile, html);

	const openCmd =
		process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
	exec(`${openCmd} "${tmpFile}"`);

	if (isTTY) {
		p.log.success('Opened preview in browser');
		p.log.info(pc.dim(tmpFile));
	} else {
		console.log(tmpFile);
	}
}

function parseTtl(str) {
	if (!str || str === 'never') return 0;

	const match = str.match(/^(\d+)(h|d)$/);
	if (!match) {
		throw new Error(`Invalid expiry: ${str}. Use e.g., 1h, 7d, 30d, or never.`);
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
	if (isTTY) {
		p.cancel(err.message);
	} else {
		process.stderr.write(`Error: ${err.message}\n`);
	}
	process.exit(1);
});
