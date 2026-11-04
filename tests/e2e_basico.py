import subprocess, os, time, sys, json
from playwright.sync_api import sync_playwright
PORT=3222; URL=f'http://localhost:{PORT}'
env=dict(os.environ, PORT=str(PORT), DB_FILE='/tmp/mp_e2e.sqlite', RATE_AUTH_MAX='500', RATE_API_MAX='5000')
for f in ['/tmp/mp_e2e.sqlite','/tmp/mp_e2e.sqlite-wal','/tmp/mp_e2e.sqlite-shm']:
    if os.path.exists(f): os.remove(f)
srv=subprocess.Popen(['node','server/index.js'],env=env,stdout=open('/tmp/e2e.log','w'),stderr=subprocess.STDOUT,start_new_session=True)
time.sleep(3)
errs=[]; csp=[]; res=[]
def ok(n,c,extra=''):
    res.append(c); print(('PASS ' if c else 'FAIL ')+n+((' | '+str(extra)[:250]) if not c and extra else ''))
try:
  with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':1280,'height':900}); pg=ctx.new_page()
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.on('console',lambda m: csp.append(m.text) if m.type=='error' else None)
    pg.on('dialog',lambda d:d.accept())
    pg.goto(URL); pg.wait_for_timeout(800)
    ok('login visivel', pg.is_visible('#tela-login'))
    ok('botao visitante', pg.is_visible('#btn-entrar-visitante'))
    # pote dourado
    html=pg.evaluate("desenharPlanta(3,'Feijão','Pote de Danone dourado',{})")
    pg.evaluate("h=>{const d=document.createElement('div');d.id='tt';d.style.cssText='position:fixed;left:0;top:0;width:360px;background:#fff;z-index:9999';d.innerHTML=h;document.body.appendChild(d)}",html)
    pg.locator('#tt').screenshot(path='/tmp/ouro_novo.png')
    pg.evaluate("document.getElementById('tt').remove()")
    html=pg.evaluate("desenharPlanta(3,'Feijão','Pote de Danone',{})")
    pg.evaluate("h=>{const d=document.createElement('div');d.id='tt';d.style.cssText='position:fixed;left:0;top:0;width:360px;background:#fff;z-index:9999';d.innerHTML=h;document.body.appendChild(d)}",html)
    pg.locator('#tt').screenshot(path='/tmp/danone_normal.png')
    pg.evaluate("document.getElementById('tt').remove()")
    # admin por UI
    pg.fill('#login-email','adm@gmail.com'); pg.fill('#login-senha','123456'); pg.click('#btn-login'); pg.wait_for_timeout(700)
    ok('passo codigo aparece', pg.is_visible('#login-passo-codigo'))
    ok('ainda nao entrou', not pg.evaluate("document.body.classList.contains('app-mode')"))
    pg.fill('#login-codigo','0000'); pg.click('#btn-login-codigo'); pg.wait_for_timeout(500)
    ok('codigo errado nega', 'incorreto' in pg.inner_text('#erro-login').lower(), pg.inner_text('#erro-login'))
    pg.fill('#login-codigo','2324'); pg.click('#btn-login-codigo'); pg.wait_for_timeout(1200)
    ok('entrou admin', pg.evaluate("document.body.classList.contains('app-mode')") and pg.evaluate("contaAdmin()"))
    ok('aba admin visivel', pg.is_visible('#settings-admin-tab'))
    pg.screenshot(path='/tmp/admin_home.png')
    b.close()
finally:
    os.killpg(os.getpgid(srv.pid),9)
print('erros de pagina:',errs); print('console errors:',csp[:8])
print('RESUMO',sum(res),'/',len(res))
