'use strict';

const emailValido = (s) => typeof s === 'string' && s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const normalizarEmail = (s) => String(s || '').trim().toLowerCase();

function textoLimpo(s, max) {
  if (typeof s !== 'string') return '';
  return s.replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, max);
}

function dataValida(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [a, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d));
  if (dt.getUTCFullYear() !== a || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return false;
  return a >= 1900 && dt.getTime() <= Date.now();
}
function idadeEmAnos(s) {
  if (!dataValida(s)) return null;
  const [a, m, d] = s.split('-').map(Number);
  const h = new Date();
  let idade = h.getUTCFullYear() - a;
  if (h.getUTCMonth() + 1 < m || (h.getUTCMonth() + 1 === m && h.getUTCDate() < d)) idade--;
  return idade;
}

/* ---------- Imagens enviadas (data URL): valida tipo REAL pelos bytes, tamanho e dimensões ---------- */
function lerDimensoes(buf, tipo) {
  try {
    if (tipo === 'png') return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
    if (tipo === 'jpeg') {
      let i = 2;
      while (i + 9 < buf.length) {
        if (buf[i] !== 0xff) { i++; continue; }
        const m = buf[i + 1];
        if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
        i += 2 + buf.readUInt16BE(i + 2);
      }
      return null;
    }
    if (tipo === 'webp') {
      const f = buf.toString('ascii', 12, 16);
      if (f === 'VP8 ') return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
      if (f === 'VP8L') { const b = buf.readUInt32LE(21); return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 }; }
      if (f === 'VP8X') return { w: buf.readUIntLE(24, 3) + 1, h: buf.readUIntLE(27, 3) + 1 };
    }
  } catch (_) { /* cai no null abaixo */ }
  return null;
}
function validarImagem(src, { maxBytes, maxLado = 4096 }) {
  if (typeof src !== 'string') return 'imagem inválida';
  const m = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(src);
  if (!m) return 'formato de imagem não permitido (use PNG, JPEG ou WebP)';
  if (src.length > maxBytes * 1.4 + 100) return 'imagem muito grande';
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > maxBytes) return 'imagem muito grande';
  const t = m[1];
  const ok = (t === 'png' && buf.length > 24 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    || (t === 'jpeg' && buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)
    || (t === 'webp' && buf.length > 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP');
  if (!ok) return 'o conteúdo do arquivo não corresponde a uma imagem válida';
  const dim = lerDimensoes(buf, t);
  if (!dim || !dim.w || !dim.h) return 'não foi possível validar as dimensões da imagem';
  if (dim.w > maxLado || dim.h > maxLado) return 'dimensões da imagem acima do permitido';
  return '';
}

/* Copia JSON recusando chaves perigosas, profundidade e textos exagerados (evita poluição de protótipo e abuso). */
function higienizar(v, prof = 0, max = { str: 6000 }) {
  if (prof > 8) throw new Error('estrutura muito profunda');
  if (v === null || typeof v === 'boolean') return v;
  if (typeof v === 'number') { if (!Number.isFinite(v)) throw new Error('número inválido'); return v; }
  if (typeof v === 'string') { if (v.length > max.str && !v.startsWith('data:image/')) throw new Error('texto muito longo'); return v; }
  if (Array.isArray(v)) return v.map(x => higienizar(x, prof + 1, max));
  if (typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') throw new Error('campo proibido');
      o[k] = higienizar(v[k], prof + 1, max);
    }
    return o;
  }
  throw new Error('tipo inválido');
}

module.exports = { emailValido, normalizarEmail, textoLimpo, dataValida, idadeEmAnos, validarImagem, higienizar };
