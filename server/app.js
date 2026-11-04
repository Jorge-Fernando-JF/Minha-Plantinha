'use strict';
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { validarChave, ErroDados, LIMITE_BYTES, CONQ, CHAVES } = require('./dados');
const V = require('./validacao');

const MIN = 60 * 1000, HORA = 60 * MIN, DIA = 24 * HORA;
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function criarApp(cfg, db, seg, mail) {
  const app = express();
  app.disable('x-powered-by');
  if (cfg.trustProxy) app.set('trust proxy', cfg.trustProxy);
  const COOKIE = cfg.producao ? '__Host-mp_sid' : 'mp_sid';

  /* ---------- Cabeçalhos de segurança + CSP compatível com o site ---------- */
  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'"],
        'style-src-attr': ["'unsafe-inline'"],          /* o app ajusta estilos de elementos via JS (ex.: barras de progresso) */
        'img-src': ["'self'", 'data:', 'blob:', 'https://upload.wikimedia.org'],
        'font-src': ["'self'"],
        'connect-src': ["'self'"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        ...(cfg.producao ? { 'upgrade-insecure-requests': [] } : {})
      }
    },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    referrerPolicy: { policy: 'no-referrer' },
    hsts: cfg.producao ? { maxAge: 15552000, includeSubDomains: true } : false
  }));
  app.use(cookieParser());

  /* ---------- Limites de requisições ---------- */
  const lim = (limit, msg) => rateLimit({ windowMs: 10 * MIN, limit, standardHeaders: true, legacyHeaders: false, message: { erro: msg } });
  const limiteApi = lim(cfg.limites.api, 'Muitas requisições. Aguarde um pouco.');
  const limiteAuth = lim(cfg.limites.auth, 'Muitas tentativas. Aguarde alguns minutos e tente novamente.');

  /* ---------- Proteção CSRF: SameSite=Strict + verificação de origem + cabeçalho personalizado ---------- */
  const hostsOk = new Set([new URL(cfg.baseUrl).host]);
  function origemOk(req, res, next) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const o = req.get('origin');
    if (o) {
      let h = ''; try { h = new URL(o).host; } catch (_) { /* inválida */ }
      if (h !== req.get('host') && !hostsOk.has(h)) { seg.evento('csrf_bloqueado', { ip: req.ip }); return res.status(403).json({ erro: 'Origem não permitida.' }); }
    } else {
      const sfs = req.get('sec-fetch-site');
      if (sfs && !['same-origin', 'none'].includes(sfs)) return res.status(403).json({ erro: 'Origem não permitida.' });
    }
    if (req.originalUrl.startsWith('/api/') && req.get('x-mp-csrf') !== '1') return res.status(403).json({ erro: 'Requisição inválida.' });
    next();
  }

  /* ---------- Sessões (servidor): o navegador só guarda um identificador aleatório ---------- */
  const q = {
    inserir: db.prepare('INSERT INTO sessoes (id_hash, usuario_id, etapa, criada_em, expira_em, ultimo_uso, ociosidade_ms) VALUES (?,?,?,?,?,?,?)'),
    buscar: db.prepare(`SELECT s.id_hash, s.etapa, s.criada_em, s.expira_em, s.ultimo_uso, s.ociosidade_ms,
        u.id AS uid, u.email, u.papel, u.nome, u.nascimento, u.status, u.email_responsavel
        FROM sessoes s JOIN usuarios u ON u.id = s.usuario_id WHERE s.id_hash = ?`),
    tocar: db.prepare('UPDATE sessoes SET ultimo_uso = ? WHERE id_hash = ?'),
    apagar: db.prepare('DELETE FROM sessoes WHERE id_hash = ?'),
    apagarDoUsuario: db.prepare('DELETE FROM sessoes WHERE usuario_id = ?'),
    apagarExpiradas: db.prepare('DELETE FROM sessoes WHERE expira_em < ? OR (? - ultimo_uso) > ociosidade_ms')
  };
  function criarSessao(res, user, etapa) {
    const token = seg.novoToken();
    const admin = user.papel === 'admin';
    const abs = etapa === 'pendente_codigo' ? 10 * MIN : (admin ? 2 * HORA : 7 * DIA);
    const ocio = etapa === 'pendente_codigo' ? 10 * MIN : (admin ? 20 * MIN : DIA);
    const agora = Date.now();
    q.inserir.run(seg.hashToken(token), user.id, etapa, agora, agora + abs, agora, ocio);
    res.cookie(COOKIE, token, { httpOnly: true, secure: cfg.producao, sameSite: 'strict', path: '/', maxAge: abs });
  }
  function carregarSessao(req, res, next) {
    req.sessao = null;
    const token = req.cookies && req.cookies[COOKIE];
    if (typeof token === 'string' && token.length >= 32 && token.length <= 64) {
      const s = q.buscar.get(seg.hashToken(token));
      const agora = Date.now();
      if (s && s.expira_em > agora && agora - s.ultimo_uso <= s.ociosidade_ms) {
        if (agora - s.ultimo_uso > 30000) q.tocar.run(agora, s.id_hash);
        req.sessao = { idHash: s.id_hash, etapa: s.etapa, user: { id: s.uid, email: s.email, papel: s.papel, nome: s.nome, nascimento: s.nascimento, status: s.status } };
      } else if (s) q.apagar.run(s.id_hash);
    }
    next();
  }
  setInterval(() => { try { q.apagarExpiradas.run(Date.now(), Date.now()); } catch (_) { /* ignora */ } }, 15 * MIN).unref();

  const exigirLogin = (req, res, next) => (req.sessao && req.sessao.etapa === 'completa' && req.sessao.user.status === 'ativa') ? next() : res.status(401).json({ erro: 'Entre na sua conta para continuar.' });
  /* A permissão administrativa é lida do BANCO a cada requisição; nada que o navegador envia conta. */
  const exigirAdmin = (req, res, next) => (req.sessao && req.sessao.etapa === 'completa' && req.sessao.user.papel === 'admin')
    ? next() : (seg.evento('acesso_admin_negado', { usuarioId: req.sessao && req.sessao.user.id, ip: req.ip, detalhe: req.method + ' ' + req.path }), res.status(403).json({ erro: 'Ação restrita ao administrador.' }));

  const jsonPequeno = express.json({ limit: '20kb' });
  const jsonDados = express.json({ limit: '12mb' });
  const contaPublica = (u) => ({ email: u.email, nome: u.nome, nascimento: u.nascimento, papel: u.papel });
  const str = (v, max) => typeof v === 'string' && v.length <= max;

  app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.use('/api', limiteApi, origemOk, carregarSessao);

  /* =============================== AUTENTICAÇÃO =============================== */
  const auth = express.Router();
  auth.use(limiteAuth);

  async function enviarConfirmacaoResponsavel(usuario, emailResp) {
    const token = seg.novoToken();
    const agora = Date.now();
    db.prepare('INSERT INTO consentimentos (token_hash, usuario_id, email_responsavel, criado_em, expira_em) VALUES (?,?,?,?,?)')
      .run(seg.hashToken(token), usuario.id, emailResp, agora, agora + 7 * DIA);
    const link = cfg.baseUrl + '/responsavel/confirmar?token=' + token;
    await mail.enviar({
      para: emailResp,
      assunto: 'Minha Plantinha: confirmação do responsável',
      texto: 'Olá!\n\nAlguém com menos de 18 anos pediu uma conta no Minha Plantinha (apelido: ' + usuario.nome + ') e informou este e-mail como o de um responsável.\n' +
        'O Minha Plantinha guarda apenas o necessário (e-mail, apelido, data de nascimento e o progresso das plantinhas) e não publica nenhuma informação.\n\n' +
        'Para autorizar a conta, abra o link abaixo (válido por 7 dias). Se você não reconhece esse pedido, ignore esta mensagem: a conta não será ativada.\n\n' + link + '\n'
    });
  }

  auth.post('/register', jsonPequeno, async (req, res) => {
    const b = req.body || {};
    const email = V.normalizarEmail(b.email);
    const nome = V.textoLimpo(b.nome, 50);
    const erros = [];
    if (!V.emailValido(email)) erros.push('Informe um e-mail válido.');
    if (!str(b.senha, 128) || b.senha.length < 6) erros.push('A senha precisa ter entre 6 e 128 caracteres.');
    if (!nome) erros.push('Informe seu nome de exibição.');
    if (!V.dataValida(b.nascimento)) erros.push('Informe uma data de nascimento válida e não futura.');
    if (erros.length) return res.status(400).json({ erro: erros[0] });
    const idade = V.idadeEmAnos(b.nascimento);
    const menor = idade < 18;
    let emailResp = '';
    if (menor) {
      emailResp = V.normalizarEmail(b.emailResponsavel);
      if (!V.emailValido(emailResp) || emailResp === email) return res.status(400).json({ erro: 'Para menores de 18 anos, informe o e-mail de um adulto responsável (diferente do seu).' });
      if (!mail.disponivel) return res.status(503).json({ erro: 'O envio de e-mail ao responsável ainda não está configurado neste servidor.' });
    }
    const generico = { erro: 'Não foi possível concluir o cadastro. Se você já tem conta, tente entrar.' };
    if (email === cfg.adminEmail) { seg.evento('cadastro_email_reservado', { ip: req.ip }); return res.status(409).json(generico); }
    const hash = await seg.hashSegredo(b.senha);
    let info;
    try {
      info = db.prepare(`INSERT INTO usuarios (email, senha_hash, papel, nome, nascimento, email_responsavel, status, criado_em)
        VALUES (?,?, 'usuario', ?,?,?,?,?)`).run(email, hash, nome, b.nascimento, emailResp || null, menor ? 'aguardando_responsavel' : 'ativa', new Date().toISOString());
    } catch (e) { return res.status(409).json(generico); }
    const user = { id: Number(info.lastInsertRowid), email, papel: 'usuario', nome, nascimento: b.nascimento };
    if (menor) {
      try { await enviarConfirmacaoResponsavel(user, emailResp); }
      catch (e) { db.prepare('DELETE FROM usuarios WHERE id = ?').run(user.id); return res.status(503).json({ erro: 'Não foi possível enviar o e-mail ao responsável. Tente novamente mais tarde.' }); }
      seg.evento('cadastro_menor', { usuarioId: user.id, ip: req.ip });
      return res.status(202).json({ ok: true, aguardandoResponsavel: true });
    }
    criarSessao(res, user, 'completa');
    seg.evento('cadastro', { usuarioId: user.id, ip: req.ip });
    res.status(201).json({ ok: true, conta: contaPublica(user) });
  });

  const REGRA_IP = { limiar: 10, baseSeg: 30, maxSeg: 900 };
  const REGRA_CONTA_IP = { limiar: 3, baseSeg: 30, maxSeg: 900 };
  auth.post('/login', jsonPequeno, async (req, res) => {
    const b = req.body || {};
    if (!str(b.email, 254) || !str(b.senha, 128) || !b.email || !b.senha) return res.status(400).json({ erro: 'Informe e-mail e senha.' });
    const email = V.normalizarEmail(b.email);
    const ipH = seg.hmacIp(req.ip);
    const kIp = 'login:ip:' + ipH, kConta = 'login:conta:' + email + ':' + ipH;
    const espera = Math.max(seg.segundosBloqueado(kIp), seg.segundosBloqueado(kConta));
    if (espera) { seg.evento('login_bloqueado', { ip: req.ip }); return res.status(429).json({ erro: 'Muitas tentativas. Aguarde ' + espera + ' segundos para tentar de novo.', esperarSegundos: espera }); }
    const u = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
    const ok = u ? await seg.confere(u.senha_hash, b.senha) : await seg.confereFalso(b.senha);
    if (!ok) {
      seg.registrarFalha(kIp, REGRA_IP); seg.registrarFalha(kConta, REGRA_CONTA_IP);
      seg.evento('login_falhou', { usuarioId: u && u.id, ip: req.ip });
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }
    seg.limparFalhas(kConta);
    if (req.sessao) q.apagar.run(req.sessao.idHash);            /* nova sessão a cada login (evita fixação) */
    if (u.status !== 'ativa') return res.status(403).json({ erro: 'Esta conta está aguardando a confirmação do responsável.', aguardandoResponsavel: true });
    if (u.papel === 'admin') {
      criarSessao(res, u, 'pendente_codigo');
      seg.evento('admin_senha_ok', { usuarioId: u.id, ip: req.ip });
      return res.json({ ok: true, etapa: 'codigo' });
    }
    criarSessao(res, u, 'completa');
    db.prepare('UPDATE usuarios SET ultimo_acesso = ? WHERE id = ?').run(new Date().toISOString(), u.id);
    res.json({ ok: true, etapa: 'completa', conta: contaPublica(u) });
  });

  const REGRA_COD_IP = { limiar: 3, baseSeg: 60, maxSeg: 3600 };
  const REGRA_COD_CONTA = { limiar: 8, baseSeg: 300, maxSeg: 3600 };
  auth.post('/admin-code', jsonPequeno, async (req, res) => {
    const s = req.sessao;
    if (!s || s.etapa !== 'pendente_codigo' || s.user.papel !== 'admin') return res.status(401).json({ erro: 'Informe e-mail e senha primeiro.' });
    const codigo = req.body && req.body.codigo;
    if (!str(codigo, 64) || !codigo) return res.status(400).json({ erro: 'Informe o código de acesso.' });
    const kIp = 'codigo:' + s.user.id + ':' + seg.hmacIp(req.ip), kConta = 'codigo:conta:' + s.user.id;
    const espera = Math.max(seg.segundosBloqueado(kIp), seg.segundosBloqueado(kConta));
    if (espera) { seg.evento('codigo_admin_bloqueado', { usuarioId: s.user.id, ip: req.ip }); return res.status(429).json({ erro: 'Muitas tentativas. Aguarde ' + espera + ' segundos.', esperarSegundos: espera }); }
    const u = db.prepare('SELECT codigo_hash FROM usuarios WHERE id = ?').get(s.user.id);
    const ok = u && u.codigo_hash ? await seg.confere(u.codigo_hash, codigo) : await seg.confereFalso(codigo);
    if (!ok) {
      const f = seg.registrarFalha(kIp, REGRA_COD_IP); seg.registrarFalha(kConta, REGRA_COD_CONTA);
      seg.evento('codigo_admin_falhou', { usuarioId: s.user.id, ip: req.ip, detalhe: 'falhas=' + f.falhas });
      if (f.falhas >= 5) { q.apagar.run(s.idHash); res.clearCookie(COOKIE, { path: '/' }); return res.status(401).json({ erro: 'Código incorreto. Entre novamente com e-mail e senha.', reiniciar: true }); }
      return res.status(401).json({ erro: 'Código incorreto.' });
    }
    seg.limparFalhas(kIp); seg.limparFalhas(kConta);
    q.apagar.run(s.idHash);                                     /* troca o identificador ao subir de nível */
    criarSessao(res, { id: s.user.id, papel: 'admin' }, 'completa');
    db.prepare('UPDATE usuarios SET ultimo_acesso = ? WHERE id = ?').run(new Date().toISOString(), s.user.id);
    seg.evento('admin_login', { usuarioId: s.user.id, ip: req.ip });
    res.json({ ok: true, etapa: 'completa', conta: contaPublica(s.user) });
  });

  auth.post('/reenviar-responsavel', jsonPequeno, async (req, res) => {
    const b = req.body || {};
    const email = V.normalizarEmail(b.email);
    if (!str(b.senha, 128) || !b.senha) return res.status(400).json({ erro: 'Informe e-mail e senha.' });
    const u = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
    const ok = u ? await seg.confere(u.senha_hash, b.senha) : await seg.confereFalso(b.senha);
    if (!ok || u.status !== 'aguardando_responsavel') return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    const ult = db.prepare('SELECT MAX(criado_em) m FROM consentimentos WHERE usuario_id = ?').get(u.id).m || 0;
    if (Date.now() - ult < MIN) return res.status(429).json({ erro: 'Aguarde um minuto para reenviar.' });
    try { await enviarConfirmacaoResponsavel(u, u.email_responsavel); } catch (_) { return res.status(503).json({ erro: 'Não foi possível enviar o e-mail agora.' }); }
    res.json({ ok: true });
  });

  auth.post('/logout', (req, res) => {
    if (req.sessao) q.apagar.run(req.sessao.idHash);
    res.clearCookie(COOKIE, { path: '/' });
    res.json({ ok: true });
  });

  auth.get('/me', (req, res) => {
    const s = req.sessao;
    if (!s) return res.json({ autenticado: false });
    if (s.etapa === 'pendente_codigo') return res.json({ autenticado: false, etapa: 'codigo' });
    if (s.user.status !== 'ativa') return res.json({ autenticado: false });
    res.json({ autenticado: true, admin: s.user.papel === 'admin', conta: contaPublica(s.user) });
  });
  app.use('/api/auth', auth);

  /* =============================== CONTA (LGPD) =============================== */
  const conta = express.Router();
  conta.use(exigirLogin);

  conta.put('/', jsonPequeno, async (req, res) => {
    const b = req.body || {}; const u = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.sessao.user.id);
    const nome = V.textoLimpo(b.nome, 50);
    const email = V.normalizarEmail(b.email || u.email);
    if (!nome || !V.emailValido(email)) return res.status(400).json({ erro: 'Preencha nome e e-mail válidos.' });
    if (!V.dataValida(b.nascimento)) return res.status(400).json({ erro: 'Informe uma data de nascimento válida e não futura.' });
    const novaSenha = b.novaSenha === undefined || b.novaSenha === '' ? '' : b.novaSenha;
    if (novaSenha && (!str(novaSenha, 128) || novaSenha.length < 6)) return res.status(400).json({ erro: 'A nova senha precisa ter entre 6 e 128 caracteres.' });
    if (V.idadeEmAnos(u.nascimento) < 18 && V.idadeEmAnos(b.nascimento) >= 18) return res.status(422).json({ erro: 'Não é possível alterar a data de nascimento de menor para maior de idade por aqui. Fale com o responsável pelo serviço.' });
    if (email !== u.email || novaSenha) {            /* mudar e-mail ou senha exige a senha atual */
      const k = 'conta:' + u.id;
      const espera = seg.segundosBloqueado(k);
      if (espera) return res.status(429).json({ erro: 'Aguarde ' + espera + ' segundos.' });
      if (!str(b.senhaAtual, 128) || !(await seg.confere(u.senha_hash, b.senhaAtual))) { seg.registrarFalha(k, REGRA_CONTA_IP); seg.evento('troca_dados_senha_errada', { usuarioId: u.id, ip: req.ip }); return res.status(401).json({ erro: 'Informe sua senha atual para alterar e-mail ou senha.' }); }
      seg.limparFalhas(k);
    }
    if (email !== u.email && email === cfg.adminEmail) return res.status(409).json({ erro: 'Não foi possível usar esse e-mail.' });
    const hash = novaSenha ? await seg.hashSegredo(novaSenha) : u.senha_hash;
    try { db.prepare('UPDATE usuarios SET nome = ?, nascimento = ?, email = ?, senha_hash = ? WHERE id = ?').run(nome, b.nascimento, email, hash, u.id); }
    catch (_) { return res.status(409).json({ erro: 'Não foi possível usar esse e-mail.' }); }
    if (novaSenha) {                                  /* trocar a senha encerra todas as sessões */
      q.apagarDoUsuario.run(u.id);
      if (u.papel === 'admin') { res.clearCookie(COOKIE, { path: '/' }); return res.json({ ok: true, reautenticar: true }); }
      criarSessao(res, u, 'completa');
    }
    res.json({ ok: true, conta: contaPublica({ email, nome, nascimento: b.nascimento, papel: u.papel }) });
  });

  conta.delete('/', jsonPequeno, async (req, res) => {
    const u = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.sessao.user.id);
    if (u.papel === 'admin') return res.status(403).json({ erro: 'A conta administrativa não pode ser excluída por aqui.' });
    if (!str(req.body && req.body.senha, 128) || !(await seg.confere(u.senha_hash, req.body.senha))) return res.status(401).json({ erro: 'Senha incorreta.' });
    db.prepare('DELETE FROM usuarios WHERE id = ?').run(u.id);   /* sessões, dados e consentimentos saem em cascata */
    seg.evento('conta_excluida', { ip: req.ip });
    res.clearCookie(COOKIE, { path: '/' });
    res.json({ ok: true });
  });

  conta.get('/exportar', (req, res) => {
    const u = req.sessao.user;
    const dados = {};
    db.prepare('SELECT chave, valor FROM dados WHERE usuario_id = ?').all(u.id).forEach(r => { dados[r.chave] = JSON.parse(r.valor); });
    res.set('Content-Disposition', 'attachment; filename="minha-plantinha-dados.json"');
    res.json({ conta: contaPublica(u), dados });
  });
  app.use('/api/conta', conta);

  /* =============================== DADOS DO USUÁRIO (isolados por conta) =============================== */
  const dados = express.Router();
  dados.use(exigirLogin);
  /* O id do usuário vem SEMPRE da sessão; não existe parâmetro de id nas rotas (sem acesso por IDOR). */
  const lerTodos = (uid) => { const o = {}; db.prepare('SELECT chave, valor FROM dados WHERE usuario_id = ?').all(uid).forEach(r => { try { o[r.chave] = JSON.parse(r.valor); } catch (_) { /* ignora */ } }); return o; };

  dados.get('/', (req, res) => res.json({ dados: lerTodos(req.sessao.user.id) }));

  dados.put('/', jsonDados, (req, res) => {
    const itens = req.body && req.body.itens;
    if (!itens || typeof itens !== 'object' || Array.isArray(itens)) return res.status(400).json({ erro: 'Requisição inválida.' });
    const chaves = Object.keys(itens);
    if (!chaves.length || chaves.length > CHAVES.length) return res.status(400).json({ erro: 'Requisição inválida.' });
    const u = req.sessao.user;
    const ctx = { admin: u.papel === 'admin' && req.sessao.etapa === 'completa', nascimento: u.nascimento, atual: lerTodos(u.id) };
    const agora = new Date().toISOString();
    const up = db.prepare('INSERT INTO dados (usuario_id, chave, valor, atualizado_em) VALUES (?,?,?,?) ON CONFLICT(usuario_id, chave) DO UPDATE SET valor = excluded.valor, atualizado_em = excluded.atualizado_em');
    const del = db.prepare('DELETE FROM dados WHERE usuario_id = ? AND chave = ?');
    const saidas = [];
    for (const k of chaves) {
      if (!CHAVES.includes(k)) return res.status(422).json({ erro: 'Chave de dados desconhecida.' });
      if (itens[k] === null) { saidas.push([k, null]); continue; }
      const v = validarChave(k, itens[k], ctx);
      const txt = JSON.stringify(v);
      if (Buffer.byteLength(txt) > LIMITE_BYTES[k]) return res.status(413).json({ erro: 'Dados grandes demais para "' + k + '".' });
      saidas.push([k, txt]);
    }
    db.transaction(() => saidas.forEach(([k, txt]) => (txt === null ? del.run(u.id, k) : up.run(u.id, k, txt, agora))))();
    res.json({ ok: true });
  });
  app.use('/api/dados', dados);

  /* =============================== ADMINISTRAÇÃO =============================== */
  const admin = express.Router();
  admin.use(exigirAdmin);

  admin.post('/modo', jsonPequeno, (req, res) => {
    const ativo = req.body && req.body.ativo === true;
    const uid = req.sessao.user.id;
    const r = db.prepare("SELECT valor FROM dados WHERE usuario_id = ? AND chave = 'perfil'").get(uid);
    const perfil = r ? JSON.parse(r.valor) : {};
    perfil.adminAtivo = ativo;
    db.prepare("INSERT INTO dados (usuario_id, chave, valor, atualizado_em) VALUES (?, 'perfil', ?, ?) ON CONFLICT(usuario_id, chave) DO UPDATE SET valor = excluded.valor, atualizado_em = excluded.atualizado_em").run(uid, JSON.stringify(perfil), new Date().toISOString());
    seg.evento('admin_modo', { usuarioId: uid, ip: req.ip, detalhe: ativo ? 'ativado' : 'desativado' });
    res.json({ ok: true, adminAtivo: ativo });
  });

  admin.post('/conquistas/liberar', jsonPequeno, (req, res) => {
    const id = req.body && req.body.id;
    if (!CONQ.todas.includes(id)) return res.status(400).json({ erro: 'Conquista desconhecida.' });
    let alvo = req.sessao.user.id;
    if (req.body.email) {
      const t = db.prepare('SELECT id, status FROM usuarios WHERE email = ?').get(V.normalizarEmail(req.body.email));
      if (!t || t.status !== 'ativa') return res.status(404).json({ erro: 'Usuário não encontrado.' });
      alvo = t.id;
    }
    const todos = lerTodos(alvo);
    const conquistas = Array.isArray(todos.conquistas) ? todos.conquistas : [];
    const meta = todos.conquistasMeta && typeof todos.conquistasMeta === 'object' ? todos.conquistasMeta : {};
    if (conquistas.includes(id)) return res.json({ ok: true, jaTinha: true });
    conquistas.push(id);
    meta[id] = { desbloqueadaEm: new Date().toISOString(), origem: 'admin' };
    const up = db.prepare('INSERT INTO dados (usuario_id, chave, valor, atualizado_em) VALUES (?,?,?,?) ON CONFLICT(usuario_id, chave) DO UPDATE SET valor = excluded.valor, atualizado_em = excluded.atualizado_em');
    const agora = new Date().toISOString();
    db.transaction(() => { up.run(alvo, 'conquistas', JSON.stringify(conquistas), agora); up.run(alvo, 'conquistasMeta', JSON.stringify(meta), agora); })();
    seg.evento('admin_liberou_conquista', { usuarioId: req.sessao.user.id, ip: req.ip, detalhe: id + (alvo !== req.sessao.user.id ? ' -> usuário ' + alvo : '') });
    res.json({ ok: true });
  });
  app.use('/api/admin', admin);

  app.use('/api', (req, res) => res.status(404).json({ erro: 'Não encontrado.' }));

  /* =============================== CONFIRMAÇÃO DO RESPONSÁVEL =============================== */
  function pagina(titulo, corpo) {
    return '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="robots" content="noindex"><title>' + esc(titulo) + '</title><link rel="stylesheet" href="/css/style.css"></head><body class="auth-mode"><main class="container"><section class="tela ativa"><div class="empty-state panel"><h2>' + esc(titulo) + '</h2>' + corpo + '</div></section></main></body></html>';
  }
  const consulta = db.prepare(`SELECT c.token_hash, c.usuario_id, c.expira_em, c.confirmado_em, u.nome FROM consentimentos c JOIN usuarios u ON u.id = c.usuario_id WHERE c.token_hash = ?`);
  const limiteResp = lim(30, 'Muitas tentativas.');
  app.get('/responsavel/confirmar', limiteResp, (req, res) => {
    res.set('Cache-Control', 'no-store');
    const t = typeof req.query.token === 'string' ? req.query.token : '';
    const c = t.length >= 32 && t.length <= 64 ? consulta.get(seg.hashToken(t)) : null;
    if (!c || c.expira_em < Date.now() || c.confirmado_em) return res.status(400).send(pagina('Link inválido ou expirado', '<p>Este link não é mais válido. Peça para a criança entrar no site e reenviar o e-mail ao responsável.</p>'));
    res.send(pagina('Autorização do responsável',
      '<p>Você foi indicado(a) como responsável pela conta de <strong>' + esc(c.nome) + '</strong> no Minha Plantinha, um site educativo de cuidado com plantas.</p>' +
      '<p>Guardamos apenas e-mail, apelido, data de nascimento e o progresso das plantinhas, sem publicar nada e sem compartilhar com terceiros. Você pode pedir a exclusão da conta e dos dados a qualquer momento.</p>' +
      '<form method="post" action="/responsavel/confirmar"><input type="hidden" name="token" value="' + esc(t) + '"><button class="botao" type="submit">Sou o responsável e autorizo a conta</button></form>'));
  });
  app.post('/responsavel/confirmar', limiteResp, origemOk, express.urlencoded({ extended: false, limit: '2kb' }), (req, res) => {
    res.set('Cache-Control', 'no-store');
    const t = req.body && typeof req.body.token === 'string' ? req.body.token : '';
    const c = t.length >= 32 && t.length <= 64 ? consulta.get(seg.hashToken(t)) : null;
    if (!c || c.expira_em < Date.now() || c.confirmado_em) return res.status(400).send(pagina('Link inválido ou expirado', '<p>Este link não é mais válido.</p>'));
    db.transaction(() => {
      db.prepare('UPDATE consentimentos SET confirmado_em = ? WHERE token_hash = ?').run(new Date().toISOString(), c.token_hash);
      db.prepare("UPDATE usuarios SET status = 'ativa' WHERE id = ?").run(c.usuario_id);
    })();
    seg.evento('responsavel_confirmou', { usuarioId: c.usuario_id, ip: req.ip });
    res.send(pagina('Conta autorizada', '<p>Obrigado! A conta foi autorizada e já pode ser usada.</p>'));
  });

  /* =============================== ARQUIVOS DO SITE (somente /public) =============================== */
  app.use(express.static(cfg.publicDir, { dotfiles: 'ignore', index: 'index.html', maxAge: cfg.producao ? '1h' : 0, extensions: false }));

  app.use((req, res) => res.status(404).type('text').send('Não encontrado.'));
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.type === 'entity.too.large' ? 413 : (err.status && err.status < 500 ? err.status : 500);
    if (status >= 500) console.error('[erro]', req.method, req.path, err.name, err.message);   /* sem corpo da requisição, sem segredos */
    res.status(status).json({ erro: status === 413 ? 'Conteúdo grande demais.' : status === 400 ? 'Requisição inválida.' : status === 422 && err instanceof ErroDados ? err.message : 'Erro interno. Tente novamente.' });
  });
  return app;
}
module.exports = { criarApp };
