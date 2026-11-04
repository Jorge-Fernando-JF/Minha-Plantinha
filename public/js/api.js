"use strict";
/* Camada de acesso ao servidor e armazenamento do Minha Plantinha.
   - Conta: os dados ficam no servidor (SQLite); aqui só existe uma cópia em memória enquanto a sessão está aberta.
   - Visitante: tudo fica SOMENTE em memória; nenhuma requisição de dados é feita. Ao sair ou recarregar, some.
   Nada de segredo mora neste arquivo: permissões (inclusive de administrador) são decididas pelo servidor. */
const MP = (() => {
  const PREFIXO = "minhaPlantinha.";
  const MAPA = { plantas: "plantas", conquistas: "conquistas", conquistasMeta: "conquistasMeta", diario: "diario", registros: "registros", fotos: "fotos", resultadosJogos: "jogos", usuario: "perfil" };
  const REVERSO = { plantas: "plantas", conquistas: "conquistas", conquistasMeta: "conquistasMeta", diario: "diario", registros: "registros", fotos: "fotos", jogos: "resultadosJogos", perfil: "usuario" };

  const estado = { tipo: "nenhuma", admin: false, conta: null };   /* tipo: nenhuma | conta | visitante */
  const mem = new Map();
  const pendentes = new Map();
  let timer = null;
  let aoErro = () => {};

  async function api(metodo, caminho, corpo) {
    if (estado.tipo === "visitante" && /^\/api\/(dados|conta|admin)/.test(caminho)) throw new Error("O modo visitante não usa o servidor.");
    let r;
    try {
      r = await fetch(caminho, { method: metodo, credentials: "same-origin", headers: { "Content-Type": "application/json", "X-MP-CSRF": "1" }, body: corpo === undefined ? undefined : JSON.stringify(corpo) });
    } catch (e) { return { ok: false, status: 0, json: { erro: "Sem conexão com o servidor. Tente novamente." } }; }
    let json = null; try { json = await r.json(); } catch (_) { json = {}; }
    return { ok: r.ok, status: r.status, json };
  }

  function paraPerfil(texto) {
    const u = JSON.parse(texto);
    return { preferencias: u.preferencias, primeiroAcessoConcluido: u.primeiroAcessoConcluido, ultimoAcesso: u.ultimoAcesso, recompensas: u.recompensas, stats: u.stats, fotoPerfil: u.fotoPerfil || "", adminAtivo: u.adminAtivo === true };
  }
  function agendar(chaveCliente, texto) {
    if (estado.tipo !== "conta") return;                       /* visitante e sessão fechada: nunca enfileira nada */
    const nome = chaveCliente.slice(PREFIXO.length);
    const srv = MAPA[nome];
    if (!srv) return;
    try { pendentes.set(srv, texto === null ? null : (srv === "perfil" ? paraPerfil(texto) : JSON.parse(texto))); } catch (_) { return; }
    clearTimeout(timer);
    timer = setTimeout(enviar, 600);
  }
  async function enviar() {
    clearTimeout(timer); timer = null;
    if (estado.tipo !== "conta" || !pendentes.size) return true;
    const itens = Object.fromEntries(pendentes);
    pendentes.clear();
    const r = await api("PUT", "/api/dados", { itens });
    if (r.ok) return true;
    if (r.status === 401) { aoErro("Sua sessão expirou. Entre novamente."); window.dispatchEvent(new Event("mp:sessao-expirada")); return false; }
    aoErro((r.json && r.json.erro) || "Não foi possível salvar agora.");
    return false;
  }

  const Store = {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => { mem.set(k, String(v)); agendar(k, String(v)); },
    removeItem: (k) => { mem.delete(k); agendar(k, null); },
    chaves: () => Array.from(mem.keys())
  };

  function montarUsuario(conta, perfil) {
    return Object.assign({ preferencias: { reduzirAnimacoes: false, mostrarDicas: true }, recompensas: { poteDourado: false }, stats: {}, primeiroAcessoConcluido: false, ultimoAcesso: "", fotoPerfil: "" }, perfil || {}, {
      email: conta.email, senha: "", nomeExibicao: conta.nome, nascimento: conta.nascimento, acompanhamentoResponsavel: true,
      admin: estado.admin, adminAtivo: estado.admin && perfil && perfil.adminAtivo === true
    });
  }

  /* Carrega a conta autenticada (a sessão já existe no cookie HttpOnly). */
  async function carregarConta(conta, admin) {
    mem.clear(); pendentes.clear();
    estado.tipo = "conta"; estado.admin = admin === true; estado.conta = conta;
    const r = await api("GET", "/api/dados");
    if (!r.ok) { estado.tipo = "nenhuma"; return false; }
    const d = (r.json && r.json.dados) || {};
    Object.keys(d).forEach(k => { if (REVERSO[k] && k !== "perfil") mem.set(PREFIXO + REVERSO[k], JSON.stringify(d[k])); });
    mem.set(PREFIXO + "usuario", JSON.stringify(montarUsuario(conta, d.perfil)));
    return true;
  }
  function entrarVisitante() {
    mem.clear(); pendentes.clear(); clearTimeout(timer);
    estado.tipo = "visitante"; estado.admin = false; estado.conta = null;
  }
  /* Sair (conta ou visitante): descarta tudo que está em memória. */
  async function encerrar() {
    if (estado.tipo === "conta") { await enviar(); await api("POST", "/api/auth/logout"); }
    mem.clear(); pendentes.clear(); clearTimeout(timer);
    estado.tipo = "nenhuma"; estado.admin = false; estado.conta = null;
  }

  window.addEventListener("pagehide", () => {
    if (estado.tipo === "conta" && pendentes.size) {
      try { fetch("/api/dados", { method: "PUT", keepalive: true, credentials: "same-origin", headers: { "Content-Type": "application/json", "X-MP-CSRF": "1" }, body: JSON.stringify({ itens: Object.fromEntries(pendentes) }) }); } catch (_) { /* melhor esforço */ }
    }
  });

  return { estado, api, Store, carregarConta, entrarVisitante, encerrar, flush: enviar, aoErro: (f) => { aoErro = f; }, PREFIXO };
})();
