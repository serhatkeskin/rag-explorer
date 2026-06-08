const BACKEND = "https://rag-api.projects.serhatkeskin.com";

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const target = `${BACKEND}${url.pathname}${url.search}`;

  const headers = new Headers(context.request.headers);
  headers.set("host", "rag-api.projects.serhatkeskin.com");

  const init = { method: context.request.method, headers };

  if (!["GET", "HEAD"].includes(context.request.method)) {
    init.body = context.request.body;
  }

  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Admin-Key",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      },
    });
  }

  const upstream = await fetch(target, init);
  const respHeaders = new Headers(upstream.headers);
  respHeaders.set("Access-Control-Allow-Origin", "*");

  return new Response(upstream.body, {
    status: upstream.status,
    headers: respHeaders,
  });
}
