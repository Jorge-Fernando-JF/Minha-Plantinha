'use strict';
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  senha_hash TEXT NOT NULL,
  codigo_hash TEXT,
  papel TEXT NOT NULL DEFAULT 'usuario' CHECK (papel IN ('usuario','admin')),
  nome TEXT NOT NULL,
  nascimento TEXT NOT NULL,
  email_responsavel TEXT,
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa','aguardando_responsavel')),
  criado_em TEXT NOT NULL,
  ultimo_acesso TEXT
);
CREATE TABLE IF NOT EXISTS sessoes (
  id_hash TEXT PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  etapa TEXT NOT NULL CHECK (etapa IN ('pendente_codigo','completa')),
  criada_em INTEGER NOT NULL,
  expira_em INTEGER NOT NULL,
  ultimo_uso INTEGER NOT NULL,
  ociosidade_ms INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessoes_usuario ON sessoes(usuario_id);
CREATE TABLE IF NOT EXISTS dados (
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  chave TEXT NOT NULL,
  valor TEXT NOT NULL,
  atualizado_em TEXT NOT NULL,
  PRIMARY KEY (usuario_id, chave)
);
CREATE TABLE IF NOT EXISTS bloqueios (
  chave TEXT PRIMARY KEY,
  falhas INTEGER NOT NULL DEFAULT 0,
  bloqueado_ate INTEGER NOT NULL DEFAULT 0,
  atualizado_em INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS eventos_seguranca (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  tipo TEXT NOT NULL,
  usuario_id INTEGER,
  ip_hmac TEXT,
  detalhe TEXT
);
CREATE TABLE IF NOT EXISTS consentimentos (
  token_hash TEXT PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  email_responsavel TEXT NOT NULL,
  criado_em INTEGER NOT NULL,
  expira_em INTEGER NOT NULL,
  confirmado_em TEXT
);
`;

function abrirBanco(arquivo) {
  if (arquivo !== ':memory:') fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  const db = new Database(arquivo);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  if (arquivo !== ':memory:') { try { fs.chmodSync(arquivo, 0o600); } catch (_) { /* melhor esforço */ } }
  return db;
}

module.exports = { abrirBanco };
