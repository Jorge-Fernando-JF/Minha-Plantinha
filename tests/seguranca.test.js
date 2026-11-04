'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { iniciar } = require('../server/index.js');

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

async function subir(extra = {}) {
  const ctx = await iniciar(Object.assign({ DB_FILE: ':memory:', RATE_AUTH_MAX: '1000', RATE_API_MAX: '10000' }, extra));
  const srv = await new Promise(r => { const s = ctx.app.listen(0, () => r(s)); });
  const base = 'http://localhost:' + srv.address().port;
  const cliente = () => {
    let cookie = '';
    const c = async (m, p, body, h = {}) => {
      const r = await fetch(base + p, { method: m, redirect: 'manual', headers: { 'Content-Type': 'application/json', 'X-MP-CSRF': '1', Origin: base, ...(cookie ? { Cookie: cookie } : {}), ...h }, body: body === undefined ? undefined : JSON.stringify(body) });
      const sc = r.headers.get('set-cookie'); if (sc) { const v = sc.split(';')[0]; cookie = v.endsWith('=') ? '' : v; }
      let j = null; try { j = await r.json(); } catch (_) { /* sem corpo */ }
      return { s: r.status, j, h: r.headers, raw: sc };
    };
    return c;
  };
  return { ...ctx, base, cliente, fechar: () => srv.close() };
}
const reg = (c, email, nome = 'Ana', nasc = '1990-05-05') => c('POST', '/api/auth/register', { email, senha: 'segredo1', nome, nascimento: nasc });

test('1. usuário comum não acessa dados de outra conta', async (t) => {
  const S = await subir(); t.after(S.fechar);
  const a = S.cliente(), b = S.cliente();
  await reg(a, 'a@x.com'); await reg(b, 'b@x.com', 'Beto');
  assert.equal((await a('PUT', '/api/dados', { itens: { diario: [{ id: 1, nota: 'segredo da Ana' }] } })).s, 200);
  const rb = await b('GET', '/api/dados');
  assert.equal(JSON.stringify(rb.j).includes('segredo da Ana'), false);
  for (const p of ['/api/dados/1', '/api/dados?usuario=1', '/api/dados?id=1']) {
    const r = await b('GET', p); assert.equal(JSON.stringify(r.j || {}).includes('segredo da Ana'), false);
  }
  assert.equal((await b('PUT', '/api/dados', { itens: { diario: [] }, usuarioId: 1 })).s, 200);
  assert.equal(JSON.stringify((await a('GET', '/api/dados')).j).includes('segredo da Ana'), true, 'a escrita de B não pode afetar A');
});

test('2. usuário comum não executa operações administrativas nem se promove', async (t) => {
  const S = await subir(); t.after(S.fechar);
  const a = S.cliente(); await reg(a, 'a@x.com');
  assert.equal((await a('POST', '/api/admin/modo', { ativo: true })).s, 403);
  assert.equal((await a('POST', '/api/admin/conquistas/liberar', { id: 'tres-dias' })).s, 403);
  assert.equal((await a('POST', '/api/admin/conquistas/liberar', { id: 'tres-dias', email: 'a@x.com' })).s, 403);
  await a('PUT', '/api/dados', { itens: { perfil: { adminAtivo: true, admin: true, papel: 'admin' } } });
  const perfil = (await a('GET', '/api/dados')).j.dados.perfil;
  assert.equal(perfil.adminAtivo, false); assert.equal(perfil.admin, undefined); assert.equal(perfil.papel, undefined);
  const forjada = await a('PUT', '/api/dados', { itens: { conquistasMeta: { 'tres-dias': { desbloqueadaEm: new Date().toISOString(), origem: 'admin' } } } });
  assert.equal(forjada.s, 422);
  assert.equal((await a('GET', '/api/auth/me')).j.admin, false);
});

