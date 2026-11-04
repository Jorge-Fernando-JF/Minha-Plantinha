'use strict';
/* Regras do armazenamento por usuário. O servidor decide o que pode ser gravado e quem pode gravar;
   nada do que vem do navegador define permissões. */
const CONQ = require('./conquistas.json');
const { higienizar, validarImagem, idadeEmAnos } = require('./validacao');

const CHAVES = ['plantas', 'conquistas', 'conquistasMeta', 'diario', 'registros', 'fotos', 'jogos', 'perfil'];
const LIMITE_BYTES = { plantas: 300e3, conquistas: 4e3, conquistasMeta: 20e3, diario: 700e3, registros: 700e3, fotos: 9e6, jogos: 120e3, perfil: 600e3 };
const POTES_OK = ['Vaso', 'Pote de Danone', 'Pote de Danone dourado', 'Pote de Terra de Ouro'];
const MAX_PLANTAS = 4;
const MAX_FOTOS = 60;
const FOTO_BYTES = 450e3;
const PERFIL_BYTES = 150e3;

class ErroDados extends Error { constructor(m) { super(m); this.status = 422; } }
const exige = (c, m) => { if (!c) throw new ErroDados(m); };

function validarChave(chave, bruto, ctx) {
  exige(CHAVES.includes(chave), 'Chave de dados desconhecida.');
  let v;
  try { v = higienizar(bruto); } catch (e) { throw new ErroDados('Dados inválidos: ' + e.message + '.'); }

  switch (chave) {
    case 'plantas': {
      exige(v && typeof v === 'object' && !Array.isArray(v) && Array.isArray(v.lista), 'Formato de plantas inválido.');
      exige(v.lista.length <= MAX_PLANTAS, 'Limite de plantinhas excedido.');
      const ids = new Set();
      v.lista.forEach(p => {
        exige(p && typeof p === 'object' && typeof p.id === 'string' && /^[\w-]{1,40}$/.test(p.id), 'Plantinha inválida.');
        exige(!ids.has(p.id), 'Plantinha duplicada.'); ids.add(p.id);
        if (p.pote !== undefined && p.pote !== '') exige(POTES_OK.includes(p.pote), 'Recipiente inválido.');
        if (p.semente !== undefined && p.semente !== '') exige(p.semente === 'Feijão', 'Semente inválida.');
        if (p.nome !== undefined) exige(typeof p.nome === 'string' && p.nome.length <= 60 && !/[<>]/.test(p.nome), 'Nome de plantinha inválido.');
        if (p.diasConsecutivos !== undefined) exige(Number.isInteger(p.diasConsecutivos) && p.diasConsecutivos >= 0 && p.diasConsecutivos <= 365, 'Dias inválidos.');
      });
      return { versao: 2, ativa: typeof v.ativa === 'string' ? v.ativa.slice(0, 40) : '', lista: v.lista };
    }
    case 'conquistas': {
      exige(Array.isArray(v) && v.length <= 60, 'Formato de conquistas inválido.');
      v.forEach(id => exige(CONQ.todas.includes(id), 'Conquista desconhecida.'));
      return [...new Set(v)];
    }
    case 'conquistasMeta': {
      exige(v && typeof v === 'object' && !Array.isArray(v), 'Formato inválido.');
      const antigo = ctx.atual.conquistasMeta || {};
      Object.keys(v).forEach(id => {
        exige(CONQ.todas.includes(id), 'Conquista desconhecida.');
        const m = v[id];
        exige(m && typeof m === 'object' && (m.origem === 'normal' || m.origem === 'admin'), 'Registro de conquista inválido.');
        exige(typeof m.desbloqueadaEm === 'string' && m.desbloqueadaEm.length <= 40, 'Data de conquista inválida.');
        /* Só uma sessão administrativa completa pode criar "origem: admin" */
        if (m.origem === 'admin' && !ctx.admin) exige(antigo[id] && antigo[id].origem === 'admin', 'Operação restrita ao administrador.');
      });
      return v;
    }
    case 'diario': case 'registros': {
      exige(Array.isArray(v) && v.length <= (chave === 'diario' ? 250 : 500), 'Lista muito grande.');
      v.forEach(r => exige(r && typeof r === 'object' && !Array.isArray(r), 'Registro inválido.'));
      return v;
    }
    case 'fotos': {
      exige(Array.isArray(v) && v.length <= MAX_FOTOS, 'Limite de fotografias excedido.');
      v.forEach(f => {
        exige(f && typeof f === 'object' && typeof f.id === 'string', 'Fotografia inválida.');
        const erro = validarImagem(f.src, { maxBytes: FOTO_BYTES });
        exige(!erro, 'Fotografia recusada: ' + erro + '.');
        if (f.legenda !== undefined) exige(typeof f.legenda === 'string' && f.legenda.length <= 300, 'Legenda muito longa.');
      });
      return v;
    }
    case 'jogos': {
      exige(v && typeof v === 'object' && !Array.isArray(v), 'Formato inválido.');
      return v;
    }
    case 'perfil': {
      exige(v && typeof v === 'object' && !Array.isArray(v), 'Formato inválido.');
      const p = {};
      if (v.preferencias && typeof v.preferencias === 'object') p.preferencias = { reduzirAnimacoes: v.preferencias.reduzirAnimacoes === true, mostrarDicas: v.preferencias.mostrarDicas !== false };
      p.primeiroAcessoConcluido = v.primeiroAcessoConcluido === true;
      if (typeof v.ultimoAcesso === 'string') p.ultimoAcesso = v.ultimoAcesso.slice(0, 20);
      p.recompensas = { poteDourado: !!(v.recompensas && v.recompensas.poteDourado === true) };
      if (v.stats && typeof v.stats === 'object' && !Array.isArray(v.stats)) {
        p.stats = {};
        Object.keys(v.stats).slice(0, 60).forEach(k => { if (typeof v.stats[k] === 'number' || typeof v.stats[k] === 'boolean') p.stats[k] = v.stats[k]; else if (v.stats[k] && typeof v.stats[k] === 'object') p.stats[k] = v.stats[k]; });
      }
      /* modo administrador: só vale em sessão administrativa completa */
      p.adminAtivo = ctx.admin ? v.adminAtivo === true : false;
      if (v.fotoPerfil) {
        exige((idadeEmAnos(ctx.nascimento) || 0) >= 18, 'A fotografia de perfil está disponível somente para maiores de 18 anos.');
        const erro = validarImagem(v.fotoPerfil, { maxBytes: PERFIL_BYTES, maxLado: 1024 });
        exige(!erro, 'Fotografia de perfil recusada: ' + erro + '.');
        p.fotoPerfil = v.fotoPerfil;
      }
      return p;
    }
  }
  return v;
}

module.exports = { CHAVES, LIMITE_BYTES, validarChave, ErroDados, CONQ };
