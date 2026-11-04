'use strict';
/* Cria o arquivo .env local (fora da pasta pública e do Git) na primeira instalação.
   Idempotente: se o .env já existe, não altera nada. Valores de DESENVOLVIMENTO apenas. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const arq = path.join(__dirname, '..', '.env');
if (fs.existsSync(arq)) { console.log('[setup] .env já existe; nada foi alterado.'); process.exit(0); }
const r = (n) => crypto.randomBytes(n).toString('hex');
const conteudo = [
  '# Gerado por "npm run setup" — somente DESENVOLVIMENTO. Nunca envie este arquivo ao Git.',
  'NODE_ENV=development',
  'PORT=3000',
  'SESSION_SECRET=' + r(32),
  'HASH_PEPPER=' + r(32),
  '',
  '# Conta administrativa de teste (criada UMA vez na primeira inicialização; depois disso estes valores são ignorados).',
  'ADMIN_SEED_ENABLED=true',
  'ADMIN_EMAIL=adm@gmail.com',
  'ADMIN_PASSWORD=123456',
  'ADMIN_ACCESS_CODE=2324',
  'ADMIN_NICK=Teste',
  ''
].join('\n');
fs.writeFileSync(arq, conteudo, { mode: 0o600 });
console.log('[setup] .env criado (permissão 600). Inicie com: npm start');
