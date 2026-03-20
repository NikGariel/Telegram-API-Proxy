export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/api/, '');
    const targetUrl = 'https://api.telegram.org' + path + url.search;

    return fetch(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body
    });
}