test('3. admin sem o código adicional não tem acesso', async (t) => {
  const S = await subir(); t.after(S.fechar);
  const c = S.cliente();
  const l = await c('POST', '/api/auth/login', { email: 'adm@gmail.com', senha: '123456' });
  assert.equal(l.j.etapa, 'codigo');
  assert.equal((await c('GET', '/api/auth/me')).j.autenticado, false);
  assert.equal((await c('GET', '/api/dados')).s, 401);
  assert.equal((await c('POST', '/api/admin/modo', { ativo: true })).s, 403);
  assert.equal((await c('POST', '/api/admin/conquistas/liberar', { id: 'tres-dias' })).s, 403);
  assert.equal((await c('POST', '/api/auth/admin-code', { codigo: '2324' })).s, 200);
  assert.equal((await c('GET', '/api/auth/me')).j.admin, true);
  assert.equal((await c('POST', '/api/admin/conquistas/liberar', { id: 'tres-dias' })).s, 200);
  assert.ok((await c('GET', '/api/dados')).j.dados.conquistasMeta['tres-dias'].origem === 'admin');
});

test('4. erros repetidos no código: bloqueio progressivo e sessão invalidada', async (t) => {
  const S = await subir(); t.after(S.fechar);
  const c = S.cliente();
  await c('POST', '/api/auth/login', { email: 'adm@gmail.com', senha: '123456' });
  const st = [];
  for (let i = 0; i < 4; i++) st.push((await c('POST', '/api/auth/admin-code', { codigo: '000' + i })).s);
  assert.deepEqual(st.slice(0, 2), [401, 401]);
  assert.ok(st.includes(429), 'deve bloquear: ' + st);
  const certo = await c('POST', '/api/auth/admin-code', { codigo: '2324' });
  assert.equal(certo.s, 429, 'mesmo o código certo é recusado durante o bloqueio');
  const ev = S.db.prepare("SELECT tipo, detalhe FROM eventos_seguranca WHERE tipo LIKE 'codigo_admin%'").all();
  assert.ok(ev.length >= 3);
  assert.equal(JSON.stringify(ev).includes('2324'), false);
  assert.equal(JSON.stringify(S.db.prepare('SELECT * FROM eventos_seguranca').all()).includes('123456'), false);
});

test('5. visitante (sem sessão) não grava nada', async (t) => {
  const S = await subir(); t.after(S.fechar);
  const v = S.cliente();
  const antes = S.db.prepare('SELECT COUNT(*) n FROM dados').get().n;
  assert.equal((await v('PUT', '/api/dados', { itens: { plantas: { lista: [] } } })).s, 401);
  assert.equal((await v('PUT', '/api/conta', { nome: 'x' })).s, 401);
  assert.equal(S.db.prepare('SELECT COUNT(*) n FROM dados').get().n, antes);
});

test('6. alterar permissões por requisição manual não funciona', async (t) => {
  const S = await subir(); t.after(S.fechar);
  const a = S.cliente();
  const r = await a('POST', '/api/auth/register', { email: 'z@x.com', senha: 'segredo1', nome: 'Z', nascimento: '1990-01-01', papel: 'admin', admin: true });
  assert.equal(S.db.prepare("SELECT papel FROM usuarios WHERE email='z@x.com'").get().papel, 'usuario');
  await a('PUT', '/api/conta', { nome: 'Z', nascimento: '1990-01-01', email: 'z@x.com', papel: 'admin' });
  assert.equal(S.db.prepare("SELECT papel FROM usuarios WHERE email='z@x.com'").get().papel, 'usuario');
  assert.equal((await reg(S.cliente(), 'adm@gmail.com', 'Teste')).s, 409, 'e-mail do admin é reservado');
  assert.equal((await a('PUT', '/api/conta', { nome: 'Z', nascimento: '1990-01-01', email: 'adm@gmail.com', senhaAtual: 'segredo1' })).s, 409);
  assert.equal(S.db.prepare("SELECT COUNT(*) n FROM usuarios WHERE papel='admin'").get().n, 1);
  const forjado = S.cliente(); // cookie inventado
  const f = await forjado('GET', '/api/auth/me', undefined, { Cookie: 'mp_sid=' + 'A'.repeat(43) });
  assert.equal(f.j.autenticado, false);
});

