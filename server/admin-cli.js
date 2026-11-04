'use strict';
/* Troca da senha ou do código da conta administrativa por um responsável autorizado (acesso ao servidor).
   Uso:  ADMIN_NEW_PASSWORD='...' node server/admin-cli.js senha
         ADMIN_NEW_CODE='...'     node server/admin-cli.js codigo     */
const { carregarConfig } = require('./config');
const { abrirBanco } = require('./db');
const { criarSeguranca } = require('./seguranca');

(async () => {
  const cfg = carregarConfig();
  const db = abrirBanco(cfg.dbArquivo);
  const seg = criarSeguranca(cfg, db);
  const adm = db.prepare("SELECT id FROM usuarios WHERE papel = 'admin' LIMIT 1").get();
  if (!adm) { console.error('Nenhuma conta administrativa encontrada.'); process.exit(1); }
  const modo = process.argv[2];
  if (modo === 'senha') {
    const n = process.env.ADMIN_NEW_PASSWORD || '';
    if (n.length < 12) { console.error('Use ADMIN_NEW_PASSWORD com ao menos 12 caracteres.'); process.exit(1); }
    db.prepare('UPDATE usuarios SET senha_hash = ? WHERE id = ?').run(await seg.hashSegredo(n), adm.id);
  } else if (modo === 'codigo') {
    const n = process.env.ADMIN_NEW_CODE || '';
    if (n.length < 8) { console.error('Use ADMIN_NEW_CODE com ao menos 8 caracteres.'); process.exit(1); }
    db.prepare('UPDATE usuarios SET codigo_hash = ? WHERE id = ?').run(await seg.hashSegredo(n), adm.id);
  } else { console.error('Uso: admin-cli.js senha|codigo'); process.exit(1); }
  db.prepare('DELETE FROM sessoes WHERE usuario_id = ?').run(adm.id);
  console.log('Atualizado. Sessões antigas do administrador foram encerradas.');
})();
