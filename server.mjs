import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 4173);
const types = { '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json','.json':'application/json' };
createServer((req,res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { 'Allow':'GET, HEAD' }); res.end('Method not allowed'); return; }
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400); res.end('Bad request'); return; }
  const target = resolve(normalize(join(root, pathname === '/' ? 'index.html' : pathname)));
  const fromRoot = relative(root, target);
  if (fromRoot.startsWith(`..${sep}`) || fromRoot === '..' || !existsSync(target) || !statSync(target).isFile()) { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': types[extname(target)] || 'application/octet-stream', 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'no-referrer', 'X-Frame-Options':'DENY', 'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'", 'Permissions-Policy':'camera=(), microphone=(), geolocation=()', 'Cache-Control': pathname === '/sw.js' ? 'no-cache' : 'public, max-age=3600' });
  if (req.method === 'HEAD') { res.end(); return; }
  createReadStream(target).pipe(res);
}).listen(port, () => console.log(`CrazeTools-V2 ready at http://localhost:${port}`));
