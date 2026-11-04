import subprocess, os, time, sqlite3, json
from playwright.sync_api import sync_playwright
PORT=3223; URL=f'http://localhost:{PORT}'; DB='/tmp/mp_e2e2.sqlite'
for f in [DB,DB+'-wal',DB+'-shm']:
    if os.path.exists(f): os.remove(f)
env=dict(os.environ, PORT=str(PORT), DB_FILE=DB, RATE_AUTH_MAX='500', RATE_API_MAX='5000')
srv=subprocess.Popen(['node','server/index.js'],env=env,stdout=open('/tmp/e2e2.log','w'),stderr=subprocess.STDOUT,start_new_session=True)
time.sleep(3)
errs=[]; res=[]
def ok(n,c,extra=''):
    res.append(bool(c)); print(('PASS ' if c else 'FAIL ')+n+((' | '+str(extra)[:300]) if not c and extra else ''))
def fechar(pg):
    n=0
    while pg.evaluate("filaDeModais.length")>0 and n<40: pg.click('#btn-fechar-modal'); n+=1; pg.wait_for_timeout(30)
def criar(pg,nome,pote):
    pg.evaluate("abrirNovaPlanta()"); pg.click('.plant-choice')
    pg.locator('label:has(input[name="pote"][value="%s"])'%pote).click()
    pg.click('#btn-continuar-inicial'); pg.fill('#nome-planta',nome); pg.click('#btn-continuar-nome'); pg.click('#btn-finalizar'); pg.wait_for_timeout(500); fechar(pg)
def cnt(q):
    c=sqlite3.connect(DB); r=c.execute(q).fetchone()[0]; c.close(); return r
