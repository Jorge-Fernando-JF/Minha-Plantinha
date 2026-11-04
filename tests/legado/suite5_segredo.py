import json, datetime
from playwright.sync_api import sync_playwright
res=[]; errs=[]
def ok(nome, cond, extra=''):
    res.append((nome, bool(cond), str(extra)[:300])); print(('PASS ' if cond else 'FAIL ')+nome+(' | '+str(extra)[:300] if (extra and not cond) else ''))
URL='file:///home/claude/v3/index.html'
def novo(b, email, nick, nasc, resp=False, w=1280):
    ctx=b.new_context(viewport={'width':w,'height':900}); pg=ctx.new_page()
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('dialog',lambda d:d.accept())
    pg.goto(URL); pg.click('#btn-ir-cadastro')
    pg.fill('#cadastro-email',email); pg.fill('#cadastro-senha','segredo1'); pg.fill('#cadastro-nome',nick); pg.fill('#cadastro-nascimento',nasc)
    if resp: pg.check('#cadastro-responsavel')
    pg.click('#btn-cadastrar'); pg.wait_for_timeout(500)
    return ctx,pg
def fechar(pg):
    pg.wait_for_timeout(80); n=0
    while pg.evaluate("filaDeModais.length")>0 and n<40:
        pg.click('#btn-fechar-modal'); n+=1; pg.wait_for_timeout(30)
def criar(pg, nome, pote):
    pg.evaluate("abrirNovaPlanta()"); pg.click('.plant-choice')
    pg.locator('label:has(input[name="pote"][value="%s"])'%pote).click()
    pg.click('#btn-continuar-inicial'); pg.fill('#nome-planta',nome); pg.click('#btn-continuar-nome'); pg.click('#btn-finalizar'); pg.wait_for_timeout(250); fechar(pg)
def ir(pg, tela): fechar(pg); pg.evaluate("mostrarTela('%s')"%tela); pg.wait_for_timeout(120); fechar(pg)


with sync_playwright() as p:
    b=p.chromium.launch()
    ctx,pg=novo(b,'ana@teste.com','Ana','1990-01-01'); fechar(pg)
    criar(pg,'Minha','Vaso'); pg.evaluate("mostrarTela('tela-configuracoes')"); pg.evaluate("abrirConfigTab('sobre')"); pg.wait_for_timeout(200)
    ok('X0 Antes: nenhum texto revela a conquista no Descrição do app', 'clique' not in pg.inner_text('[data-settings-panel=sobre]').lower() and pg.locator('.criador-item').count()==1)
    for i in range(10): pg.click('.criador-item')
    ok('X1 10 cliques contam e nada desbloqueia', pg.evaluate("usuario.stats.cliquesGabriel")==10 and not pg.evaluate("conquistas.includes('gabriel-gallego-secreto')") and pg.evaluate("filaDeModais.length")==0)
    pg.reload(); pg.wait_for_timeout(500)
    ok('X2 Contador persiste após recarregar', pg.evaluate("usuario.stats.cliquesGabriel")==10)
    pg.evaluate("mostrarTela('tela-configuracoes'); abrirConfigTab('sobre')")
    for i in range(10): pg.click('.criador-item')
    pg.wait_for_timeout(300)
    ok('X3 20º clique desbloqueia e mostra modal secreto', pg.evaluate("conquistas.includes('gabriel-gallego-secreto')") and pg.evaluate("document.getElementById('modal-conteudo').classList.contains('segredo')") and pg.locator('.segredo-particula').count()==28 and pg.locator('.segredo-raios').count()==1)
    pg.screenshot(path='segredo.png')
    n=pg.evaluate("filaDeModais.length")
    pg.click('#btn-fechar-modal'); fechar(pg)
    for i in range(5): pg.click('.criador-item')
    ok('X4 Não desbloqueia de novo ao continuar clicando', pg.evaluate("conquistas.filter(c=>c==='gabriel-gallego-secreto').length")==1 and pg.evaluate("filaDeModais.length")==0)
    pg.evaluate("mostrarTela('tela-conquistas')"); pg.wait_for_timeout(200)
    ok('X5 Aparece como conquistada na lista', 'Olhar de Descobridor' in pg.inner_text('#lista-conquistadas'))
    ctx2,pg2=novo(b,'bia@teste.com','Bia','1990-01-01'); fechar(pg2)
    pg2.evaluate("mostrarTela('tela-conquistas')"); pg2.wait_for_timeout(200)
    t=pg2.inner_text('body')
    ok('X6 Antes de desbloquear, não revela Gabriel/20 cliques/título', 'Olhar de Descobridor' not in t and 'Gabriel' not in t and '20 vezes' not in t)
    b.close()
print('RESUMO', sum(1 for r in res if r[1]),'/',len(res)); print('erros JS:',errs)
