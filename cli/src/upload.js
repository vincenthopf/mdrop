import { loadConfig } from './config.js';

export async function upload(html, { ttl, title, theme }) {
	const config = loadConfig();

	const headers = {
		'Authorization': `Bearer ${config.apiKey}`,
		'Content-Type': 'text/html',
		'X-Title': encodeURIComponent(title || 'Untitled'),
		'X-Theme': theme || 'clean',
	};

	if (ttl !== undefined && ttl !== null) {
		headers['X-TTL'] = String(ttl);
	}

	const response = await fetch(config.workerUrl, {
		method: 'POST',
		headers,
		body: html,
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Upload failed (${response.status}): ${text}`);
	}

	return response.json();
}

export async function listPages() {
	const config = loadConfig();

	const response = await fetch(`${config.workerUrl}/_list`, {
		headers: { 'Authorization': `Bearer ${config.apiKey}` },
	});

	if (!response.ok) {
		throw new Error(`List failed (${response.status})`);
	}

	return response.json();
}

export async function deletePage(id) {
	const config = loadConfig();

	const response = await fetch(`${config.workerUrl}/${id}`, {
		method: 'DELETE',
		headers: { 'Authorization': `Bearer ${config.apiKey}` },
	});

	if (!response.ok) {
		throw new Error(`Delete failed (${response.status})`);
	}

	return response.json();
}
