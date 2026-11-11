/* AFTER CLASS on GitHub Pages.
   The site was written against a small server API (/api/records, /api/chronology, /api/wall, /api/assets).
   Pages has no server, so this worker answers those same requests from the browser:
   everything is kept in IndexedDB on the device and mirrored to a private GitHub repository you choose. */
const BASE = new URL(self.registration.scope).pathname;            // "/peter/"
const DB_NAME = 'after-class-pages', STATE_PATH = 'data/state.json', ASSET_DIR = 'assets/';
const KINDS = ['story','inspiration','manuscript','artwork','message','question','link','profile'];
const json = (data, status = 200) => new Response(JSON.stringify(data), {status, headers: {'content-type': 'application/json', 'cache-control': 'no-store'}});
const now = () => new Date().toISOString();
const emptyState = () => ({version: 1, records: [], gone: {}, assets: {}, chronology: {doc: {version: 1, story: [], message: []}, revision: 0, updated: null}, wall: {doc: null, revision: 0, updated: null}});

/* ---------- IndexedDB ---------- */
let dbPromise;
function db() {
  return dbPromise ||= new Promise((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, 1);
    open.onupgradeneeded = () => { open.result.createObjectStore('kv'); open.result.createObjectStore('blobs'); };
    open.onsuccess = () => resolve(open.result); open.onerror = () => reject(open.error);
  });
}
async function idb(store, mode, run) {
  const d = await db();
  return new Promise((resolve, reject) => { const tx = d.transaction(store, mode), req = run(tx.objectStore(store)); tx.oncomplete = () => resolve(req?.result); tx.onerror = tx.onabort = () => reject(tx.error); });
}
const kvGet = key => idb('kv', 'readonly', s => s.get(key));
const kvSet = (key, value) => idb('kv', 'readwrite', s => s.put(value, key));
const blobGet = id => idb('blobs', 'readonly', s => s.get(id));
const blobSet = (id, blob) => idb('blobs', 'readwrite', s => s.put(blob, id));
const blobDel = id => idb('blobs', 'readwrite', s => s.delete(id));

/* ---------- in-memory copy, loaded once per worker life ---------- */
let state, config, sync, loading;
function load() {
  return loading ||= (async () => {
    state = {...emptyState(), ...((await kvGet('state')) || {})};
    config = (await kvGet('config')) || null;                       // {owner, repo, token} | {local:true} | null
    sync = {sha: null, dirty: false, pendingAssets: [], goneAssets: [], lastSync: null, lastPull: 0, error: '', ...((await kvGet('sync')) || {})};
  })();
}
const saveState = () => kvSet('state', state);
const saveSync = () => kvSet('sync', sync);
const remote = () => !!(config && config.token);

