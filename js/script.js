let usuario = {
  email: "",
  senha: "",
  nomeExibicao: "",
  nascimento: "",
  acompanhamentoResponsavel: false,
  primeiroAcessoConcluido: false,
  ultimoAcesso: "",
  preferencias: { reduzirAnimacoes: false, mostrarDicas: true },
  admin: false,
  adminAtivo: false,
  fotoPerfil: "",
  recompensas: { poteDourado: false },
  stats: {}
};

function novaPlanta(extra) {
  return Object.assign({
    id: "", semente: "", pote: "", nome: "", descricao: "", dataInicio: "", diasConsecutivos: 0, ultimoDia: "",
    cuidados: { regar: false, sol: false }, tarefas: {}, ultimaRegaEm: "", modoTeste: false,
    interacoes: { cliquesNome: 0, acessosJornal: 0, notasDiario: 0 }
  }, extra || {});
}
/* "planta" é sempre a plantinha selecionada: a mesma referência guardada em "plantas" (até 3, cada uma com id único). */
let planta = novaPlanta();
let plantas = [];
let plantaAtivaId = "";
let jogosStats = null;

let conquistas = [];
let conquistasMeta = {};
let draftPlant = null;
let telaOrigemGuia = "tela-planta";
let fotoPendente = "";
let filaDeModais = [];
let jogoAtual = "quiz";
let perguntaAtual = 0;
let pontosJogo = 0;
let jogoRespondido = false;
let calendarioCursor = new Date();
let calendarioSelecionado = new Date();
let jornalMesAtual = new Date().getMonth();
let toastTimer = null;

const MODO_TESTE_INICIAL = new URLSearchParams(window.location.search).get("modo") === "teste";
let modoTesteAtivo = MODO_TESTE_INICIAL;

function criarChaves(demo) {
  const prefixo = demo ? "minhaPlantinha.demo." : "minhaPlantinha.";
  return {
    usuario: prefixo + "usuario",
    planta: prefixo + "planta",
    plantas: prefixo + "plantas",
    fotos: prefixo + "fotos",
    conquistas: prefixo + "conquistas",
    conquistasMeta: prefixo + "conquistasMeta",
    diario: prefixo + "diario",
    registros: prefixo + "registros",
    jogos: prefixo + "resultadosJogos"
  };
}

let CHAVE = criarChaves(modoTesteAtivo);


const ETAPAS_DIAS = [0, 1, 3, 5, 7, 10];

const JORNAL_PLANTAS = [
  {
    nome: "Feijão",
    especie: "Phaseolus vulgaris",
    foto: "https://upload.wikimedia.org/wikipedia/commons/3/3a/Feij%C3%A3o_Paulista.jpg",
    fonte: "https://commons.wikimedia.org/wiki/File:Feijão_Paulista.jpg",
    credito: "Agent010 — CC BY-SA 4.0",
    meses: [0, 1, 8, 9, 10, 11],
    resumo: "Cultivo de acompanhamento do app. A época adequada depende da temperatura e das condições da região.",
    ambiente: "Prefira observar temperatura, umidade do recipiente e resposta da planta antes de decidir cuidados.",
    semeadura: "Use a orientação do material local de cultivo e acompanhe a umidade sem encharcar."
  },
  {
    nome: "Tomate",
    especie: "Solanum lycopersicum",
    foto: "https://upload.wikimedia.org/wikipedia/commons/e/e7/Tomato_plant_picture.jpg",
    fonte: "https://commons.wikimedia.org/wiki/File:Tomato_plant_picture.jpg",
    credito: "Divya Chinnasamy — CC BY-SA 4.0",
    meses: [7, 8, 9, 10, 11],
    resumo: "Planta sensível às condições de temperatura e luminosidade, com recomendações que mudam conforme a região.",
    ambiente: "Observe calor, disponibilidade de luz e drenagem do recipiente.",
    semeadura: "A orientação deve ser ajustada ao clima local e ao tipo de tomate cultivado."
  },
  {
    nome: "Alface",
    especie: "Lactuca sativa",
    foto: "https://upload.wikimedia.org/wikipedia/commons/b/bd/A_lettuce_plant.jpg",
    fonte: "https://commons.wikimedia.org/wiki/File:A_lettuce_plant.jpg",
    credito: "Ndiptambe — CC0",
    meses: [2, 3, 4, 5, 6, 7],
    resumo: "Acompanhe a umidade do solo e as condições térmicas da região antes do plantio.",
    ambiente: "Evite transformar a referência do calendário em uma regra universal; o clima local importa.",
    semeadura: "Consulte a orientação de sua região e mantenha o recipiente com drenagem adequada."
  },
  {
    nome: "Girassol",
    especie: "Helianthus annuus",
    foto: "https://upload.wikimedia.org/wikipedia/commons/e/e0/A_sunflower_plant.jpg",
    fonte: "https://commons.wikimedia.org/wiki/File:A_sunflower_plant.jpg",
    credito: "Mothusi Sekhomba — CC BY-SA 4.0",
    meses: [0, 7, 8, 9, 10, 11],
    resumo: "Uma espécie que pode integrar projetos educativos sobre luz, crescimento e biodiversidade.",
    ambiente: "Avalie a disponibilidade de luz e o espaço de crescimento da planta.",
    semeadura: "Confirme a melhor época para sua região e para a cultivar escolhida."
  },
  {
    nome: "Rabanete",
    especie: "Raphanus sativus",
    foto: "",
    fonte: "",
    credito: "Conteúdo local",
    meses: [1, 2, 5, 6, 7],
    resumo: "Exemplo de hortaliça de ciclo curto para explorar calendário e cuidado com o solo.",
    ambiente: "Temperatura e umidade interferem no desenvolvimento, portanto a região deve ser considerada.",
    semeadura: "Use a recomendação específica para sua região e mantenha boa drenagem."
  },
  {
    nome: "Cenoura",
    especie: "Daucus carota",
    foto: "",
    fonte: "",
    credito: "Conteúdo local",
    meses: [2, 3, 4, 5, 6, 7],
    resumo: "Uma espécie útil para explicar raízes, solo e desenvolvimento subterrâneo.",
    ambiente: "O solo e a temperatura da região influenciam diretamente o cultivo.",
    semeadura: "Consulte a recomendação regional para a época e prepare um substrato sem excesso de compactação."
  }
];

const ICONES_CONQUISTAS = {
  "gabriel-gallego-secreto": '<svg viewBox="0 0 48 48"><path d="M24 5l5.2 12.3L42 18.6l-9.8 8.6 3 12.8L24 33l-11.2 7 3-12.8L6 18.6l12.8-1.3Z"/><circle cx="24" cy="23" r="3.5"/></svg>',
  "primeiro-cuidado": '<svg viewBox="0 0 48 48"><path d="M24 5C20 13 13 19 13 27a11 11 0 0 0 22 0C35 19 28 13 24 5Z"/><path d="M19 28a5 5 0 0 0 5 5"/></svg>',
  "primeiro-crescimento": '<svg viewBox="0 0 48 48"><path d="M24 40V24"/><path d="M24 30C14 30 10 23 11 15c9 1 13 7 13 15Z"/><path d="M24 25c1-9 7-13 15-12 0 8-6 13-15 12Z"/></svg>',
  "tres-dias": '<svg viewBox="0 0 48 48"><rect x="8" y="12" width="32" height="28" rx="5"/><path d="M15 7v10M33 7v10M8 21h32M16 28h5M27 28h5M16 34h5"/></svg>',
  "sete-dias": '<svg viewBox="0 0 48 48"><path d="M24 39V12"/><path d="M24 28C12 28 8 20 10 11c9 2 14 8 14 17Z"/><path d="M24 21c1-9 7-14 15-12 0 9-6 13-15 12Z"/></svg>',
  "dez-dias": '<svg viewBox="0 0 48 48"><path d="M13 7h22v14a11 11 0 0 1-22 0Z"/><path d="M13 11H7v6a9 9 0 0 0 8 9M35 11h6v6a9 9 0 0 1-8 9M24 32v8M17 42h14"/><path d="m24 10 2.2 4.4 4.8.7-3.5 3.4.8 4.8-4.3-2.3-4.3 2.3.8-4.8-3.5-3.4 4.8-.7Z"/></svg>'
};

function migrarRegistrosAntigos() {
  const atuais = lerJSON(CHAVE.registros, []);
  if (Array.isArray(atuais) && atuais.length) return;
  const historico = lerJSON(CHAVE.diario, []);
  if (!Array.isArray(historico) || !historico.length) return;
  const derivados = historico
    .filter(item => item.origem === "principal" && (item.tipo === "Rega" || item.tipo === "Sol"))
    .map(item => {
      const hora = item.hora || "00:00";
      return {
        id: item.id || Date.now() + Math.random(),
        timestamp: item.data ? new Date(item.data + "T" + hora + ":00").toISOString() : new Date().toISOString(),
        data: item.data || hojeISO(),
        hora,
        tipo: item.tipo,
        descricao: item.nota || "Cuidado concluído"
      };
    });
  if (derivados.length) localStorage.setItem(CHAVE.registros, JSON.stringify(derivados.slice(-500)));
}


/* ---------- Segurança básica de senha (hash SHA-256 com sal) ---------- */
function bytesParaHex(buf) { return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join(""); }
async function hashSenha(senha, sal) {
  sal = sal || bytesParaHex(crypto.getRandomValues(new Uint8Array(12)));
  const dados = new TextEncoder().encode(sal + ":" + senha);
  const resumo = await crypto.subtle.digest("SHA-256", dados);
  return "h1$" + sal + "$" + bytesParaHex(resumo);
}
async function senhaConfere(informada, guardada) {
  if (!guardada) return false;
  if (guardada.startsWith("h1$")) {
    const sal = guardada.split("$")[1];
    return (await hashSenha(informada, sal)) === guardada;
  }
  return guardada === informada; /* senha antiga em texto puro: será convertida no login */
}

function lerJSON(chave, fallback) {
  try {
    const valor = JSON.parse(localStorage.getItem(chave) || "null");
    return valor === null ? fallback : valor;
  } catch (erro) {
    return fallback;
  }
}

