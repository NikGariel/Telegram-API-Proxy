//Anonymous

const TELEGRAM_API = 'https://api.telegram.org';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400'
};

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    try {
        return await proxyRequest(request);
    } catch (error) {
        const isTimeout = error.name === 'AbortError';
        return jsonResponse(
            { ok: false, error: isTimeout ? 'Gateway timeout' : error.message },
            isTimeout ? 504 : 500
        );
    }
}

async function proxyRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api/, '');

    if (!path.startsWith('/bot')) {
        return jsonResponse({ ok: false, error: 'Invalid request path' }, 400);
    }

    const timeoutMs = 120_000;

    const targetUrl = TELEGRAM_API + path + url.search;

    const headers = new Headers();
    const allowedHeaders = ['content-type', 'x-telegram-bot-api-secret-token'];
    for (const name of allowedHeaders) {
        const value = request.headers.get(name);
        if (value) headers.set(name, value);
    }

    const requestBody = (request.method !== 'GET' && request.method !== 'HEAD')
        ? request.body
        : undefined;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(targetUrl, {
            method: request.method,
            headers,
            body: requestBody,
            signal: controller.signal,
            redirect: 'follow'
        });

        const responseHeaders = new Headers(CORS_HEADERS);
        const contentType = response.headers.get('content-type');
        if (contentType) responseHeaders.set('content-type', contentType);

        const responseBody = await response.arrayBuffer();

        return new Response(responseBody, {
            status: response.status,
            headers: responseHeaders
        });
    } finally {
        clearTimeout(timeout);
    }
}

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
}
