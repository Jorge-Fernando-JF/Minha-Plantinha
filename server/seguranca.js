'use strict';
const crypto = require('crypto');
const argon2 = require('argon2');

/* Argon2id com parâmetros no mínimo recomendado pela OWASP (19 MiB, 2 iterações, 1 thread) e "pepper":
   um segredo do servidor, guardado fora do banco. Sem ele, um vazamento do banco não permite adivinhar
   offline nem um código curto (como o de 4 dígitos do administrador). */
function criarSeguranca(cfg, db) {
  const OPC = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1, secret: Buffer.from(cfg.pepper) };
  let hashFalso = null;

  const hashSegredo = (s) => argon2.hash(String(s), OPC);
  async function confere(hash, s) {
    try { return await argon2.verify(hash, String(s), { secret: OPC.secret }); } catch (_) { return false; }
  }
  /* Quando a conta não existe, verifica contra um hash falso para o tempo de resposta não revelar isso. */
  async function confereFalso(s) {
    if (!hashFalso) hashFalso = await hashSegredo('hash-falso-' + crypto.randomBytes(8).toString('hex'));
    await confere(hashFalso, s);
    return false;
  }

  const novoToken = () => crypto.randomBytes(32).toString('base64url');
  const hashToken = (t) => crypto.createHash('sha256').update(String(t)).digest('hex');
  const hmacIp = (ip) => crypto.createHmac('sha256', cfg.sessionSecret).update(String(ip || '')).digest('hex').slice(0, 24);
  const iguais = (a, b) => { const x = Buffer.from(String(a)); const y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };

  /* ---------- Bloqueio progressivo contra tentativas consecutivas ---------- */
  const lerB = db.prepare('SELECT falhas, bloqueado_ate FROM bloqueios WHERE chave = ?');
  const gravarB = db.prepare(`INSERT INTO bloqueios (chave, falhas, bloqueado_ate, atualizado_em) VALUES (@chave, @falhas, @ate, @agora)
    ON CONFLICT(chave) DO UPDATE SET falhas = @falhas, bloqueado_ate = @ate, atualizado_em = @agora`);
  const apagarB = db.prepare('DELETE FROM bloqueios WHERE chave = ?');

  /* retorna segundos restantes de bloqueio (0 = liberado) */
  function segundosBloqueado(chave) {
    const l = lerB.get(chave);
    if (!l) return 0;
    const resta = l.bloqueado_ate - Date.now();
    return resta > 0 ? Math.ceil(resta / 1000) : 0;
  }
  /* A partir de "limiar" falhas, espera base * 2^(falhas - limiar) segundos (até "max"). */
  function registrarFalha(chave, { limiar, baseSeg, maxSeg }) {
    const l = lerB.get(chave) || { falhas: 0 };
    const falhas = l.falhas + 1;
    let ate = 0;
    if (falhas >= limiar) ate = Date.now() + Math.min(baseSeg * Math.pow(2, falhas - limiar), maxSeg) * 1000;
    gravarB.run({ chave, falhas, ate, agora: Date.now() });
    return { falhas, bloqueadoAte: ate };
  }
  const limparFalhas = (chave) => apagarB.run(chave);

  /* ---------- Registro de eventos suspeitos (nunca grava senha nem código) ---------- */
  const inserirEv = db.prepare('INSERT INTO eventos_seguranca (ts, tipo, usuario_id, ip_hmac, detalhe) VALUES (?, ?, ?, ?, ?)');
  function evento(tipo, { usuarioId = null, ip = '', detalhe = '' } = {}) {
    try { inserirEv.run(new Date().toISOString(), tipo, usuarioId, hmacIp(ip), String(detalhe).slice(0, 200)); } catch (_) { /* log nunca derruba a requisição */ }
  }

  return { hashSegredo, confere, confereFalso, novoToken, hashToken, hmacIp, iguais, segundosBloqueado, registrarFalha, limparFalhas, evento };
}

module.exports = { criarSeguranca };
