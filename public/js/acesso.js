/* Acesso ao Minha Plantinha: etapa do código administrativo, modo visitante, dados antigos do navegador,
   exportação/exclusão de conta e decisão da tela inicial (sessão válida no servidor ou login). */
(function () {
  const el = (id) => document.getElementById(id);
  MP.aoErro((t) => mostrarToast(t));

  /* ---------- Código adicional da conta administrativa ---------- */
  function mostrarPassoCodigo() {
    el("login-passo-senha").classList.add("escondido");
    el("login-opcoes").classList.add("escondido");
    el("login-passo-codigo").classList.remove("escondido");
    el("erro-login").textContent = "";
    el("login-codigo").value = "";
    el("login-codigo").focus();
  }
  function voltarPassoSenha() {
    el("login-passo-codigo").classList.add("escondido");
    el("login-passo-senha").classList.remove("escondido");
    el("login-opcoes").classList.remove("escondido");
    el("login-codigo").value = ""; el("login-senha").value = "";
  }
  window.mostrarPassoCodigo = mostrarPassoCodigo;

  async function confirmarCodigoAdmin() {
    const erro = el("erro-login");
    const codigo = el("login-codigo").value;
    if (!codigo) { erro.textContent = "Informe o código de acesso."; return; }
    const r = await MP.api("POST", "/api/auth/admin-code", { codigo });
    el("login-codigo").value = "";
    if (!r.ok) {
      erro.textContent = (r.json && r.json.erro) || "Não foi possível validar o código.";
      if (r.json && r.json.reiniciar) voltarPassoSenha();
      return;
    }
    voltarPassoSenha();
    await entrarComConta(r.json.conta, true);
  }
  el("btn-login-codigo").addEventListener("click", confirmarCodigoAdmin);
  el("login-codigo").addEventListener("keydown", (e) => { if (e.key === "Enter") confirmarCodigoAdmin(); });
  el("btn-login-codigo-voltar").addEventListener("click", async () => { await MP.api("POST", "/api/auth/logout"); voltarPassoSenha(); el("erro-login").textContent = ""; });

  el("btn-reenviar-responsavel").addEventListener("click", async () => {
    const r = await MP.api("POST", "/api/auth/reenviar-responsavel", { email: el("login-email").value, senha: el("login-senha").value });
    el("erro-login").textContent = r.ok ? "E-mail reenviado ao responsável." : ((r.json && r.json.erro) || "Não foi possível reenviar.");
  });

  /* ---------- Modo visitante (somente memória; nenhuma requisição de dados ao servidor) ---------- */
  el("btn-entrar-visitante").addEventListener("click", () => { el("erro-visitante").textContent = ""; mostrarTela("tela-visitante"); });
  el("btn-visitante-voltar").addEventListener("click", () => { el("visitante-nascimento").value = ""; el("visitante-responsavel").checked = false; mostrarTela("tela-login"); });
  el("visitante-nascimento").addEventListener("change", () => {
    const idade = idadeEmAnos(el("visitante-nascimento").value);
    const menor = idade !== null && idade < 18;
    el("visitante-menor").classList.toggle("escondido", !menor);
    if (!menor) el("visitante-responsavel").checked = false;
  });
  el("btn-visitante-continuar").addEventListener("click", () => {
    const erro = el("erro-visitante"); erro.textContent = "";
    const nascimento = el("visitante-nascimento").value;
    if (!dataValidaNaoFutura(nascimento)) { erro.textContent = "Informe uma data de nascimento válida e não futura."; return; }
    const idade = idadeEmAnos(nascimento);
    if (idade < 18 && !el("visitante-responsavel").checked) { erro.textContent = "Para visitar com menos de 18 anos, um adulto responsável precisa acompanhar. Marque a confirmação para continuar."; return; }
    MP.entrarVisitante();                       /* sessão do tipo "visitante": sem cookie, sem conta, sem servidor */
    modoTesteAtivo = true;                      /* cuidados podem ser repetidos para explorar */
    resetarEstadoParaNamespace(true);
    usuario.nomeExibicao = "Visitante";
    usuario.email = "";
    usuario.nascimento = nascimento;            /* só em memória, para o aviso de idade; some ao sair */
    usuario.admin = false; usuario.adminAtivo = false;
    el("visitante-nascimento").value = ""; el("visitante-responsavel").checked = false;
    sincronizarAdmin();
    aplicarEstadoCarregado();
    iniciarSessao();
    mostrarTela("tela-inicial");
  });
  el("btn-visitante-sair").addEventListener("click", () => encerrarSessao());
  el("btn-visitante-criar-conta").addEventListener("click", async () => { await encerrarSessao(); mostrarTela("tela-cadastro"); });

  /* ---------- Direitos do titular: baixar e excluir os próprios dados ---------- */
  el("btn-exportar-conta").addEventListener("click", async () => {
    const msg = el("config-conta-msg");
    if (MP.estado.tipo !== "conta") { msg.textContent = "No modo visitante não há dados salvos para baixar."; msg.className = "form-message error"; return; }
    await MP.flush();
    const r = await MP.api("GET", "/api/conta/exportar");
    if (!r.ok) { msg.textContent = (r.json && r.json.erro) || "Não foi possível baixar agora."; msg.className = "form-message error"; return; }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(r.json, null, 2)], { type: "application/json" }));
    a.download = "minha-plantinha-meus-dados.json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  el("btn-excluir-conta").addEventListener("click", async () => {
    const msg = el("config-conta-msg");
    if (MP.estado.tipo !== "conta") { msg.textContent = "No modo visitante não existe conta para excluir."; msg.className = "form-message error"; return; }
    const senha = el("config-senha-atual").value;
    if (!senha) { msg.textContent = "Digite sua senha atual no campo “Senha atual” para excluir a conta."; msg.className = "form-message error"; return; }
    if (!window.confirm("Excluir sua conta e TODOS os dados (plantinhas, fotos, diário, conquistas)? Isso não pode ser desfeito.")) return;
    const r = await MP.api("DELETE", "/api/conta", { senha });
    if (!r.ok) { msg.textContent = (r.json && r.json.erro) || "Não foi possível excluir a conta."; msg.className = "form-message error"; return; }
    el("config-senha-atual").value = "";
    await MP.encerrar(); resetarEstadoParaNamespace(false); aplicarEstadoCarregado();
    mostrarTela("tela-login"); mostrarToast("Conta e dados excluídos.");
  });

  /* ---------- Dados da versão antiga (localStorage deste navegador) ---------- */
  function lerLegado() {
    const dados = {};
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith("minhaPlantinha.") && !k.startsWith("minhaPlantinha.demo.")) dados[k] = window.localStorage.getItem(k);
      }
    } catch (_) { /* armazenamento bloqueado */ }
    return dados;
  }
  function apagarLegado() {
    try { Object.keys(lerLegado()).forEach(k => window.localStorage.removeItem(k)); Object.keys(window.localStorage).filter(k => k.startsWith("minhaPlantinha.demo.")).forEach(k => window.localStorage.removeItem(k)); } catch (_) { /* ignora */ }
  }
  function detectarLegado() {
    const tem = Object.keys(lerLegado()).length > 0;
    el("aviso-legado").hidden = !tem || MP.estado.tipo === "conta";
    el("btn-importar-legado").classList.toggle("escondido", !tem);
  }
  el("btn-importar-legado").addEventListener("click", async () => {
    if (MP.estado.tipo !== "conta") { mostrarToast("Entre na sua conta para importar."); return; }
    if (!window.confirm("Importar os dados salvos neste navegador pela versão antiga para a sua conta? Isso substitui os dados atuais da conta.")) return;
    const falhas = await aplicarDadosImportados(lerLegado());
    mostrarToast(falhas ? "Importado com avisos (" + falhas + " item(ns) recusado(s))." : "Dados antigos importados.");
    if (window.confirm("Apagar a cópia antiga deste navegador? (Recomendado: ela contém dados pessoais sem proteção.)")) apagarLegado();
    setTimeout(() => location.reload(), 1000);
  });

  /* ---------- Sessão expirada ---------- */
  window.addEventListener("mp:sessao-expirada", async () => {
    await MP.encerrar(); modoTesteAtivo = false; resetarEstadoParaNamespace(false); aplicarEstadoCarregado(); mostrarTela("tela-login");
  });

  /* ---------- Tela inicial: sessão válida no servidor ou login ---------- */
  async function iniciarApp() {
    const r = await MP.api("GET", "/api/auth/me");
    if (r.ok && r.json.autenticado) await entrarComConta(r.json.conta, r.json.admin === true);
    else if (r.json && r.json.etapa === "codigo") { mostrarTela("tela-login"); mostrarPassoCodigo(); }
    else mostrarTela("tela-login");
    detectarLegado();
  }
  window.addEventListener("load", iniciarApp);
})();
