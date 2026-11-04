'use strict';
const { carregarConfig } = require('./config');
const { abrirBanco } = require('./db');
const { criarSeguranca } = require('./seguranca');
const { criarEmail } = require('./email');
const { provisionarAdmin } = require('./provisionar');
const { criarApp } = require('./app');

async function iniciar(overrides) {
  const cfg = carregarConfig(overrides);
  cfg.aviso.forEach(a => console.warn('[aviso]', a));
  const db = abrirBanco(cfg.dbArquivo);
  const seg = criarSeguranca(cfg, db);
  const mail = criarEmail(cfg);
  const r = await provisionarAdmin(db, cfg, seg);
  if (r.acao === 'criada') console.log('[admin] conta administrativa criada (primeira inicialização).');
  else if (r.aviso) console.warn('[admin]', r.aviso);
  if (cfg.producao && !mail.disponivel) console.warn('[aviso] SMTP_URL não configurado: cadastro de menores ficará indisponível.');
  const app = criarApp(cfg, db, seg, mail);
  return { cfg, db, seg, app };
}

if (require.main === module) {
  iniciar().then(({ cfg, app }) => {
    app.listen(cfg.porta, () => console.log('Minha Plantinha em ' + cfg.baseUrl + (cfg.producao ? ' (produção)' : ' (desenvolvimento)')));
  }).catch(e => { console.error('Falha ao iniciar:', e.message); process.exit(1); });
}
module.exports = { iniciar };