function mostrarToast(texto) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = texto;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function idadeEmAnos(dataNascimento) {
  if (!dataNascimento) return null;
  const nascimento = new Date(dataNascimento + "T12:00:00");
  if (Number.isNaN(nascimento.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const aniversario = new Date(hoje.getFullYear(), nascimento.getMonth(), nascimento.getDate());
  if (hoje < aniversario) idade--;
  return idade;
}

function dataValidaNaoFutura(valor) {
  if (!valor) return false;
  const data = new Date(valor + "T12:00:00");
  if (Number.isNaN(data.getTime())) return false;
  const hoje = new Date();
  hoje.setHours(23, 59, 59, 999);
  return data <= hoje;
}

function formatarData(data) {
  return data.getFullYear() + "-" + String(data.getMonth() + 1).padStart(2, "0") + "-" + String(data.getDate()).padStart(2, "0");
}

function hojeISO() { return formatarData(new Date()); }
function ontemISO() { const d = new Date(); d.setDate(d.getDate() - 1); return formatarData(d); }

function formatarDataBR(valor) {
  if (!valor) return "—";
  return new Date(valor + "T12:00:00").toLocaleDateString("pt-BR");
}

function iniciarSessao() {
  document.body.classList.add("app-mode");
  document.body.classList.remove("auth-mode");
}

function mostrarTela(id) {
  document.querySelectorAll(".tela").forEach(tela => tela.classList.remove("ativa"));
  const tela = document.getElementById(id);
  if (!tela) return;
  tela.classList.add("ativa");
  registrarVisitaTela(id);
  const appTelas = ["tela-inicial", "tela-nome", "tela-lembretes", "tela-planta", "tela-minha-plantinha", "tela-progresso", "tela-conquistas", "tela-guia", "tela-topico", "tela-jornal", "tela-calendario", "tela-tutorial", "tela-diario", "tela-registros", "tela-fotos", "tela-configuracoes", "tela-jogos"];
  document.body.classList.toggle("app-mode", appTelas.includes(id));
  document.body.classList.toggle("auth-mode", id === "tela-login" || id === "tela-cadastro" || id === "tela-fim");
  fecharMenuMobile();
  atualizarNavegacao(id);
  if (id === "tela-planta") atualizarTelaPlanta();
  if (id === "tela-minha-plantinha") renderizarDetalhesPlanta();
  if (id === "tela-progresso") carregarProgresso();
  if (id === "tela-conquistas") renderizarConquistas();
  if (id === "tela-guia") renderizarGuia();
  if (id === "tela-jornal") {
    garantirUsuario();
    usuario.stats.acessosJornal = (usuario.stats.acessosJornal || 0) + 1;
    salvarDados();
    renderizarJornal();
    verificarConquistas();
  }
  if (id === "tela-calendario") { calendarioCursor = new Date(); calendarioSelecionado = new Date(); calendarioAba = "dia"; renderizarCalendario(); }
  if (id === "tela-tutorial") { renderizarTutorial(tutorialAtual); tutorialAtual = ""; }
  if (id === "tela-lembretes") renderizarMetodoLembrete();
  if (id === "tela-diario") renderizarDiario();
  if (id === "tela-registros") renderizarRegistros();
  if (id === "tela-fotos") renderizarFotos();
  if (id === "tela-configuracoes") carregarConfiguracoes();
  if (id === "tela-jogos" && !document.getElementById("game-area").children.length) renderizarPerguntaJogo();
  window.scrollTo(0, 0);
}

function atualizarNavegacao(id) {
  document.querySelectorAll(".nav-link[data-nav-screen], .recent-plant").forEach(item => item.classList.toggle("selecionado", item.dataset.navScreen === id));
  let grupoAtivo = null;
  document.querySelectorAll(".nav-link[data-nav-screen]").forEach(item => { if (item.dataset.navScreen === id) grupoAtivo = item.closest(".nav-group"); });
  document.querySelectorAll(".nav-group").forEach(grupo => {
    const aberto = grupo === grupoAtivo;
    grupo.classList.toggle("aberto", aberto);
    const toggle = grupo.querySelector(".nav-group-toggle");
    const submenu = grupo.querySelector(".nav-subnav");
    if (toggle) toggle.setAttribute("aria-expanded", String(aberto));
    if (submenu) submenu.hidden = !aberto;
  });
  atualizarSidebar();
}

function atualizarSidebar() {
  const nome = planta.nome || "Minha plantinha";
  const nomePerfil = usuario.nomeExibicao || "Meu cultivo";
  document.getElementById("sidebar-plant-name").textContent = nome;
  document.getElementById("sidebar-plant-status").textContent = planta.nome ? "Em acompanhamento" : "Pronto para começar";
  document.getElementById("sidebar-profile-name").textContent = nomePerfil;
  document.getElementById("sidebar-profile-email").textContent = usuario.email || "Conta local";
  const perfil = document.getElementById("sidebar-profile-email");
  if (perfil && contaAdmin()) perfil.textContent = (usuario.email || "Conta administrativa") + " · ADM";
  const novo = document.getElementById("sidebar-nova-planta");
  if (novo) { const cheio = plantas.length >= MAX_PLANTAS; novo.disabled = cheio; novo.classList.toggle("limite", cheio); novo.title = cheio ? "Você atingiu o limite de plantinhas." : "Criar uma nova plantinha"; novo.innerHTML = cheio ? '<span aria-hidden="true">✓</span> Limite de plantinhas' : '<span aria-hidden="true">+</span> Nova plantinha'; }
  atualizarFotoPerfil();
}


function prepararNovoDia() {
  if (!planta.ultimoDia) return;
  const hoje = hojeISO();
  if (planta.ultimoDia === hoje) return;
  if (planta.ultimoDia !== ontemISO()) planta.diasConsecutivos = 0;
  planta.cuidados = { regar: false, sol: false };
  salvarDados();
}

function obterIndiceEtapa(dias) {
  let indice = 0;
  ETAPAS_DIAS.forEach((dia, i) => { if (dias >= dia) indice = i; });
  return indice;
}

let svgContador = 0;

function ehPoteDourado(pote) { return /dourado|terra de ouro/i.test(String(pote || "")); }
function ehTerraOuro(pote) { return /terra de ouro/i.test(String(pote || "")); }
/* Converte o texto salvo em planta.pote ("Vaso" / "Pote de Danone" / "Pote de Danone dourado") para um tipo interno. */
function normalizarRecipiente(pote) {
  if (ehTerraOuro(pote)) return "vaso";
  return /danone|iogurte|dourado/i.test(String(pote || "")) ? "danone" : "vaso";
}

function salvarDados() {
  try {
    garantirUsuario();
    if (planta.id && !plantas.includes(planta)) {
      const i = plantas.findIndex(p => p.id === planta.id);
      if (i >= 0) plantas[i] = planta; else plantas.push(planta);
    }
    plantaAtivaId = planta.id || plantaAtivaId;
    localStorage.setItem(CHAVE.usuario, JSON.stringify(usuario));
    localStorage.setItem(CHAVE.plantas, JSON.stringify({ versao: 2, ativa: plantaAtivaId, lista: plantas }));
    localStorage.setItem(CHAVE.conquistas, JSON.stringify(conquistas));
    localStorage.setItem(CHAVE.conquistasMeta, JSON.stringify(conquistasMeta));
    localStorage.setItem(CHAVE.jogos, JSON.stringify(jogosStats || novosJogosStats()));
  } catch (erro) {
    mostrarToast("Não foi possível salvar os dados.");
  }
}

function lerJSON(chave, fallback) {
  try {
    const valor = JSON.parse(localStorage.getItem(chave) || "null");
    return valor === null ? fallback : valor;
  } catch (erro) {
    return fallback;
  }
}

/* Carrega a conta e migra dados do formato antigo (uma só planta) para o formato com várias plantinhas. */
function carregarDados() {
  const salvoUsuario = lerJSON(CHAVE.usuario, null);
  const salvoPlantas = lerJSON(CHAVE.plantas, null);
  const salvoConquistas = lerJSON(CHAVE.conquistas, []);
  const salvoConquistasMeta = lerJSON(CHAVE.conquistasMeta, {});
  if (salvoUsuario) usuario = Object.assign(usuario, salvoUsuario, {
    preferencias: Object.assign({ reduzirAnimacoes: false, mostrarDicas: true }, salvoUsuario.preferencias || {}),
    adminAtivo: Boolean(salvoUsuario.adminAtivo)
  });
  garantirUsuario();
  sincronizarAdmin();
  plantas = [];
  let antiga = null;
  if (salvoPlantas && Array.isArray(salvoPlantas.lista)) {
    plantas = salvoPlantas.lista.filter(p => p && p.id).slice(0, MAX_PLANTAS).map(normalizarPlanta);
  } else {
    antiga = lerJSON(CHAVE.planta, null);
    if (antiga && antiga.nome) plantas = [normalizarPlanta(Object.assign({}, antiga, { id: gerarIdPlanta() }))];
  }
  planta = plantas.find(p => p.id === (salvoPlantas && salvoPlantas.ativa)) || plantas[0] || novaPlanta();
  plantaAtivaId = planta.id;
  if (Array.isArray(salvoConquistas)) conquistas = salvoConquistas;
  if (salvoConquistasMeta && typeof salvoConquistasMeta === "object") conquistasMeta = salvoConquistasMeta;
  jogosStats = Object.assign(novosJogosStats(), lerJSON(CHAVE.jogos, {}) || {});
  migrarRegistrosAntigos();
  /* migração: contadores que ficavam na planta passam a valer para a conta; foto única vira registro da galeria */
  plantas.forEach(p => {
    usuario.stats.cliquesNome = Math.max(usuario.stats.cliquesNome || 0, p.interacoes.cliquesNome || 0);
    usuario.stats.acessosJornal = Math.max(usuario.stats.acessosJornal || 0, p.interacoes.acessosJornal || 0);
  });
  if (antiga && plantas[0]) {
    if (antiga.foto && !lerListaSalva(CHAVE.fotos).length) {
      try { localStorage.setItem(CHAVE.fotos, JSON.stringify([{ id: gerarIdPlanta() + "f", plantaId: plantas[0].id, data: antiga.fotoData || hojeISO(), ts: new Date((antiga.fotoData || hojeISO()) + "T12:00:00").toISOString(), estagio: obterIndiceEtapa(plantas[0].diasConsecutivos), dia: plantas[0].diasConsecutivos, legenda: "", src: antiga.foto }])); } catch (e) { /* sem espaço */ }
    }
  }
  if (plantas[0]) {
    ["diario", "registros"].forEach(k => {
      const lista = lerListaSalva(CHAVE[k]);
      if (lista.some(r => !r.plantaId)) { lista.forEach(r => { if (!r.plantaId) r.plantaId = plantas[0].id; }); try { localStorage.setItem(CHAVE[k], JSON.stringify(lista)); } catch (e) { /* ignora */ } }
    });
  }
}

function resetarEstadoParaNamespace(demo) {
  usuario = {
    email: "", senha: "", nomeExibicao: "", nascimento: "", acompanhamentoResponsavel: false, primeiroAcessoConcluido: false,
    ultimoAcesso: "", preferencias: { reduzirAnimacoes: false, mostrarDicas: true }, admin: false, adminAtivo: false,
    fotoPerfil: "", recompensas: { poteDourado: false }, stats: {}
  };
  planta = novaPlanta({ modoTeste: demo });
  plantas = []; plantaAtivaId = "";
  conquistas = []; conquistasMeta = {}; jogosStats = novosJogosStats();
  CHAVE = criarChaves(demo);
  carregarDados();
}

/* Pote dourado: ouro envelhecido (tons de champanhe), brilho estático e suave, faixa ondulada como no pote original. */
function gradientesOuro(uid) {
  return '<linearGradient id="' + uid + '-gold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9a7628"/><stop offset=".16" stop-color="#cfaa55"/><stop offset=".36" stop-color="#f0dc9c"/><stop offset=".56" stop-color="#d6b25c"/><stop offset=".82" stop-color="#ab8130"/><stop offset="1" stop-color="#85621d"/></linearGradient>'
    + '<linearGradient id="' + uid + '-goldband" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#c79a3c"/><stop offset="1" stop-color="#94691f"/></linearGradient>';
}
function paredeOuro(uid, corpo) {
  /* O ouro fica só na casca (bordas e fundo); o miolo continua transparente, com algodão, raízes e água nas cores naturais. */
  const frente = 'M121 196 L142 300 A48 9 0 0 0 238 300 L259 196 A69 15.5 0 0 1 121 196 Z';
  return '<path d="' + frente + '" fill="url(#' + uid + '-gold)" opacity=".1"/>'
    + '<g clip-path="url(#' + uid + '-clip)"><rect x="110" y="270" width="160" height="45" fill="url(#' + uid + '-band)"/><path d="M110 276q20-9 40 0t40 0t40 0t40 0" fill="none" stroke="#ffffff" stroke-width="3" opacity=".7"/></g>'
    + '<path d="M121 196 L142 300 A48 9 0 0 0 238 300 L259 196" fill="none" stroke="#7d5c1c" stroke-width="7.4" stroke-linejoin="round" stroke-linecap="round"/>'
    + '<path d="M121 196 L142 300 A48 9 0 0 0 238 300 L259 196" fill="none" stroke="url(#' + uid + '-gold)" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>'
    + '<path d="M126 208l14 84" stroke="#fff8dc" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>';
}
function bordaOuro(uid, cx) {
  return '<ellipse cx="' + cx + '" cy="196" rx="69" ry="15.5" fill="none" stroke="#7d5c1c" stroke-width="6.2"/><ellipse cx="' + cx + '" cy="196" rx="69" ry="15.5" fill="none" stroke="url(#' + uid + '-gold)" stroke-width="4"/><ellipse cx="' + cx + '" cy="195" rx="66" ry="13.5" fill="none" stroke="#fff4c4" stroke-width="1" opacity=".6"/>';
}
/* Vaso de Terra de Ouro: mesma forma do vaso de cerâmica, esmaltado em ouro envelhecido. */
function douradoVaso(svg, uid) {
  const cores = { '#e4a078': '#d9bd6c', '#ca7655': '#bd9740', '#a9523e': '#8a6420', '#ebaa81': '#ecd790', '#b96145': '#a67d2c', '#ad6047': '#7d5c1c', '#b96044': '#9d7424', '#f4bb97': '#fff1bd', '#984b38': '#6f4f14' };
  return svg.replace(/#[0-9a-fA-F]{6}/g, c => cores[c.toLowerCase()] || c);
}

/* Converte o texto salvo em planta.pote ("Vaso" / "Pote de Danone") para um tipo interno. */
/* Partes da planta em coordenadas locais (caule em x=180, base em y=209). */
function partesPlanta(etapa) {
  const altura = [0, 29, 48, 72, 96, 124][etapa];
  const topo = 205 - altura;
  const paresFolhas = Math.max(0, etapa - 1);
  const larguraFolha = 40;
  const folhas = Array.from({ length: paresFolhas }, (_, i) => {
    const y = 190 - i * (etapa >= 5 ? 25 : etapa >= 4 ? 29 : 31);
    const x = larguraFolha + Math.min(i * 2, 8);
    const esquerda = '<path d="M180 ' + y + ' C' + (180 - x * .25) + ' ' + (y - 17) + ' ' + (180 - x) + ' ' + (y - 22) + ' ' + (180 - x) + ' ' + (y - 5) + ' C' + (180 - x + 2) + ' ' + (y + 8) + ' ' + (180 - x * .3) + ' ' + (y + 8) + ' 180 ' + y + 'Z" fill="' + (i % 2 ? '#6f966c' : '#86a87b') + '"/><path d="M180 ' + (y + 1) + ' L' + (180 - x + 4) + ' ' + (y - 8) + '" stroke="#d0dfbd" stroke-width="1.5" opacity=".8"/>';
    const direita = '<path d="M180 ' + (y - 5) + ' C' + (180 + x * .2) + ' ' + (y - 25) + ' ' + (180 + x) + ' ' + (y - 27) + ' ' + (180 + x - 1) + ' ' + (y - 9) + ' C' + (180 + x - 2) + ' ' + (y + 2) + ' ' + (180 + x * .25) + ' ' + (y + 8) + ' 180 ' + (y - 5) + 'Z" fill="' + (i % 2 ? '#477756' : '#5f8a5e') + '"/><path d="M180 ' + (y - 3) + ' L' + (180 + x - 4) + ' ' + (y - 15) + '" stroke="#c5d9b4" stroke-width="1.5" opacity=".8"/>';
    return '<path d="M180 209 Q' + (180 - (i % 2 ? 11 : 6)) + ' ' + (y + 18) + ' 180 ' + y + '" fill="none" stroke="#467451" stroke-width="3.3" stroke-linecap="round"/>' + esquerda + direita;
  }).join("");
  const haste = etapa > 0 ? '<path d="M180 209 C' + (176 + etapa) + ' ' + (topo + 42) + ' 177 ' + (topo + 18) + ' 180 ' + topo + '" fill="none" stroke="#467451" stroke-width="4.5" stroke-linecap="round"/>' : "";
  const broto = etapa === 1 ? '<path d="M180 ' + (topo + 3) + ' C160 ' + (topo - 20) + ' 147 ' + (topo - 13) + ' 156 ' + (topo + 2) + ' C164 ' + (topo + 9) + ' 174 ' + (topo + 8) + ' 180 ' + (topo + 3) + 'Z" fill="#86a87b"/><path d="M180 ' + (topo + 3) + ' C196 ' + (topo - 21) + ' 212 ' + (topo - 13) + ' 203 ' + (topo + 2) + ' C195 ' + (topo + 9) + ' 185 ' + (topo + 8) + ' 180 ' + (topo + 3) + 'Z" fill="#5f8a5e"/>' : "";
  const topoFolhas = etapa >= 2 ? '<path d="M180 ' + (topo + 4) + ' C158 ' + (topo - 20) + ' 151 ' + (topo - 10) + ' 160 ' + (topo + 1) + ' C166 ' + (topo + 8) + ' 175 ' + (topo + 8) + ' 180 ' + (topo + 4) + 'Z" fill="#8eaf80"/><path d="M180 ' + (topo + 4) + ' C199 ' + (topo - 21) + ' 210 ' + (topo - 10) + ' 201 ' + (topo + 1) + ' C195 ' + (topo + 8) + ' 185 ' + (topo + 8) + ' 180 ' + (topo + 4) + 'Z" fill="#507f5b"/>' : "";
  return haste + folhas + broto + topoFolhas;
}

const FEIJAO_SVG = '<ellipse cx="180" cy="204" rx="12" ry="7" fill="#b78a51" transform="rotate(-22 180 204)"/><path d="M174 205q7-7 13-5" fill="none" stroke="#e0bd82" stroke-width="2" stroke-linecap="round"/>';

/* Vaso tradicional: a planta sai do centro da terra, que fica dentro da boca do vaso. */
function cenaVaso(uid, etapa, op, ouro) {
  const defs = '<defs><linearGradient id="' + uid + '-cer" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e4a078"/><stop offset=".48" stop-color="#ca7655"/><stop offset="1" stop-color="#a9523e"/></linearGradient><linearGradient id="' + uid + '-rim" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ebaa81"/><stop offset="1" stop-color="#b96145"/></linearGradient><filter id="' + uid + '-sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="7" flood-color="#604d3e" flood-opacity=".13"/></filter></defs>';
  const vaso = '<g filter="url(#' + uid + '-sh)"><path d="M91 211 C98 245 108 279 119 293 Q180 310 241 293 C252 279 262 245 269 211Z" fill="url(#' + uid + '-cer)" stroke="#ad6047" stroke-width="1.5"/><path d="M109 255c6 20 10 29 15 36M251 253c-5 19-10 30-15 38" fill="none" stroke="#f4bb97" stroke-width="4" stroke-linecap="round" opacity=".55"/><path d="M126 295q54 9 108 0" fill="none" stroke="#984b38" stroke-width="2" opacity=".4"/><ellipse cx="180" cy="211" rx="101" ry="23" fill="#b96044"/><ellipse cx="180" cy="207" rx="87" ry="16" fill="url(#' + uid + '-rim)"/><ellipse cx="180" cy="207" rx="76" ry="10.5" fill="#594536"/><path d="M111 207q69 17 138 0" fill="none" stroke="#8f6b4a" stroke-width="2" opacity=".7"/><circle cx="143" cy="205" r="1.5" fill="#b99872"/><circle cx="166" cy="209" r="1.2" fill="#b99872"/><circle cx="203" cy="204" r="1.5" fill="#b99872"/><circle cx="223" cy="208" r="1.2" fill="#b99872"/></g>';
  const vasoFinal = ouro ? douradoVaso(vaso, uid) + '<path d="M97 232q83 18 166 0" fill="none" stroke="#fff1bd" stroke-width="2" opacity=".55"/>' : vaso;
  let planta = "";
  if (op.feijao) {
    if (etapa === 0) planta = FEIJAO_SVG + '<path d="M165 207q15-6 30 0q-15 6-30 0Z" fill="#594536"/>';
    else planta = partesPlanta(etapa) + '<ellipse cx="180" cy="208" rx="13" ry="4" fill="#594536"/><circle cx="173" cy="207" r="1.4" fill="#8f6b4a"/><circle cx="188" cy="208" r="1.2" fill="#8f6b4a"/>';
  }
  return { defs: ouro ? douradoVaso(defs, uid) : defs, base: vasoFinal, planta: '<g class="planta-svg">' + planta + (op.umido > 0 && op.feijao ? orvalho(etapa, op.umido) : '') + '</g>', frente: "", lateral: "" };
}

/* Pote de iogurte (Danone): copo cônico com borda, paredes translúcidas, algodão e raiz visível. */
function cenaDanone(uid, etapa, op, ouro) {
  const dx = 10; /* centro do pote: o caule fica em x = 180 + dx = 190 = cx, em todas as etapas */
  const cx = 190;
  const corpo = 'M122 196 L142 300 A48 9 0 0 0 238 300 L258 196 Z';
  const defs = '<defs>' + (ouro ? gradientesOuro(uid) : '') + '<linearGradient id="' + uid + '-fofo" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#e4dcc8"/><stop offset=".3" stop-color="#f7f3e8"/><stop offset=".7" stop-color="#f7f3e8"/><stop offset="1" stop-color="#e0d8c3"/></linearGradient><clipPath id="' + uid + '-clip"><path d="' + corpo + '"/></clipPath><linearGradient id="' + uid + '-wall" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#ffffff" stop-opacity=".78"/><stop offset=".45" stop-color="#ffffff" stop-opacity=".34"/><stop offset="1" stop-color="#dfe9ee" stop-opacity=".62"/></linearGradient><linearGradient id="' + uid + '-band" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#8fc6e6"/><stop offset=".5" stop-color="#5fa8d3"/><stop offset="1" stop-color="#4a8fbd"/></linearGradient><filter id="' + uid + '-sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="7" flood-color="#604d3e" flood-opacity=".13"/></filter></defs>';
  /* fundo: parede interna traseira + algodão */
  let miolo = '<ellipse cx="' + cx + '" cy="196" rx="66" ry="14" fill="#d9e3e6"/>';
  if (op.algodao) {
    const fibras = 'M136 226q12-8 24-2M170 240q14-9 28 0M206 224q12-7 24 2M146 256q12-7 26 0M190 268q14-7 28-1M222 250q8-6 16-2M158 280q10-5 20 0M216 282q8-4 14 0';
    miolo += '<g clip-path="url(#' + uid + '-clip)"><rect x="110" y="200" width="160" height="116" fill="url(#' + uid + '-fofo)"/>'
      + (op.gotas ? '<rect x="110" y="205" width="160" height="110" fill="#bcdcec" opacity=".3"/>' : '')
      + '<path d="' + fibras + '" fill="none" stroke="#d9cfb6" stroke-width="2" stroke-linecap="round" opacity=".85"/>'
      + '<path d="M140 236q10-5 18-1M182 250q10-5 20 0M226 238q6-3 12 0" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" opacity=".8"/></g>'
      + '<ellipse cx="' + cx + '" cy="204" rx="62" ry="10.5" fill="#efe8d6"/>'
      + [[142, 201, 8.5], [160, 197, 9.5], [181, 195, 9], [203, 196, 9.5], [222, 200, 8.5], [236, 205, 6.5], [132, 206, 6.5], [170, 205, 8], [196, 206, 8], [214, 207, 6.5]].map(c => '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '" fill="#faf7ef"/><path d="M' + (c[0] - c[2] * .6) + ' ' + (c[1] + c[2] * .55) + 'q' + (c[2] * .6) + ' ' + (c[2] * .5) + ' ' + (c[2] * 1.2) + ' 0" fill="none" stroke="#ddd3ba" stroke-width="1.1" stroke-linecap="round"/>').join("")
      + (op.gotas ? '<ellipse cx="' + cx + '" cy="206" rx="56" ry="9" fill="#bcdcec" opacity=".3"/>' : '');
  }
  /* raízes (somente com feijão e algodão): aparecem pela parede translúcida */
  let raizes = "";
  if (op.feijao && op.algodao && etapa >= 1) {
    const L = [0, 22, 38, 50, 58, 62][etapa];
    const traco = (d, w) => '<path d="' + d + '" fill="none" stroke="#a8946a" stroke-width="' + (w + 1.6) + '" stroke-linecap="round"/><path d="' + d + '" fill="none" stroke="#fffaf0" stroke-width="' + w + '" stroke-linecap="round"/>';
    raizes = '<g transform="translate(' + dx + ' 0)" clip-path="url(#' + uid + '-clip)" transform-origin="0 0">' + traco('M180 210 C177 ' + (210 + L * .4) + ' 184 ' + (210 + L * .7) + ' 179 ' + (210 + L), 2.6)
      + (L >= 38 ? traco('M179 ' + (210 + L * .45) + ' q-12 4 -17 12', 1.6) + traco('M181 ' + (210 + L * .62) + ' q12 3 17 11', 1.6) : '')
      + (L >= 58 ? traco('M180 ' + (210 + L * .85) + ' q-9 2 -13 9', 1.3) : '') + '</g>';
    raizes = raizes.replace(' transform-origin="0 0"', '');
  }
  const parede = '<path d="' + corpo + '" fill="url(#' + uid + '-wall)" stroke="#9fb2ba" stroke-width="1.8"/>'
    + '<g clip-path="url(#' + uid + '-clip)"><rect x="110" y="270" width="160" height="45" fill="url(#' + uid + '-band)"/><path d="M110 276q20-9 40 0t40 0t40 0t40 0" fill="none" stroke="#ffffff" stroke-width="3" opacity=".7"/><path d="M118 205l16 90" stroke="#ffffff" stroke-width="5" opacity=".5" stroke-linecap="round"/></g>'
    + '<path d="M142 300 A48 9 0 0 0 238 300" fill="none" stroke="#3f7ba5" stroke-width="1.6" opacity=".7"/>';
  const borda = '<ellipse cx="' + cx + '" cy="196" rx="69" ry="15.5" fill="none" stroke="#9fb2ba" stroke-width="5.5"/><ellipse cx="' + cx + '" cy="196" rx="69" ry="15.5" fill="none" stroke="#ffffff" stroke-width="3"/>';
  /* planta e feijão, por cima de tudo; a base fica em cima do algodão, dentro da boca do pote */
  let planta = "";
  if (op.feijao) {
    if (etapa === 0) planta = FEIJAO_SVG + '<path d="M170 205q10-4 20 0q-10 4-20 0Z" fill="#fbf9f3"/>';
    else planta = partesPlanta(etapa) + (etapa <= 3 ? '<ellipse cx="180" cy="209" rx="9" ry="5.5" fill="#b78a51" transform="rotate(-22 180 209)"/>' : '') + '<ellipse cx="180" cy="208" rx="12" ry="3.6" fill="#fbf9f3"/>';
  }
  return {
    defs,
    base: '<g filter="url(#' + uid + '-sh)">' + miolo + raizes + (ouro ? paredeOuro(uid, corpo) : parede) + (ouro ? bordaOuro(uid, cx) : borda) + '</g>',
    planta: '<g class="planta-svg" transform="translate(' + dx + ' 0)">' + planta + (op.umido > 0 && op.feijao ? orvalho(etapa, op.umido) : '') + '</g>',
    frente: "", lateral: ""
  };
}

function cenaExtras(op) {
  let extra = "";
  if (op.sol) extra += '<g opacity=".95"><circle cx="300" cy="64" r="24" fill="#f5cf68"/><path d="M300 22v-10M300 106v10M258 64h-10M342 64h10M270 34l-7-7M330 94l7 7M330 34l7-7M270 94l-7 7" stroke="#e6b84a" stroke-width="4" stroke-linecap="round"/><path d="M276 84 L232 150" stroke="#f5cf68" stroke-width="3" stroke-dasharray="2 8" stroke-linecap="round"/></g>';
  if (op.gotas) extra += [[150, 96], [190, 128], [226, 90]].map(p => '<path d="M' + p[0] + ' ' + p[1] + 'c-9 12-13 18-13 24a13 13 0 0 0 26 0c0-6-4-12-13-24Z" fill="#7bbbe0" stroke="#4f95bf" stroke-width="1.5"/>').join("");
  if (op.brilho) extra += '<g fill="#f5cf68"><path d="M300 90l4 12 12 4-12 4-4 12-4-12-12-4 12-4Z"/><path d="M82 70l3 8 8 3-8 3-3 8-3-8-8-3 8-3Z"/><path d="M96 150l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5Z"/></g>';
  return extra;
}

function desenharPlanta(indice, semente, pote, opcoes) {
  const op = Object.assign({ algodao: true, feijao: true, gotas: false, sol: false, brilho: false }, opcoes || {});
  const etapa = Math.max(0, Math.min(5, indice));
  const tipo = normalizarRecipiente(pote);
  const uid = "pl" + (++svgContador);
  const cena = tipo === "danone" ? cenaDanone(uid, etapa, op, ehPoteDourado(pote)) : cenaVaso(uid, etapa, op, ehPoteDourado(pote));
  const descricao = ["semente plantada", "germinação", "primeiro broto", "muda com folhas", "planta jovem", "planta desenvolvida"][etapa];
  const nomeRec = tipo === "danone" ? (ehPoteDourado(pote) ? "pote de iogurte dourado com algodão" : "pote de iogurte com algodão") : (ehPoteDourado(pote) ? "vaso Terra de Ouro com terra" : "vaso com terra");
  const rotulo = op.feijao ? 'Ilustração educativa de um ' + (semente || 'feijão').toLowerCase() + ' em ' + nomeRec + ', etapa ' + (etapa + 1) + ': ' + descricao : 'Ilustração educativa de um ' + nomeRec;
  const sombra = '<ellipse cx="' + (tipo === "danone" ? 190 : 180) + '" cy="304" rx="' + (tipo === "danone" ? 70 : 85) + '" ry="9" fill="#796c57" opacity=".13"/>';
  return '<svg class="plant-illustration plant-' + tipo + (ehPoteDourado(pote) ? ' plant-dourado' : '') + '" viewBox="0 0 360 330" role="img" aria-label="' + rotulo + '" xmlns="http://www.w3.org/2000/svg">' + cena.defs + sombra + cena.base + cena.planta + cenaExtras(op) + '</svg>';
}

function obterImagemPlanta(semente, dias, pote, opcoes) { return desenharPlanta(obterIndiceEtapa(dias), semente, pote, opcoes); }

function obterNomeEtapa(dias) {
  const labels = ["Semente", "Germinação", "Primeiro broto", "Muda com folhas", "Planta jovem", "Planta desenvolvida"];
  return labels[obterIndiceEtapa(dias)];
}

function obterDiaProximaEtapa(dias) {
  const futura = ETAPAS_DIAS.find(dia => dia > dias);
  return futura === undefined ? null : futura;
}

function atualizarTelaPlanta() {
  prepararNovoDia();
  document.getElementById("nome-planta-final").textContent = planta.nome || "Minha plantinha";
  document.getElementById("tipo-semente-final").textContent = "Feijão";
  document.getElementById("tipo-pote-final").textContent = planta.pote ? planta.pote : "Recipiente não definido";
  document.getElementById("dias-consecutivos").textContent = planta.diasConsecutivos;
  document.getElementById("plant-stage-label").textContent = obterNomeEtapa(planta.diasConsecutivos);
  document.getElementById("plant-stage-day").textContent = "Etapa " + (obterIndiceEtapa(planta.diasConsecutivos) + 1);
  const proxima = obterDiaProximaEtapa(planta.diasConsecutivos);
  document.getElementById("proxima-etapa").textContent = proxima === null ? "Concluída" : "Dia " + proxima;
  document.getElementById("proxima-etapa-texto").textContent = proxima === null ? "Último marco da jornada" : "Próximo marco visual";
  atualizarMensagemSaudacao();
  atualizarImagem();
  atualizarCuidados();
  atualizarContadorConquistas();
  atualizarAdminTempo();
  renderizarFotoPrincipal();
  renderizarSeletorPlantas("plant-switcher", true);
  if (!usuario.preferencias.mostrarDicas) document.querySelectorAll(".tip-panel").forEach(el => el.classList.add("escondido"));
  else document.querySelectorAll(".tip-panel").forEach(el => el.classList.remove("escondido"));
  atualizarSidebar();
}

function atualizarMensagemSaudacao() {
  const recorrente = Boolean(usuario.ultimoAcesso);
  const nome = usuario.nomeExibicao ? usuario.nomeExibicao.split(" ")[0] : "";
  if (!usuario.primeiroAcessoConcluido) {
    document.getElementById("saudacao-kicker").textContent = "SUA JORNADA DE CULTIVO";
    document.getElementById("mensagem-contextual").textContent = "Sua jornada de cultivo começa aqui.";
    usuario.primeiroAcessoConcluido = true;
    salvarDados();
  } else if (nome) {
    document.getElementById("saudacao-kicker").textContent = "BEM-VINDO AO SEU CULTIVO";
    document.getElementById("mensagem-contextual").textContent = "Que bom ter você por aqui, " + nome + ".";
  } else {
    document.getElementById("saudacao-kicker").textContent = "BEM-VINDO AO SEU CULTIVO";
    document.getElementById("mensagem-contextual").textContent = "Seu acompanhamento continua de onde você parou.";
  }
}

/* Regra de administrador: e-mail adm@gmail.com (sem diferenciar maiúsculas) E nick exatamente "Teste"
   (ignorando espaços no início/fim). ATENÇÃO: o site funciona só no navegador, então esta regra é
   demonstrativa e NÃO é uma autenticação administrativa segura. */
const ADMIN_EMAIL = "adm@gmail.com";
const ADMIN_NICK = "Teste";

function identificaAdmin(email, nick) {
  return String(email || "").trim().toLowerCase() === ADMIN_EMAIL && String(nick || "").trim() === ADMIN_NICK;
}

function contaAdmin() {
  return identificaAdmin(usuario.email, usuario.nomeExibicao);
}

/* Recalcula a permissão a partir dos dados da conta; nunca confia em um "admin: true" salvo. */
function sincronizarAdmin() {
  usuario.admin = contaAdmin();
  if (!usuario.admin) usuario.adminAtivo = false;
}

function atualizarVisibilidadeAdmin() {
  const isAdmin = contaAdmin();
  const aba = document.getElementById("settings-admin-tab");
  const painel = document.getElementById("settings-admin-panel");
  if (aba) aba.classList.toggle("escondido", !isAdmin);
  if (painel) painel.classList.toggle("escondido", !isAdmin);
  const toggle = document.getElementById("admin-ativado");
  if (toggle) toggle.checked = isAdmin && usuario.adminAtivo === true;
  atualizarAdminTempo();
  atualizarSidebar();
}

function atualizarAdminTempo() {
  const painel = document.getElementById("admin-tempo-panel");
  const botao = document.getElementById("btn-avancar-tempo");
  if (!painel || !botao) return;
  const disponivel = contaAdmin() && usuario.adminAtivo === true && Boolean(planta.nome);
  painel.classList.toggle("escondido", !disponivel);
  if (!disponivel) return;
  const proxima = obterDiaProximaEtapa(planta.diasConsecutivos);
  if (proxima === null) {
    botao.textContent = "Etapa final alcançada";
    botao.disabled = true;
  } else {
    botao.textContent = "Avançar no tempo · Dia " + proxima;
    botao.disabled = false;
  }
}

function avancarTempoAdmin() {
  if (!contaAdmin() || usuario.adminAtivo !== true || !planta.nome) return;
  const proxima = obterDiaProximaEtapa(planta.diasConsecutivos);
  if (proxima === undefined) {
    atualizarAdminTempo();
    return;
  }
  const etapaAntes = obterIndiceEtapa(planta.diasConsecutivos);
  planta.diasConsecutivos = proxima;
  planta.ultimoDia = hojeISO();
  if (obterIndiceEtapa(proxima) > etapaAntes) adicionarRegistroAtividade("Estágio", "A plantinha chegou à etapa: " + NOMES_ETAPA[obterIndiceEtapa(proxima)] + ".");
  salvarDados();
  atualizarTelaPlanta();
  carregarProgresso();
  verificarConquistas();
  const imagem = document.getElementById("imagem-planta");
  if (imagem) {
    imagem.classList.remove("cresceu");
    void imagem.offsetWidth;
    imagem.classList.add("cresceu");
  }
  mostrarToast(proxima === ETAPAS_DIAS[ETAPAS_DIAS.length - 1] ? "A planta chegou à etapa final." : "Tempo avançado para o dia " + proxima + ".");
}

function completarDia() {
  const hoje = hojeISO();
  if (planta.ultimoDia === hoje) return;
  const indiceAntes = obterIndiceEtapa(planta.diasConsecutivos);
  planta.diasConsecutivos += 1;
  planta.ultimoDia = hoje;
  salvarDados();
  const indiceDepois = obterIndiceEtapa(planta.diasConsecutivos);
  if (indiceDepois > indiceAntes) adicionarRegistroAtividade("Estágio", "A plantinha chegou à etapa: " + NOMES_ETAPA[indiceDepois] + ".");
  atualizarTelaPlanta();
  if (indiceDepois > indiceAntes) {
    const imagem = document.getElementById("imagem-planta");
    imagem.classList.remove("cresceu");
    void imagem.offsetWidth;
    imagem.classList.add("cresceu");
  }
  verificarConquistas();
  enfileirarModal("", "Cuidados do dia concluídos", "Você registrou os dois cuidados de hoje. O próximo marco visual é " + (obterDiaProximaEtapa(planta.diasConsecutivos) ? "dia " + obterDiaProximaEtapa(planta.diasConsecutivos) : "a etapa final") + ".");
}

function registrarCuidado(tipo) {
  if (!planta.nome) return;
  const admLivre = !modoTesteAtivo && contaAdmin() && usuario.adminAtivo === true;   /* ADM: sem limite de rega/sol */
  const repeticao = admLivre && planta.cuidados[tipo] && planta.ultimoDia === hojeISO();
  if (!modoTesteAtivo) {
    const hoje = hojeISO();
    if (planta.ultimoDia !== hoje) {
      planta.cuidados = { regar: false, sol: false };
      planta.ultimoDia = hoje;
    }
    if (planta.cuidados[tipo] && !admLivre) return;
  }
  planta.cuidados[tipo] = true;
  if (tipo === "regar") planta.ultimaRegaEm = new Date().toISOString();   /* base persistida do efeito de umidade */
  adicionarRegistroDiario(tipo === "regar" ? "Rega" : "Sol", modoTesteAtivo ? "Registro de teste" : (repeticao ? "Registro do administrador" : "Cuidado concluído"));
  adicionarRegistroAtividade(tipo === "regar" ? "Rega" : "Sol", modoTesteAtivo ? "Registro de teste" : (repeticao ? "Registro do administrador" : "Cuidado concluído"));
  const agora = document.querySelector("#acao-" + tipo);
  if (agora) {
    agora.classList.remove("pulse-action");
    void agora.offsetWidth;
    agora.classList.add("pulse-action");
  }
  if (!modoTesteAtivo && !repeticao && planta.cuidados.regar && planta.cuidados.sol) completarDia();
  salvarDados();
  atualizarCuidados();
  verificarConquistas();
  atualizarTelaPlanta();
  mostrarToast(modoTesteAtivo ? "Registro de teste adicionado. Você pode repetir." : repeticao ? (tipo === "regar" ? "Rega do administrador registrada." : "Luz do administrador registrada.") : (tipo === "regar" ? "Rega confirmada." : "Luz adequada confirmada."));
  if (tipo === "regar") animarAgua(); else animarSol();
}

function adicionarRegistroDiario(tipo, nota) {
  const registros = lerListaSalva(CHAVE.diario);
  registros.push({ id: Date.now() + Math.random(), data: hojeISO(), hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), tipo, nota, origem: "principal", plantaId: planta.id });
  localStorage.setItem(CHAVE.diario, JSON.stringify(registros.slice(-250)));
}

function adicionarRegistroAtividade(tipo, descricao, dados = {}) {
  const registros = lerListaSalva(CHAVE.registros);
  const agora = new Date();
  const data = dados.data || hojeISO();
  const hora = dados.hora || agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const timestamp = dados.timestamp || new Date(data + "T" + hora + ":00").toISOString();
  registros.push({
    id: dados.id || Date.now() + Math.random(),
    timestamp,
    data,
    hora,
    tipo,
    descricao,
    plantaId: dados.plantaId || planta.id || ""
  });
  localStorage.setItem(CHAVE.registros, JSON.stringify(registros.slice(-500)));
}

function lerListaSalva(chave) {
  try {
    const valor = JSON.parse(localStorage.getItem(chave) || "[]");
    return Array.isArray(valor) ? valor : [];
  } catch (erro) {
    return [];
  }
}

function contarRegistrosAtividade(tipo) {
  return lerListaSalva(CHAVE.registros).filter(registro => registro.tipo === tipo).length;
}

function contarRegistrosHoje() {
  const hoje = hojeISO();
  return lerListaSalva(CHAVE.registros).filter(registro => registro.data === hoje).length;
}

function carregarProgresso() {
  const dias = planta.diasConsecutivos;
  document.getElementById("nome-progresso").textContent = planta.nome || "Minha plantinha";
  document.getElementById("dias-progresso").textContent = dias;
  document.getElementById("imagem-progresso").innerHTML = obterImagemPlanta(planta.semente || "Feijão", dias, planta.pote, { umido: nivelUmidade(planta) });
  const progresso = Math.min((dias / 10) * 100, 100);
  document.getElementById("barra-progresso-preenchida").style.width = progresso + "%";
  document.getElementById("texto-porcentagem").textContent = Math.round(progresso) + "%";
  const texto = document.getElementById("texto-progresso");
  if (dias === 0) texto.textContent = "Comece hoje a registrar os cuidados.";
  else if (dias < 3) texto.textContent = "Muito bem. Continue observando sua plantinha e registrando o que realmente fizer.";
  else if (dias < 5) texto.textContent = "A primeira fase visual já começou. O próximo marco é o quinto dia.";
  else if (dias < 7) texto.textContent = "A planta entrou em uma etapa de crescimento mais visível no aplicativo.";
  else if (dias < 10) texto.textContent = "Você já registrou uma semana consecutiva de cuidados.";
  else texto.textContent = "Você alcançou o maior marco visual desta versão.";
  let proximaMarcada = false;
  [1, 3, 5, 7, 10].forEach(dia => {
    const etapa = document.getElementById("etapa-" + dia);
    const status = document.getElementById("status-etapa-" + dia);
    if (!etapa || !status) return;
    etapa.classList.remove("desbloqueada", "atual");
    if (dias >= dia) {
      etapa.classList.add("desbloqueada");
      status.textContent = "Concluído";
    } else if (!proximaMarcada) {
      etapa.classList.add("atual");
      status.textContent = "Próxima etapa";
      proximaMarcada = true;
    } else {
      status.textContent = "Bloqueada";
    }
  });
}

function iniciarNovoCultivo() {
  draftPlant = { semente: "", pote: "", nome: "", descricao: "", dataInicio: hojeISO(), diasConsecutivos: 0, ultimoDia: "", cuidados: { regar: false, sol: false }, foto: "", fotoData: "", modoTeste: false, interacoes: { cliquesNome: 0, acessosJornal: 0, notasDiario: 0 } };
  document.querySelectorAll(".plant-choice").forEach(el => el.setAttribute("aria-pressed", "false"));
  document.querySelectorAll('input[name="pote"]').forEach(input => { input.checked = false; });
  document.getElementById("nome-planta").value = "";
  document.getElementById("erro-inicial").textContent = "";
  document.getElementById("erro-nome").textContent = "";
  mostrarTela("tela-inicial");
}

function cancelarNovoCultivo() {
  const nome = document.getElementById("nome-planta")?.value.trim() || "";
  const preenchido = Boolean(draftPlant && (draftPlant.semente || draftPlant.pote || nome));
  if (preenchido && !window.confirm("Descartar os dados desta nova plantinha? A plantinha principal será preservada.")) return;
  draftPlant = null;
  if (planta.nome) mostrarTela("tela-planta");
  else mostrarTela("tela-login");
}

function selecionarFeijao() {
  if (!draftPlant) draftPlant = { semente: "" };
  draftPlant.semente = "Feijão";
  document.querySelectorAll(".plant-choice").forEach(el => el.setAttribute("aria-pressed", el.dataset.selectSeed === "Feijão" ? "true" : "false"));
}

function mostrarDicaDoDia() {
  const texto = DICAS[new Date().getDate() % DICAS.length] || "Observe pequenas mudanças na sua planta e registre o que realmente acontecer.";
  document.querySelectorAll(".dica-do-dia-texto").forEach(el => { el.textContent = texto; });
}

function mostrarDicas() {
  mostrarDicaDoDia();
}

/* Um ícone para cada assunto do Guia (traço simples, mesma identidade visual). */
const ICONES_TOPICO = {
  germinacao: '<path d="M12 21v-9"/><path d="M12 13C7 13 5 10 5 6c4 0 7 2 7 7Z"/><path d="M12 15c0-4 3-6 7-6 0 4-3 6-7 6Z"/><path d="M6 21h12"/>',
  partes: '<path d="M12 12V4"/><path d="M12 8c-3 0-5-1-6-3 3 0 5 1 6 3Z"/><path d="M12 8c3 0 5-1 6-3-3 0-5 1-6 3Z"/><path d="M12 12v3m0 0-3 4m3-4 3 4m-3-4v5"/><path d="M4 12h16"/>',
  fotossintese: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  "agua-luz": '<path d="M9 21c-3 0-5-2-5-5 0-3 5-9 5-9s5 6 5 9c0 3-2 5-5 5Z"/><circle cx="18" cy="6" r="2.4"/><path d="M18 1.5v1M18 9.5v1M13.5 6h1M21.5 6h1"/>',
  solo: '<path d="M3 11h18"/><path d="M3 11v9h18v-9"/><path d="M12 11V5M12 7c-2 0-3-1-3.5-2.5 2 0 3 .8 3.5 2.5ZM12 7c2 0 3-1 3.5-2.5-2 0-3 .8-3.5 2.5Z"/><path d="M8 15l1 1M14 17l1 1M16 14l1 1"/>',
  compostagem: '<path d="M6 8h12l-1.5 12h-9Z"/><path d="M5 8h14"/><path d="M10 5c1-2 3-2 4 0"/><path d="M9.5 13l2 2 3-3"/>',
  biodiversidade: '<path d="M12 12c-3-3-6-2-7 0 2 1 5 2 7 0Z"/><path d="M12 12c3-3 6-2 7 0-2 1-5 2-7 0Z"/><path d="M12 12c-2 3-1 6 0 8 1-2 2-5 0-8Z"/><path d="M12 12c-2-3-1-6 0-8 1 2 2 5 0 8Z"/>',
  residuos: '<path d="M7 16a6 6 0 0 1 1-9l2-2"/><path d="M8 4l2 1-1 2"/><path d="M17 8a6 6 0 0 1-1 9l-2 2"/><path d="M16 20l-2-1 1-2"/><path d="M12 9c-2 0-3 1-3 3 2 0 3-1 3-3Zm0 0c2 0 3 1 3 3-2 0-3-1-3-3Zm0 3v3"/>'
};
function iconeTopico(id) {
  const traco = ICONES_TOPICO[id] || '<path d="M12 21V10M12 14C7 14 5 11 5 7c4 0 7 2 7 7M12 16c0-4 3-7 7-7 0 4-2 7-7 7Z"/>';
  return '<svg viewBox="0 0 24 24" aria-hidden="true">' + traco + '</svg>';
}

function renderizarGuia() {
  const lista = document.getElementById("lista-guia");
  if (!lista || typeof GUIA === "undefined") return;
  lista.replaceChildren();
  GUIA.forEach(topico => {
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "topico-card";
    const icone = document.createElement("span");
    icone.className = "topico-card-emoji";
    icone.innerHTML = iconeTopico(topico.id);
    const texto = document.createElement("div");
    const titulo = document.createElement("strong");
    titulo.textContent = topico.titulo;
    const resumo = document.createElement("small");
    resumo.textContent = topico.resumo;
    texto.append(titulo, resumo);
    const seta = document.createElement("span");
    seta.className = "topico-card-seta";
    seta.textContent = "→";
    botao.append(icone, texto, seta);
    botao.addEventListener("click", () => abrirTopico(topico));
    lista.appendChild(botao);
  });
}

function abrirGuia(origem = "tela-planta") {
  telaOrigemGuia = origem;
  mostrarDicaDoDia();
  mostrarTela("tela-guia");
}

function abrirTopico(topico) {
  garantirUsuario();
  const chaveTopico = String(topico.titulo || topico.id || "");
  usuario.stats.topicos = usuario.stats.topicos || {};
  if (chaveTopico && !usuario.stats.topicos[chaveTopico]) { usuario.stats.topicos[chaveTopico] = true; salvarDados(); setTimeout(verificarConquistas, 0); }
  document.getElementById("topico-titulo").textContent = topico.titulo;
  document.getElementById("topico-resumo").textContent = topico.resumo;
  const secoes = document.getElementById("topico-secoes");
  secoes.replaceChildren();
  topico.secoes.forEach(secao => {
    const article = document.createElement("article");
    article.className = "content-section";
    const titulo = document.createElement("h3");
    titulo.textContent = secao.titulo.replace(/^[^\p{L}\p{N}]*/u, "");
    const lista = document.createElement("ul");
    secao.itens.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item;
      lista.appendChild(li);
    });
    article.append(titulo, lista);
    secoes.appendChild(article);
  });
  const curiosidade = document.getElementById("topico-curiosidade");
  curiosidade.textContent = topico.curiosidade || "";
  telaOrigemGuia = "tela-guia";
  mostrarTela("tela-topico");
}

function renderizarJornal() {
  const nomeMes = MESES[jornalMesAtual] || "Mês";
  document.getElementById("jornal-mes-nome").textContent = nomeMes;
  const lista = document.getElementById("jornal-lista");
  lista.replaceChildren();
  const especies = JORNAL_PLANTAS.filter(plantaJornal => plantaJornal.meses.includes(jornalMesAtual));
  if (!especies.length) {
    const vazio = document.createElement("div");
    vazio.className = "empty-state panel";
    vazio.textContent = "Não há fichas editoriais para este mês nesta versão local.";
    lista.appendChild(vazio);
    return;
  }
  especies.forEach(item => {
    const card = document.createElement("article");
    card.className = "journal-card";
    const media = document.createElement("div");
    media.className = "journal-card-media";
    if (item.foto) {
      media.innerHTML = `<img src="${item.foto}" alt="Fotografia de ${item.nome}" loading="lazy">`;
    } else {
      media.innerHTML = '<div class="journal-photo-placeholder"><span>Fotografia editorial não disponível</span></div>';
    }
    const body = document.createElement("div");
    body.className = "journal-card-body";
    const especie = document.createElement("p");
    especie.className = "eyebrow";
    especie.textContent = item.especie;
    const title = document.createElement("h3");
    title.textContent = item.nome;
    const resumo = document.createElement("p");
    resumo.textContent = item.resumo;
    const info = document.createElement("div");
    info.className = "journal-info-list";
    [["Condições", item.ambiente], ["Semeadura", item.semeadura]].forEach(([label, text]) => {
      const row = document.createElement("div");
      const strong = document.createElement("strong"); strong.textContent = label;
      const small = document.createElement("small"); small.textContent = text;
      row.append(strong, small); info.appendChild(row);
    });
    if (item.fonte) {
      const fonte = document.createElement("a");
      fonte.href = item.fonte;
      fonte.target = "_blank";
      fonte.rel = "noopener noreferrer";
      fonte.className = "source-link";
      fonte.textContent = "Ver fotografia e licença — " + item.credito;
      body.append(especie, title, resumo, info, fonte);
    } else {
      const source = document.createElement("small");
      source.className = "source-link source-local";
      source.textContent = item.credito;
      body.append(especie, title, resumo, info, source);
    }
    card.append(media, body);
    lista.appendChild(card);
  });
}

/* ---------- Calendário de cuidados (plano por fase e por recipiente) ---------- */
let calendarioAba = "dia";
let tutorialAtual = "";
let telaOrigemTutorial = "tela-guia";

function criarEl(tag, classe, texto) {
  const el = document.createElement(tag);
  if (classe) el.className = classe;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

function lerDataISO(valor) {
  const partes = String(valor || "").split("-").map(Number);
  return new Date(partes[0], partes[1] - 1, partes[2]);
}

function dataDoPlantio() {
  return /^\d{4}-\d{2}-\d{2}$/.test(planta.dataInicio || "") ? lerDataISO(planta.dataInicio) : null;
}

/* Dia do cultivo: 0 = dia do plantio, 3 = "Dia 3 após o plantio". */
function diaDeCultivo(data) {
  const inicio = dataDoPlantio();
  if (!inicio) return null;
  const alvo = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  return Math.round((alvo - inicio) / 86400000);
}

function dataDoDia(dia) {
  const inicio = dataDoPlantio();
  return new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + dia);
}

function planoAtual() {
  return planta.nome && planta.pote ? PLANO_CUIDADOS[normalizarRecipiente(planta.pote)] : null;
}

function faseDoDia(dia) {
  return FASES_CULTIVO.find(fase => dia >= fase.de && (fase.ate === null || dia <= fase.ate)) || FASES_CULTIVO[0];
}

function tarefaOcorre(tarefa, dia) {
  if (tarefa.cada) return dia >= tarefa.dia && dia <= (tarefa.ate === undefined ? tarefa.dia : tarefa.ate) && (dia - tarefa.dia) % tarefa.cada === 0;
  return dia === tarefa.dia;
}

function tarefasDoDia(dia) {
  const plano = planoAtual();
  if (!plano || dia < 0 || dia > DIAS_PLANO) return [];
  return plano.tarefas.filter(t => tarefaOcorre(t, dia)).map(t => ({ tarefa: t, dia, chave: t.id + "|" + dia }));
}

function todasAsTarefas() {
  const lista = [];
  for (let dia = 0; dia <= DIAS_PLANO; dia++) lista.push(...tarefasDoDia(dia));
  return lista;
}

function tarefaFeita(chave) { return Boolean(planta.tarefas && planta.tarefas[chave]); }

/* Uma tarefa só é concluída quando o usuário marca; passar o dia não conclui nada. */
function alternarTarefa(chave) {
  if (!planta.tarefas || typeof planta.tarefas !== "object") planta.tarefas = {};
  if (planta.tarefas[chave]) delete planta.tarefas[chave];
  else planta.tarefas[chave] = new Date().toISOString();
  salvarDados();
  renderizarCalendario();
}

function estadoTarefa(oc, diaHoje) {
  if (tarefaFeita(oc.chave)) return { id: "feita", texto: "Concluída" };
  if (oc.dia > diaHoje) return { id: "futura", texto: "Em breve" };
  if (oc.dia === diaHoje) return { id: "hoje", texto: "Para hoje" };
  return oc.tarefa.cada ? { id: "naoreg", texto: "Não registrado" } : { id: "atrasada", texto: "Pendente" };
}

/* Pendentes: tarefas únicas que já venceram + tarefas repetidas de hoje. */
function tarefasPendentes(diaHoje) {
  return todasAsTarefas().filter(oc => !tarefaFeita(oc.chave) && oc.dia <= diaHoje && (!oc.tarefa.cada || oc.dia === diaHoje));
}

function criarCartaoTarefa(oc, diaHoje, mostrarData) {
  const estado = estadoTarefa(oc, diaHoje);
  const t = oc.tarefa;
  const cartao = criarEl("article", "cal-tarefa estado-" + estado.id);
  const ilu = t.ilu || { etapa: 0 };
  const thumb = criarEl("div", "cal-tarefa-ilu");
  thumb.setAttribute("aria-hidden", "true");
  thumb.innerHTML = desenharPlanta(ilu.etapa || 0, "Feijão", ilu.pote || planta.pote, ilu.opcoes);
  const corpo = criarEl("div", "cal-tarefa-corpo");
  const topo = criarEl("label", "cal-tarefa-topo");
  const caixa = document.createElement("input");
  caixa.type = "checkbox";
  caixa.checked = estado.id === "feita";
  caixa.disabled = estado.id === "futura";
  caixa.dataset.tarefa = oc.chave;
  caixa.addEventListener("change", () => alternarTarefa(oc.chave));
  const titulo = criarEl("strong", "", t.titulo);
  topo.append(caixa, titulo);
  const meta = criarEl("div", "cal-tarefa-meta");
  const data = dataDoDia(oc.dia);
  meta.append(criarEl("span", "chip", "Dia " + oc.dia + (mostrarData ? " · " + data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "")), criarEl("span", "chip estado", estado.texto));
  corpo.append(topo, meta, criarEl("p", "cal-tarefa-texto", t.oQue));
  if (t.ref) corpo.appendChild(criarEl("p", "cal-tarefa-ref", t.ref));
  if (estado.id === "futura") corpo.appendChild(criarEl("p", "cal-tarefa-ref", "Disponível para marcar a partir de " + data.toLocaleDateString("pt-BR") + "."));
  if (estado.id === "feita") corpo.appendChild(criarEl("p", "cal-tarefa-ref", "Concluída em " + new Date(planta.tarefas[oc.chave]).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) + "."));
  const detalhes = document.createElement("details");
  detalhes.className = "cal-tarefa-porque";
  detalhes.append(criarEl("summary", "", "Por que fazer isso?"), criarEl("p", "", t.porque));
  corpo.appendChild(detalhes);
  cartao.append(thumb, corpo);
  return cartao;
}