test('7. imagens inválidas ou grandes são recusadas', async (t) => {
  const S = await subir(); t.after(S.fechar);
  const a = S.cliente(); await reg(a, 'a@x.com');
  const put = (src) => a('PUT', '/api/dados', { itens: { fotos: [{ id: 'f1', src }] } });
  assert.equal((await put(PNG)).s, 200);
  assert.equal((await put('data:image/png;base64,' + Buffer.from('isto não é uma imagem'.repeat(5)).toString('base64'))).s, 422);
  assert.equal((await put('data:image/svg+xml;base64,' + Buffer.from('<svg onload=alert(1)>').toString('base64'))).s, 422);
  assert.equal((await put('javascript:alert(1)')).s, 422);
  const grande = Buffer.concat([Buffer.from(PNG.split(',')[1], 'base64'), Buffer.alloc(600e3)]).toString('base64');
  assert.equal((await put('data:image/png;base64,' + grande)).s, 422);
  const enorme = await a('PUT', '/api/dados', { itens: { fotos: [{ id: 'f', src: PNG, x: 'a'.repeat(14e6) }] } });
  assert.equal(enorme.s, 413);
  assert.equal((await a('PUT', '/api/dados', { itens: { perfil: { fotoPerfil: PNG } } })).s, 200);
});

test('8. rota protegida sem login, CSRF e CORS', async (t) => {
  const S = await subir(); t.after(S.fechar);
  const n = S.cliente();
  for (const [m, p] of [['GET', '/api/dados'], ['GET', '/api/conta/exportar'], ['POST', '/api/admin/modo']]) assert.ok([401, 403].includes((await n(m, p, m === 'GET' ? undefined : {})).s), p);
  const a = S.cliente(); await reg(a, 'a@x.com');
  const x1 = await a('PUT', '/api/dados', { itens: { jogos: {} } }, { 'X-MP-CSRF': 'x' });
  const x2 = await a('PUT', '/api/dados', { itens: { jogos: {} } }, { Origin: 'https://site-malicioso.example' });
  assert.equal(x1.s, 403, 'sem cabeçalho anti-CSRF');
  assert.equal(x2.s, 403, 'origem externa');
  const r = await fetch(S.base + '/api/auth/me', { headers: { Origin: 'https://site-malicioso.example' } });
  assert.equal(r.headers.get('access-control-allow-origin'), null, 'sem CORS aberto');
});

test('cookie de sessão, cabeçalhos e arquivos públicos', async (t) => {
  const S = await subir(); t.after(S.fechar);
  const a = S.cliente(); const r = await reg(a, 'a@x.com');
  assert.match(r.raw, /HttpOnly/i); assert.match(r.raw, /SameSite=Strict/i);
  const h = await fetch(S.base + '/');
  const csp = h.headers.get('content-security-policy');
  assert.match(csp, /script-src 'self'/); assert.match(csp, /frame-ancestors 'none'/);
  assert.equal(h.headers.get('x-content-type-options'), 'nosniff');
  for (const p of ['/.env', '/server/app.js', '/data/minha-plantinha.sqlite', '/package.json', '/.env.example', '/../.env']) assert.notEqual((await fetch(S.base + p)).status, 200, p);
  const pub = path.join(__dirname, '..', 'public'); let achou = [];
  (function varre(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? varre(p) : (/2324|123456|adm@gmail/.test(fs.readFileSync(p, 'utf8')) && achou.push(p)); } })(pub);
  assert.deepEqual(achou, [], 'segredos não podem aparecer em arquivos públicos');
});

