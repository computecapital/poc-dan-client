export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const upstream = process.env.NEXT_PUBLIC_API_URL;
  if (!upstream) {
    return new Response("Missing NEXT_PUBLIC_API_URL", { status: 500 });
  }

  const resourcePath = path.join("/");
  const url = `${upstream}/files/${resourcePath}`;

  // Forward Authorization and cc-auth from incoming request headers or cookies
  const incomingAuth = req.headers.get("authorization") || undefined;
  const incomingCcAuth = req.headers.get("cc-auth") || undefined;
  const cookieHeader = req.headers.get("cookie") || "";
  const cookiesMap = Object.fromEntries(
    cookieHeader
      .split(";")
      .map((c) => c.trim())
      .filter(Boolean)
      .map((c) => {
        const idx = c.indexOf("=");
        if (idx === -1) return [c, ""] as const;
        const k = decodeURIComponent(c.slice(0, idx));
        const v = decodeURIComponent(c.slice(idx + 1));
        return [k, v] as const;
      })
  );
  const cookieToken = cookiesMap["accessToken"];
  const cookieCcAuth = cookiesMap["cc-auth"];

  const headers: Record<string, string> = {};
  const bearer = incomingAuth || (cookieToken ? `Bearer ${cookieToken}` : undefined);
  if (bearer) headers["authorization"] = bearer;
  if (incomingCcAuth || cookieCcAuth) headers["cc-auth"] = incomingCcAuth || cookieCcAuth;

  const resp = await fetch(url, {
    headers,
    cache: "no-store",
  });

  const headersResponse = new Headers(resp.headers);
  // Remover cabeçalhos indesejados para resposta do Next
  headersResponse.delete("content-security-policy");
  headersResponse.delete("x-frame-options");

  return new Response(resp.body, {
    status: resp.status,
    headers: headersResponse,
  });
}