function renderizarResumoCalendario() {
  const area = document.getElementById("calendar-resumo");
  if (!area) return;
  area.replaceChildren();
  if (!planta.nome) {
    area.append(criarEl("p", "eyebrow", "SEU CULTIVO"), criarEl("h3", "", "Escolha o recipiente para ver as orientações"), criarEl("p", "muted", "O calendário se adapta ao vaso ou ao pote de Danone com algodão. Comece uma plantinha para receber as tarefas de cada fase."));
    const iniciar = criarEl("button", "botao small", "Começar uma plantinha");
    iniciar.type = "button";
    iniciar.addEventListener("click", abrirNovaPlanta);
    area.appendChild(iniciar);
    return;
  }
  const plano = planoAtual();
  const hoje = new Date();
  const diaHoje = diaDeCultivo(hoje);
  const principal = criarEl("div", "cal-resumo-principal");
  principal.appendChild(criarEl("p", "eyebrow", "SEU CULTIVO · " + plano.nome.toUpperCase()));
  if (diaHoje === null) {
    principal.append(criarEl("h3", "", "Quando você plantou o feijão?"), criarEl("p", "muted", "Informe a data do plantio para calcular os dias de cultivo e montar o calendário."));
  } else {
    const fase = faseDoDia(diaHoje);
    principal.append(criarEl("h3", "", diaHoje === 0 ? "Hoje é o dia do plantio" : "Dia " + diaHoje + " após o plantio"), criarEl("span", "calendar-status", fase.nome), criarEl("p", "muted", diaHoje > DIAS_PLANO ? "O plano de cuidados cobre os primeiros " + DIAS_PLANO + " dias. Continue observando sua planta e registrando no Diário." : plano.fases[fase.id]));
  }
  const lateral = criarEl("div", "cal-resumo-lateral");
  const rotulo = criarEl("label", "", "Data do plantio");
  rotulo.htmlFor = "cal-data-plantio";
  const campo = document.createElement("input");
  campo.type = "date"; campo.id = "cal-data-plantio"; campo.max = hojeISO(); campo.value = planta.dataInicio || "";
  const salvar = criarEl("button", "botao-secundario small", diaHoje === null ? "Salvar data" : "Atualizar data");
  salvar.type = "button";
  salvar.addEventListener("click", salvarDataPlantioCalendario);
  const msg = criarEl("p", "form-message", ""); msg.id = "cal-data-msg"; msg.setAttribute("aria-live", "polite");
  lateral.append(rotulo, campo, salvar, msg);
  area.append(principal, lateral);
  if (diaHoje !== null) {
    const todas = todasAsTarefas();
    const feitas = todas.filter(oc => tarefaFeita(oc.chave)).length;
    const pendentes = tarefasPendentes(diaHoje).length;
    const stats = criarEl("div", "cal-resumo-stats");
    [[feitas + "/" + todas.length, "tarefas concluídas"], [String(pendentes), "pendentes até hoje"]].forEach(par => { const caixa = criarEl("div", "cal-stat"); caixa.append(criarEl("strong", "", par[0]), criarEl("small", "", par[1])); stats.appendChild(caixa); });
    const acoes = criarEl("div", "cal-resumo-acoes");
    const hojeBtn = criarEl("button", "botao-secundario small", "Ir para hoje"); hojeBtn.type = "button";
    hojeBtn.addEventListener("click", () => { calendarioCursor = new Date(); calendarioSelecionado = new Date(); calendarioAba = "dia"; renderizarCalendario(); });
    const tutBtn = criarEl("button", "botao-secundario small", "Ver passo a passo do plantio"); tutBtn.type = "button";
    tutBtn.addEventListener("click", () => abrirTutorial("", "tela-calendario"));
    acoes.append(hojeBtn, tutBtn);
    area.append(stats, acoes);
  }
}

