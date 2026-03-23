export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const path = url.pathname.slice(1);

		if (request.method === 'POST') {
			return handlePost(request, env, url);
		}

		if (request.method === 'DELETE' && path) {
			return handleDelete(request, env, path);
		}

		if (request.method === 'GET') {
			if (path === '_list') {
				return handleList(request, env);
			}
			if (path) {
				return handleGet(env, path);
			}
			return new Response('mdrop', { status: 200 });
		}

		return new Response('Method not allowed', { status: 405 });
	},
};

async function handlePost(request, env, url) {
	if (!authorize(request, env)) {
		return new Response('Unauthorized', { status: 401 });
	}

	const html = await request.text();
	if (!html) {
		return new Response('Empty body', { status: 400 });
	}

	const id = crypto.randomUUID().slice(0, 8);
	const ttlHeader = request.headers.get('X-TTL');
	const title = request.headers.get('X-Title') || 'Untitled';
	const theme = request.headers.get('X-Theme') || 'clean';

	const options = {};
	if (ttlHeader && ttlHeader !== '0') {
		const ttl = parseInt(ttlHeader, 10);
		if (ttl >= 60) {
			options.expirationTtl = ttl;
		}
	}

	options.metadata = {
		title,
		theme,
		created: Date.now(),
		size: html.length,
	};

	await env.PAGES.put(id, html, options);

	return new Response(JSON.stringify({ url: `${url.origin}/${id}`, id }), {
		headers: { 'Content-Type': 'application/json' },
	});
}

async function handleGet(env, id) {
	const html = await env.PAGES.get(id);
	if (!html) {
		return new Response('Not found or expired', { status: 404 });
	}

	return new Response(html, {
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
			'Cache-Control': 'public, max-age=3600',
		},
	});
}

async function handleDelete(request, env, id) {
	if (!authorize(request, env)) {
		return new Response('Unauthorized', { status: 401 });
	}

	await env.PAGES.delete(id);
	return new Response(JSON.stringify({ deleted: id }), {
		headers: { 'Content-Type': 'application/json' },
	});
}

async function handleList(request, env) {
	if (!authorize(request, env)) {
		return new Response('Unauthorized', { status: 401 });
	}

	const list = await env.PAGES.list();
	const items = list.keys.map((key) => ({
		id: key.name,
		...key.metadata,
	}));

	return new Response(JSON.stringify(items), {
		headers: { 'Content-Type': 'application/json' },
	});
}

function authorize(request, env) {
	const auth = request.headers.get('Authorization');
	return auth === `Bearer ${env.API_KEY}`;
}
