'use strict';
/* Configuração do servidor. Os segredos vêm SOMENTE de variáveis de ambiente / arquivo .env
   (fora da pasta pública e do controle de versão). Nada daqui é enviado ao navegador. */
const path = require('path');
const crypto = require('crypto');

function carregarEnv() {
  try { process.loadEnvFile(path.join(__dirname, '..', '.env')); } catch (_) { /* .env é opcional */ }
}

function bool(v, padrao) {
  if (v === undefined || v === '') return padrao;
  return ['1', 'true', 'sim', 'yes'].includes(String(v).toLowerCase());
}

function carregarConfig(overrides = {}) {
  carregarEnv();
  const e = Object.assign({}, process.env, overrides);
  const producao = e.NODE_ENV === 'production';
  const aviso = [];

  let sessionSecret = e.SESSION_SECRET;
  let pepper = e.HASH_PEPPER;
  if (producao) {
    if (!sessionSecret || sessionSecret.length < 32) throw new Error('SESSION_SECRET (>= 32 caracteres) é obrigatório em produção.');
    if (!pepper || pepper.length < 32) throw new Error('HASH_PEPPER (>= 32 caracteres) é obrigatório em produção.');
  } else {
    if (!sessionSecret) { sessionSecret = crypto.randomBytes(32).toString('hex'); aviso.push('SESSION_SECRET ausente: usando valor temporário (rode "npm run setup").'); }
    if (!pepper) { pepper = 'dev-pepper-' + crypto.randomBytes(16).toString('hex'); aviso.push('HASH_PEPPER ausente: usando valor temporário; contas criadas agora não serão reconhecidas na próxima execução (rode "npm run setup").'); }
  }

  return {
    producao,
    porta: Number(e.PORT || 3000),
    dbArquivo: e.DB_FILE || path.join(__dirname, '..', 'data', 'minha-plantinha.sqlite'),
    publicDir: path.join(__dirname, '..', 'public'),
    outboxDir: path.join(__dirname, '..', 'data', 'outbox'),
    sessionSecret,
    pepper,
    trustProxy: e.TRUST_PROXY ? (isNaN(Number(e.TRUST_PROXY)) ? e.TRUST_PROXY : Number(e.TRUST_PROXY)) : false,
    baseUrl: (e.PUBLIC_BASE_URL || ('http://localhost:' + Number(e.PORT || 3000))).replace(/\/$/, ''),
    /* conta administrativa: criada uma única vez por provisionar.js */
    adminSeed: bool(e.ADMIN_SEED_ENABLED, !producao),
    adminEmail: String(e.ADMIN_EMAIL || '').trim().toLowerCase(),
    adminPassword: e.ADMIN_PASSWORD || '',
    adminCode: e.ADMIN_ACCESS_CODE || 'zdWY1RmLaty6ryQCIL-N3vWK',
    adminNick: e.ADMIN_NICK || 'Teste',
    smtpUrl: e.SMTP_URL || '',
    smtpFrom: e.SMTP_FROM || 'Minha Plantinha <nao-responda@localhost>',
    limites: {
      auth: Number(e.RATE_AUTH_MAX || 30),      /* requisições de autenticação por IP / 10 min */
      api: Number(e.RATE_API_MAX || 600)        /* requisições gerais por IP / 10 min */
    },
    aviso
  };
}

module.exports = { carregarConfig };