function salvarDataPlantioCalendario() {
  const valor = document.getElementById("cal-data-plantio").value;
  const msg = document.getElementById("cal-data-msg");
  if (!dataValidaNaoFutura(valor)) { msg.textContent = "Informe uma data válida que não seja futura."; msg.className = "form-message error"; return; }
  planta.dataInicio = valor;
  salvarDados();
  calendarioCursor = new Date();
  calendarioSelecionado = new Date();
  renderizarCalendario();
  mostrarToast("Data do plantio salva. Tarefas já marcadas continuam marcadas.");
}

function renderizarCalendario() {
  renderizarResumoCalendario();
  const ano = calendarioCursor.getFullYear();
  const mes = calendarioCursor.getMonth();
  document.getElementById("cal-mes-nome").textContent = calendarioCursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const grid = document.getElementById("calendar-grid");
  grid.replaceChildren();
  const temPlano = Boolean(planoAtual() && dataDoPlantio());
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const ultimoDiaMes = new Date(ano, mes + 1, 0).getDate();
  const ultimoDiaAnterior = new Date(ano, mes, 0).getDate();
  const totalCelulas = Math.ceil((primeiroDiaSemana + ultimoDiaMes) / 7) * 7;
  for (let i = 0; i < totalCelulas; i++) {
    let data;
    let fora = false;
    if (i < primeiroDiaSemana) { data = new Date(ano, mes - 1, ultimoDiaAnterior - primeiroDiaSemana + i + 1); fora = true; }
    else if (i >= primeiroDiaSemana + ultimoDiaMes) { data = new Date(ano, mes + 1, i - (primeiroDiaSemana + ultimoDiaMes) + 1); fora = true; }
    else data = new Date(ano, mes, i - primeiroDiaSemana + 1);
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "calendar-day" + (fora ? " outside" : "");
    const chave = formatarData(data);
    botao.dataset.data = chave;
    if (formatarData(calendarioSelecionado) === chave) botao.classList.add("selected");
    if (chave === hojeISO()) botao.classList.add("today");
    botao.appendChild(criarEl("span", "day-number", String(data.getDate())));
    if (temPlano) {
      const n = diaDeCultivo(data);
      if (n >= 0 && n <= DIAS_PLANO) {
        const tarefas = tarefasDoDia(n);
        const feitas = tarefas.filter(oc => tarefaFeita(oc.chave)).length;
        if (n === 0) botao.classList.add("plantio");
        const marcas = criarEl("div", "day-tasks");
        marcas.appendChild(criarEl("span", "day-task day-ciclo", "Dia " + n));
        if (tarefas.length) marcas.appendChild(criarEl("span", "day-task" + (feitas === tarefas.length ? " completed" : ""), feitas + "/" + tarefas.length));
        botao.appendChild(marcas);
        botao.setAttribute("aria-label", data.toLocaleDateString("pt-BR") + ", dia " + n + " após o plantio, " + feitas + " de " + tarefas.length + " tarefas concluídas");
      }
    }
    botao.addEventListener("click", () => { calendarioSelecionado = data; calendarioAba = "dia"; renderizarCalendario(); });
    grid.appendChild(botao);
  }
  renderizarDetalheCalendario(calendarioSelecionado);
}

function renderizarDetalheCalendario(data) {
  const area = document.getElementById("calendar-detail");
  area.replaceChildren();
  const plano = planoAtual();
  const temPlano = Boolean(plano && dataDoPlantio());
  const diaHoje = temPlano ? diaDeCultivo(new Date()) : null;
  if (temPlano) {
    const pendentes = tarefasPendentes(diaHoje);
    const feitas = todasAsTarefas().filter(oc => tarefaFeita(oc.chave));
    const abas = criarEl("div", "cal-abas");
    abas.setAttribute("role", "group");
    abas.setAttribute("aria-label", "Filtrar tarefas");
    [["dia", "Dia selecionado"], ["pendentes", "Pendentes (" + pendentes.length + ")"], ["feitas", "Concluídas (" + feitas.length + ")"]].forEach(par => {
      const b = criarEl("button", "cal-aba" + (calendarioAba === par[0] ? " ativa" : ""), par[1]);
      b.type = "button"; b.dataset.aba = par[0]; b.setAttribute("aria-pressed", String(calendarioAba === par[0]));
      b.addEventListener("click", () => { calendarioAba = par[0]; renderizarDetalheCalendario(calendarioSelecionado); });
      abas.appendChild(b);
    });
    area.appendChild(abas);
    const lista = criarEl("div", "calendar-task-list");
    if (calendarioAba === "pendentes") {
      area.appendChild(criarEl("h3", "", "O que falta fazer"));
      area.appendChild(criarEl("p", "muted", "Tarefas únicas que já venceram e as verificações de hoje. Nada é marcado sozinho."));
      if (!pendentes.length) lista.appendChild(criarEl("p", "muted cal-vazio", "Nenhuma tarefa pendente agora. Bom trabalho!"));
      pendentes.forEach(oc => lista.appendChild(criarCartaoTarefa(oc, diaHoje, true)));
      const proximas = todasAsTarefas().filter(oc => oc.dia > diaHoje && oc.dia <= diaHoje + 3);
      if (proximas.length) {
        lista.appendChild(criarEl("h4", "cal-subtitulo", "Nos próximos dias"));
        proximas.slice(0, 6).forEach(oc => lista.appendChild(criarCartaoTarefa(oc, diaHoje, true)));
      }
    } else if (calendarioAba === "feitas") {
      area.appendChild(criarEl("h3", "", "Tarefas concluídas"));
      if (!feitas.length) lista.appendChild(criarEl("p", "muted cal-vazio", "Você ainda não marcou nenhuma tarefa como concluída."));
      feitas.forEach(oc => lista.appendChild(criarCartaoTarefa(oc, diaHoje, true)));
    } else {
      area.appendChild(criarEl("p", "eyebrow", "DETALHES DA DATA"));
      area.appendChild(criarEl("h3", "", data.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })));
      const n = diaDeCultivo(data);
      if (n < 0) area.appendChild(criarEl("span", "calendar-status", "Antes do plantio"));
      else if (n > DIAS_PLANO) area.appendChild(criarEl("span", "calendar-status", "Dia " + n + " · além do plano de " + DIAS_PLANO + " dias"));
      else {
        const fase = faseDoDia(n);
        area.appendChild(criarEl("span", "calendar-status", (n === 0 ? "Dia do plantio" : "Dia " + n + " após o plantio") + " · " + fase.nome));
        area.appendChild(criarEl("p", "muted cal-fase-resumo", plano.fases[fase.id]));
      }
      const tarefas = tarefasDoDia(n);
      if (n >= 0 && n <= DIAS_PLANO && !tarefas.length) lista.appendChild(criarEl("p", "muted cal-vazio", "Nenhuma tarefa programada para este dia. Aproveite para observar a planta e anotar no Diário."));
      tarefas.forEach(oc => lista.appendChild(criarCartaoTarefa(oc, diaHoje, false)));
    }
    area.appendChild(lista);
  } else {
    area.appendChild(criarEl("p", "eyebrow", "DETALHES DA DATA"));
    area.appendChild(criarEl("h3", "", data.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })));
    area.appendChild(criarEl("p", "muted", planta.nome ? "Informe a data do plantio acima para ver as tarefas desta data." : "Comece uma plantinha para receber as tarefas de cada fase."));
  }
  if (!temPlano || calendarioAba === "dia") {
    const registros = lerListaSalva(CHAVE.diario).filter(r => r.data === formatarData(data));
    const especiesDoMes = typeof CALENDARIO !== "undefined" ? (CALENDARIO[data.getMonth()] || []) : [];
    const especie = JORNAL_PLANTAS.find(item => especiesDoMes.includes(item.nome) && item.foto);
    if (especie) {
      const sazonal = document.createElement("div");
      sazonal.className = "calendar-seasonal";
      sazonal.innerHTML = `<img src="${especie.foto}" alt="${especie.nome}" loading="lazy"><div><strong>Referência sazonal: ${especie.nome}</strong><small>${especie.ambiente}</small></div>`;
      area.appendChild(sazonal);
    }
    area.appendChild(criarEl("p", "muted", registros.length ? registros.length + " registro(s) pessoal(is) no Diário nesta data." : "Nenhum registro pessoal foi salvo nesta data."));
  }
  if (planta.nome) {
    const link = criarEl("button", "botao-secundario small", "Abrir minha plantinha"); link.type = "button";
    link.addEventListener("click", () => mostrarTela("tela-planta"));
    area.appendChild(link);
  }
}

/* ---------- Passo a passo do plantio ---------- */
function abrirTutorial(tipo, origem) {
  tutorialAtual = tipo || "";
  telaOrigemTutorial = origem || "tela-guia";
  mostrarTela("tela-tutorial");
}

function renderizarTutorial(tipoEscolhido) {
  const meu = planta.pote ? normalizarRecipiente(planta.pote) : (draftPlant && draftPlant.pote ? normalizarRecipiente(draftPlant.pote) : "");
  const tipo = tipoEscolhido || tutorialAtual || meu || "danone";
  tutorialAtual = tipo;
  const dados = TUTORIAIS[tipo];
  document.getElementById("tutorial-titulo").textContent = dados.titulo;
  document.getElementById("tutorial-resumo").textContent = dados.resumo;
  document.querySelectorAll(".tutorial-tab").forEach(b => { const ativo = b.dataset.tutorial === tipo; b.classList.toggle("ativa", ativo); b.setAttribute("aria-pressed", String(ativo)); });
  document.getElementById("tutorial-seu-metodo").textContent = meu ? (meu === tipo ? "Este é o método do seu cultivo." : "Você está vendo o outro método. O seu é " + (meu === "danone" ? "o pote de Danone com algodão" : "o vaso com terra") + ".") : "";
  const lista = document.getElementById("tutorial-passos");
  lista.replaceChildren();
  dados.passos.forEach((passo, i) => {
    const cartao = criarEl("article", "tutorial-passo");
    const ilu = criarEl("div", "tutorial-ilu");
    ilu.setAttribute("aria-hidden", "true");
    ilu.innerHTML = desenharPlanta(passo.ilu.etapa, "Feijão", passo.ilu.pote || (tipo === "danone" ? "Pote de Danone" : "Vaso"), passo.ilu.opcoes);
    const corpo = criarEl("div", "tutorial-corpo");
    const cab = criarEl("div", "tutorial-cab");
    cab.append(criarEl("span", "tutorial-num", String(i + 1)), criarEl("h3", "", passo.titulo.replace(/^Passo \d+\s*—\s*/, "")));
    const ul = criarEl("ul", "");
    passo.itens.forEach(item => ul.appendChild(criarEl("li", "", item)));
    corpo.append(cab, ul, criarEl("p", "tutorial-porque", "Por quê? " + passo.porque));
    cartao.append(ilu, corpo);
    lista.appendChild(cartao);
  });
  document.getElementById("tutorial-aviso").textContent = dados.aviso;
  document.getElementById("tutorial-diferenca").textContent = dados.diferenca;
}

function renderizarMetodoLembrete() {
  const area = document.getElementById("lembrete-metodo");
  if (!area || !draftPlant || !draftPlant.pote) { if (area) area.hidden = true; return; }
  const tipo = normalizarRecipiente(draftPlant.pote);
  area.hidden = false;
  area.replaceChildren();
  area.append(criarEl("p", "eyebrow", "SEU RECIPIENTE"), criarEl("h3", "", TUTORIAIS[tipo].titulo), criarEl("p", "muted", TUTORIAIS[tipo].resumo));
  const botao = criarEl("button", "botao-secundario small", "Ver passo a passo do plantio");
  botao.type = "button";
  botao.addEventListener("click", () => abrirTutorial(tipo, "tela-lembretes"));
  area.appendChild(botao);
}

function prepararPreviasRecipiente() {
  document.querySelectorAll('input[name="pote"]').forEach(input => {
    const rotulo = input.nextElementSibling;
    if (!rotulo || rotulo.querySelector(".recipiente-mini")) return;
    const mini = document.createElement("i");
    mini.className = "recipiente-mini";
    mini.setAttribute("aria-hidden", "true");
    mini.innerHTML = desenharPlanta(2, "Feijão", input.value);
    rotulo.prepend(mini);
  });
}

function cancelarFotoPendente() {
  fotoPendente = "";
  document.getElementById("foto-input").value = "";
  renderizarFotoPrincipal();
  renderizarFotos();
  mostrarToast("Prévia cancelada.");
}

function processarArquivoFoto(arquivo) {
  if (!arquivo || !arquivo.type.startsWith("image/")) { mostrarToast("Escolha uma imagem válida."); return; }
  const reader = new FileReader();
  reader.onload = evento => {
    const imagem = new Image();
    imagem.onload = () => {
      const max = 1000;
      const fator = Math.min(1, max / Math.max(imagem.width, imagem.height));
      const largura = Math.max(1, Math.round(imagem.width * fator));
      const altura = Math.max(1, Math.round(imagem.height * fator));
      const canvas = document.createElement("canvas"); canvas.width = largura; canvas.height = altura;
      const contexto = canvas.getContext("2d"); contexto.drawImage(imagem, 0, 0, largura, altura);
      fotoPendente = canvas.toDataURL("image/jpeg", .72);
      renderizarFotoPrincipal();
      renderizarFotos();
      mostrarToast("Prévia pronta. Salve a fotografia ou cancele a seleção.");
    };
    imagem.src = evento.target.result;
  };
  reader.readAsDataURL(arquivo);
}

function fecharFotoModal() {
  document.getElementById("photo-modal").classList.add("escondido");
}

async function cadastrar() {
  const email = document.getElementById("cadastro-email").value.trim().toLowerCase();
  const senha = document.getElementById("cadastro-senha").value.trim();
  const nome = document.getElementById("cadastro-nome").value.trim();
  const nascimento = document.getElementById("cadastro-nascimento").value;
  const erro = document.getElementById("erro-cadastro");
  erro.textContent = "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { erro.textContent = "Informe um e-mail válido."; return; }
  if (!senha || senha.length < 6) { erro.textContent = "A senha precisa ter pelo menos 6 caracteres."; return; }
  if (!nome) { erro.textContent = "Informe seu nome de exibição."; return; }
  if (!dataValidaNaoFutura(nascimento)) { erro.textContent = "Informe uma data de nascimento válida e não futura."; return; }
  const idade = idadeEmAnos(nascimento);
  const responsavel = document.getElementById("cadastro-responsavel").checked;
  if (idade < 18 && !responsavel) { erro.textContent = "Para menores de 18 anos, marque a declaração de acompanhamento de um adulto responsável."; return; }
  usuario = { email, senha: await hashSenha(senha), nomeExibicao: nome, nascimento, acompanhamentoResponsavel: responsavel, primeiroAcessoConcluido: false, ultimoAcesso: "", preferencias: { reduzirAnimacoes: false, mostrarDicas: true }, admin: false, adminAtivo: false, fotoPerfil: "", recompensas: { poteDourado: false }, stats: {} };
  sincronizarAdmin();
  planta = novaPlanta(); plantas = []; plantaAtivaId = ""; conquistas = []; conquistasMeta = {}; jogosStats = novosJogosStats();
  [CHAVE.diario, CHAVE.registros, CHAVE.fotos, CHAVE.planta].forEach(k => localStorage.removeItem(k));   /* conta nova: não herda dados da anterior */
  salvarDados();
  iniciarSessao();
  mostrarTela("tela-inicial");
  mostrarToast("Conta criada. Vamos começar seu cultivo?");
}

async function login(emailInformado, senhaInformada) {
  const erro = document.getElementById("erro-login");
  erro.textContent = "";
  const email = String(emailInformado || "").trim().toLowerCase();
  const senha = String(senhaInformada || "").trim();

  if (email === "teste@gmail.com" && senha === "1234") {
    modoTesteAtivo = true;
    resetarEstadoParaNamespace(true);
    if (!usuario.email) {
      usuario = { email, senha, nomeExibicao: "Conta de teste", nascimento: "2000-01-01", acompanhamentoResponsavel: true, primeiroAcessoConcluido: true, ultimoAcesso: hojeISO(), preferencias: { reduzirAnimacoes: false, mostrarDicas: true }, admin: false, adminAtivo: false, fotoPerfil: "", recompensas: { poteDourado: false }, stats: {} };
    } else {
      usuario.ultimoAcesso = hojeISO();
    }
    if (!planta.nome) {
      planta = novaPlanta({ id: gerarIdPlanta(), semente: "Feijão", pote: "Pote de Danone", nome: "Plantinha de teste", descricao: "Cultivo de demonstração", dataInicio: hojeISO(), modoTeste: true });
      plantas = [planta]; plantaAtivaId = planta.id;
    }
    planta.modoTeste = true;
    salvarDados();
    iniciarSessao();
    mostrarTela("tela-planta");
    mostrarToast("Modo de teste local ativado. Você pode repetir os cuidados.");
    return;
  }

  if (modoTesteAtivo && !MODO_TESTE_INICIAL) {
    modoTesteAtivo = false;
    resetarEstadoParaNamespace(false);
  }

  if (!usuario.email || usuario.email.toLowerCase() !== email || !(await senhaConfere(senha, usuario.senha))) {
    erro.textContent = "E-mail ou senha incorretos.";
    return;
  }
  if (!String(usuario.senha).startsWith("h1$")) usuario.senha = await hashSenha(senha); /* migra senha antiga */
  usuario.ultimoAcesso = hojeISO();
  sincronizarAdmin();
  salvarDados();
  iniciarSessao();
  if (planta.nome) mostrarTela("tela-planta"); else mostrarTela("tela-inicial");
}

function atualizarResponsavelCadastro() {
  const nascimento = document.getElementById("cadastro-nascimento").value;
  const wrap = document.getElementById("responsavel-wrap");
  const checkbox = document.getElementById("cadastro-responsavel");
  const idade = idadeEmAnos(nascimento);
  const menor = idade !== null && idade < 18;
  wrap.classList.toggle("escondido", !menor);
  if (!menor) checkbox.checked = false;
}

function validarNascimentoECaminhamento(valor, responsavel) {
  if (!dataValidaNaoFutura(valor)) return "Informe uma data de nascimento válida e não futura.";
  const idade = idadeEmAnos(valor);
  if (idade < 18 && !responsavel) return "Para menores de 18 anos, a declaração de acompanhamento de um adulto responsável é obrigatória.";
  return "";
}

function carregarConfiguracoes() {
  atualizarOpcoesRecipiente();
  atualizarFotoPerfil();
  document.getElementById("config-nome").value = usuario.nomeExibicao || "";
  document.getElementById("config-nascimento").value = usuario.nascimento || "";
  document.getElementById("config-email").value = usuario.email || "";
  document.getElementById("config-senha").value = "";
  document.getElementById("config-planta-nome").value = planta.nome || "";
  document.getElementById("config-pote").value = planta.pote || "Vaso";
  document.getElementById("config-descricao").value = planta.descricao || "";
  document.getElementById("config-data-inicio").value = planta.dataInicio || hojeISO();
  document.getElementById("pref-reduzir-animacoes").checked = Boolean(usuario.preferencias.reduzirAnimacoes);
  document.getElementById("pref-mostrar-dicas").checked = usuario.preferencias.mostrarDicas !== false;
  const adminTab = document.getElementById("settings-admin-tab");
  const adminPanel = document.getElementById("settings-admin-panel");
  const isAdmin = contaAdmin();
  if (adminTab) adminTab.classList.toggle("escondido", !isAdmin);
  if (adminPanel) adminPanel.classList.toggle("escondido", !isAdmin);
  const adminToggle = document.getElementById("admin-ativado");
  if (adminToggle) adminToggle.checked = isAdmin && usuario.adminAtivo === true;
  if (!isAdmin) abrirConfigTab("conta");
}

function salvarConfiguracaoAdmin() {
  const msg = document.getElementById("admin-config-msg");
  if (!contaAdmin()) {
    if (msg) { msg.textContent = "Esta configuração está disponível somente para a conta administrativa."; msg.className = "form-message error"; }
    return;
  }
  usuario.adminAtivo = document.getElementById("admin-ativado").checked;
  salvarDados();
  atualizarAdminTempo();
  if (msg) { msg.textContent = usuario.adminAtivo ? "Admin ativado. O avanço de tempo foi liberado na tela da planta." : "Admin desativado. O avanço de tempo foi ocultado."; msg.className = "form-message success"; }
}

