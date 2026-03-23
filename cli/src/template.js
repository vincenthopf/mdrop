import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const themeCache = new Map();

function loadTheme(name) {
	if (themeCache.has(name)) {
		return themeCache.get(name);
	}
	const cssPath = join(__dirname, 'themes', `${name}.css`);
	const css = readFileSync(cssPath, 'utf-8');
	themeCache.set(name, css);
	return css;
}

export function wrapHtml(content, title, themeName = 'clean') {
	const css = loadTheme(themeName);

	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
${css}
</style>
</head>
<body>
<article class="mdrop-article">
${content}
</article>
<footer class="mdrop-footer">
<span>shared via <a href="https://github.com/vincenthopf/mdrop">mdrop</a></span>
</footer>
</body>
</html>`;
}

function escapeHtml(str) {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}
