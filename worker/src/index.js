/* =====================================================
   LIBER edit proxy — Cloudflare Worker
   ─────────────────────────────────────────────────────
   Routes:
     POST /api/login    { password }
       → { token: <session-token>, expiresAt: <ts> }
     GET  /api/file
       Authorization: Bearer <session-token>
       → { content, sha }   (proxies github get contents)
     PUT  /api/file
       Authorization: Bearer <session-token>
       body: { content, sha, message }
       → { sha }            (proxies github put contents)

   Sekrety wrangler:
     GITHUB_TOKEN
     ADMIN_PASSWORD
   Bindings (opcjonalne KV `RATE` do rate-limitu — wyłączone w v1)
   ===================================================== */

const REPO = 'Phantos7/Liber';
const FILE_PATH = 'index.html';
const BRANCH = 'main';
const SESSION_TTL = 6 * 60 * 60 * 1000; // 6h
const LOGIN_DELAY_MS = 700;             // brute-force slowdown
const ALLOWED_ORIGINS = [
  'https://phantos7.github.io',
  'http://localhost:5174',
  'http://localhost:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5173',
];

/* ---------- helpers ---------- */
function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(data, init = {}, origin = '') {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders(origin),
      ...(init.headers || {}),
    },
  });
}

async function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  if (aBytes.length !== bBytes.length) {
    // wciąż musimy zrobić jakąś pracę żeby nie ujawniać długości
    await crypto.subtle.digest('SHA-256', bBytes);
    return false;
  }
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i];
  return diff === 0;
}

async function signSession(payload, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
  );
  const data = JSON.stringify(payload);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const dataB64 = btoa(unescape(encodeURIComponent(data))).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${dataB64}.${sigB64}`;
}

async function verifySession(token, secret) {
  try {
    const [dataB64, sigB64] = (token || '').split('.');
    if (!dataB64 || !sigB64) return null;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
    );
    const sig = Uint8Array.from(atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const data = decodeURIComponent(escape(atob(dataB64.replace(/-/g, '+').replace(/_/g, '/'))));
    const ok = await crypto.subtle.verify('HMAC', key, sig, enc.encode(data));
    if (!ok) return null;
    const payload = JSON.parse(data);
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch (_) { return null; }
}

/* ---------- handlers ---------- */
async function handleLogin(request, env, origin) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad_json' }, { status: 400 }, origin); }
  const login = (body?.login || '').trim();
  const password = body?.password || '';

  // celowe opóźnienie żeby utrudnić brute force
  await new Promise(r => setTimeout(r, LOGIN_DELAY_MS));

  if (!env.ADMIN_PASSWORD || !env.ADMIN_LOGIN) {
    return json({ error: 'server_not_configured', msg: 'Brak konfiguracji na serwerze.' }, { status: 500 }, origin);
  }
  // Porównaj login (case-insensitive) i hasło niezależnie żeby nie ujawniać który źle
  const loginOk = await timingSafeEqual(login.toLowerCase(), env.ADMIN_LOGIN.toLowerCase());
  const passOk  = await timingSafeEqual(password, env.ADMIN_PASSWORD);
  if (!loginOk || !passOk) {
    return json({ error: 'invalid_credentials', msg: 'Nieprawidłowy login lub hasło.' }, { status: 401 }, origin);
  }

  const exp = Date.now() + SESSION_TTL;
  const session = await signSession({ sub: env.ADMIN_LOGIN, exp }, env.ADMIN_PASSWORD + (env.GITHUB_TOKEN || ''));
  return json({ token: session, expiresAt: exp, login: env.ADMIN_LOGIN }, {}, origin);
}

async function requireSession(request, env, origin) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  const payload = await verifySession(token, env.ADMIN_PASSWORD + (env.GITHUB_TOKEN || ''));
  if (!payload) return { error: json({ error: 'unauthorized' }, { status: 401 }, origin) };
  return { payload };
}

async function handleGetFile(request, env, origin) {
  const guard = await requireSession(request, env, origin);
  if (guard.error) return guard.error;

  const url = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}&t=${Date.now()}`;
  const r = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'liber-edit-worker',
    }
  });
  if (!r.ok) return json({ error: 'github_error', status: r.status, msg: await r.text() }, { status: r.status }, origin);
  const data = await r.json();
  return json({ content: data.content, sha: data.sha, encoding: data.encoding }, {}, origin);
}

async function handlePutFile(request, env, origin) {
  const guard = await requireSession(request, env, origin);
  if (guard.error) return guard.error;

  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad_json' }, { status: 400 }, origin); }
  const { content, sha, message } = body || {};
  if (!content || !sha) return json({ error: 'missing_fields' }, { status: 400 }, origin);

  const url = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;
  const r = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'liber-edit-worker',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: message || 'Edycja treści (panel)',
      content,           // base64 — przesyłamy taki sam jak przyszedł
      sha,
      branch: BRANCH,
    }),
  });
  const respText = await r.text();
  if (!r.ok) {
    let parsed;
    try { parsed = JSON.parse(respText); } catch { parsed = { raw: respText }; }
    return json({ error: 'github_error', status: r.status, ...parsed }, { status: r.status }, origin);
  }
  const data = JSON.parse(respText);
  return json({ sha: data.content.sha, commitSha: data.commit.sha }, {}, origin);
}

/* ---------- router ---------- */
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (url.pathname === '/api/login' && request.method === 'POST') {
      return handleLogin(request, env, origin);
    }
    if (url.pathname === '/api/file' && request.method === 'GET') {
      return handleGetFile(request, env, origin);
    }
    if (url.pathname === '/api/file' && request.method === 'PUT') {
      return handlePutFile(request, env, origin);
    }
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response('LIBER edit proxy · ok', { headers: corsHeaders(origin) });
    }

    return json({ error: 'not_found', path: url.pathname }, { status: 404 }, origin);
  },
};