function abrirConfigTab(tab) {
  if (tab === "admin" && !contaAdmin()) tab = "conta";
  document.querySelectorAll(".settings-tab").forEach(btn => btn.classList.toggle("active", btn.dataset.settingsTab === tab));
  document.querySelectorAll(".settings-panel").forEach(panel => panel.classList.toggle("active", panel.dataset.settingsPanel === tab));
}

async function salvarConta() {
  const nome = document.getElementById("config-nome").value.trim();
  const nascimento = document.getElementById("config-nascimento").value;
  const email = document.getElementById("config-email").value.trim().toLowerCase();
  const senha = document.getElementById("config-senha").value.trim();
  const msg = document.getElementById("config-conta-msg");
  const erro = validarNascimentoECaminhamento(nascimento, true);
  if (!nome || !email || !/^\S+@\S+\.\S+$/.test(email)) { msg.textContent = "Preencha nome e e-mail válidos."; msg.className = "form-message error"; return; }
  if (erro) { msg.textContent = erro; msg.className = "form-message error"; return; }
  usuario.nomeExibicao = nome; usuario.nascimento = nascimento; usuario.email = email; if (senha) { if (senha.length < 6) { msg.textContent = "A nova senha precisa ter pelo menos 6 caracteres."; msg.className = "form-message error"; return; } usuario.senha = await hashSenha(senha); document.getElementById("config-senha").value = ""; }
  sincronizarAdmin(); salvarDados(); atualizarVisibilidadeAdmin(); msg.textContent = "Conta atualizada."; msg.className = "form-message success";
}

function salvarPlantaConfiguracao() {
  const nome = document.getElementById("config-planta-nome").value.trim();
  const pote = document.getElementById("config-pote").value;
  const descricao = document.getElementById("config-descricao").value.trim();
  const dataInicio = document.getElementById("config-data-inicio").value;
  const msg = document.getElementById("config-planta-msg");
  if (!nome) { msg.textContent = "Informe um nome para a plantinha."; msg.className = "form-message error"; return; }
  if (ehPoteDourado(pote) && !poteDouradoLiberado()) { msg.textContent = "O pote dourado ainda não foi liberado."; msg.className = "form-message error"; return; }
  if (!dataValidaNaoFutura(dataInicio)) { msg.textContent = "A data de início precisa ser válida e não futura."; msg.className = "form-message error"; return; }
  if (dataInicio !== planta.dataInicio && !window.confirm("Alterar a data de início pode mudar a leitura do cultivo. Confirmar?")) return;
  planta.nome = nome; planta.pote = pote; planta.descricao = descricao; planta.dataInicio = dataInicio;
  salvarDados(); atualizarTelaPlanta(); renderizarDetalhesPlanta(); msg.textContent = "Alterações da plantinha salvas."; msg.className = "form-message success";
}

function salvarPreferencias() {
  usuario.preferencias.reduzirAnimacoes = document.getElementById("pref-reduzir-animacoes").checked;
  usuario.preferencias.mostrarDicas = document.getElementById("pref-mostrar-dicas").checked;
  document.body.classList.toggle("reduzir-animacoes", usuario.preferencias.reduzirAnimacoes);
  salvarDados();
  mostrarDicas();
  const msg = document.getElementById("config-pref-msg"); msg.textContent = "Preferências salvas."; msg.className = "form-message success";
  atualizarTelaPlanta();
}




function renderizarPerguntaJogo() {
  const area = document.getElementById("game-area");
  const feedback = document.getElementById("game-feedback");
  const perguntas = perguntasJogos[jogoAtual] || perguntasJogos.quiz;
  feedback.textContent = ""; feedback.classList.remove("error"); area.replaceChildren();
  if (perguntaAtual >= perguntas.length) {
    const titulo = document.createElement("h3"); titulo.textContent = "Rodada concluída";
    const resumo = document.createElement("p"); resumo.textContent = "Você acertou " + pontosJogo + " de " + perguntas.length + " questões.";
    const score = document.createElement("p"); score.className = "game-score"; score.textContent = Math.round((pontosJogo / perguntas.length) * 100) + "% de aproveitamento";
    const repetir = document.createElement("button"); repetir.type = "button"; repetir.className = "botao"; repetir.textContent = "Jogar novamente"; repetir.addEventListener("click", () => iniciarJogo(jogoAtual));
    area.append(titulo, resumo, score, repetir); return;
  }
  const marcador = document.createElement("p"); marcador.className = "eyebrow"; marcador.textContent = "QUESTÃO " + (perguntaAtual + 1) + " DE " + perguntas.length;
  const titulo = document.createElement("h3"); titulo.textContent = perguntas[perguntaAtual].pergunta;
  const score = document.createElement("p"); score.className = "game-score"; score.textContent = "Pontuação: " + pontosJogo;
  const opcoes = document.createElement("div"); opcoes.className = "game-options";
  perguntas[perguntaAtual].opcoes.forEach((opcao, indice) => {
    const botao = document.createElement("button"); botao.type = "button"; botao.className = "game-option"; botao.textContent = opcao; botao.addEventListener("click", () => responderJogo(indice, botao, opcoes, score)); opcoes.appendChild(botao);
  });
  area.append(marcador, titulo, score, opcoes);
}

function iniciarJogo(tipo) {
  jogoAtual = tipo; perguntaAtual = 0; pontosJogo = 0; jogoRespondido = false;
  registrarInicioJogo(tipo);
  document.querySelectorAll("[data-game]").forEach(btn => btn.classList.toggle("active", btn.dataset.game === tipo));
  renderizarPerguntaJogo();
}

function responderJogo(indice, botaoSelecionado, opcoes, score) {
  if (jogoRespondido) return;
  jogoRespondido = true;
  const pergunta = perguntasJogos[jogoAtual][perguntaAtual];
  const acertou = indice === pergunta.correta;
  if (acertou) pontosJogo++;
  registrarRespostaJogo(jogoAtual, perguntaAtual, acertou);
  opcoes.querySelectorAll("button").forEach((botao, indiceOpcao) => {
    botao.disabled = true;
    if (indiceOpcao === pergunta.correta) botao.classList.add("correct");
    else if (indiceOpcao === indice) botao.classList.add("incorrect");
  });
  score.textContent = "Pontuação: " + pontosJogo;
  const feedback = document.getElementById("game-feedback"); feedback.textContent = (acertou ? "Resposta correta. " : "Ainda não. ") + pergunta.explicacao; feedback.classList.toggle("error", !acertou);
  const proximo = document.createElement("button"); proximo.type = "button"; proximo.className = "botao"; proximo.textContent = perguntaAtual === perguntasJogos[jogoAtual].length - 1 ? "Ver resultado" : "Próxima questão"; proximo.addEventListener("click", () => { perguntaAtual++; jogoRespondido = false; if (perguntaAtual >= perguntasJogos[jogoAtual].length) concluirRodada(jogoAtual, pontosJogo, perguntasJogos[jogoAtual].length); renderizarPerguntaJogo(); }); opcoes.after(proximo);
}

function configurarNavegacao() {
  document.querySelectorAll(".nav-group-toggle").forEach(toggle => toggle.addEventListener("click", () => {
    const grupo = toggle.closest(".nav-group");
    document.querySelectorAll(".nav-group").forEach(item => { if (item !== grupo) { item.classList.remove("aberto"); const btn = item.querySelector(".nav-group-toggle"); const submenu = item.querySelector(".nav-subnav"); if (btn) btn.setAttribute("aria-expanded", "false"); if (submenu) submenu.hidden = true; } });
    const aberto = grupo.classList.toggle("aberto"); toggle.setAttribute("aria-expanded", String(aberto)); const submenu = grupo.querySelector(".nav-subnav"); if (submenu) submenu.hidden = !aberto;
  }));
  document.querySelectorAll(".nav-link[data-nav-screen], button[data-nav-screen]:not(.nav-link)").forEach(link => link.addEventListener("click", () => mostrarTela(link.dataset.navScreen)));
  document.querySelectorAll(".recent-plant[data-nav-screen]").forEach(link => link.addEventListener("click", () => mostrarTela(link.dataset.navScreen)));
}

function fecharMenuMobile() {
  const sidebar = document.getElementById("app-sidebar");
  const toggle = document.getElementById("sidebar-mobile-toggle");
  const overlay = document.getElementById("app-overlay");
  if (!sidebar) return;
  sidebar.classList.remove("mobile-open");
  if (toggle) toggle.setAttribute("aria-expanded", "false");
  if (overlay) overlay.classList.remove("show");
}

function encerrarSessao() {
  salvarDados();
  document.body.classList.remove("app-mode");
  document.body.classList.add("auth-mode");
  mostrarTela("tela-fim");
}

