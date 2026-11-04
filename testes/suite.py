import json, base64, io, sys
from playwright.sync_api import sync_playwright
from PIL import Image
res=[]; errs=[]
def ok(nome, cond, extra=''):
    res.append((nome, bool(cond), extra)); print(('PASS ' if cond else 'FAIL ')+nome+(' | '+str(extra) if extra and not cond else ''))

def png(w=400,h=300,color=(30,140,60)):
    im=Image.new('RGB',(w,h),color); bio=io.BytesIO(); im.save(bio,'PNG'); return bio.getvalue()
open('foto1.png','wb').write(png()); open('foto2.png','wb').write(png(500,400,(200,120,40))); open('foto3.png','wb').write(png(300,300,(60,60,200)))
open('grande.png','wb').write(b'0'*10)
open('doc.txt','wb').write(b'x')

URL='file:///home/claude/v3/index.html'
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(viewport={'width':1280,'height':900})
    pg=ctx.new_page()
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.on('dialog',lambda d:d.accept())
    pg.goto(URL)
    # ---------- A. ILUSTRAÇÃO ----------
    pg.fill('#login-email','teste@gmail.com'); pg.fill('#login-senha','1234'); pg.click('#btn-login'); pg.wait_for_timeout(300)
    r=pg.evaluate("""() => { const out=[]; const box=document.createElement('div'); document.body.appendChild(box);
      for (const pote of ['Pote de Danone','Pote de Danone dourado','Vaso']) for (let e=0;e<6;e++) {
        box.innerHTML = desenharPlanta(e,'Feijão',pote,{});
        const svg=box.querySelector('svg'); const g=svg.querySelector('.planta-svg'); const bb=g.getBBox();
        const cx = pote==='Vaso'?180:190; const rx = pote==='Vaso'?76:69;
        const m=/translate\\((-?\\d+) /.exec(g.getAttribute('transform')||''); const off=m?+m[1]:0; const ctr=bb.x+off+bb.width/2; 
        out.push({pote,e,ctr:Math.round(ctr),min:Math.round(bb.x+off),max:Math.round(bb.x+off+bb.width),cx,rx, tr:g.getAttribute('transform')});
      } box.remove(); return out; }""")
    dan=[x for x in r if x['pote']=='Pote de Danone']; our=[x for x in r if 'dourado' in x['pote']]; vas=[x for x in r if x['pote']=='Vaso']
    ok('A1 Danone: planta centralizada (centro do desenho = centro do pote ±6px) em 6 etapas', all(abs(x['ctr']-x['cx'])<=6 for x in dan), dan)
    ok('A2 Danone: planta dentro da boca do pote (x entre bordas) em 6 etapas', all(x['min']>=x['cx']-x['rx'] and x['max']<=x['cx']+x['rx'] for x in dan), [(x['e'],x['min'],x['max']) for x in dan])
    ok('A3 Pote dourado: centralizado e dentro do pote', all(abs(x['ctr']-x['cx'])<=6 and x['min']>=x['cx']-x['rx'] and x['max']<=x['cx']+x['rx'] for x in our), our)
    ok('A4 Vaso tradicional continua centralizado e dentro', all(abs(x['ctr']-x['cx'])<=6 and x['min']>=x['cx']-x['rx'] and x['max']<=x['cx']+x['rx'] for x in vas), vas)
    gold=pg.evaluate("(()=>{const d=document.createElement('div');d.innerHTML=desenharPlanta(3,'Feijão','Pote de Danone dourado',{});return [!d.querySelector('.ouro-brilho'),d.innerHTML.includes('-gold')]})()")
    ok('A5 Pote dourado tem gradiente metálico e brilho estático', gold==[True,True], gold)
    # mobile
    pg.set_viewport_size({'width':390,'height':800}); pg.wait_for_timeout(150)
    w=pg.evaluate("(()=>{const s=document.querySelector('#imagem-planta svg').getBoundingClientRect();return [s.left>=0,s.right<=window.innerWidth, document.documentElement.scrollWidth<=window.innerWidth+1]})()")
    ok('A6 Mobile 390px: ilustração cabe na tela, sem rolagem horizontal', all(w), w)
    pg.screenshot(path='m_planta.png',full_page=True)
    pg.set_viewport_size({'width':1280,'height':900})

    # ---------- B. CONQUISTAS (usuário comum) ----------
    pg.evaluate("mostrarTela('tela-conquistas')"); pg.wait_for_timeout(100)
    ok('B1 Usuário comum não vê botões administrativos', pg.locator('.admin-liberar').count()==0)
    r=pg.evaluate("liberarConquistaAdmin('primeiro-cuidado')")
    ok('B2 Usuário comum não consegue liberar chamando a função (validação no código)', r is False and pg.evaluate("!conquistas.includes('primeiro-cuidado')"))
    # secretas ocultas
    t=pg.inner_text('#lista-secretas')
    ok('B3 Conquistas secretas aparecem ocultas', 'Conquista oculta' in t and 'Pequeno Explorador' not in t)
    ok('B4 Conquista Em breve aparece em seção própria e não conta na coleção', pg.evaluate("!document.getElementById('secao-breve').hidden") and pg.evaluate("resumoColecao().total")==pg.evaluate("CONQUISTAS.filter(c=>!c.indisponivel).length"))
    # jogos reais: quiz completo acertando tudo
    pg.evaluate("mostrarTela('tela-jogos')"); pg.click('#game-start')
    def fechar():
        while pg.evaluate("filaDeModais.length")>0:
            pg.click('#btn-fechar-modal')
    def jogar(acertar_todas=True, erradas=()):
        n=pg.evaluate("perguntasJogos[jogoAtual].length")
        for i in range(n):
            cor=pg.evaluate("perguntasJogos[jogoAtual][perguntaAtual].correta")
            idx=cor if (acertar_todas and i not in erradas) else (cor+1)%pg.locator('.game-option').count()
            fechar(); pg.locator('.game-option').nth(idx).click(); fechar()
            pg.locator('#game-area button.botao').click()
        fechar()
    ok('B5 Ao iniciar: só "Primeira partida" desbloqueia; acerto e conclusão ainda não', pg.evaluate("conquistas.includes('jogo-iniciado') && !conquistas.includes('primeiro-acerto') && !conquistas.includes('jogo-concluido')"))
    jogar()
    ids=pg.evaluate("conquistas")
    for cid in ['jogo-iniciado','jogo-concluido','primeiro-acerto','partida-perfeita','acertos-5','sequencia-5','desafio-germinacao']:
        ok('B6 Quiz perfeito desbloqueia '+cid, cid in ids)
    ok('B7 Ainda NÃO: todos-os-jogos, acertos-10, amigo-da-agua, olho-na-luz (dependem de outros jogos/perguntas)', not any(x in ids for x in ['todos-os-jogos','melhorou-resultado','acertos-10','amigo-da-agua','olho-na-luz']))
    # reiniciar quiz errando 1 -> não melhora; depois melhora
    fechar(); pg.click('[data-game="partes"]'); jogar(); fechar(); pg.click('[data-game="cuidados"]'); jogar()
    ids=pg.evaluate("conquistas")
    ok('B8 Concluir os 3 jogos desbloqueia todos-os-jogos, acertos-10, amigo-da-agua e olho-na-luz', all(x in ids for x in ['todos-os-jogos','acertos-10','amigo-da-agua','olho-na-luz']))
    # melhorar: partida pior depois melhor
    fechar(); pg.click('[data-game="quiz"]'); jogar(True, erradas=(0,)); 
    ok('B9 Resultado pior não conta como melhora', 'melhorou-resultado' not in pg.evaluate("conquistas"))
    fechar(); pg.click('[data-game="quiz"]'); jogar(True); 
    ok('B10 Melhorar o resultado anterior desbloqueia conquista', 'melhorou-resultado' in pg.evaluate("conquistas"))
    ok('B11 Tema reciclagem não é desbloqueável (conteúdo inexistente)', pg.evaluate("!conquistas.includes('reciclagem-recipientes')"))
    b.close()
print('\nRESUMO:', sum(1 for r in res if r[1]),'/',len(res)); print('erros JS:',errs)
json.dump(res,open('res1.json','w'))
