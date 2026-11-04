# 🌱 Minha Plantinha

**Minha Plantinha** é um aplicativo web educativo em que crianças cuidam de uma planta virtual, aprendem sobre botânica e sustentabilidade e desbloqueiam conquistas pelo caminho. Ele transforma o cuidado diário com a planta em uma forma divertida de aprender sobre o meio ambiente.

## Funcionalidades

- **Cuidados com a planta:** crie uma plantinha (o feijão é o exemplo inicial), faça os cuidados do dia, como regar e observar a luz, e acompanhe o crescimento ao longo do tempo.
- **Progresso e calendário:** veja as etapas de crescimento da planta e o registro dos dias de cuidado.
- **Lembretes:** avisos para não esquecer de cuidar da plantinha.
- **Diário e fotos:** escreva no diário e guarde um registro em fotos do desenvolvimento da planta.
- **Jornal:** artigos e curiosidades educativas sobre a natureza.
- **Guia da planta:** lições curtas sobre germinação, partes da planta, fotossíntese, água e luz, solo, compostagem, biodiversidade e cultivo sustentável.
- **Jogos educativos:** quiz ambiental e os desafios "Monte sua planta" e "Cuide da planta".
- **Conquistas:** mais de 30 medalhas para desbloquear ao cuidar, aprender e explorar.
- **Modo visitante:** experimente o app na hora, sem criar conta. Nada é salvo.
- **Acessível e responsivo:** link para pular ao conteúdo, foco visível no teclado e layout que funciona no celular.

## Tecnologias

- **Frontend:** HTML, CSS e JavaScript puro, servidos a partir de `public/`
- **Backend:** Node.js (Express) com SQLite

## Estrutura do projeto

```
public/   # o site (HTML, CSS, JS)
server/   # API, banco de dados e segurança
tests/    # testes do backend e do navegador
```

---

# Minha Plantinha v5 — backend seguro (Express + SQLite)

## Como rodar
```bash
npm install          # instala e cria o .env de desenvolvimento (npm run setup)
npm start            # http://localhost:3000
npm test             # 13 testes de segurança do backend
python3 tests/e2e_fluxos.py   # testes no navegador (precisa de Playwright)
```
O site é servido **somente** da pasta `public/`. Servidor, banco (`data/`) e `.env` ficam fora dela.

## Conta administrativa de teste
- Criada automaticamente na 1ª inicialização (`server/provisionar.js`), de forma idempotente: se já existe, nada muda (nem a senha alterada depois).
- Valores de desenvolvimento ficam só no `.env` local (gerado por `npm run setup`, fora do Git): `adm@gmail.com` / `123456` / código `2324`, nick `Teste`.
- Login: e-mail + senha → servidor pede o código → só então abre a sessão administrativa. Senha e código são guardados com **Argon2id + pepper** (segredo do servidor).
- Erros no código: bloqueio progressivo (3 erros → 60 s, dobrando até 1 h); 5 erros encerram a etapa; eventos registrados sem senha/código.
- Trocar senha/código: `ADMIN_NEW_PASSWORD='...' node server/admin-cli.js senha` e `ADMIN_NEW_CODE='...' node server/admin-cli.js codigo`.

## Produção (obrigatório)
Copie `.env.example` → `.env` e preencha: `NODE_ENV=production`, `SESSION_SECRET` e `HASH_PEPPER` (≥ 32 caracteres, `openssl rand -hex 32`), `PUBLIC_BASE_URL`, `TRUST_PROXY`, `SMTP_URL` (e-mail do responsável), HTTPS no proxy.
O admin só é criado se `ADMIN_SEED_ENABLED=true` com senha ≥ 12 e código ≥ 8 caracteres; credenciais fracas são recusadas. **Não use a conta de teste em produção.**
Se trocar o `HASH_PEPPER`, todas as senhas deixam de valer.

## Modo visitante
Botão "Entrar como visitante" → explicação → data de nascimento (só em memória) → apelido "Visitante". Sem cookie, sem conta, sem requisições a `/api/dados`; o servidor nem aceita gravar sem sessão. Faixa permanente "Modo visitante — seu progresso não será salvo.", botão "Sair do modo visitante" e convite para criar conta (sem transferir dados). Recarregar a página reinicia a demonstração. No modo visitante os cuidados podem ser repetidos (para ver a planta crescer).

## Menores de 18 anos
Cadastro exige e-mail do responsável; a conta fica "aguardando" até o responsável abrir o link e clicar em confirmar (token de uso único, 7 dias). Foto de perfil só para maiores de 18 (também no servidor). Conta e dados podem ser baixados/excluídos em Configurações → Minha conta.

## Dados antigos (versão sem backend)
Os dados ficavam no `localStorage` do navegador. Depois de entrar, use Configurações → Preferências → "Importar dados antigos deste navegador" (e apague a cópia antiga).