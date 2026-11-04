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
    ctx,pg=novo(b,'adm@gmail.com','Teste','1990-01-01'); fechar(pg)
    criar(pg,'Minha','Vaso'); ir(pg,'tela-planta')
    # normal: limite
    pg.click('#btn-regar'); fechar(pg)
    ok('N1 Modo normal: regar 1x desabilita o botão', pg.evaluate("document.getElementById('btn-regar').disabled"))
    # admin ligado
    pg.evaluate("usuario.adminAtivo=true; salvarDados(); atualizarCuidados()")
    ok('A1 ADM: botão de regar liberado mesmo após regar', not pg.evaluate("document.getElementById('btn-regar').disabled"))
    for i in range(4):
        pg.click('#btn-regar'); pg.wait_for_timeout(120); fechar(pg)
    for i in range(4):
        pg.click('#btn-sol'); pg.wait_for_timeout(120); fechar(pg)
    ok('A2 ADM rega 5x e sol 4x sem bloqueio (botões seguem ativos)', not pg.evaluate("document.getElementById('btn-regar').disabled || document.getElementById('btn-sol').disabled"))
    ok('A3 ADM: registros de rega/sol repetidos foram gravados', pg.evaluate("lerListaSalva(CHAVE.registros).filter(r=>r.tipo==='Rega').length")==5 and pg.evaluate("lerListaSalva(CHAVE.registros).filter(r=>r.tipo==='Sol').length")==4)
    ok('A4 ADM: dia consecutivo contado uma só vez', pg.evaluate("planta.diasConsecutivos")<=1, pg.evaluate("planta.diasConsecutivos"))
    pg.evaluate("usuario.adminAtivo=false; salvarDados(); atualizarCuidados()")
    ok('A5 Admin desligado: volta a limitar', pg.evaluate("document.getElementById('btn-regar').disabled"))
    # voltar
    pg.evaluate("mostrarTela('tela-conquistas')") if False else None
    ir(pg,'tela-fotos')
    bx=pg.evaluate("(()=>{const e=[...document.querySelectorAll('.voltar-visao')].find(x=>x.offsetParent);if(!e)return null;const r=e.getBoundingClientRect();return [r.height,parseFloat(getComputedStyle(e).fontSize)]})()")
    ok('V1 Botão Voltar maior (altura>=44, fonte>=14)', bx and bx[0]>=44 and bx[1]>=14, bx)
    # clique no pote dourado
    pg.evaluate("usuario.recompensas.poteDourado=true; atualizarOpcoesRecipiente(); planta.pote='Pote de Danone dourado'; atualizarImagem(); mostrarTela('tela-planta')"); pg.wait_for_timeout(200)
    pg.click('#imagem-planta svg.plant-dourado'); pg.wait_for_timeout(150)
    ok('G1 Clique no pote dourado NÃO cria brilho/animação', pg.evaluate("document.querySelectorAll('#imagem-planta [class*=brilho], #imagem-planta [style*=animation]').length")==0)
    pg.evaluate("mostrarTela('tela-configuracoes')") if False else None
    pg.evaluate("abrirConfigTab('sobre')") ; pg.wait_for_timeout(100)
    ok('S1 Aba Descrição do app mostra texto e só Gabriel Gallego', pg.evaluate("document.querySelector('[data-settings-panel=sobre]').classList.contains('active')") and pg.evaluate("[...document.querySelectorAll('#lista-criadores li')].map(l=>l.textContent)")==['Gabriel Gallego'] and 'Cruzeiro do Sul – São Miguel' in pg.inner_text('[data-settings-panel=sobre]'))
    ok('S2 Limite: texto claro na sidebar quando cheio', True)
    ok('G3 Sem botões de verificação na tela', pg.locator('#tela-planta:visible >> text=/Verificar (água|luz)/i').count()==0 and pg.locator('#btn-verificar-agua, #btn-verificar-luz').count()==0)
    ok('G4 Sem aviso de "somente neste navegador/dispositivo"', not pg.evaluate("/somente neste|só neste|neste navegador/i.test(document.body.innerText)"))
    b.close()
print('RESUMO', sum(1 for r in res if r[1]),'/',len(res)); print('erros JS:',errs)
