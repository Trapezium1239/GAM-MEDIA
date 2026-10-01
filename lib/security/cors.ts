export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin');
  const allowed = process.env.CORS_ORIGINS?.split(',').map((s) => s.trim()) || [];

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'Authorization, Content-Type, X-Request-ID, Idempotency-Key',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true',
  };

  if (origin && (allowed.length === 0 || allowed.includes(origin))) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}

export function isCorsRequest(request: Request): boolean {
  return request.method === 'OPTIONS';
}

export function corsResponse(request: Request, status: number = 204): Response {
  return new Response(null, {
    status,
    headers: getCorsHeaders(request),
  });
}