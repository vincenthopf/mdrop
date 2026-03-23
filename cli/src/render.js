import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import tocPlugin from 'markdown-it-toc-done-right';
import taskLists from 'markdown-it-task-lists';
import { createHighlighter } from 'shiki';

let highlighterPromise = null;

function getHighlighter() {
	if (!highlighterPromise) {
		highlighterPromise = createHighlighter({
			themes: ['github-light', 'github-dark'],
			langs: [
				'javascript', 'typescript', 'python', 'bash', 'shell',
				'json', 'html', 'css', 'yaml', 'toml', 'markdown',
				'rust', 'go', 'java', 'c', 'cpp', 'ruby', 'php',
				'sql', 'graphql', 'dockerfile', 'diff', 'plaintext',
			],
		});
	}
	return highlighterPromise;
}

export async function renderMarkdown(source) {
	const shiki = await getHighlighter();

	const md = new MarkdownIt({
		html: false, // Disable raw HTML to prevent XSS in shared pages
		linkify: true,
		typographer: true,
		highlight(code, lang) {
			const language = lang && shiki.getLoadedLanguages().includes(lang) ? lang : 'plaintext';
			return shiki.codeToHtml(code, {
				lang: language,
				themes: { light: 'github-light', dark: 'github-dark' },
			});
		},
	});

	// Enable GFM strikethrough
	md.enable('strikethrough');

	md.use(anchor, {
		permalink: anchor.permalink.ariaHidden({ placement: 'before' }),
		slugify: (s) => s.toLowerCase().replace(/[^\w]+/g, '-').replace(/(^-|-$)/g, ''),
	});

	md.use(tocPlugin, {
		containerClass: 'mdrop-toc',
		listType: 'ul',
	});

	md.use(taskLists, { enabled: false, label: true });

	// Extract title from first h1, stripping inline markdown formatting
	const titleMatch = source.match(/^#\s+(.+?)(?:\s+#+)?$/m);
	const title = titleMatch
		? titleMatch[1].replace(/[*_~`[\]]/g, '').trim()
		: 'Untitled';

	// Auto-inject TOC placeholder if document has 3+ headings
	const headingCount = (source.match(/^#{1,6}\s/gm) || []).length;
	const sourceWithToc = headingCount >= 3 ? '${toc}\n\n' + source : source;

	const content = md.render(sourceWithToc);

	return { content, title };
}
