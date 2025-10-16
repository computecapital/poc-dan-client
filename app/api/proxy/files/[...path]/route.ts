export async function GET(
  req: Request,
  { params }: { params: { path: string[] } }
) {
  const auth = new URL(req.url).searchParams.get("auth");
  const upstream = process.env.NEXT_PUBLIC_API_URL;
  if (!upstream) {
    return new Response("Missing NEXT_PUBLIC_API_URL", { status: 500 });
  }

  const resourcePath = params.path.join("/");
  const url = `${upstream}/files/${resourcePath}`;

  const resp = await fetch(url, {
    headers: {
      ...(auth ? { "cc-auth": auth } : {}),
    },
    cache: "no-store",
  });

  const headers = new Headers(resp.headers);
  // Remover cabeçalhos indesejados para resposta do Next
  headers.delete("content-security-policy");
  headers.delete("x-frame-options");

  return new Response(resp.body, {
    status: resp.status,
    headers,
  });
}