function inicializarEventos() {
  document.getElementById("btn-ir-cadastro").addEventListener("click", () => mostrarTela("tela-cadastro"));
  document.getElementById("btn-voltar-login").addEventListener("click", () => mostrarTela("tela-login"));
  document.getElementById("btn-cadastrar").addEventListener("click", cadastrar);
  document.getElementById("btn-login").addEventListener("click", () => login(document.getElementById("login-email").value, document.getElementById("login-senha").value));
  document.getElementById("cadastro-nascimento").addEventListener("change", atualizarResponsavelCadastro);
  document.getElementById("sidebar-nova-planta").addEventListener("click", abrirNovaPlanta);
  document.getElementById("sidebar-settings").addEventListener("click", () => { mostrarTela("tela-configuracoes"); abrirConfigTab("conta"); });
  document.getElementById("sidebar-mobile-toggle").addEventListener("click", () => {
    const sidebar = document.getElementById("app-sidebar"); const overlay = document.getElementById("app-overlay"); const aberto = sidebar.classList.toggle("mobile-open"); document.getElementById("sidebar-mobile-toggle").setAttribute("aria-expanded", String(aberto)); overlay.classList.toggle("show", aberto);
  });
  document.getElementById("app-overlay").addEventListener("click", fecharMenuMobile);
  document.getElementById("btn-continuar-inicial").addEventListener("click", () => {
    const erro = document.getElementById("erro-inicial"); erro.textContent = "";
    if (!draftPlant) draftPlant = {};
    if (!draftPlant.semente) { erro.textContent = "Selecione o feijão para continuar."; return; }
    const pote = document.querySelector('input[name="pote"]:checked');
    if (!pote) { erro.textContent = "Escolha o recipiente."; return; }
    draftPlant.pote = pote.value; mostrarTela("tela-nome");
  });
  document.getElementById("btn-cancelar-novo").addEventListener("click", cancelarNovoCultivo);
  document.getElementById("btn-voltar-escolha").addEventListener("click", () => mostrarTela("tela-inicial"));
  document.getElementById("btn-continuar-nome").addEventListener("click", () => { const nome = document.getElementById("nome-planta").value.trim(); const erro = document.getElementById("erro-nome"); erro.textContent = ""; if (!nome) { erro.textContent = "Digite um nome para a plantinha."; return; } if (!draftPlant) draftPlant = {}; draftPlant.nome = nome; mostrarTela("tela-lembretes"); });
  document.getElementById("btn-finalizar").addEventListener("click", finalizarNovoCultivo);
  document.getElementById("btn-voltar-nome").addEventListener("click", () => mostrarTela("tela-nome"));
  document.getElementById("btn-regar").addEventListener("click", () => registrarCuidado("regar"));
  document.getElementById("btn-sol").addEventListener("click", () => registrarCuidado("sol"));
  document.getElementById("btn-ver-progresso").addEventListener("click", () => mostrarTela("tela-progresso"));
  document.getElementById("btn-avancar-tempo")?.addEventListener("click", avancarTempoAdmin);
  document.getElementById("btn-ir-diario-planta").addEventListener("click", () => mostrarTela("tela-diario"));
  document.getElementById("btn-fechar-diario-leitor").addEventListener("click", () => { const leitor = document.getElementById("diario-leitor"); if (leitor) leitor.hidden = true; });
  document.getElementById("btn-limpar-registros").addEventListener("click", () => { if (!window.confirm("Apagar todos os registros de atividades?")) return; localStorage.removeItem(CHAVE.registros); renderizarRegistros(); atualizarContadorConquistas(); mostrarToast("Registros de atividades apagados."); });
  document.getElementById("btn-ir-jornal").addEventListener("click", () => mostrarTela("tela-jornal"));
  document.getElementById("btn-ir-tutorial").addEventListener("click", () => abrirTutorial("", "tela-guia"));
  document.getElementById("btn-ir-tutorial-planta").addEventListener("click", () => abrirTutorial("", "tela-planta"));
  document.getElementById("btn-ir-calendario-planta").addEventListener("click", () => mostrarTela("tela-calendario"));
  document.getElementById("btn-tutorial-calendario").addEventListener("click", () => mostrarTela("tela-calendario"));
  document.getElementById("btn-tutorial-voltar").addEventListener("click", () => mostrarTela(telaOrigemTutorial));
  document.querySelectorAll(".tutorial-tab").forEach(b => b.addEventListener("click", () => renderizarTutorial(b.dataset.tutorial)));
  document.getElementById("btn-voltar-topico").addEventListener("click", () => mostrarTela(telaOrigemGuia));
  document.getElementById("btn-config-planta").addEventListener("click", () => { mostrarTela("tela-configuracoes"); abrirConfigTab("planta"); });
  document.getElementById("btn-config-fotos").addEventListener("click", () => mostrarTela("tela-fotos"));
  document.getElementById("btn-salvar-conta").addEventListener("click", salvarConta);
  document.getElementById("btn-salvar-planta").addEventListener("click", salvarPlantaConfiguracao);
  document.getElementById("btn-salvar-preferencias").addEventListener("click", salvarPreferencias);
  document.querySelectorAll(".settings-tab").forEach(btn => btn.addEventListener("click", () => abrirConfigTab(btn.dataset.settingsTab)));
  document.getElementById("btn-salvar-admin")?.addEventListener("click", salvarConfiguracaoAdmin);
  document.getElementById("btn-sair").addEventListener("click", encerrarSessao);
  document.getElementById("btn-foto-adicionar").addEventListener("click", () => document.getElementById("foto-input").click());
  document.getElementById("btn-foto-adicionar-2").addEventListener("click", () => document.getElementById("foto-input").click());
  document.getElementById("btn-foto-salvar").addEventListener("click", salvarFotoPendente);
  document.getElementById("btn-foto-cancelar").addEventListener("click", cancelarFotoPendente);
  document.getElementById("btn-foto-ampliar").addEventListener("click", abrirFotoModal);
  document.getElementById("foto-input").addEventListener("change", evento => processarArquivoFoto(evento.target.files[0]));
  document.getElementById("btn-fechar-photo-modal").addEventListener("click", fecharFotoModal);
  document.getElementById("photo-modal").addEventListener("click", evento => { if (evento.target.id === "photo-modal") fecharFotoModal(); });
  document.getElementById("btn-fechar-modal").addEventListener("click", () => { filaDeModais.shift(); exibirModalAtual(); });
  document.getElementById("nome-planta-final").addEventListener("click", registrarCliqueNomePlantinha);
  document.getElementById("nome-planta-final").addEventListener("keydown", evento => { if (evento.key === "Enter" || evento.key === " ") { evento.preventDefault(); registrarCliqueNomePlantinha(); } });
  document.querySelectorAll(".plant-choice").forEach(btn => btn.addEventListener("click", selecionarFeijao));
  document.getElementById("jornal-mes-anterior").addEventListener("click", () => { jornalMesAtual = (jornalMesAtual + 11) % 12; renderizarJornal(); });
  document.getElementById("jornal-mes-proximo").addEventListener("click", () => { jornalMesAtual = (jornalMesAtual + 1) % 12; renderizarJornal(); });
  document.getElementById("cal-mes-anterior").addEventListener("click", () => { calendarioCursor.setMonth(calendarioCursor.getMonth() - 1); renderizarCalendario(); });
  document.getElementById("cal-mes-proximo").addEventListener("click", () => { calendarioCursor.setMonth(calendarioCursor.getMonth() + 1); renderizarCalendario(); });
  document.querySelectorAll("[data-toggle-password]").forEach(btn => btn.addEventListener("click", () => { const input = document.getElementById(btn.dataset.togglePassword); const mostrar = input.type === "password"; input.type = mostrar ? "text" : "password"; btn.classList.toggle("is-visible", mostrar); btn.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha"); }));
  document.querySelectorAll("#login-email, #login-senha").forEach(input => input.addEventListener("keydown", e => { if (e.key === "Enter") document.getElementById("btn-login").click(); }));
  document.querySelectorAll("#cadastro-email, #cadastro-senha, #cadastro-nome, #cadastro-nascimento").forEach(input => input.addEventListener("keydown", e => { if (e.key === "Enter") document.getElementById("btn-cadastrar").click(); }));
  document.querySelectorAll("[data-game]").forEach(btn => btn.addEventListener("click", () => iniciarJogo(btn.dataset.game)));
  document.getElementById("game-start").addEventListener("click", () => iniciarJogo("quiz"));
  document.getElementById("btn-voltar-login-fim").addEventListener("click", () => mostrarTela("tela-login"));
}

function migrarDadosAntigos() {
  if (modoTesteAtivo) return;
  const antigoUsuario = localStorage.getItem("usuario");
  const antigaPlanta = localStorage.getItem("planta");
  const antigasConquistas = localStorage.getItem("conquistas");
  if (!localStorage.getItem(CHAVE.usuario) && antigoUsuario) localStorage.setItem(CHAVE.usuario, antigoUsuario);
  if (!localStorage.getItem(CHAVE.planta) && antigaPlanta) localStorage.setItem(CHAVE.planta, antigaPlanta);
  if (!localStorage.getItem(CHAVE.conquistas) && antigasConquistas) localStorage.setItem(CHAVE.conquistas, antigasConquistas);
}


/* ---------- Melhorias de robustez e acessibilidade ---------- */
document.addEventListener("error", e => {
  const img = e.target;
  if (!img || img.tagName !== "IMG" || img.id === "photo-modal-img") return;
  img.style.display = "none";
  if (img.parentElement) img.parentElement.classList.add("img-fail");
}, true);

document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  const foto = document.getElementById("photo-modal");
  const modal = document.getElementById("modal-mensagem");
  if (foto && !foto.classList.contains("escondido")) { fecharFotoModal(); return; }
  if (modal && !modal.classList.contains("escondido")) { document.getElementById("btn-fechar-modal").click(); return; }
  fecharMenuMobile();
});

function exportarBackup() {
  const prefixo = "minhaPlantinha.";
  const dados = {};
  for (let i = 0; i < localStorage.length; i++) {
    const chave = localStorage.key(i);
    if (chave.startsWith(prefixo) && !chave.startsWith(prefixo + "demo.")) dados[chave] = localStorage.getItem(chave);
  }
  const blob = new Blob([JSON.stringify({ app: "minha-plantinha", versao: 1, exportadoEm: new Date().toISOString(), dados }, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "minha-plantinha-backup-" + hojeISO() + ".json";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  mostrarToast("Backup baixado.");
}

function importarBackup(arquivo) {
  if (!arquivo) return;
  const leitor = new FileReader();
  leitor.onload = () => {
    try {
      const obj = JSON.parse(leitor.result);
      if (!obj || obj.app !== "minha-plantinha" || typeof obj.dados !== "object") throw new Error("formato");
      if (!window.confirm("Importar este backup vai substituir os dados atuais. Continuar?")) return;
      Object.keys(obj.dados).forEach(chave => {
        if (chave.startsWith("minhaPlantinha.") && !chave.startsWith("minhaPlantinha.demo.") && typeof obj.dados[chave] === "string") localStorage.setItem(chave, obj.dados[chave]);
      });
      mostrarToast("Backup importado. Recarregando...");
      setTimeout(() => location.reload(), 900);
    } catch (erro) {
      mostrarToast("Arquivo de backup inválido.");
    }
  };
  leitor.readAsText(arquivo);
}
document.getElementById("btn-exportar-backup").addEventListener("click", exportarBackup);
document.getElementById("backup-input").addEventListener("change", e => { importarBackup(e.target.files[0]); e.target.value = ""; });
document.getElementById("btn-importar-backup").addEventListener("click", () => document.getElementById("backup-input").click());

/* =====================================================================
   v3 — várias plantinhas, conquistas ampliadas, animações de cuidado,
   histórico fotográfico em árvore, perfil e navegação
   ===================================================================== */
const $ = id => document.getElementById(id);
const MAX_PLANTAS = 4;
const POTE_DOURADO = "Pote de Danone dourado";
const POTE_TERRA_OURO = "Pote de Terra de Ouro";
const POTES_RECOMPENSA = [{ valor: POTE_DOURADO, nome: "Pote de Danone dourado", legenda: "Recompensa especial" }, { valor: POTE_TERRA_OURO, nome: "Pote de Terra de Ouro", legenda: "Recompensa especial" }];
const UMIDADE_MIN_MS = 10 * 60 * 1000;
const UMIDADE_FADE_MS = 4 * 60 * 1000;
const NOMES_ETAPA = ["Semente", "Germinação", "Primeiro broto", "Muda com folhas", "Planta jovem", "Planta desenvolvida"];
const TEXTO_AGUA = "Verifique a umidade antes de regar. Só confirme quando a rega realmente acontecer.";
const TEXTO_LUZ = "Verifique o local de cultivo. Só confirme se a luz realmente estiver adequada.";
/* Perguntas dos jogos agrupadas por tema ("jogo:índice da pergunta"). */
const TEMAS_PERGUNTAS = {
  germinacao: ["quiz:2"],
  agua: ["quiz:1", "quiz:3", "quiz:6", "cuidados:0", "cuidados:2", "partes:0"],
  luz: ["quiz:0", "cuidados:1"]
};
const ICONE_GRUPO = {
  cultivo: '<svg viewBox="0 0 48 48"><path d="M24 40V24"/><path d="M24 30C14 30 10 23 11 15c9 1 13 7 13 15Z"/><path d="M24 25c1-9 7-13 15-12 0 8-6 13-15 12Z"/></svg>',
  educativa: '<svg viewBox="0 0 48 48"><path d="M6 12h14a4 4 0 0 1 4 4v22a3 3 0 0 0-3-3H6Z"/><path d="M42 12H28a4 4 0 0 0-4 4v22a3 3 0 0 1 3-3h15Z"/></svg>',
  secreta: '<svg viewBox="0 0 48 48"><path d="m24 6 4.6 9.4 10.4 1.5-7.5 7.3 1.8 10.3L24 29.6l-9.3 4.9 1.8-10.3L9 16.9l10.4-1.5Z"/></svg>',
  especial: '<svg viewBox="0 0 48 48"><path d="M13 7h22v14a11 11 0 0 1-22 0Z"/><path d="M13 11H7v6a9 9 0 0 0 8 9M35 11h6v6a9 9 0 0 1-8 9M24 32v8M17 42h14"/></svg>'
};
const ICONE_POTE_DOURADO = '<svg viewBox="0 0 48 48"><path d="M9 15h30l-4 27H13Z" fill="#e8b93f" stroke="#8a6410" stroke-width="2"/><ellipse cx="24" cy="15" rx="15" ry="4.5" fill="#ffe9a0" stroke="#8a6410" stroke-width="2"/><path d="M16 23l2.4 15" stroke="#fff6cf" stroke-width="3" fill="none"/><path d="M24 14V5M24 9c-5 0-7-2-7-5 4 0 7 1 7 5Z" stroke="#477756" fill="none"/></svg>';

/* ---------- Jogos: estatísticas ---------- */
function novosJogosStats() { return { iniciados: 0, concluidos: 0, acertos: 0, seqAtual: 0, seqMax: 0, perfeitas: 0, melhorou: false, porJogo: {}, acertadas: {} }; }
function acertosDoTema(tema) { const j = jogosStats || novosJogosStats(); return TEMAS_PERGUNTAS[tema].filter(k => j.acertadas[k]).length; }
function jogosConcluidosDistintos() { const j = jogosStats || novosJogosStats(); return Object.keys(perguntasJogos).filter(k => (j.porJogo[k] && j.porJogo[k].concluidas > 0)).length; }

function garantirUsuario() {
  usuario.recompensas = Object.assign({ poteDourado: false }, usuario.recompensas || {});
  usuario.stats = usuario.stats || {};
  if (typeof usuario.fotoPerfil !== "string") usuario.fotoPerfil = "";
}

function sequenciaDeDias(datas) {
  const s = [...new Set(datas)].sort();
  let corrida = s.length ? 1 : 0, max = corrida;
  for (let i = 1; i < s.length; i++) {
    corrida = Math.round((lerDataISO(s[i]) - lerDataISO(s[i - 1])) / 86400000) === 1 ? corrida + 1 : 1;
    max = Math.max(max, corrida);
  }
  return max;
}
function fotosPorPlanta(c) { const m = {}; c.fotos.forEach(f => { (m[f.plantaId] = m[f.plantaId] || []).push(f); }); return Object.values(m); }

/* Dados reais usados pelas condições das conquistas (todas as plantinhas da conta). */
function contextoConquistas() {
  garantirUsuario();
  const st = usuario.stats;
  const regs = lerListaSalva(CHAVE.registros);
  const notas = lerListaSalva(CHAVE.diario).filter(d => d.origem !== "principal");
  return {
    dias: Math.max(0, ...plantas.map(p => p.diasConsecutivos || 0), planta.diasConsecutivos || 0),
    cuidou: regs.some(r => r.tipo === "Rega" || r.tipo === "Sol"),
    rega: regs.filter(r => r.tipo === "Rega").length,
    sol: regs.filter(r => r.tipo === "Sol").length,
    notas: notas.length,
    obs: notas.filter(d => d.tipo === "Observação" && String(d.nota || "").trim().length >= 20).length,
    cliquesNome: st.cliquesNome || 0, cliquesGabriel: st.cliquesGabriel || 0, acessosJornal: st.acessosJornal || 0,
    telas: st.telas || {}, topicos: Object.keys(st.topicos || {}).length,
    verifAgua: st.verifAgua || 0, verifLuz: st.verifLuz || 0,
    plantas: plantas.length, fotos: lerListaSalva(CHAVE.fotos), j: jogosStats || novosJogosStats()
  };
}
const AREAS_EDUCATIVAS = ["tela-guia", "tela-jornal", "tela-jogos", "tela-tutorial", "tela-calendario"];

const CONQUISTAS = [
  /* ---- Cultivo ---- */
  { id: "primeiro-cuidado", grupo: "cultivo", titulo: "Primeiro cuidado", descricao: "Você registrou o primeiro cuidado da sua planta.", como: "Confirme uma rega ou a luz adequada.", condicao: c => c.cuidou },
  { id: "primeiro-crescimento", grupo: "cultivo", titulo: "Primeiro crescimento", descricao: "Sua plantinha completou o primeiro dia de cuidados.", como: "Complete os dois cuidados em um dia.", condicao: c => c.dias >= 1 },
  { id: "tres-dias", grupo: "cultivo", titulo: "3 dias consecutivos", descricao: "Você está criando uma rotina de acompanhamento.", como: "Cuide da mesma plantinha por 3 dias seguidos.", condicao: c => c.dias >= 3 },
  { id: "sete-dias", grupo: "cultivo", titulo: "7 dias consecutivos", descricao: "Uma semana de observação registrada.", como: "Cuide por 7 dias seguidos.", condicao: c => c.dias >= 7 },
  { id: "dez-dias", grupo: "cultivo", titulo: "10 dias consecutivos", descricao: "Você chegou a uma grande etapa da jornada.", como: "Cuide por 10 dias seguidos.", condicao: c => c.dias >= 10 },
  { id: "regador-dedicado", grupo: "cultivo", titulo: "Regador dedicado", descricao: "Você registrou 10 momentos de rega no cultivo.", como: "Registre 10 regas.", condicao: c => c.rega >= 10, progresso: c => ({ atual: c.rega, total: 10 }) },
  { id: "observador-da-luz", grupo: "cultivo", titulo: "Observador da luz", descricao: "Você registrou 10 momentos de exposição à luz.", como: "Confirme a luz adequada 10 vezes.", condicao: c => c.sol >= 10, progresso: c => ({ atual: c.sol, total: 10 }) },
  { id: "diario-vivo", grupo: "cultivo", titulo: "Diário vivo", descricao: "Você registrou 5 anotações no seu diário.", como: "Escreva 5 anotações no Diário de cultivo.", condicao: c => c.notas >= 5, progresso: c => ({ atual: c.notas, total: 5 }) },
  /* ---- Jogos educativos ---- */
  { id: "jogo-iniciado", grupo: "educativa", titulo: "Primeira partida", descricao: "Você começou seu primeiro jogo educativo.", como: "Inicie qualquer jogo educativo.", condicao: c => c.j.iniciados >= 1 },
  { id: "jogo-concluido", grupo: "educativa", titulo: "Rodada completa", descricao: "Você chegou ao fim de um jogo educativo.", como: "Termine uma rodada de qualquer jogo.", condicao: c => c.j.concluidos >= 1 },
  { id: "primeiro-acerto", grupo: "educativa", titulo: "Primeiro acerto", descricao: "Você acertou sua primeira pergunta educativa.", como: "Acerte uma pergunta.", condicao: c => c.j.acertos >= 1 },
  { id: "partida-perfeita", grupo: "educativa", titulo: "Rodada perfeita", descricao: "Você acertou todas as perguntas de uma rodada (100%).", como: "Termine uma rodada sem errar.", condicao: c => c.j.perfeitas >= 1 },
  { id: "acertos-5", grupo: "educativa", titulo: "Estudante curioso", descricao: "Você acertou 5 perguntas educativas.", como: "Some 5 acertos nos jogos.", condicao: c => c.j.acertos >= 5, progresso: c => ({ atual: c.j.acertos, total: 5 }) },
  { id: "acertos-10", grupo: "educativa", titulo: "Pequeno botânico", descricao: "Você acertou 10 perguntas educativas.", como: "Some 10 acertos nos jogos.", condicao: c => c.j.acertos >= 10, progresso: c => ({ atual: c.j.acertos, total: 10 }) },
  { id: "sequencia-5", grupo: "educativa", titulo: "Sequência certeira", descricao: "Você acertou 5 respostas seguidas.", como: "Acerte 5 perguntas em sequência.", condicao: c => c.j.seqMax >= 5, progresso: c => ({ atual: c.j.seqMax, total: 5 }) },
  { id: "todos-os-jogos", grupo: "educativa", titulo: "Mestre dos jogos", descricao: "Você concluiu todos os jogos educativos disponíveis.", como: "Termine uma rodada de cada jogo.", condicao: c => jogosConcluidosDistintos() >= Object.keys(perguntasJogos).length, progresso: () => ({ atual: jogosConcluidosDistintos(), total: Object.keys(perguntasJogos).length }) },
  { id: "melhorou-resultado", grupo: "educativa", titulo: "Cada vez melhor", descricao: "Você repetiu um jogo e superou o resultado anterior.", como: "Jogue de novo e faça mais pontos que da última vez.", condicao: c => c.j.melhorou },
  { id: "desafio-germinacao", grupo: "educativa", titulo: "Desafio da germinação", descricao: "Você acertou a pergunta sobre como o feijão germina.", como: "Acerte a pergunta sobre germinação no Quiz ambiental.", condicao: () => acertosDoTema("germinacao") >= 1 },
  { id: "amigo-da-agua", grupo: "educativa", titulo: "Amigo da água", descricao: "Você entendeu a importância da água para as plantas.", como: "Acerte 4 perguntas diferentes sobre água.", condicao: () => acertosDoTema("agua") >= 4, progresso: () => ({ atual: acertosDoTema("agua"), total: 4 }) },
  { id: "olho-na-luz", grupo: "educativa", titulo: "Olho na luz", descricao: "Você identificou corretamente as condições de iluminação.", como: "Acerte as 2 perguntas sobre luz.", condicao: () => acertosDoTema("luz") >= 2, progresso: () => ({ atual: acertosDoTema("luz"), total: 2 }) },
  { id: "reciclagem-recipientes", grupo: "educativa", indisponivel: true, titulo: "Recipiente reaproveitado", descricao: "Concluir um desafio sobre reciclagem e reutilização de recipientes.", como: "Ainda não há um desafio sobre esse tema. Esta conquista será ativada quando ele for incluído nos jogos.", condicao: () => false },
  /* ---- Secretas ---- */
  { id: "gabriel-gallego-secreto", grupo: "secreta", secreta: true, titulo: "Olhar de Descobridor", descricao: "Você encontrou algo que estava escondido à vista de todos.", como: "Um segredo escondido em um lugar inesperado do app.", condicao: c => c.cliquesGabriel >= 20 },
  { id: "toque-persistente", grupo: "secreta", secreta: true, titulo: "Toque Persistente", descricao: "Você encontrou um pequeno segredo escondido no nome da planta.", como: "Tocar 10 vezes no nome da plantinha.", condicao: c => c.cliquesNome >= 10 },
  { id: "explorador-do-jornal", grupo: "secreta", secreta: true, titulo: "Explorador do jornal", descricao: "Você descobriu o caminho escondido pelo Jornal das Plantas.", como: "Abrir o Jornal das Plantas 3 vezes.", condicao: c => c.acessosJornal >= 3 },
  { id: "pequeno-explorador", grupo: "secreta", secreta: true, titulo: "Pequeno Explorador", descricao: "Você visitou todas as áreas educativas do site.", como: "Abrir Conteúdos, Jornal, Jogos, Passo a passo e Calendário.", condicao: c => AREAS_EDUCATIVAS.every(a => c.telas[a]) },
  { id: "curioso-por-natureza", grupo: "secreta", secreta: true, titulo: "Curioso por Natureza", descricao: "Você abriu vários assuntos dos conteúdos educativos.", como: "Ler 3 assuntos diferentes em Conteúdos educativos.", condicao: c => c.topicos >= 3 },
  { id: "olhos-de-cientista", grupo: "secreta", secreta: true, titulo: "Olhos de Cientista", descricao: "Você descreveu com detalhes uma mudança na sua planta.", como: "Salvar uma Observação de pelo menos 20 caracteres no Diário.", condicao: c => c.obs >= 1 },
  { id: "fotografo-botanico", grupo: "secreta", secreta: true, titulo: "Fotógrafo Botânico", descricao: "Você fotografou a mesma plantinha em etapas diferentes do crescimento.", como: "Registrar fotos de uma plantinha em 3 etapas diferentes.", condicao: c => fotosPorPlanta(c).some(l => new Set(l.map(f => f.estagio)).size >= 3) },
  { id: "memorias-do-feijao", grupo: "secreta", secreta: true, titulo: "Memórias do Feijão", descricao: "Você construiu uma sequência de registros fotográficos.", como: "Fotografar a mesma plantinha em 3 dias seguidos.", condicao: c => fotosPorPlanta(c).some(l => sequenciaDeDias(l.map(f => f.data)) >= 3) },
  { id: "jardineiro-de-tres", grupo: "secreta", secreta: true, titulo: "Jardineiro de Três", descricao: "Seu jardim está cheio: três plantinhas ao mesmo tempo.", como: "Cultivar três plantinhas na mesma conta.", condicao: c => c.plantas >= 3 },
  { id: "observador-atento", grupo: "secreta", secreta: true, indisponivel: true, titulo: "Observador Atento", descricao: "Uma conquista de observação que chega em uma próxima atualização.", como: "Ainda não está disponível.", condicao: c => c.verifAgua >= 3 && c.verifLuz >= 3 },
  /* ---- Especial ---- */
  { id: "mestre-da-minha-plantinha", grupo: "especial", especial: true, titulo: "Mestre da Minha Plantinha", descricao: "Você descobriu todos os segredos, concluiu os desafios e conquistou todas as recompensas da Minha Plantinha!", como: "Desbloquear todas as outras conquistas disponíveis, inclusive as secretas e as dos jogos.", recompensa: "Pote de Danone dourado + Pote de Terra de Ouro", condicao: () => false }
];
const ICONES_ID = typeof ICONES_CONQUISTAS !== "undefined" ? ICONES_CONQUISTAS : {};
function iconeConquista(c) { return ICONES_ID[c.id] || ICONE_GRUPO[c.especial ? "especial" : c.grupo] || ICONE_GRUPO.cultivo; }

function conquistaDisponivel(c) { return !c.indisponivel; }
function conquistaRegular(c) { return !c.especial && !c.indisponivel; }
function colecaoCompleta() { return CONQUISTAS.filter(conquistaRegular).every(c => conquistas.includes(c.id)); }
function poteDouradoLiberado() { garantirUsuario(); return usuario.recompensas.poteDourado === true; }

function concederPoteDourado() {
  garantirUsuario();
  if (usuario.recompensas.poteDourado) { atualizarOpcoesRecipiente(); return false; }
  usuario.recompensas.poteDourado = true;   /* um único marcador libera os DOIS potes ao mesmo tempo */
  atualizarOpcoesRecipiente();
  return true;
}

/* Único ponto de desbloqueio: evita duplicar registros e recompensas. */
function desbloquearConquista(conquista, origem) {
  if (conquistas.includes(conquista.id)) return false;
  conquistas.push(conquista.id);
  conquistasMeta[conquista.id] = { desbloqueadaEm: new Date().toISOString(), origem: origem === "admin" ? "admin" : "normal" };
  const novoPote = conquista.especial ? concederPoteDourado() : false;
  salvarDados();
  if (conquista.id === "gabriel-gallego-secreto") {
    enfileirarModal(iconeConquista(conquista), "Você descobriu uma conquista secreta!", conquista.titulo + " — " + conquista.descricao, true, "segredo");
    return true;
  }
  enfileirarModal(iconeConquista(conquista), origem === "admin" ? "Conquista liberada" : "Conquista desbloqueada", conquista.titulo + " — " + conquista.descricao, true, conquista.especial ? "dourado" : "");
  if (novoPote) enfileirarModal(ICONE_POTE_DOURADO, "Dois potes dourados liberados!", "Você completou toda a coleção! O Pote de Danone dourado e o Pote de Terra de Ouro foram liberados juntos e já podem ser usados em uma plantinha.", true, "dourado");
  return true;
}

function verificarConquistas() {
  const ctx = contextoConquistas();
  CONQUISTAS.forEach(c => { if (!c.especial && !c.indisponivel && !conquistas.includes(c.id) && c.condicao(ctx)) desbloquearConquista(c, "normal"); });
  const mestre = CONQUISTAS.find(c => c.especial);
  if (mestre && !conquistas.includes(mestre.id) && colecaoCompleta()) desbloquearConquista(mestre, "normal");
  atualizarContadorConquistas();
  if ($("tela-conquistas")?.classList.contains("ativa")) renderizarConquistas();
}

function adminConquistasAtivo() { return contaAdmin() && usuario.adminAtivo === true; }
function liberarConquistaAdmin(id) {
  if (!adminConquistasAtivo()) { mostrarToast("Ação restrita ao administrador."); return false; }
  const c = CONQUISTAS.find(x => x.id === id);
  if (!c) return false;
  if (conquistas.includes(id)) { mostrarToast("Esta conquista já está desbloqueada."); return false; }
  desbloquearConquista(c, "admin");
  mostrarToast("Conquista liberada pelo administrador: " + c.titulo + ".");
  verificarConquistas();
  renderizarConquistas();
  return true;
}

function resumoColecao() {
  const lista = CONQUISTAS.filter(conquistaDisponivel);
  return { total: lista.length, abertas: lista.filter(c => conquistas.includes(c.id)).length, secretas: lista.filter(c => c.secreta && conquistas.includes(c.id)).length };
}

function atualizarContadorConquistas() {
  const { total, abertas, secretas } = resumoColecao();
  const pct = total ? Math.round((abertas / total) * 100) : 0;
  const set = (id, v) => { const e = $(id); if (e) e.textContent = v; };
  set("contagem-conquistas", abertas); set("conquistas-total", total); set("conquistas-desbloqueadas", abertas);
  set("conquistas-percentual", pct + "%"); set("conquistas-progresso-label", pct + "%"); set("stat-conquistas-ok", abertas);
  set("stat-conquistas-faltam", Math.max(0, total - abertas)); set("stat-conquistas-secretas", secretas);
  set("stat-registros-cuidado", lerListaSalva(CHAVE.registros).length);
  set("conquistas-resumo-texto", abertas ? "Sua coleção cresce com cuidados, jogos e descobertas reais." : "Comece a cuidar para construir sua coleção.");
  const b = $("barra-conquistas"); if (b) b.style.width = pct + "%";
  const ring = document.querySelector(".achievement-progress-ring"); if (ring) ring.style.setProperty("--achievement-percent", pct);
}

function obterProgressoConquista(c) {
  if (!c.progresso) return null;
  const r = c.progresso(contextoConquistas());
  if (!r || typeof r.atual !== "number") return null;
  return { atual: Math.min(r.atual, r.total), total: r.total, percentual: Math.min(100, Math.round((r.atual / r.total) * 100)) };
}

function criarCardConquista(c) {
  const aberta = conquistas.includes(c.id);
  const meta = conquistasMeta[c.id] || {};
  const admin = adminConquistasAtivo();
  const oculta = c.secreta && !aberta && !admin;
  const card = criarEl("article", "conquista-card" + (aberta ? " desbloqueada" : "") + (oculta ? " secreta" : "") + (aberta && meta.origem === "admin" ? " liberada-admin" : "") + (c.especial ? " especial" : "") + (c.indisponivel ? " em-breve" : ""));
  card.dataset.id = c.id;
  const icone = criarEl("span", "conquista-icone");
  icone.innerHTML = oculta ? '<svg viewBox="0 0 48 48"><rect x="9" y="21" width="30" height="22" rx="4"/><path d="M15 21v-6a9 9 0 0 1 18 0v6"/><circle cx="24" cy="32" r="2"/></svg>' : iconeConquista(c);
  const bloco = criarEl("div", "conquista-corpo");
  const estado = aberta ? (meta.origem === "admin" ? "Liberada pelo administrador" : "Conquistada") : (c.indisponivel ? "Em breve" : "Bloqueada");
  bloco.appendChild(criarEl("span", "conquista-estado estado-" + (aberta ? (meta.origem === "admin" ? "admin" : "ok") : (c.indisponivel ? "breve" : "bloq")), estado));
  bloco.appendChild(criarEl("strong", "", oculta ? "Conquista oculta" : c.titulo));
  const desc = criarEl("small", "", oculta ? "Existe um segredo a descobrir. Explore o site para revelar." : c.descricao + (aberta && meta.desbloqueadaEm ? " Desbloqueada em " + new Date(meta.desbloqueadaEm).toLocaleDateString("pt-BR") + "." : ""));
  bloco.appendChild(desc);
  if (!oculta) {
    bloco.appendChild(criarEl("small", "conquista-como", (c.secreta ? "Condição (secreta): " : "Como conseguir: ") + c.como));
    if (c.recompensa) bloco.appendChild(criarEl("small", "conquista-recompensa", "Recompensa: " + c.recompensa));
    if (!aberta && !c.indisponivel) {
      const p = obterProgressoConquista(c);
      if (p) {
        const w = criarEl("div", "conquista-progresso"); const top = criarEl("div", "conquista-progresso-top");
        top.append(criarEl("span", "", p.atual + " / " + p.total), criarEl("strong", "", p.percentual + "%"));
        const bar = criarEl("div", "conquista-mini-bar"); const f = document.createElement("span"); f.style.width = p.percentual + "%"; bar.appendChild(f);
        w.append(top, bar); bloco.appendChild(w);
      }
    }
  }
  if (c.secreta && admin && !aberta) bloco.appendChild(criarEl("small", "conquista-chip", "Secreta"));
  if (admin && !aberta) {
    const b = criarEl("button", "botao-secundario small admin-liberar", "Liberar (admin)");
    b.type = "button"; b.setAttribute("aria-label", "Liberar a conquista " + c.titulo + " como administrador");
    b.addEventListener("click", () => liberarConquistaAdmin(c.id));
    bloco.appendChild(b);
  }
  if (aberta) card.setAttribute("aria-label", c.titulo + " desbloqueada");
  card.append(icone, bloco);
  return card;
}

function renderizarConquistas() {
  atualizarContadorConquistas();
  const g = { ok: $("lista-conquistadas"), pend: $("lista-pendentes"), sec: $("lista-secretas"), breve: $("lista-breve") };
  if (!g.ok) return;
  Object.values(g).forEach(l => l.replaceChildren());
  const n = { ok: 0, pend: 0, sec: 0, breve: 0 };
  CONQUISTAS.forEach(c => {
    const aberta = conquistas.includes(c.id);
    const k = aberta ? "ok" : (c.indisponivel ? "breve" : (c.secreta ? "sec" : "pend"));
    g[k].appendChild(criarCardConquista(c)); n[k]++;
  });
  $("count-conquistadas").textContent = n.ok; $("count-pendentes").textContent = n.pend; $("count-secretas").textContent = n.sec; $("count-breve").textContent = n.breve;
  $("secao-breve").hidden = n.breve === 0;
  const aviso = $("admin-conquistas-aviso");
  const admin = adminConquistasAtivo();
  aviso.classList.toggle("escondido", !admin);
  if (admin) aviso.textContent = "Modo administrador: a conta ativa é " + (usuario.email || "—") + ". Liberar uma conquista afeta somente ela. Itens “Em breve” e secretos também podem ser liberados.";
}

/* ---------- Notificações (modal) com variante dourada ---------- */
function enfileirarModal(icone, titulo, texto, conquista, variante) {
  filaDeModais.push({ icone, titulo, texto, conquista: Boolean(conquista), variante: variante || "" });
  if (filaDeModais.length === 1) exibirModalAtual();
}
function exibirModalAtual() {
  const modal = $("modal-mensagem");
  if (!modal) return;
  const conteudo = $("modal-conteudo");
  conteudo.querySelectorAll(".confete-wrap").forEach(n => n.remove());
  if (!filaDeModais.length) { modal.classList.add("escondido"); conteudo.classList.remove("dourado"); return; }
  const item = filaDeModais[0];
  $("modal-titulo").textContent = item.titulo;
  $("modal-texto").textContent = item.texto;
  $("modal-icone").innerHTML = item.icone || '<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>';
  conteudo.classList.toggle("achievement-unlock", item.conquista);
  conteudo.classList.toggle("dourado", item.variante === "dourado");
  conteudo.classList.toggle("segredo", item.variante === "segredo");
  conteudo.querySelectorAll(".segredo-efeito").forEach(n => n.remove());
  $("modal-etiqueta").hidden = !item.conquista;
  $("modal-etiqueta").textContent = item.variante === "dourado" ? "RECOMPENSA ESPECIAL" : (item.variante === "segredo" ? "✦ SEGREDO DESCOBERTO ✦" : "CONQUISTA DESBLOQUEADA");
  modal.classList.remove("escondido");
  if (item.conquista) { conteudo.classList.remove("achievement-pop"); void conteudo.offsetWidth; conteudo.classList.add("achievement-pop"); }
  if (item.variante === "segredo") {
    /* Animação exclusiva: raios giratórios, explosão de partículas a partir do ícone e confetes coloridos. */
    const fx = criarEl("div", "segredo-efeito"); fx.setAttribute("aria-hidden", "true");
    fx.appendChild(criarEl("div", "segredo-raios"));
    fx.appendChild(criarEl("div", "segredo-onda"));
    const cores = ["#f5cf68", "#7bbbe0", "#e58f7a", "#86a87b", "#b79be0", "#fff0a8"];
    for (let i = 0; i < 28; i++) {
      const ang = (i / 28) * Math.PI * 2, dist = 90 + (i % 4) * 34;
      const p = criarEl("i", "segredo-particula");
      p.style.setProperty("--dx", Math.round(Math.cos(ang) * dist) + "px"); p.style.setProperty("--dy", Math.round(Math.sin(ang) * dist) + "px");
      p.style.setProperty("--c", cores[i % cores.length]); p.style.setProperty("--d", (i % 6) * .05 + "s");
      fx.appendChild(p);
    }
    for (let i = 0; i < 24; i++) { const c = criarEl("i", "confete segredo-confete"); c.style.setProperty("--x", (3 + i * 4.1) + "%"); c.style.setProperty("--d", .5 + (i % 6) * .15 + "s"); c.style.background = cores[i % cores.length]; fx.appendChild(c); }
    conteudo.appendChild(fx);
  }
  if (item.variante === "dourado") {
    const wrap = criarEl("div", "confete-wrap"); wrap.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 14; i++) { const s = criarEl("i", "confete"); s.style.setProperty("--x", (6 + i * 6.5) + "%"); s.style.setProperty("--d", (i % 5) * .18 + "s"); wrap.appendChild(s); }
    conteudo.appendChild(wrap);
  }
}

/* ---------- Várias plantinhas ---------- */
function gerarIdPlanta() { return "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function plantaPorId(id) { return plantas.find(p => p.id === id) || null; }
function numeroDaPlanta(id) { const i = plantas.findIndex(p => p.id === id); return i >= 0 ? i + 1 : 0; }
function rotuloPlanta(p) { return "Plantinha " + numeroDaPlanta(p.id) + " — " + p.nome; }
function rotuloPlantaPorId(id) { const p = plantaPorId(id); return p ? rotuloPlanta(p) : "Plantinha removida"; }
function normalizarPlanta(p) {
  return Object.assign(novaPlanta(), p, {
    cuidados: Object.assign({ regar: false, sol: false }, p.cuidados || {}),
    interacoes: Object.assign({ cliquesNome: 0, acessosJornal: 0, notasDiario: 0 }, p.interacoes || {}),
    tarefas: p.tarefas && typeof p.tarefas === "object" ? p.tarefas : {}
  });
}
function trocarPlanta(id) {
  const p = plantaPorId(id);
  if (!p || p === planta) return;
  planta = p; plantaAtivaId = p.id; fotoPendente = ""; fotoArvoreSel = null;
  salvarDados();
  mostrarTela(document.querySelector(".tela.ativa")?.id || "tela-planta");
}
function renderizarSeletorPlantas(idBox, comNova) {
  const box = $(idBox); if (!box) return;
  box.replaceChildren();
  plantas.forEach(p => {
    const b = criarEl("button", "plant-chip" + (p === planta ? " ativa" : ""), rotuloPlanta(p));
    b.type = "button"; b.setAttribute("aria-pressed", String(p === planta));
    b.addEventListener("click", () => trocarPlanta(p.id));
    box.appendChild(b);
  });
  if (comNova) {
    if (plantas.length < MAX_PLANTAS) { const n = criarEl("button", "plant-chip nova", "+ Nova plantinha"); n.type = "button"; n.addEventListener("click", abrirNovaPlanta); box.appendChild(n); }
    else box.appendChild(criarEl("span", "plant-chip-limite", "Você atingiu o limite de plantinhas."));
  }
  box.hidden = plantas.length === 0;
}
function abrirNovaPlanta() {
  if (plantas.length >= MAX_PLANTAS) { mostrarToast("Você atingiu o limite de plantinhas."); return; }
  iniciarNovoCultivo();
}
function finalizarNovoCultivo() {
  if (!draftPlant) return;
  const nome = $("nome-planta").value.trim();
  if (!nome) { mostrarToast("Dê um nome para sua plantinha antes de continuar."); return; }
  if (!draftPlant.semente || !draftPlant.pote) { mostrarToast("Escolha o feijão e o recipiente antes de finalizar."); return; }
  if (plantas.length >= MAX_PLANTAS) { mostrarToast("Você atingiu o limite de plantinhas."); return; }
  if (ehPoteDourado(draftPlant.pote) && !poteDouradoLiberado()) { mostrarToast("O pote dourado ainda não foi liberado."); return; }
  if (!window.confirm("Criar a plantinha “" + nome + "”? As suas outras plantinhas continuam como estão.")) return;
  const nova = novaPlanta({ id: gerarIdPlanta(), semente: "Feijão", pote: draftPlant.pote, nome, dataInicio: hojeISO(), modoTeste: modoTesteAtivo });
  plantas.push(nova); planta = nova; plantaAtivaId = nova.id; fotoPendente = "";
  usuario.ultimoAcesso = hojeISO();
  sincronizarAdmin(); salvarDados(); draftPlant = null;
  verificarConquistas(); atualizarTelaPlanta(); mostrarTela("tela-planta");
}
function renderizarListaPlantas() {
  const box = $("plantas-lista"); if (!box) return;
  box.replaceChildren();
  plantas.forEach(p => {
    const card = criarEl("article", "planta-card" + (p === planta ? " ativa" : ""));
    const arte = criarEl("div", "planta-card-arte"); arte.setAttribute("aria-hidden", "true");
    arte.innerHTML = obterImagemPlanta(p.semente || "Feijão", p.diasConsecutivos, p.pote, { umido: nivelUmidade(p) });
    const corpo = criarEl("div", "planta-card-corpo");
    corpo.append(criarEl("p", "eyebrow", "PLANTINHA " + numeroDaPlanta(p.id) + (p === planta ? " · SELECIONADA" : "")), criarEl("h3", "", p.nome),
      criarEl("small", "", p.pote + " · plantada em " + formatarDataBR(p.dataInicio)),
      criarEl("small", "", NOMES_ETAPA[obterIndiceEtapa(p.diasConsecutivos)] + " · " + p.diasConsecutivos + " dia(s) consecutivo(s)"),
      criarEl("small", "", listarFotos(p.id).length + " fotografia(s)"));
    const ab = criarEl("button", "botao small", "Abrir"); ab.type = "button";
    ab.addEventListener("click", () => { if (p !== planta) { planta = p; plantaAtivaId = p.id; fotoPendente = ""; salvarDados(); } mostrarTela("tela-planta"); });
    corpo.appendChild(ab); card.append(arte, corpo); box.appendChild(card);
  });
  if (plantas.length < MAX_PLANTAS) {
    const nv = criarEl("button", "planta-card nova", ""); nv.type = "button";
    nv.append(criarEl("strong", "", "+ Nova plantinha"), criarEl("small", "", "Você pode ter até " + MAX_PLANTAS + " (" + plantas.length + "/" + MAX_PLANTAS + ")."));
    nv.addEventListener("click", abrirNovaPlanta); box.appendChild(nv);
  }
  const aviso = $("plantas-limite");
  aviso.textContent = plantas.length >= MAX_PLANTAS ? "Você atingiu o limite de plantinhas." : "";
  aviso.classList.toggle("ativo", plantas.length >= MAX_PLANTAS);
}
function renderizarDetalhesPlanta() {
  renderizarListaPlantas();
  $("detail-nome").textContent = planta.nome || "—";
  $("detail-pote").textContent = planta.pote || "—";
  $("detail-inicio").textContent = formatarDataBR(planta.dataInicio);
  $("detail-dias").textContent = planta.diasConsecutivos;
  const r = resumoColecao();
  $("detail-conquistas").textContent = r.abertas + "/" + r.total;
  const nf = planta.id ? listarFotos(planta.id).length : 0;
  $("detail-foto").textContent = nf ? nf + (nf === 1 ? " fotografia" : " fotografias") : "Nenhuma";
}

/* Recipiente dourado: só aparece nas escolhas depois de liberado. */
function atualizarOpcoesRecipiente() {
  if (!poteDouradoLiberado()) return;
  const grupo = document.querySelector(".segmented-choice");
  let novos = false;
  POTES_RECOMPENSA.forEach(p => {
    if (grupo && !grupo.querySelector('input[value="' + p.valor + '"]')) {
      const label = document.createElement("label");
      label.innerHTML = '<input type="radio" name="pote" value="' + p.valor + '"><span><strong>' + p.nome + '</strong><small>' + p.legenda + '</small></span>';
      grupo.appendChild(label); novos = true;
    }
    const sel = $("config-pote");
    if (sel && !Array.from(sel.options).some(o => o.value === p.valor)) { const o = document.createElement("option"); o.value = p.valor; o.textContent = p.nome; sel.appendChild(o); }
  });
  if (novos) prepararPreviasRecipiente();
}

/* ---------- Umidade, animações de água e luz ---------- */
function nivelUmidade(p) {
  if (!p || !p.ultimaRegaEm) return 0;
  const t = Date.parse(p.ultimaRegaEm);
  if (Number.isNaN(t)) return 0;
  const dec = Date.now() - t;
  if (dec <= UMIDADE_MIN_MS) return 1;
  if (dec < UMIDADE_MIN_MS + UMIDADE_FADE_MS) return 1 - (dec - UMIDADE_MIN_MS) / UMIDADE_FADE_MS;
  return 0;
}
/* Gotinhas de orvalho nas folhas; só aparecem enquanto a planta está "molhada". */
function orvalho(etapa, v) {
  if (!(v > 0)) return "";
  const gota = (x, y) => '<g class="orvalho-gota"><circle cx="' + x + '" cy="' + y + '" r="2.6" fill="#cfe9f7" stroke="#6fb2d6" stroke-width=".8"/><circle cx="' + (x - .8) + '" cy="' + (y - .9) + '" r=".8" fill="#fff"/></g>';
  if (etapa === 0) return '<g class="orvalho" opacity="' + v.toFixed(2) + '">' + gota(168, 203) + gota(193, 205) + gota(181, 199) + '</g>';   /* semente: gotas na superfície úmida */
  const topo = 205 - [0, 29, 48, 72, 96, 124][etapa];
  let g = gota(180, topo + 14) + gota(176, topo + 4);
  for (let i = 0; i < Math.max(0, etapa - 1); i++) {
    const y = 190 - i * (etapa >= 5 ? 25 : etapa >= 4 ? 29 : 31), x = 40 + Math.min(i * 2, 8);
    g += gota(180 - x + 9, y - 9) + gota(180 + x - 10, y - 13);
  }
  return '<g class="orvalho" opacity="' + v.toFixed(2) + '">' + g + '</g>';
}
let umidadeRenderizada = -1;
function iniciarMonitorUmidade() {
  setInterval(() => {
    if (!$("tela-planta")?.classList.contains("ativa") || !planta.id) return;
    const n = Math.round(nivelUmidade(planta) * 8);
    if (n !== umidadeRenderizada) { atualizarImagem(); atualizarCuidados(); }
  }, 15000);
}
function atualizarImagem() {
  const imagem = $("imagem-planta"); if (!imagem) return;
  const u = nivelUmidade(planta);
  umidadeRenderizada = Math.round(u * 8);
  imagem.innerHTML = obterImagemPlanta(planta.semente || "Feijão", planta.diasConsecutivos, planta.pote, { umido: u });
}
function svgPlanta() { return document.querySelector("#imagem-planta svg.plant-illustration"); }
function criarGrupoSvg(classe, html) { const g = document.createElementNS("http://www.w3.org/2000/svg", "g"); g.setAttribute("class", classe); g.innerHTML = html; return g; }

function animarAgua() {
  const svg = svgPlanta(); if (!svg) return;
  svg.querySelectorAll(".anim-agua").forEach(n => n.remove());
  const danone = normalizarRecipiente(planta.pote) === "danone";
  const cx = danone ? 190 : 180, fim = (danone ? 196 : 204) - 30;
  let html = "";
  [-54, -32, -12, 12, 32, 54].forEach((dx, i) => {
    const atraso = (i * .22).toFixed(2);
    html += '<g class="gota-queda" style="--x:' + (cx + dx) + 'px;--fim:' + fim + 'px;animation-delay:' + atraso + 's"><path d="M0-7c-4 6-6 9-6 12a6 6 0 0 0 12 0c0-3-2-6-6-12Z" fill="#7bbbe0" stroke="#4f95bf" stroke-width="1"/></g>';
    html += '<ellipse class="respingo" cx="' + (cx + dx) + '" cy="' + (fim + 31) + '" rx="9" ry="2.6" fill="none" stroke="#7bbbe0" stroke-width="1.4" style="animation-delay:' + (+atraso + 1.05).toFixed(2) + 's"/>';
  });
  const g = criarGrupoSvg("anim-agua", html);
  const alvo = svg.querySelector(".planta-svg");
  svg.insertBefore(g, alvo || null);   /* as gotas caem atrás das folhas e terminam na boca do recipiente */
  svg.classList.add("plant-regando");
  setTimeout(() => { g.remove(); svg.classList.remove("plant-regando"); }, 3300);
}
function animarSol() {
  const svg = svgPlanta(); if (!svg) return;
  svg.querySelectorAll(".anim-sol").forEach(n => n.remove());
  const cx = normalizarRecipiente(planta.pote) === "danone" ? 190 : 180;
  const html = '<path class="sol-feixe" d="M290 78 L' + (cx - 30) + ' 96 L' + (cx + 22) + ' 150Z" fill="#f8dd85"/><ellipse class="sol-brilho" cx="' + cx + '" cy="135" rx="64" ry="58" fill="#fff0b0"/>'
    + '<g transform="translate(305 56)"><g class="sol-anim"><g class="sol-raios"><path d="M0-34v-9M0 34v9M-34 0h-9M34 0h9M-24-24l-6-6M24 24l6 6M24-24l6-6M-24 24l-6 6" stroke="#e6b84a" stroke-width="4" stroke-linecap="round"/></g><circle r="21" fill="#f5cf68"/><circle r="21" fill="none" stroke="#e6b84a" stroke-width="2"/></g></g>';
  const g = criarGrupoSvg("anim-sol", html);
  svg.appendChild(g);
  setTimeout(() => g.remove(), 3700);
}
function atualizarCuidados() {
  const btnRegar = $("btn-regar"), btnSol = $("btn-sol");
  const completo = planta.cuidados.regar && planta.cuidados.sol;
  const admLivre = !modoTesteAtivo && contaAdmin() && usuario.adminAtivo === true;
  btnRegar.textContent = (modoTesteAtivo || admLivre) ? "Confirmar novamente" : (planta.cuidados.regar ? "Rega confirmada hoje" : "Confirmar rega");
  btnSol.textContent = (modoTesteAtivo || admLivre) ? "Confirmar novamente" : (planta.cuidados.sol ? "Luz confirmada hoje" : "Confirmar luz adequada");
  btnRegar.disabled = !modoTesteAtivo && !admLivre && planta.cuidados.regar;
  btnSol.disabled = !modoTesteAtivo && !admLivre && planta.cuidados.sol;
  $("cuidado-regar").classList.toggle("concluido", planta.cuidados.regar);
  $("cuidado-sol").classList.toggle("concluido", planta.cuidados.sol);
  const status = $("mensagem-dia");
  status.textContent = modoTesteAtivo ? "Modo de teste: ações podem ser repetidas" : (completo ? "Cuidados de hoje concluídos" : "Aguardando registros");
  status.classList.toggle("ok", completo);
  const u = nivelUmidade(planta);
  $("info-agua").textContent = u > 0 ? "Rega confirmada às " + new Date(planta.ultimaRegaEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) + ". A planta fica com aparência úmida por pelo menos 10 minutos; evite regar de novo sem verificar." : TEXTO_AGUA;
  $("info-luz").textContent = TEXTO_LUZ;
}

/* ---------- Jogos: registro de resultados reais ---------- */
function registrarRespostaJogo(tipo, indice, acertou) {
  const j = jogosStats;
  if (acertou) { j.acertos++; j.seqAtual++; j.seqMax = Math.max(j.seqMax, j.seqAtual); j.acertadas[tipo + ":" + indice] = true; }
  else j.seqAtual = 0;
  salvarDados(); verificarConquistas();
}
function concluirRodada(tipo, pontos, total) {
  const j = jogosStats, pct = Math.round((pontos / total) * 100);
  const jg = j.porJogo[tipo] || { partidas: 0, concluidas: 0, melhor: 0, ultimo: null };
  if (jg.ultimo !== null && pct > jg.ultimo) j.melhorou = true;
  jg.concluidas++; jg.ultimo = pct; jg.melhor = Math.max(jg.melhor, pct); j.porJogo[tipo] = jg;
  j.concluidos++; if (pct === 100) j.perfeitas++;
  salvarDados(); verificarConquistas();
}
function registrarInicioJogo(tipo) {
  const j = jogosStats; j.iniciados++;
  const jg = j.porJogo[tipo] || { partidas: 0, concluidas: 0, melhor: 0, ultimo: null }; jg.partidas++; j.porJogo[tipo] = jg;
  salvarDados(); verificarConquistas();
}

function registrarVisitaTela(id) {
  if (!usuario.email) return;
  garantirUsuario();
  const t = usuario.stats.telas = usuario.stats.telas || {};
  if (!t[id]) { t[id] = 1; salvarDados(); setTimeout(verificarConquistas, 0); }
}
function registrarCliqueNomePlantinha() {
  garantirUsuario();
  usuario.stats.cliquesNome = (usuario.stats.cliquesNome || 0) + 1;
  salvarDados(); verificarConquistas();
  mostrarToast(usuario.stats.cliquesNome >= 10 ? "Você encontrou um pequeno segredo." : "Interação registrada.");
}

/* ---------- Navegação: voltar para a Visão geral ---------- */
function adicionarBotoesVoltar() {
  ["tela-progresso", "tela-minha-plantinha", "tela-conquistas", "tela-guia", "tela-topico", "tela-jornal", "tela-calendario", "tela-tutorial", "tela-diario", "tela-registros", "tela-fotos", "tela-configuracoes", "tela-jogos"].forEach(id => {
    const tela = $(id); if (!tela || tela.querySelector(".voltar-visao")) return;
    const b = criarEl("button", "voltar-visao", "← Voltar para Visão geral");
    b.type = "button"; b.dataset.navScreen = "tela-planta";
    tela.prepend(b);
  });
}

/* ---------- Diário (anotações) e Histórico (eventos) ---------- */
function popularSelectPlantas(id, valor, comTodas) {
  const s = $(id); if (!s) return;
  const atual = valor !== undefined ? valor : s.value;
  s.replaceChildren();
  if (comTodas) { const o = document.createElement("option"); o.value = ""; o.textContent = "Todas as plantinhas"; s.appendChild(o); }
  plantas.forEach(p => { const o = document.createElement("option"); o.value = p.id; o.textContent = rotuloPlanta(p); s.appendChild(o); });
  s.value = atual;
  if (s.value !== atual) s.value = comTodas ? "" : (plantas[0] ? plantas[0].id : "");
}
function abrirLeitorDiario(r) {
  const leitor = $("diario-leitor"); if (!leitor) return;
  $("diario-leitor-data").textContent = formatarDataBR(r.data) + (r.hora ? " · " + r.hora : "");
  $("diario-leitor-tipo").textContent = r.tipo || "Registro";
  $("diario-leitor-titulo").textContent = r.tipo || "Registro de cultivo";
  $("diario-leitor-planta").textContent = r.plantaId ? rotuloPlantaPorId(r.plantaId) : "";
  $("diario-leitor-texto").textContent = r.nota || "Registro sem observações adicionais.";
  leitor.hidden = false;
  leitor.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
function renderizarDiario() {
  const lista = $("diario-lista"); if (!lista) return;
  popularSelectPlantas("diario-planta", planta.id);
  const regs = lerListaSalva(CHAVE.diario).filter(r => r.origem !== "principal" && r.plantaId === planta.id)
    .sort((a, b) => ((b.data || "") + "T" + (b.hora || "00:00")).localeCompare((a.data || "") + "T" + (a.hora || "00:00")));
  lista.replaceChildren();
  $("diario-leitor").hidden = true;
  $("diario-contagem").textContent = regs.length + (regs.length === 1 ? " anotação" : " anotações") + (planta.nome ? " · " + planta.nome : "");
  if (!regs.length) { lista.appendChild(criarEl("div", "panel diary-empty", "Ainda não há anotações para esta plantinha. Escreva a primeira acima; os cuidados confirmados aparecem no Histórico.")); return; }
  regs.forEach(r => {
    const item = criarEl("button", "timeline-item diary-entry-button"); item.type = "button";
    item.addEventListener("click", () => abrirLeitorDiario(r));
    const marca = criarEl("span", "timeline-mark", (r.tipo || "R").slice(0, 1).toUpperCase());
    const c = criarEl("span", "timeline-content");
    const topo = criarEl("span", "timeline-meta");
    const t = document.createElement("time"); t.textContent = formatarDataBR(r.data) + (r.hora ? " · " + r.hora : "");
    topo.append(t, criarEl("span", "chip-planta", rotuloPlantaPorId(r.plantaId)));
    c.append(topo, criarEl("strong", "", r.tipo || "Registro"), criarEl("small", "", r.nota || "Registro sem observações adicionais."));
    item.append(marca, c); lista.appendChild(item);
  });
}
function salvarAnotacaoDiario(evento) {
  evento.preventDefault();
  const data = $("diario-data").value, tipo = $("diario-tipo").value, nota = $("diario-nota").value.trim();
  const pid = $("diario-planta").value;
  if (!data || !plantaPorId(pid)) { mostrarToast("Escolha a plantinha e a data do registro."); return; }
  if (!dataValidaNaoFutura(data)) { mostrarToast("A data do registro não pode ser futura."); return; }
  const regs = lerListaSalva(CHAVE.diario);
  const hora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const id = Date.now() + Math.random();
  regs.push({ id, data, hora, tipo, nota, plantaId: pid });
  localStorage.setItem(CHAVE.diario, JSON.stringify(regs.slice(-250)));
  adicionarRegistroAtividade(tipo || "Diário", nota || "Anotação registrada no diário.", { id, data, hora, plantaId: pid });
  salvarDados();
  $("diario-nota").value = "";
  renderizarDiario(); verificarConquistas();
  mostrarToast(pid === planta.id ? "Registro salvo no diário." : "Anotação salva em " + rotuloPlantaPorId(pid) + ".");
}
const TIPOS_EVENTO = { Rega: "Rega confirmada", Sol: "Luz adequada confirmada", Foto: "Fotografia registrada", "Estágio": "Mudança de estágio" };
const filtroHist = { planta: "", tipo: "" };
function iconeEvento(t) {
  if (t === "Rega") return '<svg viewBox="0 0 24 24"><path d="M12 3C9.5 7 6 10.2 6 14a6 6 0 0 0 12 0c0-3.8-3.5-7-6-11Z"/></svg>';
  if (t === "Sol") return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/></svg>';
  if (t === "Foto") return '<svg viewBox="0 0 24 24"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h3l1.4 2h6.6A2.5 2.5 0 0 1 20 8.5v9A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5Z"/><circle cx="12" cy="13" r="3.2"/></svg>';
  if (t === "Estágio") return '<svg viewBox="0 0 24 24"><path d="M12 21V10M12 14C7 14 5 11 5 7c4 0 7 2 7 7M12 16c0-4 3-7 7-7 0 4-2 7-7 7Z"/></svg>';
  return '<svg viewBox="0 0 24 24"><path d="M6 4h12v16H6z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>';
}
function renderizarRegistros() {
  const lista = $("lista-registros"); if (!lista) return;
  popularSelectPlantas("hist-planta", filtroHist.planta, true);
  $("hist-tipo").value = filtroHist.tipo;
  let regs = lerListaSalva(CHAVE.registros);
  const totalGeral = regs.length;
  if (filtroHist.planta) regs = regs.filter(r => r.plantaId === filtroHist.planta);
  if (filtroHist.tipo) regs = regs.filter(r => filtroHist.tipo === "Anotação" ? !TIPOS_EVENTO[r.tipo] : r.tipo === filtroHist.tipo);
  regs.sort((a, b) => String(b.timestamp || "").localeCompare(String(a.timestamp || "")));
  lista.replaceChildren();
  const hoje = hojeISO();
  $("registros-total").textContent = regs.length;
  $("registros-hoje").textContent = regs.filter(r => r.data === hoje).length;
  $("registros-status").textContent = regs.length + (regs.length === 1 ? " evento" : " eventos");
  if (!regs.length) {
    const e = criarEl("div", "records-empty");
    e.append(criarEl("strong", "", totalGeral ? "Nenhum evento com esses filtros." : "O histórico ainda está vazio."), criarEl("span", "", totalGeral ? "Altere a plantinha ou o tipo de evento." : "Ele começa a ser preenchido quando você confirmar uma rega ou a luz, escrever no diário ou registrar uma fotografia."));
    lista.appendChild(e); return;
  }
  const grupos = {};
  regs.forEach(r => { const d = r.data || hoje; (grupos[d] = grupos[d] || []).push(r); });
  Object.keys(grupos).sort((a, b) => b.localeCompare(a)).forEach(data => {
    const sec = criarEl("section", "record-day");
    const cab = criarEl("div", "record-day-heading"); cab.append(criarEl("strong", "", formatarDataBR(data)), criarEl("span", "", grupos[data].length + (grupos[data].length === 1 ? " evento" : " eventos")));
    const itens = criarEl("div", "record-day-list");
    grupos[data].forEach(r => {
      const it = criarEl("article", "record-item");
      const ic = criarEl("span", "record-icon " + (r.tipo === "Rega" ? "record-water" : r.tipo === "Sol" ? "record-sun" : "record-note")); ic.innerHTML = iconeEvento(r.tipo);
      const corpo = criarEl("div", "record-body");
      corpo.append(criarEl("strong", "", TIPOS_EVENTO[r.tipo] || (r.tipo || "Anotação")), criarEl("small", "", (r.hora || "Horário não informado") + " · " + (r.descricao || "Evento registrado")), criarEl("span", "chip-planta", rotuloPlantaPorId(r.plantaId)));
      it.append(ic, corpo); itens.appendChild(it);
    });
    sec.append(cab, itens); lista.appendChild(sec);
  });
}

/* ---------- Fotografias por plantinha + árvore de crescimento ---------- */
let ordemFotosDesc = true, fotoArvoreSel = null;
function listarFotos(id) { return lerListaSalva(CHAVE.fotos).filter(f => f.plantaId === id).sort((a, b) => String(a.ts).localeCompare(String(b.ts))); }
function ultimaFoto() { return planta.id ? (listarFotos(planta.id).slice(-1)[0] || null) : null; }
function tituloFoto(f) { return rotuloPlantaPorId(f.plantaId) + " · " + formatarDataBR(f.data) + (f.legenda ? " · " + f.legenda : ""); }

function renderizarFotoPrincipal() {
  const area = $("foto-planta-preview"); if (!area) return;
  const salvar = $("btn-foto-salvar"), cancelar = $("btn-foto-cancelar"), ampliar = $("btn-foto-ampliar"), adicionar = $("btn-foto-adicionar");
  area.replaceChildren();
  const ult = ultimaFoto();
  if (fotoPendente) {
    const img = criarEl("img", "photo-real"); img.src = fotoPendente; img.alt = "Prévia da fotografia selecionada";
    area.append(criarEl("span", "eyebrow", "PRÉVIA DA SELEÇÃO"), img, criarEl("small", "", "Esta imagem ainda não foi salva na trajetória."));
    salvar.hidden = false; cancelar.hidden = false; ampliar.hidden = true; adicionar.hidden = true;
  } else if (ult) {
    const img = criarEl("img", "photo-real"); img.src = ult.src; img.alt = "Fotografia mais recente de " + planta.nome;
    area.append(img, criarEl("small", "", "Último registro em " + formatarDataBR(ult.data)));
    salvar.hidden = true; cancelar.hidden = true; ampliar.hidden = false; adicionar.hidden = false; adicionar.textContent = "Nova fotografia";
  } else {
    const ic = criarEl("div", "photo-placeholder-icon"); ic.innerHTML = iconeEvento("Foto");
    area.append(ic, criarEl("strong", "", "Adicione a primeira fotografia"), criarEl("small", "", "Registre como sua planta real está hoje."));
    salvar.hidden = true; cancelar.hidden = true; ampliar.hidden = true; adicionar.hidden = false; adicionar.textContent = "Adicionar foto";
  }
}
function salvarFotoPendente() {
  if (!fotoPendente || !planta.id) return;
  const lista = lerListaSalva(CHAVE.fotos);
  const entrada = { id: gerarIdPlanta() + "f", plantaId: planta.id, data: hojeISO(), ts: new Date().toISOString(), estagio: obterIndiceEtapa(planta.diasConsecutivos), dia: planta.diasConsecutivos, legenda: ($("foto-legenda")?.value || "").trim().slice(0, 80), src: fotoPendente };
  lista.push(entrada);
  try { localStorage.setItem(CHAVE.fotos, JSON.stringify(lista)); }
  catch (e) { mostrarToast("Sem espaço para salvar. Exclua fotografias antigas ou baixe um backup."); return; }
  adicionarRegistroAtividade("Foto", entrada.legenda || "Fotografia registrada.", { plantaId: planta.id });
  fotoPendente = ""; $("foto-input").value = ""; if ($("foto-legenda")) $("foto-legenda").value = "";
  fotoArvoreSel = null;
  renderizarFotoPrincipal(); renderizarFotos(); verificarConquistas();
  mostrarToast("Fotografia adicionada à trajetória de " + planta.nome + ".");
}
function apagarFotoPorId(id) {
  const f = lerListaSalva(CHAVE.fotos).find(x => x.id === id); if (!f) return;
  if (!window.confirm("Excluir esta fotografia? As demais etapas e registros continuam intactos.")) return;
  localStorage.setItem(CHAVE.fotos, JSON.stringify(lerListaSalva(CHAVE.fotos).filter(x => x.id !== id)));
  fotoArvoreSel = null; renderizarFotoPrincipal(); renderizarFotos(); mostrarToast("Fotografia excluída.");
}
function abrirFotoModal(f) {
  if (!f || f instanceof Event) f = ultimaFoto();
  if (!f) return;
  $("photo-modal-title").textContent = tituloFoto(f);
  $("photo-modal-img").src = f.src;
  $("photo-modal").classList.remove("escondido");
}
function fecharFotoModal() { $("photo-modal").classList.add("escondido"); }

function renderizarFotos() {
  renderizarSeletorPlantas("fotos-seletor", false);
  const ok = Boolean(planta.id);
  $("foto-novo-planta").textContent = ok ? rotuloPlanta(planta) : "Crie uma plantinha para registrar fotografias.";
  const prev = $("foto-novo-preview"); prev.replaceChildren();
  if (fotoPendente) { const i = criarEl("img", "gallery-image"); i.src = fotoPendente; i.alt = "Prévia da fotografia"; prev.appendChild(i); }
  else prev.appendChild(criarEl("div", "gallery-empty", "Escolha uma fotografia para ver a prévia."));
  $("btn-foto-salvar-2").hidden = !fotoPendente; $("btn-foto-cancelar-2").hidden = !fotoPendente;
  $("btn-foto-adicionar-2").textContent = fotoPendente ? "Trocar imagem" : "Escolher fotografia";
  $("btn-foto-adicionar-2").disabled = !ok;
  const fotos = ok ? listarFotos(planta.id) : [];
  $("arvore-contagem").textContent = fotos.length + (fotos.length === 1 ? " fotografia" : " fotografias");
  renderizarArvore(fotos); renderizarGradeFotos(fotos);
}
function renderizarGradeFotos(fotos) {
  const g = $("fotos-grid"); g.replaceChildren();
  $("foto-ordem").textContent = ordemFotosDesc ? "Mais recentes primeiro" : "Mais antigas primeiro";
  if (!fotos.length) { g.appendChild(criarEl("div", "gallery-empty fotos-vazio", planta.id ? "Nenhuma fotografia de " + planta.nome + " ainda. Escolha a primeira imagem no bloco acima." : "Crie uma plantinha para começar.")); return; }
  (ordemFotosDesc ? [...fotos].reverse() : fotos).forEach(f => {
    const card = criarEl("figure", "foto-card");
    const b = criarEl("button", "foto-card-img"); b.type = "button"; b.setAttribute("aria-label", "Ampliar fotografia de " + formatarDataBR(f.data));
    const img = document.createElement("img"); img.src = f.src; img.alt = "Fotografia de " + planta.nome + " em " + formatarDataBR(f.data); img.loading = "lazy"; b.appendChild(img);
    b.addEventListener("click", () => abrirFotoModal(f));
    const leg = criarEl("figcaption", "foto-card-info");
    leg.append(criarEl("strong", "", formatarDataBR(f.data)), criarEl("small", "", NOMES_ETAPA[f.estagio] || "Etapa não informada"), criarEl("small", "", rotuloPlantaPorId(f.plantaId)));
    if (f.legenda) leg.appendChild(criarEl("em", "", f.legenda));
    const del = criarEl("button", "ghost-action danger", "Excluir"); del.type = "button"; del.addEventListener("click", () => apagarFotoPorId(f.id));
    leg.appendChild(del); card.append(b, leg); g.appendChild(card);
  });
}
/* Árvore: a base é o plantio; cada etapa com fotos vira um nó mais acima. Só existem nós para registros reais. */
function renderizarArvore(fotos) {
  const box = $("arvore"), det = $("arvore-detalhe");
  box.replaceChildren(); det.replaceChildren(); det.hidden = true;
  if (!planta.id) { det.hidden = false; det.appendChild(criarEl("p", "muted", "Crie uma plantinha para começar a árvore de crescimento.")); return; }
  const grupos = {};
  fotos.forEach(f => { const k = Number.isInteger(f.estagio) ? f.estagio : 0; (grupos[k] = grupos[k] || []).push(f); });
  const nos = [{ chave: "raiz", titulo: "Semente plantada", data: planta.dataInicio, fotos: [] }];
  Object.keys(grupos).map(Number).sort((a, b) => a - b).forEach(k => nos.push({ chave: "e" + k, titulo: NOMES_ETAPA[k], data: grupos[k][0].data, fotos: grupos[k] }));
  nos.forEach((no, i) => {
    const wrap = criarEl("div", "arvore-no " + (i % 2 ? "dir" : "esq") + (i === 0 ? " base" : ""));
    wrap.dataset.chave = no.chave;
    const b = criarEl("button", "arvore-folha"); b.type = "button";
    b.setAttribute("aria-label", no.titulo + (no.data ? ", " + formatarDataBR(no.data) : "") + (no.fotos.length ? ", " + no.fotos.length + " fotografia(s)" : ""));
    const th = criarEl("span", "arvore-thumb");
    if (no.fotos.length) { const im = document.createElement("img"); im.src = no.fotos[no.fotos.length - 1].src; im.alt = ""; th.appendChild(im); } else th.innerHTML = ICONE_GRUPO.cultivo;
    const tx = criarEl("span", "arvore-texto"); tx.append(criarEl("strong", "", no.titulo), criarEl("small", "", no.data ? formatarDataBR(no.data) : ""));
    if (no.fotos.length > 1) tx.appendChild(criarEl("em", "", no.fotos.length + " registros"));
    b.append(th, tx); b.addEventListener("click", () => mostrarDetalheArvore(no, no.fotos.length - 1));
    wrap.appendChild(b); box.appendChild(wrap);
  });
  if (!fotos.length) { det.hidden = false; det.appendChild(criarEl("p", "muted", "Ainda não há fotografias. A árvore começa no plantio e ganha uma etapa nova quando você registrar a primeira imagem.")); }
  else if (fotoArvoreSel) { const no = nos.find(n => n.chave === fotoArvoreSel.chave); if (no) mostrarDetalheArvore(no, Math.min(fotoArvoreSel.i, no.fotos.length - 1)); }
}
function mostrarDetalheArvore(no, i) {
  fotoArvoreSel = { chave: no.chave, i };
  document.querySelectorAll(".arvore-no").forEach(n => n.classList.toggle("sel", n.dataset.chave === no.chave));
  const det = $("arvore-detalhe"); det.replaceChildren(); det.hidden = false;
  det.appendChild(criarEl("p", "eyebrow", "ETAPA: " + no.titulo.toUpperCase()));
  if (!no.fotos.length) { det.appendChild(criarEl("p", "muted", "A plantinha foi plantada em " + formatarDataBR(no.data) + ". As fotografias registradas aparecem nas etapas seguintes.")); return; }
  const f = no.fotos[Math.max(0, i)];
  const linha = criarEl("div", "arvore-detalhe-corpo");
  const img = criarEl("img", "arvore-detalhe-img"); img.src = f.src; img.alt = "Fotografia de " + formatarDataBR(f.data); img.addEventListener("click", () => abrirFotoModal(f));
  const info = criarEl("div", "arvore-detalhe-info");
  info.append(criarEl("h3", "", formatarDataBR(f.data)), criarEl("p", "muted", rotuloPlantaPorId(f.plantaId) + " · " + NOMES_ETAPA[f.estagio] + " · dia " + (f.dia ?? "—")));
  if (f.legenda) info.appendChild(criarEl("p", "", f.legenda));
  const notas = lerListaSalva(CHAVE.diario).filter(d => d.origem !== "principal" && d.plantaId === f.plantaId && d.data === f.data && d.nota);
  notas.forEach(n => info.appendChild(criarEl("p", "arvore-nota", "Diário: " + n.nota)));
  if (no.fotos.length > 1) { const tb = criarEl("div", "arvore-miniaturas"); no.fotos.forEach((x, k) => { const m = criarEl("button", "mini" + (k === i ? " ativa" : "")); m.type = "button"; m.setAttribute("aria-label", "Registro de " + formatarDataBR(x.data)); const mi = document.createElement("img"); mi.src = x.src; mi.alt = ""; m.appendChild(mi); m.addEventListener("click", () => mostrarDetalheArvore(no, k)); tb.appendChild(m); }); info.appendChild(tb); }
  const ac = criarEl("div", "photo-actions"); const amp = criarEl("button", "botao-secundario small", "Ampliar"); amp.type = "button"; amp.addEventListener("click", () => abrirFotoModal(f));
  const ex = criarEl("button", "ghost-action danger", "Excluir"); ex.type = "button"; ex.addEventListener("click", () => apagarFotoPorId(f.id)); ac.append(amp, ex); info.appendChild(ac);
  linha.append(img, info); det.appendChild(linha);
}

/* ---------- Fotografia de perfil (somente 18+) ---------- */
let perfilPendente = "";
const AVATAR_PADRAO = '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5 21c.7-4 3-6 7-6s6.3 2 7 6"/></svg>';
function maiorDeIdade() { const i = idadeEmAnos(usuario.nascimento); return i !== null && i >= 18; }
function preencherAvatar(el, src) { if (!el) return; el.replaceChildren(); if (src) { const i = document.createElement("img"); i.src = src; i.alt = ""; el.appendChild(i); } else el.innerHTML = AVATAR_PADRAO; }
function atualizarFotoPerfil() {
  garantirUsuario();
  const permitido = maiorDeIdade();
  if (!permitido && usuario.fotoPerfil) { usuario.fotoPerfil = ""; salvarDados(); }   /* menores não mantêm foto de perfil */
  preencherAvatar(document.querySelector(".profile-avatar"), permitido ? usuario.fotoPerfil : "");
  const bloco = $("perfil-foto-bloco"); if (!bloco) return;
  bloco.classList.toggle("escondido", !permitido);
  if (!permitido) return;
  preencherAvatar($("perfil-foto-preview"), perfilPendente || usuario.fotoPerfil);
  $("btn-perfil-confirmar").hidden = !perfilPendente; $("btn-perfil-cancelar").hidden = !perfilPendente;
  $("btn-perfil-remover").hidden = !usuario.fotoPerfil || Boolean(perfilPendente);
  $("btn-perfil-escolher").textContent = usuario.fotoPerfil ? "Trocar foto" : "Escolher foto";
}
function mensagemPerfil(t, erro) { const m = $("perfil-foto-msg"); m.textContent = t; m.className = "form-message " + (erro ? "error" : "success"); }
function escolherFotoPerfil(arquivo) {
  if (!maiorDeIdade()) { mensagemPerfil("A fotografia de perfil está disponível somente para maiores de 18 anos.", true); return; }
  if (!arquivo) return;
  if (!["image/jpeg", "image/png", "image/webp"].includes(arquivo.type)) { mensagemPerfil("Use uma imagem JPG, PNG ou WebP.", true); return; }
  if (arquivo.size > 3 * 1024 * 1024) { mensagemPerfil("A imagem deve ter no máximo 3 MB.", true); return; }
  const leitor = new FileReader();
  leitor.onload = e => {
    const im = new Image();
    im.onload = () => {
      const lado = Math.min(im.width, im.height), cv = document.createElement("canvas"); cv.width = cv.height = 256;
      cv.getContext("2d").drawImage(im, (im.width - lado) / 2, (im.height - lado) / 2, lado, lado, 0, 0, 256, 256);
      perfilPendente = cv.toDataURL("image/jpeg", .85); atualizarFotoPerfil(); mensagemPerfil("Confira a prévia e confirme para salvar.", false);
    };
    im.onerror = () => mensagemPerfil("Não foi possível ler essa imagem.", true);
    im.src = e.target.result;
  };
  leitor.readAsDataURL(arquivo);
}
function confirmarFotoPerfil() {
  if (!maiorDeIdade()) { perfilPendente = ""; atualizarFotoPerfil(); mensagemPerfil("A fotografia de perfil está disponível somente para maiores de 18 anos.", true); return; }
  if (!perfilPendente) return;
  usuario.fotoPerfil = perfilPendente; perfilPendente = ""; salvarDados(); atualizarFotoPerfil(); mensagemPerfil("Fotografia de perfil salva.", false);
}

function inicializarEventosV3() {
  $("btn-ir-fotos-planta").addEventListener("click", () => mostrarTela("tela-fotos"));
  $("btn-foto-salvar-2").addEventListener("click", salvarFotoPendente);
  $("btn-foto-cancelar-2").addEventListener("click", cancelarFotoPendente);
  $("foto-ordem").addEventListener("click", () => { ordemFotosDesc = !ordemFotosDesc; renderizarFotos(); });
  $("form-diario").addEventListener("submit", salvarAnotacaoDiario);
  $("hist-planta").addEventListener("change", e => { filtroHist.planta = e.target.value; renderizarRegistros(); });
  $("hist-tipo").addEventListener("change", e => { filtroHist.tipo = e.target.value; renderizarRegistros(); });
  $("btn-perfil-escolher").addEventListener("click", () => $("perfil-foto-input").click());
  $("perfil-foto-input").addEventListener("change", e => { escolherFotoPerfil(e.target.files[0]); e.target.value = ""; });
  $("btn-perfil-confirmar").addEventListener("click", confirmarFotoPerfil);
  $("btn-perfil-cancelar").addEventListener("click", () => { perfilPendente = ""; atualizarFotoPerfil(); mensagemPerfil("", false); });
  $("btn-perfil-remover").addEventListener("click", () => { usuario.fotoPerfil = ""; salvarDados(); atualizarFotoPerfil(); mensagemPerfil("Fotografia removida.", false); });
  $("btn-salvar-admin").addEventListener("click", renderizarConquistas);
  $("btn-salvar-conta").addEventListener("click", () => setTimeout(atualizarFotoPerfil, 50));
}

carregarDados();
migrarDadosAntigos();
carregarDados();
inicializarEventos();
inicializarEventosV3();
adicionarBotoesVoltar();
atualizarOpcoesRecipiente();
prepararPreviasRecipiente();
configurarNavegacao();
iniciarMonitorUmidade();
mostrarDicaDoDia();
if (!document.getElementById("diario-data").value) document.getElementById("diario-data").value = hojeISO();
if (usuario.preferencias.reduzirAnimacoes) document.body.classList.add("reduzir-animacoes");
if (usuario.email && usuario.ultimoAcesso && planta.nome) {
  iniciarSessao();
  mostrarTela("tela-planta");
} else if (usuario.email && usuario.ultimoAcesso) {
  iniciarSessao();
  mostrarTela("tela-inicial");
} else {
  mostrarTela("tela-login");
}


/* Configurações > Descrição do app: para adicionar criadores, basta incluir o nome nesta lista. */
const CRIADORES = ["Gabriel Gallego"];
function renderizarCriadores() {
  const lista = document.getElementById("lista-criadores");
  if (!lista) return;
  lista.replaceChildren();
  CRIADORES.forEach(nome => {
    const li = criarEl("li", "criador-item", nome);
    if (nome === "Gabriel Gallego") li.addEventListener("click", registrarCliqueGabriel);   /* segredo: sem nenhuma dica visual */
    lista.appendChild(li);
  });
}
renderizarCriadores();

function registrarCliqueGabriel() {
  garantirUsuario();
  usuario.stats.cliquesGabriel = (usuario.stats.cliquesGabriel || 0) + 1;
  salvarDados();
  verificarConquistas();   /* desbloqueia uma única vez: desbloquearConquista ignora o que já foi aberto */
}