try:
  with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':1280,'height':900}); pg=ctx.new_page()
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('dialog',lambda d:d.accept())
    reqs=[]; pg.on('request',lambda r: reqs.append((r.method,r.url)) if '/api/' in r.url else None)
    # ---------- VISITANTE
    pg.goto(URL); pg.wait_for_timeout(700)
    antes=cnt('select (select count(*) from usuarios)+(select count(*) from dados)')
    pg.click('#btn-entrar-visitante'); pg.wait_for_timeout(200)
    ok('texto de explicacao', 'não serão salvos permanentemente' in pg.inner_text('#tela-visitante'))
    pg.click('#btn-visitante-continuar'); ok('exige data de nascimento', 'data de nascimento' in pg.inner_text('#erro-visitante').lower())
    pg.fill('#visitante-nascimento','2015-06-01'); pg.dispatch_event('#visitante-nascimento','change')
    ok('menor ve orientacao', pg.is_visible('#visitante-menor'))
    pg.click('#btn-visitante-continuar'); ok('menor exige adulto', 'adulto' in pg.inner_text('#erro-visitante').lower())
    pg.check('#visitante-responsavel'); pg.click('#btn-visitante-continuar'); pg.wait_for_timeout(500)
    ok('entrou como visitante', pg.evaluate("MP.estado.tipo")=='visitante' and pg.evaluate("usuario.nomeExibicao")=='Visitante')
    ok('faixa permanente', 'Modo visitante — seu progresso não será salvo.' in pg.inner_text('#faixa-visitante'))
    ok('sem admin', pg.evaluate("contaAdmin()") is False and not pg.is_visible('#settings-admin-tab'))
    criar(pg,'Teste Visita','Pote de Danone')
    pg.click('#btn-regar'); pg.wait_for_timeout(300); fechar(pg); pg.click('#btn-sol'); pg.wait_for_timeout(300); fechar(pg)
    pg.evaluate("adicionarRegistroDiario('Anotacao','nota do visitante')")
    ok('plantinha existe em memoria', pg.evaluate("plantas.length")==1)
    ok('nenhum localStorage', pg.evaluate("Object.keys(localStorage).filter(k=>k.startsWith('minhaPlantinha')).length")==0)
    pg.evaluate("mostrarTela('tela-conquistas')"); pg.evaluate("mostrarTela('tela-diario')"); pg.evaluate("mostrarTela('tela-calendario')"); pg.wait_for_timeout(200)
    ok('visitante nao chamou /api/dados', not any('/api/dados' in u or '/api/conta' in u or '/api/admin' in u for m,u in reqs), [r for r in reqs if 'dados' in r[1]])
    ok('banco intacto', cnt('select (select count(*) from usuarios)+(select count(*) from dados)')==antes)
    # forjar admin no navegador
    pg.evaluate("MP.estado.admin=true; usuario.adminAtivo=true")
    r=pg.evaluate("fetch('/api/admin/conquistas/liberar',{method:'POST',headers:{'Content-Type':'application/json','X-MP-CSRF':'1'},body:JSON.stringify({id:'tres-dias'})}).then(r=>r.status)")
    ok('forjar admin no navegador nao da acesso (servidor 403)', r==403, r)
    pg.evaluate("MP.estado.admin=false")
    pg.screenshot(path='/tmp/visitante.png')
    pg.click('#btn-visitante-sair'); pg.wait_for_timeout(600)
    ok('saiu: login e memoria limpa', pg.is_visible('#tela-login') and pg.evaluate("MP.estado.tipo")=='nenhuma' and pg.evaluate("plantas.length")==0 and pg.evaluate("usuario.nomeExibicao")=='' and not pg.is_visible('#faixa-visitante'))
    ok('estado persistido nenhum', cnt('select count(*) from dados')==0)
    # visitante -> criar conta
    pg.click('#btn-entrar-visitante'); pg.fill('#visitante-nascimento','1990-01-01'); pg.click('#btn-visitante-continuar'); pg.wait_for_timeout(300)
    pg.click('#btn-visitante-criar-conta'); pg.wait_for_timeout(500)
    ok('criar conta leva ao cadastro sem dados do visitante', pg.is_visible('#tela-cadastro') and pg.evaluate("plantas.length")==0)
    # ---------- CADASTRO ADULTO + persistência
    pg.fill('#cadastro-email','ana@teste.com'); pg.fill('#cadastro-senha','segredo1'); pg.fill('#cadastro-nome','Ana'); pg.fill('#cadastro-nascimento','1990-01-01')
    pg.click('#btn-cadastrar'); pg.wait_for_timeout(1200)
    ok('cadastro entrou', pg.evaluate("MP.estado.tipo")=='conta' and pg.is_visible('#tela-inicial'))
    criar(pg,'Minha','Vaso'); pg.click('#btn-regar'); pg.wait_for_timeout(300); fechar(pg)
    pg.wait_for_timeout(1500)
    ok('dados no servidor', cnt("select count(*) from dados where chave='plantas'")==1)
    pg.reload(); pg.wait_for_timeout(1500)
    ok('sessao retomada apos recarregar', pg.evaluate("MP.estado.tipo")=='conta' and pg.evaluate("planta.nome")=='Minha' and pg.is_visible('#tela-planta'))
    ok('senha nao esta no navegador', pg.evaluate("usuario.senha")=='' and 'argon2' not in json.dumps(pg.evaluate("Object.fromEntries(Object.entries(localStorage))")))
    # sair e logar
    pg.evaluate("mostrarTela('tela-configuracoes')"); pg.evaluate("abrirConfigTab('conta')")
    ok('usuario comum sem aba admin', not pg.is_visible('#settings-admin-tab'))
    pg.click('#btn-sair'); pg.wait_for_timeout(800)
    ok('tela de saida', pg.is_visible('#tela-fim') and pg.evaluate("plantas.length")==0)
    pg.click('#btn-voltar-login-fim'); pg.fill('#login-email','ana@teste.com'); pg.fill('#login-senha','errada'); pg.click('#btn-login'); pg.wait_for_timeout(500)
    ok('senha errada', 'incorretos' in pg.inner_text('#erro-login'))
    pg.fill('#login-senha','segredo1'); pg.click('#btn-login'); pg.wait_for_timeout(1500)
    ok('login normal recupera plantinha', pg.evaluate("planta.nome")=='Minha')
    # ---------- ADMIN completo pela interface
    pg.click('#btn-sair') if False else None
    pg.evaluate("encerrarSessao()"); pg.wait_for_timeout(600); pg.click('#btn-voltar-login-fim')
    pg.fill('#login-email','adm@gmail.com'); pg.fill('#login-senha','123456'); pg.click('#btn-login'); pg.wait_for_timeout(600)
    pg.fill('#login-codigo','2324'); pg.click('#btn-login-codigo'); pg.wait_for_timeout(1500)
    ok('admin entrou', pg.evaluate("contaAdmin()"))
    criar(pg,'Planta Admin','Vaso')
    pg.evaluate("mostrarTela('tela-configuracoes')"); pg.evaluate("abrirConfigTab('admin')"); pg.wait_for_timeout(200)
    ok('painel admin visivel', pg.is_visible('#settings-admin-panel'))
    pg.locator('label:has(#admin-ativado)').click(); pg.click('#btn-salvar-admin'); pg.wait_for_timeout(700)
    ok('modo admin ativo', pg.evaluate("usuario.adminAtivo")==True)
    pg.evaluate("mostrarTela('tela-planta')"); pg.wait_for_timeout(300)
    ok('avancar tempo visivel', pg.is_visible('#admin-tempo-panel'))
    pg.click('#btn-avancar-tempo'); pg.wait_for_timeout(500); fechar(pg)
    # liberar conquistas ate o pote dourado
    ids=pg.evaluate("CONQUISTAS.filter(c=>!c.especial&&!c.indisponivel).map(c=>c.id)")
    for i in ids: pg.evaluate("liberarConquistaAdmin(%s)"%json.dumps(i)); pg.wait_for_timeout(120); fechar(pg)
    pg.wait_for_timeout(1500)
    ok('conquistas liberadas pelo servidor', cnt("select count(*) from dados where chave='conquistasMeta'")>=1)
    pg.evaluate("verificarConquistas()"); pg.wait_for_timeout(500); fechar(pg)
    ok('pote dourado liberado pela regra existente', pg.evaluate("usuario.recompensas.poteDourado")==True)
    pg.evaluate("mostrarTela('tela-conquistas')"); pg.wait_for_timeout(300)
    pg.screenshot(path='/tmp/admin_conquistas.png')
    # aplicar pote dourado
    pg.evaluate("mostrarTela('tela-configuracoes')"); pg.evaluate("abrirConfigTab('planta')"); pg.wait_for_timeout(200)
    pg.evaluate("(()=>{planta.pote='Pote de Danone dourado';salvarDados();atualizarTelaPlanta();mostrarTela('tela-planta')})()"); pg.wait_for_timeout(1200)
    ok('server aceitou pote dourado', 'dourado' in str(cnt("select count(*) from dados where valor like '%Pote de Danone dourado%'")) or cnt("select count(*) from dados where valor like '%Pote de Danone dourado%'")>=1)
    pg.locator('#imagem-planta').screenshot(path='/tmp/planta_dourada.png')
    ok('sem agua no pote dourado (nenhuma referencia a faixa/onda)', pg.evaluate("document.getElementById('imagem-planta').innerHTML.includes('-band)')") is False)
    b.close()
finally:
    os.killpg(os.getpgid(srv.pid),9)
print('erros de pagina:',errs)
print('RESUMO',sum(res),'/',len(res))
