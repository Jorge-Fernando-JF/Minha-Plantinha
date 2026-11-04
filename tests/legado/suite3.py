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
    # ===== conta comum: tópicos, pote dourado bloqueado =====
    ctx,pg=novo(b,'bia@teste.com','Bia','1992-02-02'); criar(pg,'Planta da Bia','Pote de Danone')
    ok('P0 Antes da coleção, opção de pote dourado não existe na criação nem nas configurações', pg.locator('input[name="pote"][value="Pote de Danone dourado"]').count()==0 and pg.evaluate("!Array.from(document.getElementById('config-pote').options).some(o=>/dourado/.test(o.value))"))
    pg.evaluate("draftPlant={semente:'Feijão',pote:'Pote de Danone dourado'}; document.getElementById('nome-planta').value='Hack'; plantas.length=plantas.length; finalizarNovoCultivo()"); fechar(pg)
    ok('P0b Criar planta com pote dourado sem desbloquear é recusado', pg.evaluate("plantas.length")==1)
    pg.evaluate("document.getElementById('config-pote').insertAdjacentHTML('beforeend','<option value=\"Pote de Danone dourado\">x</option>')"); pg.evaluate("mostrarTela('tela-configuracoes')")
    pg.evaluate("document.getElementById('config-pote').value='Pote de Danone dourado'; salvarPlantaConfiguracao()"); fechar(pg)
    ok('P0c Forçar pote dourado nas configurações sem desbloquear é recusado', pg.evaluate("!/dourado/i.test(planta.pote)") and 'ainda não foi liberado' in pg.inner_text('#config-planta-msg'))
    # tópicos
    n=pg.evaluate("(()=>{const f=GUIA.flatMap(g=>g.topicos||g.itens||[g]).filter(t=>t&&t.secoes);window._tops=f;return f.length})()")
    pg.evaluate("abrirTopico(_tops[0]);abrirTopico(_tops[1])"); fechar(pg)
    ok('E1c 2 tópicos lidos: Curioso por Natureza ainda bloqueado', n>=3 and pg.evaluate("!conquistas.includes('curioso-por-natureza')"), n)
    pg.evaluate("abrirTopico(_tops[1])"); fechar(pg)
    ok('E1c2 Reabrir o mesmo tópico não conta como outro', pg.evaluate("!conquistas.includes('curioso-por-natureza')"))
    pg.evaluate("abrirTopico(_tops[2])"); fechar(pg)
    ok('E1c3 3 tópicos distintos desbloqueiam Curioso por Natureza', pg.evaluate("conquistas.includes('curioso-por-natureza')"))
    # perfil: adulta
    pg.evaluate("mostrarTela('tela-configuracoes')"); pg.wait_for_timeout(100)
    ok('H1a Maior de idade vê a opção de fotografia de perfil', pg.is_visible('#perfil-foto-bloco'))
    pg.set_input_files('#perfil-foto-input','doc.txt'); pg.wait_for_timeout(200)
    ok('H2a Tipo de arquivo inválido é recusado', 'JPG, PNG' in pg.inner_text('#perfil-foto-msg') and pg.evaluate("!usuario.fotoPerfil"))
    pg.set_input_files('#perfil-foto-input','grande.png'); pg.wait_for_timeout(200)
    ok('H2b Arquivo acima de 3 MB é recusado', '3 MB' in pg.inner_text('#perfil-foto-msg'))
    pg.set_input_files('#perfil-foto-input','f1.png'); pg.wait_for_timeout(500)
    ok('H1b Prévia aparece antes de confirmar (ainda não salva)', pg.is_visible('#btn-perfil-confirmar') and pg.evaluate("!usuario.fotoPerfil") and pg.locator('#perfil-foto-preview img').count()==1)
    pg.click('#btn-perfil-cancelar'); ok('H1c Cancelar descarta a prévia', pg.evaluate("!usuario.fotoPerfil") and not pg.is_visible('#btn-perfil-confirmar'))
    pg.set_input_files('#perfil-foto-input','f1.png'); pg.wait_for_timeout(500); pg.click('#btn-perfil-confirmar'); pg.wait_for_timeout(150)
    ok('H1d Confirmar salva e exibe a foto no perfil (sidebar) e nas configurações', pg.evaluate("usuario.fotoPerfil.startsWith('data:image/jpeg')") and pg.locator('.profile-avatar img').count()==1 and pg.locator('#perfil-foto-preview img').count()==1)
    pg.reload(); pg.wait_for_timeout(400)
    ok('H1e Foto de perfil persiste após recarregar', pg.locator('.profile-avatar img').count()==1)
    pg.evaluate("mostrarTela('tela-configuracoes')"); pg.click('#btn-perfil-remover'); pg.wait_for_timeout(100)
    ok('H1f Remover foto volta ao espaço reservado', pg.evaluate("!usuario.fotoPerfil") and pg.locator('.profile-avatar img').count()==0 and pg.locator('.profile-avatar svg').count()==1)
    # idade exata
    r=pg.evaluate("""(()=>{const hoje=new Date();const f=d=>d.toISOString().slice(0,10);
      const fez18=new Date(hoje.getFullYear()-18,hoje.getMonth(),hoje.getDate());
      const amanha=new Date(hoje.getFullYear()-18,hoje.getMonth(),hoje.getDate()+1);
      const o=usuario.nascimento; const out=[];
      usuario.nascimento=f(fez18); out.push(maiorDeIdade());
      usuario.nascimento=f(amanha); out.push(maiorDeIdade());
      usuario.nascimento='2000-02-29'; out.push(maiorDeIdade()); usuario.nascimento=''; out.push(maiorDeIdade()); usuario.nascimento=o; return out;})()""")
    ok('H3 Idade considera dia/mês/ano: faz 18 hoje = sim; faz 18 amanhã = não; sem data = não', r==[True,False,True,False], r)
    ctx.close()
    # ===== menor de idade =====
    ctx,pg=novo(b,'leo@teste.com','Leo','2012-06-01',resp=True)
    criar(pg,'Planta do Leo','Vaso')
    pg.evaluate("mostrarTela('tela-configuracoes')"); pg.wait_for_timeout(100)
    ok('H4a Menor de 18: opção de foto de perfil não é exibida', not pg.is_visible('#perfil-foto-bloco'))
    pg.evaluate("""(async()=>{const bl=await (await fetch(document.querySelector('.brand-mark img')?.src||'data:image/png;base64,iVBORw0KGgo=')).blob().catch(()=>new Blob(['x'],{type:'image/png'}));escolherFotoPerfil(new File([bl],'a.png',{type:'image/png'}));})()"""); pg.wait_for_timeout(300)
    ok('H4b Menor: tentar enviar por script (sem usar a interface) é recusado', pg.evaluate("!usuario.fotoPerfil") and pg.evaluate("perfilPendente===''"))
    pg.evaluate("perfilPendente='data:image/jpeg;base64,AAAA'; confirmarFotoPerfil()")
    ok('H4c Menor: confirmar foto forçada não grava', pg.evaluate("!usuario.fotoPerfil"))
    pg.evaluate("usuario.fotoPerfil='data:image/jpeg;base64,AAAA'; salvarDados()"); pg.reload(); pg.wait_for_timeout(400)
    ok('H4d Menor: foto injetada no armazenamento é descartada ao carregar', pg.evaluate("!usuario.fotoPerfil") and pg.locator('.profile-avatar img').count()==0)
    ctx.close()
    # ===== administrador =====
    ctx,pg=novo(b,'adm@gmail.com','Teste','1985-01-01'); criar(pg,'Planta do ADM','Pote de Danone')
    pg.evaluate("mostrarTela('tela-conquistas')"); pg.wait_for_timeout(100)
    ok('F0 Admin sem ativar o modo: sem botões de liberar', pg.locator('.admin-liberar').count()==0)
    pg.evaluate("mostrarTela('tela-configuracoes')"); pg.click('#settings-admin-tab'); pg.check('#admin-ativado',force=True); pg.click('#btn-salvar-admin'); pg.wait_for_timeout(150)
    ok('F1 Modo administrador ativado pela interface', pg.evaluate("usuario.adminAtivo===true"))
    ir(pg,'tela-conquistas')
    total=pg.evaluate("CONQUISTAS.length"); abertas=pg.evaluate("conquistas.length")
    ok('F2 Todas as conquistas bloqueadas (secretas, educativas e "em breve") têm botão de liberar', pg.locator('.admin-liberar').count()==total-abertas, (pg.locator('.admin-liberar').count(),total,abertas))
    ok('F2b Admin vê o nome real de conquistas secretas para poder liberá-las', 'Pequeno Explorador' in pg.inner_text('#lista-secretas') and 'Secreta' in pg.inner_text('#lista-secretas'))
    # conquista normal
    pg.evaluate("for(let i=0;i<10;i++) registrarCliqueNomePlantinha()"); fechar(pg)
    pg.locator('.conquista-card[data-id="sete-dias"] .admin-liberar').click(); pg.wait_for_timeout(150)
    ok('F3 Liberar pelo botão desbloqueia imediatamente na conta', pg.evaluate("conquistas.includes('sete-dias')") and pg.evaluate("conquistasMeta['sete-dias'].origem")=='admin')
    ok('F3b Notificação (modal + aviso) informa que foi liberada', 'Conquista liberada' in pg.inner_text('#modal-titulo') and 'liberada pelo administrador' in pg.inner_text('#toast'))
    fechar(pg)
    est=pg.evaluate("({n:document.querySelector('.conquista-card[data-id=\"toque-persistente\"] .conquista-estado').textContent,a:document.querySelector('.conquista-card[data-id=\"sete-dias\"] .conquista-estado').textContent,b:document.querySelector('.conquista-card[data-id=\"dez-dias\"] .conquista-estado').textContent})")
    ok('F4 Interface diferencia conquistada normal, liberada por admin e bloqueada', est=={'n':'Conquistada','a':'Liberada pelo administrador','b':'Bloqueada'}, est)
    n0=pg.evaluate("conquistas.length")
    r=pg.evaluate("liberarConquistaAdmin('sete-dias')"); fechar(pg)
    ok('F5 Liberar de novo não duplica registro nem recompensa', r is False and pg.evaluate("conquistas.length")==n0 and pg.evaluate("conquistas.filter(c=>c==='sete-dias').length")==1)
    # secreta e educativa
    pg.evaluate("liberarConquistaAdmin('fotografo-botanico');liberarConquistaAdmin('amigo-da-agua')"); fechar(pg)
    ok('F6 Admin libera secreta e educativa', pg.evaluate("conquistas.includes('fotografo-botanico')&&conquistas.includes('amigo-da-agua')"))
    # em breve: libera mas não conta na coleção
    r0=pg.evaluate("resumoColecao()")
    pg.evaluate("liberarConquistaAdmin('reciclagem-recipientes')"); fechar(pg)
    r1=pg.evaluate("resumoColecao()")
    ok('F7 Conquista "em breve" liberada não entra no total da coleção', r1==r0 and pg.evaluate("conquistas.includes('reciclagem-recipientes')"), (r0,r1))
    # libera tudo menos uma regular
    faltam=pg.evaluate("CONQUISTAS.filter(c=>!c.especial&&!c.indisponivel&&!conquistas.includes(c.id)).map(c=>c.id)")
    for cid in faltam[:-1]: pg.evaluate("liberarConquistaAdmin('%s')"%cid)
    fechar(pg)
    ok('G6 Faltando 1 regular: Mestre e pote dourado continuam bloqueados', pg.evaluate("!conquistas.includes('mestre-da-minha-plantinha')") and pg.evaluate("!usuario.recompensas.poteDourado") and pg.evaluate("colecaoCompleta()")==False, faltam[-1])
    ok('G6b Opção do pote dourado ainda não aparece', pg.locator('input[name="pote"][value="Pote de Danone dourado"]').count()==0)
    pg.evaluate("liberarConquistaAdmin('%s')"%faltam[-1]); pg.wait_for_timeout(200)
    titulos=[]; classes=[]
    for _ in range(10):
        if not pg.evaluate("filaDeModais.length"): break
        titulos.append(pg.inner_text('#modal-titulo')); classes.append(pg.evaluate("document.getElementById('modal-conteudo').className+' confete='+document.querySelectorAll('.confete').length"))
        if 'dourados liberados' in titulos[-1]: pg.screenshot(path='gold_modal.png')
        pg.click('#btn-fechar-modal'); pg.wait_for_timeout(60)
    ok('G7 Completar a coleção libera Mestre automaticamente (sem depender de si mesma)', pg.evaluate("conquistas.includes('mestre-da-minha-plantinha')") and pg.evaluate("conquistasMeta['mestre-da-minha-plantinha'].origem")=='normal' and pg.evaluate("colecaoCompleta()"))
    ok('G8 Pote dourado liberado e salvo na conta', pg.evaluate("usuario.recompensas.poteDourado===true"))
    ok('G9 Notificação comemorativa: modal do Mestre + modal do pote dourado com animação', any('Mestre' in t or 'Conquista' in t for t in titulos) and any('potes dourados liberados' in t for t in titulos) and any('dourado' in c and 'confete=14' in c for c in classes), (titulos,classes))
    ok('G10 Sem duplicação: Mestre registrado uma vez; lista sem repetidos', pg.evaluate("conquistas.filter(c=>c==='mestre-da-minha-plantinha').length")==1 and pg.evaluate("new Set(conquistas).size===conquistas.length"))
    ir(pg,'tela-conquistas')
    ok('G11 Mestre aparece como conquistada com recompensa descrita', 'Mestre da Minha Plantinha' in pg.inner_text('#lista-conquistadas') and 'Recompensa: Pote de Danone dourado' in pg.inner_text('#lista-conquistadas'))
    # pote dourado utilizável
    ir(pg,'tela-configuracoes'); 
    ok('P0b Os DOIS potes liberados juntos (config e criação)', pg.evaluate("['Pote de Danone dourado','Pote de Terra de Ouro'].every(v=>Array.from(document.getElementById('config-pote').options).some(o=>o.value===v)&&!!document.querySelector('input[name=pote][value=\"'+v+'\"]'))"))
    ok('P1 Pote dourado aparece nas configurações', pg.evaluate("Array.from(document.getElementById('config-pote').options).some(o=>o.value==='Pote de Danone dourado')"))
    pg.evaluate("document.getElementById('config-pote').value='Pote de Danone dourado'; salvarPlantaConfiguracao()"); fechar(pg)
    ok('P2 Pote dourado aplicado à plantinha', pg.evaluate("planta.pote")=='Pote de Danone dourado')
    ir(pg,'tela-planta')
    ok('P3 Ilustração dourada estática e planta crescendo normalmente', pg.locator('#imagem-planta svg.plant-dourado').count()==1 and pg.locator('#imagem-planta .ouro-brilho').count()==0)
    for d in [0,1,3,7,10,15]:
        pg.evaluate("planta.diasConsecutivos=%d;atualizarImagem()"%d)
    pg.evaluate("planta.diasConsecutivos=10;atualizarImagem()"); pg.screenshot(path='gold_plant.png')
    pg.evaluate("planta.ultimaRegaEm=new Date().toISOString();atualizarImagem()")
    pg.reload(); pg.wait_for_timeout(400)
    ok('P5 Pote dourado e recompensa permanecem após recarregar (não precisa reconquistar)', pg.evaluate("planta.pote")=='Pote de Danone dourado' and pg.evaluate("usuario.recompensas.poteDourado")==True and pg.locator('#imagem-planta .ouro-brilho').count()==0)
    # nova conquista depois
    pg.evaluate("CONQUISTAS.push({id:'nova-futura',grupo:'cultivo',titulo:'Futura',descricao:'d',como:'c',condicao:()=>false});verificarConquistas()"); fechar(pg)
    ok('G12 Conquista nova entra na coleção; recompensa já recebida não é removida', pg.evaluate("colecaoCompleta()")==False and pg.evaluate("usuario.recompensas.poteDourado")==True and pg.evaluate("conquistas.includes('mestre-da-minha-plantinha')"))
    # criar nova planta com dourado pela interface
    pg.evaluate("abrirNovaPlanta()"); 
    ok('P6 Pote dourado disponível na criação de nova plantinha', pg.locator('input[name="pote"][value="Pote de Danone dourado"]').count()==1)
    pg.click('.plant-choice'); pg.locator('label:has(input[value="Pote de Danone dourado"])').click(); pg.click('#btn-continuar-inicial'); pg.fill('#nome-planta','Dourada'); pg.click('#btn-continuar-nome'); pg.click('#btn-finalizar'); pg.wait_for_timeout(300); fechar(pg)
    ok('P7 Criar 2ª plantinha já com o pote dourado', pg.evaluate("plantas.length")==2 and pg.evaluate("planta.pote")=='Pote de Danone dourado')
    pg.screenshot(path='gold_ui.png',full_page=True)
    ir(pg,'tela-conquistas'); pg.screenshot(path='adm_conq.png',full_page=True)
    ctx.close(); b.close()
print('\nRESUMO:', sum(1 for r in res if r[1]),'/',len(res)); print('erros JS:',errs)
json.dump(res,open('res3.json','w'))