test('senhas e código usam Argon2id; provisionamento é idempotente', async (t) => {
  const S = await subir(); t.after(S.fechar);
  const adm = S.db.prepare("SELECT senha_hash, codigo_hash FROM usuarios WHERE papel='admin'").get();
  assert.match(adm.senha_hash, /^\$argon2id\$/); assert.match(adm.codigo_hash, /^\$argon2id\$/);
  assert.equal(adm.senha_hash.includes('123456'), false);
  const { provisionarAdmin } = require('../server/provisionar');
  const novaSenha = await S.seg.hashSegredo('Outra-senha-forte-1');
  S.db.prepare("UPDATE usuarios SET senha_hash=? WHERE papel='admin'").run(novaSenha);
  const r = await provisionarAdmin(S.db, S.cfg, S.seg);
  assert.equal(r.acao, 'ja-existe');
  assert.equal(S.db.prepare("SELECT COUNT(*) n FROM usuarios WHERE papel='admin'").get().n, 1);
  assert.equal(S.db.prepare("SELECT senha_hash FROM usuarios WHERE papel='admin'").get().senha_hash, novaSenha, 'senha alterada não é redefinida');
  await assert.rejects(() => provisionarAdmin(S.db, Object.assign({}, S.cfg, { producao: true, adminEmail: 'outro@x.com' }), S.seg), /ADMIN_PASSWORD/);
});

test('menor de idade: exige e-mail do responsável e só ativa após confirmação', async (t) => {
  const S = await subir(); t.after(S.fechar);
  const m = S.cliente();
  assert.equal((await m('POST', '/api/auth/register', { email: 'crianca@x.com', senha: 'segredo1', nome: 'Kid', nascimento: '2016-03-03' })).s, 400);
  const r = await m('POST', '/api/auth/register', { email: 'crianca@x.com', senha: 'segredo1', nome: 'Kid', nascimento: '2016-03-03', emailResponsavel: 'mae@x.com' });
  assert.equal(r.s, 202);
  const l = await m('POST', '/api/auth/login', { email: 'crianca@x.com', senha: 'segredo1' });
  assert.equal(l.s, 403); assert.equal((await m('GET', '/api/dados')).s, 401);
  const dir = S.cfg.outboxDir; const arq = fs.readdirSync(dir).map(f => path.join(dir, f)).sort().pop();
  const token = /token=([\w-]+)/.exec(fs.readFileSync(arq, 'utf8'))[1];
  const pagina = await fetch(S.base + '/responsavel/confirmar?token=' + token);
  assert.equal(pagina.status, 200);
  assert.equal(S.db.prepare("SELECT status FROM usuarios WHERE email='crianca@x.com'").get().status, 'aguardando_responsavel', 'abrir o link não confirma sozinho');
  const post = await fetch(S.base + '/responsavel/confirmar', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: S.base }, body: 'token=' + token });
  assert.equal(post.status, 200);
  assert.equal((await m('POST', '/api/auth/login', { email: 'crianca@x.com', senha: 'segredo1' })).s, 200);
  assert.equal((await m('PUT', '/api/dados', { itens: { perfil: { fotoPerfil: PNG } } })).s, 422, 'foto de perfil só para maiores de 18');
  assert.equal((await m('DELETE', '/api/conta', { senha: 'segredo1' })).s, 200);
  assert.equal(S.db.prepare('SELECT COUNT(*) n FROM dados').get().n, 0);
});

test('limite de requisições de autenticação', async (t) => {
  const S = await subir({ RATE_AUTH_MAX: '5' }); t.after(S.fechar);
  const c = S.cliente(); let ultimo = 0;
  for (let i = 0; i < 8; i++) ultimo = (await c('POST', '/api/auth/login', { email: 'x@x.com', senha: 'errada' + i })).s;
  assert.equal(ultimo, 429);
});

test('login: mensagem igual para conta inexistente e senha errada; bloqueio progressivo', async (t) => {
  const S = await subir(); t.after(S.fechar);
  const a = S.cliente(); await reg(a, 'a@x.com');
  const c = S.cliente();
  const r1 = await c('POST', '/api/auth/login', { email: 'a@x.com', senha: 'errada' });
  const r2 = await c('POST', '/api/auth/login', { email: 'nao@x.com', senha: 'errada' });
  assert.equal(r1.j.erro, r2.j.erro);
  await c('POST', '/api/auth/login', { email: 'a@x.com', senha: 'errada' });
  await c('POST', '/api/auth/login', { email: 'a@x.com', senha: 'errada' });
  const r4 = await c('POST', '/api/auth/login', { email: 'a@x.com', senha: 'segredo1' });
  assert.equal(r4.s, 429);
});
