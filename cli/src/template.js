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

const FLOATING_UI_CSS = `
.mdrop-fab {
	position: fixed;
	bottom: 1.5rem;
	right: 1.5rem;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	z-index: 1000;
}
.mdrop-fab button {
	width: 40px;
	height: 40px;
	border-radius: 50%;
	border: 1px solid var(--fab-border, #d1d5db);
	background: var(--fab-bg, #ffffff);
	color: var(--fab-fg, #4b5563);
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0;
	transition: opacity 0.2s, transform 0.2s;
	box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}
.mdrop-fab button:hover {
	transform: scale(1.08);
}
.mdrop-fab button svg {
	width: 18px;
	height: 18px;
	fill: none;
	stroke: currentColor;
	stroke-width: 2;
	stroke-linecap: round;
	stroke-linejoin: round;
}
.mdrop-fab .mdrop-scroll-top {
	opacity: 0;
	pointer-events: none;
}
.mdrop-fab .mdrop-scroll-top.visible {
	opacity: 1;
	pointer-events: auto;
}
`;

const FLOATING_UI_HTML = `
<div class="mdrop-fab">
	<button class="mdrop-scroll-top" aria-label="Scroll to top" title="Scroll to top">
		<svg viewBox="0 0 24 24"><path d="M18 15l-6-6-6 6"/></svg>
	</button>
	<button class="mdrop-theme-toggle" aria-label="Toggle theme" title="Toggle theme">
		<svg class="icon-system" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
		<svg class="icon-light" viewBox="0 0 24 24" style="display:none"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
		<svg class="icon-dark" viewBox="0 0 24 24" style="display:none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
	</button>
</div>
`;

const FLOATING_UI_JS = `
<script>
(function(){
	var MODES = ['system','light','dark'];
	var btn = document.querySelector('.mdrop-theme-toggle');
	var scrollBtn = document.querySelector('.mdrop-scroll-top');
	var icons = {
		system: btn.querySelector('.icon-system'),
		light: btn.querySelector('.icon-light'),
		dark: btn.querySelector('.icon-dark')
	};

	function getStored() {
		try { return localStorage.getItem('mdrop-theme') || 'system'; } catch(e) { return 'system'; }
	}

	function apply(mode) {
		var html = document.documentElement;
		if (mode === 'system') {
			html.removeAttribute('data-theme');
		} else {
			html.setAttribute('data-theme', mode);
		}
		MODES.forEach(function(m) { icons[m].style.display = m === mode ? '' : 'none'; });
		try { localStorage.setItem('mdrop-theme', mode); } catch(e) {}
	}

	btn.addEventListener('click', function() {
		var current = getStored();
		var next = MODES[(MODES.indexOf(current) + 1) % MODES.length];
		apply(next);
	});

	// Scroll to top
	scrollBtn.addEventListener('click', function() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	});
	window.addEventListener('scroll', function() {
		scrollBtn.classList.toggle('visible', window.scrollY > 300);
	}, { passive: true });

	// Init
	apply(getStored());
})();
</script>
`;

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
${FLOATING_UI_CSS}
</style>
</head>
<body>
<article class="mdrop-article">
${content}
</article>
<footer class="mdrop-footer">
<span>shared via <a href="https://github.com/vincenthopf/mdrop">mdrop</a></span>
</footer>
${FLOATING_UI_HTML}
${FLOATING_UI_JS}
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