/* ---------- GitHub ---------- */
const b64encode = bytes => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); };
async function gh(path, init = {}) {
  const res = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}${path ? '/' + path : ''}`, {...init, cache: 'no-store', headers: {authorization: `Bearer ${config.token}`, accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28', ...(init.headers || {})}});
  if (res.status === 401) throw Object.assign(Error('GitHub 令牌失效或没有权限，请在同步设置里重新填写。'), {status: 401});
  return res;
}
async function remoteState() {
  const meta = await gh(`contents/${STATE_PATH}`);
  if (meta.status === 404) return {sha: null, data: null};
  if (!meta.ok) throw Error(`读取云端内容失败（${meta.status}）`);
  const info = await meta.json();
  const raw = await gh(`git/blobs/${info.sha}`, {headers: {accept: 'application/vnd.github.raw+json'}});
  if (!raw.ok) throw Error(`读取云端内容失败（${raw.status}）`);
  return {sha: info.sha, data: JSON.parse(await raw.text())};
}
// Newer revision wins per record; whole documents (timeline, wall) are compared the same way.
function merge(local, other) {
  const out = {...emptyState(), ...local, gone: {...(other.gone || {}), ...(local.gone || {})}, assets: {...(other.assets || {}), ...(local.assets || {})}};
  const byId = new Map(local.records.map(r => [r.id, r]));
  for (const r of other.records || []) { const mine = byId.get(r.id); if (!mine || r.revision > mine.revision || (r.revision === mine.revision && r.updated > mine.updated)) byId.set(r.id, r); }
  out.records = [...byId.values()].filter(r => !out.gone[r.id]);
  for (const key of ['chronology', 'wall']) { const a = local[key], b = other[key]; if (b && (b.revision > a.revision || (b.revision === a.revision && (b.updated || '') > (a.updated || '')))) out[key] = b; }
  return out;
}
async function pull(force) {
  if (!remote() || (!force && Date.now() - sync.lastPull < 45000)) return;
  sync.lastPull = Date.now();
  const {sha, data} = await remoteState();
  if (sha && sha !== sync.sha && data) { state = sync.dirty ? merge(state, data) : {...emptyState(), ...data}; await saveState(); }
  sync.sha = sha; sync.lastSync = now(); sync.error = ''; await saveSync();
}
async function pushAssets() {
  for (const id of [...sync.pendingAssets]) {
    const blob = await blobGet(id);
    if (blob) {
      const res = await gh(`contents/${ASSET_DIR}${id}`, {method: 'PUT', body: JSON.stringify({message: `asset ${id}`, content: b64encode(new Uint8Array(await blob.arrayBuffer()))})});
      if (!res.ok && res.status !== 422) throw Error(`附件上传失败（${res.status}）`);                 // 422: already there
    }
    sync.pendingAssets = sync.pendingAssets.filter(x => x !== id); await saveSync();
  }
  for (const id of [...sync.goneAssets]) {
    const meta = await gh(`contents/${ASSET_DIR}${id}`);
    if (meta.ok) { const info = await meta.json(); await gh(`contents/${ASSET_DIR}${id}`, {method: 'DELETE', body: JSON.stringify({message: `remove asset ${id}`, sha: info.sha})}); }
    sync.goneAssets = sync.goneAssets.filter(x => x !== id); await saveSync();
  }
}
async function push() {
  await pushAssets();
  for (let attempt = 0; attempt < 3 && sync.dirty; attempt++) {
    const snapshot = JSON.stringify(state);
    const res = await gh(`contents/${STATE_PATH}`, {method: 'PUT', body: JSON.stringify({message: `sync ${now()}`, content: b64encode(new TextEncoder().encode(snapshot)), ...(sync.sha ? {sha: sync.sha} : {})})});
    if (res.ok) { sync.sha = (await res.json()).content.sha; if (JSON.stringify(state) === snapshot) sync.dirty = false; sync.lastSync = now(); sync.error = ''; await saveSync(); continue; }
    if (res.status === 409 || res.status === 422) { const other = await remoteState(); if (other.data) { state = merge(state, other.data); await saveState(); } sync.sha = other.sha; await saveSync(); continue; }
    throw Error(`保存到 GitHub 失败（${res.status}）`);
  }
}
let running = null, ticket = 0;
function syncNow(pullFirst) {
  return running ||= (async () => {
    try { if (!remote()) return; if (pullFirst) await pull(true); if (sync.dirty || sync.pendingAssets.length || sync.goneAssets.length) await push(); }
    catch (e) { sync.error = e.message || '同步失败'; await saveSync(); }
    finally { running = null; }
  })();
}
// Called after every change: save locally at once, then mirror to GitHub a moment later (coalescing bursts).
async function changed(event) {
  sync.dirty = true; await Promise.all([saveState(), saveSync()]);
  if (!remote()) return;
  const mine = ++ticket;
  event.waitUntil((async () => { await new Promise(r => setTimeout(r, 1800)); if (mine === ticket) { await syncNow(false); if (sync.dirty && mine === ticket) await syncNow(false); } })());
}

/* ---------- the API the site expects ---------- */
const present = r => r;
async function records(req, event) {
  if (req.method === 'GET') { try { await pull(false); } catch (e) { sync.error = e.message; } return json({records: [...state.records].sort((a, b) => b.date.localeCompare(a.date) || b.updated.localeCompare(a.updated)), initialized: true}); }
  if (req.method === 'POST') {
    let b; try { b = await req.json(); if (!b || typeof b !== 'object') throw 0; } catch { return json({error: '无法读取档案内容'}, 400); }
    if (!KINDS.includes(b.kind) || typeof b.title !== 'string' || !b.title.trim() || b.title.length > 180) return json({error: '请输入 1–180 字的标题'}, 400);
    if (typeof b.content !== 'string' || b.content.length > 250000) return json({error: '正文最多支持 25 万字'}, 400);
    if (!Array.isArray(b.tags) || b.tags.length > 30 || b.tags.some(t => typeof t !== 'string' || t.length > 80)) return json({error: '标签格式不正确'}, 400);
    if (b.date && !/^\d{4}-\d{2}-\d{2}$/.test(b.date)) return json({error: '日期格式不正确'}, 400);
    const data = b.data && typeof b.data === 'object' ? {...b.data} : {};
    if (data.files) {
      if (!Array.isArray(data.files) || data.files.length > 100) return json({error: '每则档案最多 100 个附件'}, 400);
      const safe = []; for (const f of data.files) { const meta = f && state.assets[f.id]; if (!meta) return json({error: '附件不存在，请重新上传'}, 400); safe.push({id: f.id, ...meta, url: `/api/assets/${f.id}`}); }
      data.files = safe;
    }
    if (b.kind === 'link') { try { const u = new URL(data.url || ''); if (!['http:', 'https:'].includes(u.protocol)) throw 0; } catch { return json({error: '请输入完整的 http 或 https 网站地址'}, 400); } }
    const prev = typeof b.id === 'string' ? state.records.find(r => r.id === b.id) : null, stamp = now();
    const fields = {kind: b.kind, title: b.title.trim(), content: b.content, tags: b.tags, data, date: b.date || stamp.slice(0, 10), favorite: !!b.favorite, deleted: !!b.deleted, updated: stamp};
    if (prev) {
      if (b.revision !== prev.revision) return json({error: '这则档案已在其他页面更新，请刷新页面后重新打开。'}, 409);
      const next = {...prev, ...fields, revision: prev.revision + 1}; state.records = state.records.map(r => r.id === prev.id ? next : r); await changed(event); return json({record: present(next)});
    }
    const made = {id: crypto.randomUUID(), ...fields, revision: 1}; state.records.push(made); await changed(event); return json({record: present(made)}, 201);
  }
  if (req.method === 'DELETE') {
    const id = new URL(req.url).searchParams.get('id'), record = state.records.find(r => r.id === id && r.deleted);
    if (!record) return json({error: '只能彻底删除回收站中的档案'}, 404);
    state.records = state.records.filter(r => r.id !== id); state.gone[id] = now();
    const elsewhere = JSON.stringify([state.records, state.wall.doc]);
    for (const f of record.data.files || []) if (!elsewhere.includes(f.id)) { delete state.assets[f.id]; await blobDel(f.id); if (sync.pendingAssets.includes(f.id)) sync.pendingAssets = sync.pendingAssets.filter(x => x !== f.id); else sync.goneAssets.push(f.id); }
    await changed(event); return json({ok: true});
  }
  return json({error: '不支持的操作'}, 405);
}
async function chronology(req, event) {
  if (req.method === 'GET') {
    try { await pull(false); } catch (e) { sync.error = e.message; }
    const kind = new Map(state.records.map(r => [r.id, r.kind])), doc = {...state.chronology.doc};
    doc.story = (doc.story || []).filter(p => kind.get(p.id) === 'story').map(p => ({...p, parentId: p.parentId && kind.get(p.parentId) !== 'story' ? null : p.parentId}));
    doc.message = (doc.message || []).filter(id => kind.get(id) === 'message');
    return json({doc, revision: state.chronology.revision, updated: state.chronology.updated});
  }
  if (req.method === 'PUT') {
    let b; try { b = await req.json(); } catch { return json({error: '无法读取时间目录'}, 400); }
    if (!b || !b.doc || b.doc.version !== 1 || !Array.isArray(b.doc.story) || !Array.isArray(b.doc.message) || !Number.isInteger(b.revision) || b.revision < 0) return json({error: '时间目录格式不正确'}, 400);
    if (b.revision !== state.chronology.revision) return json({error: '时间目录已在其他页面更新，请读取最新目录后再调整。'}, 409);
    const kind = new Map(state.records.map(r => [r.id, r.kind]));
    if (b.doc.story.some(p => kind.get(p.id) !== 'story') || b.doc.message.some(id => kind.get(id) !== 'message')) return json({error: '目录包含已删除或不属于你的时间点，请重新读取目录'}, 400);
    const old = state.chronology.doc, doc = {...b.doc};
    if (!('cast' in b.doc) && old.cast) doc.cast = old.cast; if (!('duo' in b.doc) && old.duo) doc.duo = old.duo;       // an older page must not erase newer sections
    state.chronology = {doc, revision: state.chronology.revision + 1, updated: now()}; await changed(event);
    return json({doc, revision: state.chronology.revision, updated: state.chronology.updated});
  }
  return json({error: '不支持的操作'}, 405);
}
async function wall(req, event) {
  if (req.method === 'GET') { try { await pull(false); } catch (e) { sync.error = e.message; } return json({...state.wall, scope: 'pages'}); }
  if (req.method === 'PUT') {
    let b; try { b = await req.json(); } catch { return json({error: '无法读取线索墙'}, 400); }
    if (!b || !b.doc || !Array.isArray(b.doc.nodes) || !Number.isInteger(b.revision) || b.revision < 0) return json({error: '缺少有效的保存版本'}, 400);
    if (b.revision !== state.wall.revision) return json({error: '另一页面或设备刚刚修改了线索墙。请先选择使用云端版本，或保留当前版本重新保存。', conflict: true, revision: state.wall.revision, doc: state.wall.doc}, 409);
    for (const n of b.doc.nodes) if (n.file) { const meta = state.assets[n.file.id]; if (!meta || !meta.type.startsWith('image/')) return json({error: '部分图片无法读取，请重新上传后再保存。'}, 400); n.file = {id: n.file.id, ...meta, url: `/api/assets/${n.file.id}`}; }
    state.wall = {doc: b.doc, revision: state.wall.revision + 1, updated: now()}; await changed(event);
    return json({revision: state.wall.revision, updated: state.wall.updated, doc: b.doc});
  }
  return json({error: '不支持的操作'}, 405);
}
async function assets(req, event, id) {
  if (!id && req.method === 'POST') {
    const f = (await req.formData()).get('file');
    if (!(f instanceof File) || !f.size) return json({error: '请选择非空文件'}, 400);
    if (f.size > 20 * 1024 * 1024) return json({error: '每个文件最多 20MB'}, 413);
    if (!/^(image\/(jpeg|png|gif|webp|avif|heic|heif)|application\/pdf|application\/vnd.openxmlformats-officedocument.wordprocessingml.document|text\/plain|text\/markdown)$/.test(f.type)) return json({error: '支持 JPG、PNG、GIF、WebP、HEIC、PDF、DOCX、TXT、Markdown 文件'}, 415);
    const made = crypto.randomUUID(); await blobSet(made, new Blob([await f.arrayBuffer()], {type: f.type}));
    state.assets[made] = {name: f.name, type: f.type, size: f.size}; sync.pendingAssets.push(made); await changed(event);
    return json({file: {id: made, name: f.name, type: f.type, size: f.size, url: `/api/assets/${made}`}}, 201);
  }
  if (id && req.method === 'GET') {
    const meta = state.assets[id]; if (!meta) return new Response('Not found', {status: 404});
    let blob = await blobGet(id);
    if (!blob && remote()) { const res = await gh(`contents/${ASSET_DIR}${id}`, {headers: {accept: 'application/vnd.github.raw+json'}}); if (res.ok) { blob = new Blob([await res.arrayBuffer()], {type: meta.type}); await blobSet(id, blob); } }
    if (!blob) return new Response('Not found', {status: 404});
    const attach = new URL(req.url).searchParams.has('download') || !/^(image\/|application\/pdf|text\/)/.test(meta.type);
    return new Response(blob, {headers: {'content-type': meta.type, 'content-disposition': `${attach ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(meta.name)}`, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff'}});
  }
  return json({error: '不支持的操作'}, 405);
}
const status = () => ({configured: !!config, mode: remote() ? 'github' : config ? 'local' : 'none', owner: config?.owner || '', repo: config?.repo || '', dirty: sync.dirty || sync.pendingAssets.length > 0 || sync.goneAssets.length > 0, pendingAssets: sync.pendingAssets.length, lastSync: sync.lastSync, error: sync.error, records: state.records.length});
async function control(req, path) {
  if (path === 'sync' && req.method === 'GET') return json(status());
  if (path === 'sync' && req.method === 'POST') { await syncNow(true); return json(status()); }
  if (path === 'config' && req.method === 'POST') {
    const b = await req.json().catch(() => null);
    if (b && b.local) { config = {local: true}; await kvSet('config', config); return json(status()); }
    if (!b || !/^[\w.-]{1,60}$/.test(b.owner || '') || !/^[\w.-]{1,100}$/.test(b.repo || '') || typeof b.token !== 'string' || b.token.length < 20 || b.token.length > 400) return json({error: '请完整填写用户名、仓库名和令牌。'}, 400);
    const trial = {owner: b.owner, repo: b.repo, token: b.token.trim()}, keep = config; config = trial;
    try {
      const res = await gh('');
      if (res.status === 404) throw Error('找不到这个仓库，或令牌没有它的权限。');
      if (!res.ok) throw Error(`GitHub 没有接受这次连接（${res.status}）。`);
      const info = await res.json();
      if (!info.private) throw Error('这个仓库是公开的。为了不让别人看到你的内容，请换一个私有仓库。');
      if (info.permissions && !info.permissions.push) throw Error('令牌对这个仓库只有读取权限，需要 Contents 的读写权限。');
    } catch (e) { config = keep; return json({error: e.message}, 400); }
    await kvSet('config', config); sync.sha = null; sync.lastPull = 0; sync.dirty = sync.dirty || state.records.length > 0 || !!state.wall.doc; await saveSync();
    await syncNow(true); return json(status());
  }
  if (path === 'config' && req.method === 'DELETE') { config = {local: true}; await kvSet('config', config); sync.error = ''; await saveSync(); return json(status()); }
  return json({error: '不支持的操作'}, 405);
}
async function api(event, url) {
  await load();
  const req = event.request, parts = url.pathname.replace(/^\/api\//, '').split('/');
  try {
    if (parts[0] === 'records') return await records(req, event);
    if (parts[0] === 'chronology') return await chronology(req, event);
    if (parts[0] === 'wall') return await wall(req, event);
    if (parts[0] === 'assets') return await assets(req, event, parts[1]);
    if (parts[0] === 'bootstrap') return json({ok: true});
    if (parts[0] === 'sync' || parts[0] === 'config') return await control(req, parts[0]);
    return json({error: '没有这个接口'}, 404);
  } catch (e) { return json({error: e.message || '操作未完成，请重试'}, 500); }
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  const inner = url.pathname.startsWith(BASE) ? '/' + url.pathname.slice(BASE.length) : url.pathname;
  if (inner.startsWith('/api/')) { event.respondWith(api(event, new URL(inner + url.search, url.origin))); return; }
  // The site refers to its pictures as "/images/…" and "/wall/…"; on Pages they live under the project path.
  if (!url.pathname.startsWith(BASE) && event.request.method === 'GET' && event.request.mode !== 'navigate') event.respondWith(fetch(BASE + url.pathname.slice(1) + url.search));
});
