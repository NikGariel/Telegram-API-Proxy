addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api/, '');
    const targetUrl = 'https://api.telegram.org' + path + url.search;

    return fetch(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body
    });
}
