'use strict';
const fs = require('fs');
const path = require('path');

/* Envio do e-mail de confirmação do responsável. Com SMTP_URL usa nodemailer; sem SMTP, apenas em
   desenvolvimento, grava o e-mail em data/outbox/ (arquivo local, fora da pasta pública). */
function criarEmail(cfg) {
  const smtp = !!cfg.smtpUrl;
  let transporte = null;
  return {
    disponivel: smtp || !cfg.producao,
    async enviar({ para, assunto, texto }) {
      if (smtp) {
        transporte = transporte || require('nodemailer').createTransport(cfg.smtpUrl);
        await transporte.sendMail({ from: cfg.smtpFrom, to: para, subject: assunto, text: texto });
        return 'smtp';
      }
      if (cfg.producao) throw new Error('E-mail não configurado.');
      fs.mkdirSync(cfg.outboxDir, { recursive: true });
      const arq = path.join(cfg.outboxDir, Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.txt');
      fs.writeFileSync(arq, 'Para: ' + para + '\nAssunto: ' + assunto + '\n\n' + texto + '\n', { mode: 0o600 });
      return arq;
    }
  };
}
module.exports = { criarEmail };
