'use strict';
/* Provisionamento da conta administrativa. Idempotente: se a conta já existe, NADA é alterado
   (inclusive senha/código que um responsável autorizado tenha trocado). */
const SENHAS_FRACAS = ['123456', '12345678', 'password', 'senha123', 'admin', 'admin123'];



async function provisionarAdmin(db, cfg, seg) {
  if (!cfg.adminSeed) return { acao: 'desativado' };
  if (!cfg.adminEmail || !cfg.adminPassword || !cfg.adminCode) return { acao: 'sem-configuracao' };

  const existente = db.prepare('SELECT id, papel FROM usuarios WHERE email = ?').get(cfg.adminEmail);
  if (existente) {
    return existente.papel === 'admin' ? { acao: 'ja-existe' } : { acao: 'conflito', aviso: 'O e-mail do admin já pertence a uma conta comum; nenhuma promoção automática foi feita.' };
  }
  if (cfg.producao) {
    /* Produção: nada de credencial universal. Exige senha forte e código longo definidos pelo responsável. */
    if (cfg.adminPassword.length < 12 || SENHAS_FRACAS.includes(cfg.adminPassword.toLowerCase())) throw new Error('Produção: ADMIN_PASSWORD precisa ter ao menos 12 caracteres e não pode ser uma senha conhecida.');
    if (cfg.adminCode.length < 8) throw new Error('Produção: ADMIN_ACCESS_CODE precisa ter ao menos 8 caracteres.');
  }
  const [senhaHash, codigoHash] = await Promise.all([seg.hashSegredo(cfg.adminPassword), seg.hashSegredo(cfg.adminCode)]);
  const r = db.prepare(`INSERT OR IGNORE INTO usuarios (email, senha_hash, codigo_hash, papel, nome, nascimento, status, criado_em)
    VALUES (?, ?, ?, 'admin', ?, '2000-01-01', 'ativa', ?)`).run(cfg.adminEmail, senhaHash, codigoHash, cfg.adminNick, new Date().toISOString());
  return { acao: r.changes ? 'criada' : 'ja-existe' };
}
module.exports = { provisionarAdmin };
