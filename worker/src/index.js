const MAX_BODY_SIZE = 5 * 1024 * 1024; // 5 MB

export default {
	async fetch(request, env) {
		try {
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
				return new Response('mDrop', { status: 200 });
			}

			return new Response('Method not allowed', { status: 405 });
		} catch (err) {
			return new Response(JSON.stringify({ error: err.message }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			});
		}
	},
};

async function handlePost(request, env, url) {
	if (!(await authorize(request, env))) {
		return new Response('Unauthorized', { status: 401 });
	}

	// Check body size before reading
	const contentLength = parseInt(request.headers.get('Content-Length') || '0', 10);
	if (contentLength > MAX_BODY_SIZE) {
		return new Response('Payload too large (max 5 MB)', { status: 413 });
	}

	const html = await request.text();
	if (!html) {
		return new Response('Empty body', { status: 400 });
	}
	if (html.length > MAX_BODY_SIZE) {
		return new Response('Payload too large (max 5 MB)', { status: 413 });
	}

	const id = crypto.randomUUID().slice(0, 8);
	const ttlHeader = request.headers.get('X-TTL');
	const titleRaw = request.headers.get('X-Title') || '';
	const title = titleRaw ? decodeURIComponent(titleRaw) : 'Untitled';
	const theme = request.headers.get('X-Theme') || 'clean';

	const options = {};
	if (ttlHeader && ttlHeader !== '0') {
		const ttl = parseInt(ttlHeader, 10);
		if (ttl >= 60) {
			options.expirationTtl = ttl;
		}
	}

	options.metadata = {
		title: title.slice(0, 200),
		theme,
		created: Date.now(),
		size: new TextEncoder().encode(html).length,
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
	if (!(await authorize(request, env))) {
		return new Response('Unauthorized', { status: 401 });
	}

	await env.PAGES.delete(id);
	return new Response(JSON.stringify({ deleted: id }), {
		headers: { 'Content-Type': 'application/json' },
	});
}

async function handleList(request, env) {
	if (!(await authorize(request, env))) {
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

async function authorize(request, env) {
	const auth = request.headers.get('Authorization') || '';
	const expected = `Bearer ${env.API_KEY}`;

	if (auth.length !== expected.length) {
		return false;
	}

	const encoder = new TextEncoder();
	const a = encoder.encode(auth);
	const b = encoder.encode(expected);

	return crypto.subtle.timingSafeEqual(a, b);
}
