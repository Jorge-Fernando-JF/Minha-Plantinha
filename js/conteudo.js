
const GUIA = [
    {
        id: "germinacao",
        emoji: "",
        titulo: "Como o feijão germina",
        resumo: "Entenda o que acontece desde a semente até o primeiro broto.",
        secoes: [
            { titulo: "1. A semente acorda", itens: ["Quando encontra água e temperatura adequada, a semente começa a absorver água.", "O embrião retoma suas atividades e a casca começa a se abrir."] },
            { titulo: "2. A raiz aparece primeiro", itens: ["A primeira estrutura visível costuma ser a raiz, que ajuda a fixar a muda e buscar água e sais minerais.", "Depois, o caule começa a crescer em direção à superfície."] },
            { titulo: "3. O broto chega à luz", itens: ["Quando o broto alcança a luz, as primeiras folhas começam a se abrir.", "A partir daí, a planta passa a depender cada vez mais da fotossíntese para produzir seu próprio alimento."] }
        ],
        curiosidade: "O feijão é ótimo para observar porque suas mudanças iniciais podem ser percebidas em pouco tempo, embora o ritmo varie com o clima e as condições do cultivo."
    },
    {
        id: "partes",
        emoji: "",
        titulo: "Partes da planta",
        resumo: "Conheça o trabalho da raiz, do caule, das folhas, das flores e dos frutos.",
        secoes: [
            { titulo: "Raiz", itens: ["Ajuda a fixar a planta e absorve água e sais minerais do ambiente.", "Algumas raízes também armazenam reservas, como acontece com a cenoura e a batata-doce."] },
            { titulo: "Caule e folhas", itens: ["O caule sustenta folhas e outras estruturas e participa do transporte de água e substâncias.", "As folhas são importantes para a fotossíntese e para as trocas gasosas com o ambiente."] },
            { titulo: "Flores, frutos e sementes", itens: ["Em muitas plantas, as flores participam da reprodução.", "Após a fecundação, o fruto pode se desenvolver e proteger as sementes."] }
        ],
        curiosidade: "Nem toda planta possui flores visíveis o tempo todo. Existem grupos de plantas com formas diferentes de reprodução."
    },
    {
        id: "fotossintese",
        emoji: "",
        titulo: "Fotossíntese",
        resumo: "Descubra como as folhas usam energia da luz para produzir açúcares.",
        secoes: [
            { titulo: "O que entra nesse processo?", itens: ["A planta utiliza água e dióxido de carbono como matérias-primas.", "A energia necessária vem da luz, capturada por pigmentos presentes nas folhas."] },
            { titulo: "O que é produzido?", itens: ["A fotossíntese produz açúcares que ajudam a fornecer energia e matéria para o crescimento.", "O processo também libera oxigênio para o ambiente."] },
            { titulo: "E no cultivo?", itens: ["A quantidade de luz adequada depende da espécie.", "Mais luz nem sempre significa melhor: algumas plantas se adaptam a ambientes de sombra ou meia-sombra."] }
        ],
        curiosidade: "A cor verde das folhas está relacionada à clorofila, um dos pigmentos que participa da captura de energia luminosa."
    },
    {
        id: "agua-luz",
        emoji: "",
        titulo: "Água e luz",
        resumo: "Aprenda a observar a planta antes de decidir quando regar e onde colocá-la.",
        secoes: [
            { titulo: "Nem toda planta bebe igual", itens: ["A necessidade de água varia conforme a espécie, o tamanho do recipiente, o substrato e o clima.", "Evite usar uma quantidade fixa de água para todas as plantas."] },
            { titulo: "Observe o recipiente", itens: ["Confira a umidade do substrato antes de regar novamente.", "Recipientes com drenagem ajudam a reduzir o excesso de água acumulada."] },
            { titulo: "Observe a luz", itens: ["Identifique se a espécie prefere sol direto, luz filtrada ou ambientes de sombra.", "Mudanças de local podem exigir adaptação gradual, especialmente em plantas sensíveis."] }
        ],
        curiosidade: "Uma folha murcha nem sempre significa falta de água: calor intenso, raízes prejudicadas e outras condições também podem causar esse sinal."
    },
    {
        id: "solo",
        emoji: "",
        titulo: "Solo e raízes",
        resumo: "Veja por que estrutura, drenagem e matéria orgânica fazem diferença.",
        secoes: [
            { titulo: "Um bom substrato", itens: ["Deve permitir entrada de ar, retenção adequada de água e desenvolvimento das raízes.", "A composição ideal depende da planta que será cultivada."] },
            { titulo: "Drenagem", itens: ["O excesso de água reduz os espaços de ar do substrato e pode prejudicar as raízes.", "Recipientes de cultivo geralmente precisam de saída para o excesso de água."] },
            { titulo: "Matéria orgânica", itens: ["Composto bem feito e matéria orgânica decomposta podem contribuir para a estrutura e a fertilidade do solo.", "Adubo em excesso também pode causar problemas; a quantidade adequada depende da cultura."] }
        ],
        curiosidade: "Um solo saudável abriga muitos organismos microscópicos e pequenos animais que participam da decomposição e da ciclagem de nutrientes."
    },
    {
        id: "compostagem",
        emoji: "",
        titulo: "Compostagem",
        resumo: "Transforme parte dos resíduos orgânicos em um recurso útil para o solo.",
        secoes: [
            { titulo: "O que acontece?", itens: ["Microrganismos decompositores transformam materiais orgânicos em um composto mais estável.", "A mistura precisa de equilíbrio, umidade e circulação de ar para funcionar bem."] },
            { titulo: "O que pode entrar?", itens: ["Restos vegetais e folhas secas são exemplos comuns de materiais compostáveis.", "Cada sistema de compostagem possui regras próprias sobre os materiais aceitos."] },
            { titulo: "Por que isso ajuda?", itens: ["A compostagem pode reduzir a quantidade de resíduos orgânicos enviados ao lixo.", "O composto final pode ser usado no solo quando estiver pronto e adequado ao cultivo."] }
        ],
        curiosidade: "Uma compostagem equilibrada tem vida própria: fungos, bactérias e pequenos organismos trabalham juntos durante a decomposição."
    },
    {
        id: "biodiversidade",
        emoji: "",
        titulo: "Biodiversidade",
        resumo: "Entenda como plantas, animais e outros seres vivos se relacionam.",
        secoes: [
            { titulo: "Mais do que variedade", itens: ["Biodiversidade inclui a variedade de espécies, genes e ecossistemas.", "Cada organismo participa de uma rede de relações com outros seres vivos e com o ambiente."] },
            { titulo: "Polinizadores", itens: ["Abelhas, borboletas e outros animais podem transportar pólen entre flores.", "A polinização ajuda muitas plantas a formar sementes e frutos."] },
            { titulo: "Como cuidar", itens: ["Evite retirar animais do ambiente sem necessidade.", "Cultivar diferentes espécies nativas e oferecer recursos como flores pode ajudar a biodiversidade local."] }
        ],
        curiosidade: "Uma pequena área com flores já pode oferecer alimento e abrigo para diferentes visitantes, dependendo da região e das espécies escolhidas."
    },
    {
        id: "residuos",
        emoji: "",
        titulo: "Cultivo e sustentabilidade",
        resumo: "Pequenas decisões no cultivo também podem ensinar sobre consumo e reaproveitamento.",
        secoes: [
            { titulo: "Reutilizar com segurança", itens: ["Recipientes limpos podem ganhar uma nova função quando forem adequados ao cultivo.", "Recipientes precisam permitir drenagem e não devem apresentar riscos para quem vai manuseá-los."] },
            { titulo: "Cuidar da água", itens: ["Evite desperdício e observe a necessidade real da planta antes de regar.", "Nunca use água com sabão ou produtos de limpeza diretamente no cultivo."] },
            { titulo: "Observar antes de descartar", itens: ["Folhas secas podem fazer parte do ciclo natural da planta.", "Antes de remover algo, observe se há sinais de crescimento, doença, praga ou mudança de ambiente."] }
        ],
        curiosidade: "Aprender a cultivar também é aprender a observar: quanto melhor você conhece sua planta, mais responsáveis podem ser suas decisões."
    }
];

const DICAS = [
    "Antes de regar, enfie o dedo 2 cm na terra. Se estiver úmida, espere mais um pouco.",
    "O melhor horário para regar é de manhã cedo ou no fim da tarde, quando o sol está fraco.",
    "Folhas amarelas muitas vezes significam excesso de água, e não falta.",
    "Gire o vaso de vez em quando: a planta cresce virada para a luz e ficaria torta.",
    "Limpe a poeira das folhas com um paninho úmido. Assim elas aproveitam melhor a luz.",
    "Aproveite a água da chuva para regar: as plantas adoram!",
    "A água usada para lavar frutas e legumes pode regar as plantas, desde que sem sabão.",
    "Plantas também descansam. Se ela crescer devagar no inverno, está tudo bem.",
    "Folhas que murcham ao meio-dia podem estar só com calor. Veja de novo no fim da tarde.",
    "As abelhas adoram flores amarelas, azuis e roxas. Que tal plantar uma?",
    "Restos de casca de banana, maçã e cenoura podem virar adubo.",
    "Um vaso sem furos acumula água e apodrece as raízes. Sempre faça furinhos!",
    "Cada planta tem seu tempo: o feijão brota rápido, mas uma árvore leva anos.",
    "Observe sua planta todos os dias: quem cuida percebe mudanças pequenas.",
    "Plantas em pote reutilizado ajudam você e o planeta ao mesmo tempo. ",
    "A luz do sol é a comida da planta: ela a transforma em energia pela fotossíntese.",
    "Evite regar em dias de chuva forte: a terra já pode estar bem molhada.",
    "Folhas novas costumam nascer no topo, de onde a planta cresce."
];

const MESES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const EMOJI_PLANTAS = {
    "Feijão": "",
    "Girassol": "",
    "Manjericão": "",
    "Quiabo": "",
    "Zínia": "",
    "Cebolinha": "",
    "Couve": "",
    "Salsinha": "",
    "Rabanete": "",
    "Alface": "",
    "Cenoura": "",
    "Rúcula": "",
    "Coentro": "",
    "Beterraba": "",
    "Ervilha": "",
    "Amor-perfeito": "",
    "Tomate": "",
    "Abóbora": "",
    "Milho": ""
};

const CALENDARIO = [
    ["Feijão", "Girassol", "Manjericão", "Quiabo", "Zínia", "Cebolinha"],
    ["Feijão", "Couve", "Salsinha", "Cebolinha", "Rabanete", "Manjericão"],
    ["Alface", "Cenoura", "Rúcula", "Coentro", "Beterraba", "Rabanete"],
    ["Alface", "Cenoura", "Coentro", "Ervilha", "Couve", "Amor-perfeito"],
    ["Alface", "Cenoura", "Ervilha", "Coentro", "Rúcula", "Amor-perfeito"],
    ["Alface", "Ervilha", "Cenoura", "Rúcula", "Cebolinha", "Salsinha"],
    ["Alface", "Rúcula", "Cenoura", "Beterraba", "Salsinha", "Coentro"],
    ["Girassol", "Tomate", "Manjericão", "Abóbora", "Zínia", "Rabanete"],
    ["Feijão", "Milho", "Girassol", "Tomate", "Abóbora", "Manjericão"],
    ["Feijão", "Milho", "Quiabo", "Abóbora", "Girassol", "Zínia"],
    ["Feijão", "Milho", "Quiabo", "Girassol", "Manjericão", "Cebolinha"],
    ["Feijão", "Quiabo", "Girassol", "Manjericão", "Cebolinha", "Zínia"]
];

const perguntasJogos = {
    quiz: [
        { pergunta: "Por que uma planta precisa de luz?", opcoes: ["Para substituir a água", "Para realizar a fotossíntese", "Para absorver sais minerais"], correta: 1, explicacao: "A luz fornece energia para a fotossíntese, processo em que a planta produz açúcares a partir de água e dióxido de carbono." },
        { pergunta: "Qual sinal ajuda a decidir se um vaso precisa de água?", opcoes: ["A data no calendário, sempre", "A cor do vaso", "A umidade do substrato e as necessidades da espécie"], correta: 2, explicacao: "O melhor indicador depende da espécie e das condições, mas observar a umidade do substrato é mais útil do que seguir uma regra fixa." },
        { pergunta: "Qual estrutura normalmente aparece primeiro na germinação do feijão?", opcoes: ["Raiz", "Fruto", "Flor"], correta: 0, explicacao: "A raiz embrionária, chamada radícula, costuma ser a primeira estrutura a emergir durante a germinação." },
        { pergunta: "O que a drenagem do vaso ajuda a evitar?", opcoes: ["O crescimento das raízes", "Acúmulo excessivo de água", "A entrada de luz nas folhas"], correta: 1, explicacao: "A drenagem permite que o excesso de água saia do recipiente e ajuda a manter ar disponível para as raízes." },
        { pergunta: "Qual atividade dos polinizadores ajuda muitas plantas?", opcoes: ["Impedir a formação de sementes", "Transformar pedra em solo", "Transportar pólen entre flores"], correta: 2, explicacao: "Animais como abelhas e borboletas podem transportar pólen e colaborar com a reprodução de muitas plantas." },
        { pergunta: "O que é compostagem?", opcoes: ["Mistura de plástico com terra", "Decomposição controlada de materiais orgânicos", "Queima de todo tipo de resíduo"], correta: 1, explicacao: "Na compostagem, microrganismos decompõem resíduos orgânicos e formam um material estável que pode ser útil ao solo." },
        { pergunta: "Por que uma única regra de rega não serve para todas as plantas?", opcoes: ["Porque todo vaso fica seco ao mesmo tempo", "Porque plantas não usam água", "Porque espécie, clima, recipiente e substrato mudam a necessidade de água"], correta: 2, explicacao: "A necessidade de água varia com a espécie e com as condições ambientais e do recipiente." },
        { pergunta: "O que representa biodiversidade?", opcoes: ["A existência de apenas uma espécie", "A variedade de seres vivos, genes e ecossistemas", "A ausência de relações entre os seres vivos"], correta: 1, explicacao: "Biodiversidade é a variedade de vida em diferentes níveis, incluindo espécies, diversidade genética e ecossistemas." }
    ],
    partes: [
        { pergunta: "Qual parte geralmente absorve água e sais minerais do solo?", opcoes: ["Flor", "Raiz", "Fruto"], correta: 1, explicacao: "As raízes ajudam na fixação da planta e absorvem água e sais minerais do ambiente." },
        { pergunta: "Qual estrutura sustenta folhas e participa do transporte de substâncias?", opcoes: ["Semente", "Caule", "Pétala"], correta: 1, explicacao: "O caule sustenta partes da planta e participa do transporte de água e outras substâncias." },
        { pergunta: "Onde a maior parte da fotossíntese acontece em muitas plantas?", opcoes: ["Nas raízes", "Nas folhas", "No fruto maduro"], correta: 1, explicacao: "As folhas possuem tecidos especializados e pigmentos que capturam energia luminosa." },
        { pergunta: "Qual estrutura pode proteger sementes após a fecundação em muitas plantas?", opcoes: ["Raiz", "Espinho", "Fruto"], correta: 2, explicacao: "Em angiospermas, o fruto se desenvolve a partir do ovário e geralmente envolve as sementes." },
        { pergunta: "Qual parte ajuda a planta a trocar gases com o ambiente?", opcoes: ["Semente seca", "Folha", "Raiz"], correta: 1, explicacao: "As folhas realizam trocas gasosas por meio de estruturas como os estômatos." },
        { pergunta: "Para que serve a semente?", opcoes: ["Substitui sempre as raízes", "Produz luz para a fotossíntese", "Abriga o embrião e ajuda na continuidade da planta"], correta: 2, explicacao: "A semente contém um embrião e estruturas de proteção e reserva que ajudam no início de uma nova planta." }
    ],
    cuidados: [
        { pergunta: "O solo parece seco na superfície. O que fazer primeiro?", opcoes: ["Deixar o vaso permanentemente cheio de água", "Verificar a umidade e considerar a espécie", "Regar sempre com a mesma quantidade"], correta: 1, explicacao: "A necessidade de água depende da planta e das condições. Observe antes de agir." },
        { pergunta: "Uma planta está recebendo sol muito forte e apresenta sinais de estresse. Qual atitude é mais cuidadosa?", opcoes: ["Retirar toda a luz por vários dias", "Ajustar a luminosidade gradualmente e observar a resposta", "Colocar imediatamente no sol mais forte"], correta: 1, explicacao: "Mudanças graduais e adequadas à espécie podem reduzir o estresse de plantas sensíveis." },
        { pergunta: "Por que o excesso de água pode ser prejudicial?", opcoes: ["Porque a água impede qualquer crescimento", "Porque toda planta precisa viver sem água", "Pode reduzir o ar disponível para as raízes e favorecer problemas"], correta: 2, explicacao: "Substratos encharcados podem reduzir o oxigênio disponível às raízes e favorecer problemas de saúde da planta." },
        { pergunta: "O que ajuda a manter o vaso mais seguro para o cultivo?", opcoes: ["Manter água acumulada no fundo", "Fechar todos os furos do recipiente", "Drenagem adequada e recipiente apropriado"], correta: 2, explicacao: "A drenagem ajuda a controlar o excesso de água e o recipiente deve ser compatível com a planta." },
        { pergunta: "Qual atitude ajuda a perceber problemas cedo?", opcoes: ["Ignorar qualquer mudança até a planta parar de crescer", "Observar folhas, solo e crescimento com frequência", "Mudar todos os cuidados diariamente"], correta: 1, explicacao: "Observações frequentes ajudam a perceber mudanças antes que elas se tornem grandes problemas." },
        { pergunta: "O que fazer antes de usar adubo?", opcoes: ["Misturar qualquer produto doméstico no solo", "Usar o máximo possível", "Verificar a necessidade da planta e seguir uma orientação adequada"], correta: 2, explicacao: "Adubação depende da planta, do solo e do produto. Excesso também pode prejudicar o cultivo." }
    ]
};


/* ================================================================
   PLANTIO PASSO A PASSO — um roteiro para cada recipiente
   (ilu = ilustração do passo: etapa 0-5 + opções do desenho)
   ================================================================ */
const TUTORIAIS = {
    danone: {
        titulo: "Plantando feijão no pote de Danone com algodão",
        resumo: "Um experimento simples para observar a germinação: o feijão, o algodão úmido e o pote transparente mostram a raiz crescendo.",
        passos: [
            { titulo: "Passo 1 — Preparar o pote", itens: ["Use um pote de iogurte limpo, sem resíduos de alimento.", "Retire completamente qualquer resto de iogurte e enxágue o recipiente.", "Peça ajuda a um adulto para fazer furos de drenagem no fundo, caso o experimento seja feito com excesso de água ou o pote vá receber substrato (terra) depois."], porque: "Resto de iogurte estraga rápido e favorece fungos e mau cheiro, que podem apodrecer a semente.", ilu: { etapa: 0, opcoes: { algodao: false, feijao: false, brilho: true } } },
            { titulo: "Passo 2 — Colocar o algodão", itens: ["Coloque uma quantidade suficiente de algodão limpo dentro do pote: uma camada fofa de cerca de 3 a 4 cm de altura.", "Acomode o algodão sem compactá-lo excessivamente.", "Ele deverá ficar úmido, mas não encharcado."], porque: "As fibras soltas guardam água e deixam o ar circular. Algodão muito apertado encharca e falta ar para a semente respirar.", ilu: { etapa: 0, opcoes: { feijao: false } } },
            { titulo: "Passo 3 — Colocar o feijão", itens: ["Coloque o feijão sobre o algodão, próximo à lateral do pote, para observar o desenvolvimento da raiz.", "Não enterre o feijão profundamente no algodão.", "Deixe uma parte do feijão visível para acompanhar a germinação."], porque: "A semente precisa de ar. Encostada na parede do pote, a raiz fica à vista quando começar a crescer.", ilu: { etapa: 0 } },
            { titulo: "Passo 4 — Umedecer o algodão", itens: ["Adicione água aos poucos, apenas o suficiente para umedecer o algodão (comece com poucas colheradas).", "Não deixe o feijão submerso em água.", "O excesso de água pode favorecer o apodrecimento do feijão e o surgimento de mofo."], porque: "A semente precisa absorver água para acordar, mas, sem ar, ela apodrece. O ponto certo é algodão úmido como uma esponja bem torcida.", ilu: { etapa: 0, opcoes: { gotas: true } } },
            { titulo: "Passo 5 — Escolher um local adequado", itens: ["Coloque o pote em um local iluminado, com luz indireta.", "Evite deixar o algodão secar completamente.", "Verifique a umidade diariamente."], porque: "Claridade ajuda o broto a se orientar, mas sol forte e direto aquece o pote e seca o algodão depressa.", ilu: { etapa: 0, opcoes: { sol: true } } },
            { titulo: "Passo 6 — Acompanhar o crescimento", itens: ["Observe e registre as mudanças no feijão (no Diário ou com fotos).", "A raiz geralmente começa a aparecer primeiro, seguida pelo desenvolvimento do caule e das primeiras folhas.", "O tempo de germinação varia de acordo com a temperatura, a umidade e a qualidade da semente. Em condições adequadas, o feijão pode começar a germinar em alguns dias, frequentemente entre 2 e 7 dias."], porque: "Cada planta tem seu ritmo. O que importa é registrar o que realmente acontece, e não comparar com uma data fixa.", ilu: { etapa: 2 } }
        ],
        aviso: "O algodão é adequado para observar a germinação, mas não fornece todos os nutrientes necessários para o crescimento prolongado da planta. Se o objetivo for manter o feijoeiro crescendo, será necessário transplantá-lo para um recipiente apropriado, com substrato (terra) e drenagem adequados.",
        diferenca: "Cultivo experimental com algodão x cultivo prolongado em terra: o algodão serve para ver a semente germinar e a raiz aparecer nos primeiros dias; a terra fornece nutrientes, sustenta a planta e permite que ela cresça por semanas. Por isso são métodos diferentes, não equivalentes."
    },
    vaso: {
        titulo: "Plantando feijão em vaso com terra",
        resumo: "O cultivo em terra serve para a planta crescer por mais tempo. A raiz fica escondida, então o que se observa é o broto saindo da terra.",
        passos: [
            { titulo: "Passo 1 — Preparar o vaso", itens: ["Use um vaso limpo, com furo de drenagem no fundo.", "Coloque um pratinho embaixo para recolher a água que escorrer."], porque: "A água precisa ter por onde sair. Vaso sem furo acumula água no fundo e apodrece a raiz.", ilu: { etapa: 0, pote: "Vaso", opcoes: { feijao: false, brilho: true } } },
            { titulo: "Passo 2 — Colocar a terra", itens: ["Use terra vegetal ou substrato de jardinagem.", "Encha até cerca de 2 cm abaixo da borda, sem compactar.", "Umedeça a terra antes de plantar."], porque: "A terra fornece nutrientes e sustenta a planta. O espaço até a borda evita que a água transborde ao regar.", ilu: { etapa: 0, pote: "Vaso", opcoes: { feijao: false } } },
            { titulo: "Passo 3 — Plantar o feijão", itens: ["Faça um buraco de 2 a 3 cm de profundidade com o dedo.", "Coloque o feijão, cubra com terra e pressione de leve."], porque: "Enterrado na medida certa, o feijão fica protegido, com umidade e ar. Fundo demais dificulta a saída do broto.", ilu: { etapa: 0, pote: "Vaso" } },
            { titulo: "Passo 4 — Regar", itens: ["Regue devagar, até sair um pouco de água pelo furo do fundo.", "Deixe escorrer e esvazie o pratinho.", "Nos dias seguintes, regue só quando a terra estiver seca a 2 cm de profundidade."], porque: "Terra encharcada tira o ar da raiz. Testar com o dedo é mais confiável do que regar por data fixa.", ilu: { etapa: 0, pote: "Vaso", opcoes: { gotas: true } } },
            { titulo: "Passo 5 — Escolher o local", itens: ["Deixe o vaso em um lugar bem iluminado, com várias horas de luz natural.", "Evite correntes fortes de vento."], porque: "O feijão faz fotossíntese para crescer: quanto mais luz adequada, mais ele se desenvolve.", ilu: { etapa: 0, pote: "Vaso", opcoes: { sol: true } } },
            { titulo: "Passo 6 — Acompanhar o crescimento", itens: ["O broto geralmente rompe a terra em alguns dias; o tempo varia com temperatura, umidade e qualidade da semente.", "Registre a altura e o surgimento das folhas.", "Como a raiz não aparece, observe a planta: cor das folhas e firmeza do caule contam como está o cultivo."], porque: "Em terra, a raiz cresce antes do broto aparecer, mas fica escondida.", ilu: { etapa: 2, pote: "Vaso" } }
        ],
        aviso: "Em vaso, o feijão pode crescer por semanas. Mesmo assim, o tempo de cada etapa varia com luz, temperatura e rega — use os dias do calendário apenas como referência.",
        diferenca: "Cultivo em terra x experimento com algodão: na terra a planta recebe nutrientes e pode crescer por muito tempo, mas a raiz não fica visível. No algodão a raiz aparece, mas só por poucos dias."
    }
};

/* ================================================================
   PLANO DE CUIDADOS (usado pelo calendário)
   dia   = dia do cultivo em que a tarefa aparece (0 = dia do plantio)
   cada  = repete a cada N dias, até o dia "ate"
   ref   = referência APROXIMADA (nunca uma data garantida)
   ================================================================ */
const FASES_CULTIVO = [
    { id: "plantio", nome: "Dia do plantio", de: 0, ate: 0 },
    { id: "primeiros", nome: "Primeiros dias", de: 1, ate: 3 },
    { id: "germinacao", nome: "Fase de germinação", de: 4, ate: 7 },
    { id: "crescimento", nome: "Fase de crescimento", de: 8, ate: 21 },
    { id: "manutencao", nome: "Manutenção", de: 22, ate: null }
];

const DIAS_PLANO = 60;

const PLANO_CUIDADOS = {
    danone: {
        nome: "Pote de Danone com algodão",
        fases: {
            plantio: "Hoje você monta o experimento. O que importa é deixar o pote limpo, o algodão fofo e úmido, e o feijão apoiado (não enterrado) perto da parede.",
            primeiros: "A semente está absorvendo água e acordando. Nada visível pode acontecer ainda. Cheque a umidade todos os dias e fique de olho em mofo.",
            germinacao: "A casca se abre e a raiz costuma ser a primeira a aparecer, seguida do caule. A semente usa as reservas guardadas nela mesma para crescer.",
            crescimento: "As primeiras folhas se abrem e a planta passa a fazer fotossíntese. O algodão não tem nutrientes: é a hora de pensar no transplante para a terra.",
            manutencao: "Se a planta continua crescendo, ela precisa de terra e drenagem. Mantenha a umidade certa e observe sinais de excesso de água, mofo ou folhas amareladas."
        },
        tarefas: [
            { id: "d-pote", dia: 0, titulo: "Preparar o pote", oQue: "Lave o pote de iogurte e enxágue até não sobrar nenhum resto. Se for usar terra depois, peça a um adulto para fazer furos de drenagem no fundo.", porque: "Resto de iogurte estraga e atrai fungos que podem apodrecer a semente.", ilu: { etapa: 0, opcoes: { algodao: false, feijao: false, brilho: true } } },
            { id: "d-algodao", dia: 0, titulo: "Colocar o algodão", oQue: "Coloque algodão limpo até formar uma camada fofa de cerca de 3 a 4 cm. Não aperte.", porque: "Fibras soltas guardam água e deixam o ar passar; algodão apertado encharca.", ilu: { etapa: 0, opcoes: { feijao: false } } },
            { id: "d-feijao", dia: 0, titulo: "Posicionar o feijão", oQue: "Apoie o feijão sobre o algodão, encostado na lateral do pote, com uma parte visível. Não enterre.", porque: "A semente precisa de ar, e encostada na parede você vai ver a raiz.", ilu: { etapa: 0 } },
            { id: "d-agua0", dia: 0, titulo: "Umedecer o algodão (umidade inicial)", oQue: "Adicione água aos poucos, algumas colheradas, até o algodão ficar úmido como uma esponja bem torcida. Não pode sobrar água no fundo nem cobrir o feijão.", porque: "A semente precisa absorver água para acordar; em excesso, ela apodrece.", ilu: { etapa: 0, opcoes: { gotas: true } } },
            { id: "d-local", dia: 0, titulo: "Escolher o local", oQue: "Deixe o pote em um lugar claro com luz indireta e anote a data do plantio.", porque: "Claridade ajuda o broto; sol forte e direto aquece o pote e seca o algodão.", ilu: { etapa: 0, opcoes: { sol: true } } },

            { id: "d-umidade", dia: 1, ate: 14, cada: 1, titulo: "Verificar a umidade do algodão", oQue: "Toque o algodão: deve estar úmido, sem pingar. Seco? Acrescente um pouco de água. Encharcado? Incline o pote e escorra o excesso.", porque: "Algodão seco interrompe a germinação; encharcado tira o ar da semente.", ilu: { etapa: 0, opcoes: { gotas: true } } },
            { id: "d-mofo", dia: 1, ate: 14, cada: 1, titulo: "Procurar sinais de mofo", oQue: "Olhe o feijão e o algodão: manchas brancas fofas, verdes ou pretas e cheiro azedo são sinais de mofo. Se aparecer, troque o algodão, lave o pote e, se a semente estiver mole ou escura, recomece com outra.", porque: "Umidade constante favorece fungos. Eles competem com a semente e podem apodrecê-la.", ilu: { etapa: 0 } },
            { id: "d-raiz1", dia: 2, titulo: "Registrar a primeira raiz", oQue: "Quando enxergar uma pontinha clara saindo do feijão, anote a data e fotografe. Se ainda não apareceu, não marque: continue observando e marque só quando acontecer.", ref: "Referência aproximada: costuma acontecer entre os dias 2 e 5, mas varia com temperatura, umidade e qualidade da semente.", porque: "A raiz é a primeira a sair: ela fixa a plantinha e absorve água.", ilu: { etapa: 1 } },

            { id: "d-raiz2", dia: 4, titulo: "Observar o crescimento da raiz", oQue: "Olhe pela parede do pote e meça a raiz com uma régua, em milímetros. Procure os pelinhos finos ao redor dela.", porque: "Os pelos absorventes aumentam a superfície que absorve água e sais minerais.", ilu: { etapa: 1 } },
            { id: "d-caule", dia: 5, titulo: "Acompanhar o surgimento do caule", oQue: "Quando o caule (geralmente curvado, em arco) começar a subir, registre a data e a altura aproximada.", ref: "Referência aproximada: costuma surgir entre os dias 4 e 8 depois da raiz.", porque: "O caule empurra o broto para cima, em direção à luz, usando a energia guardada na semente.", ilu: { etapa: 1 } },
            { id: "d-registro", dia: 6, titulo: "Registrar alterações visíveis", oQue: "Fotografe o pote e escreva no Diário: o tamanho da raiz e do caule, a cor e o que mudou desde o último registro.", porque: "Comparar registros mostra o ritmo real de crescimento da sua planta.", ilu: { etapa: 2 } },

            { id: "d-luz", dia: 8, titulo: "Conferir a iluminação", oQue: "Deixe o pote perto de uma janela bem clara. Caule muito comprido, fino e pálido indica falta de luz.", porque: "Sem luz suficiente a planta se estica procurando claridade e fica fraca.", ilu: { etapa: 2, opcoes: { sol: true } } },
            { id: "d-altura", dia: 8, ate: 20, cada: 3, titulo: "Medir a altura da planta", oQue: "Meça da base do caule até a ponta com uma régua e anote em centímetros.", porque: "A altura ao longo do tempo mostra a velocidade do crescimento.", ilu: { etapa: 2 } },
            { id: "d-folhas", dia: 9, titulo: "Observar as primeiras folhas", oQue: "Conte as folhas abertas, observe a cor e o formato e registre no Diário.", ref: "Referência aproximada: costumam aparecer entre os dias 7 e 14.", porque: "As folhas fazem a fotossíntese: transformam luz, água e gás carbônico em alimento.", ilu: { etapa: 3 } },
            { id: "d-transplante", dia: 10, titulo: "Avaliar o transplante para a terra", oQue: "Se a planta já tem as primeiras folhas e raízes de alguns centímetros, transplante com ajuda de um adulto para um vaso com terra e furos de drenagem. Segure pelas folhas ou pelo bloco de algodão, nunca apertando o caule.", ref: "Referência aproximada: entre os dias 7 e 14, dependendo do ritmo da planta.", porque: "O algodão só segura água; ele não tem os nutrientes que a planta precisa para continuar crescendo.", ilu: { etapa: 3, pote: "Vaso" } },
            { id: "d-prazo", dia: 14, titulo: "Rever: a planta já está na terra?", oQue: "Se ainda estiver no algodão, não adie mais o transplante. Raízes enroladas e folhas amarelando são sinais de que ela precisa de terra.", porque: "Sem nutrientes, a planta consome a reserva da semente e enfraquece.", ilu: { etapa: 4, pote: "Vaso" } },

            { id: "d-umid2", dia: 15, ate: DIAS_PLANO, cada: 2, titulo: "Verificar a umidade do recipiente", oQue: "No algodão, confira todos os dias (seca rápido). Já na terra, enfie o dedo 2 cm: se estiver seca, regue devagar até sair água pelo furo.", porque: "A necessidade de água muda com o calor, a luz e o tamanho da planta.", ilu: { etapa: 4, opcoes: { gotas: true } } },
            { id: "d-sinais", dia: 15, ate: DIAS_PLANO, cada: 3, titulo: "Observar folhas amareladas, mofo ou excesso de água", oQue: "Olhe as folhas e a superfície: folhas amareladas, algodão ou terra escura e com cheiro, mofo e água parada no fundo são sinais de alerta. Regue menos e melhore a drenagem e a ventilação.", porque: "Folha amarela pode indicar excesso de água, falta de nutrientes (comum no algodão) ou pouca luz.", ilu: { etapa: 4 } },
            { id: "d-recipiente", dia: 22, ate: DIAS_PLANO, cada: 7, titulo: "Verificar as condições do recipiente", oQue: "Veja se o pote ou vaso está limpo, sem rachaduras, com os furos de drenagem livres e sem água parada embaixo.", porque: "Um recipiente bem cuidado evita fungos e raízes apodrecidas.", ilu: { etapa: 5 } }
        ]
    },
    vaso: {
        nome: "Vaso com terra",
        fases: {
            plantio: "Hoje você prepara o vaso, a terra e planta o feijão a 2 ou 3 cm de profundidade. A raiz vai crescer escondida.",
            primeiros: "A semente está absorvendo água e a raiz começa a se formar sob a terra, onde você não enxerga. Verifique a umidade com o dedo.",
            germinacao: "O broto empurra a terra e aparece na superfície, ainda sem folhas completas. O ritmo depende de temperatura, umidade e qualidade da semente.",
            crescimento: "As folhas se abrem, a fotossíntese começa e a planta cresce mais depressa. Luz e rega equilibrada fazem diferença.",
            manutencao: "A planta já está estabelecida. Mantenha a rega equilibrada e observe folhas, terra e drenagem."
        },
        tarefas: [
            { id: "v-vaso", dia: 0, titulo: "Preparar o vaso", oQue: "Use um vaso limpo com furo de drenagem no fundo e coloque um pratinho embaixo.", porque: "A água precisa ter por onde sair, senão a raiz apodrece.", ilu: { etapa: 0, pote: "Vaso", opcoes: { feijao: false, brilho: true } } },
            { id: "v-terra", dia: 0, titulo: "Colocar a terra", oQue: "Use terra vegetal ou substrato. Encha até cerca de 2 cm abaixo da borda, sem compactar, e umedeça antes de plantar.", porque: "A terra dá nutrientes e sustenta a planta.", ilu: { etapa: 0, pote: "Vaso", opcoes: { feijao: false } } },
            { id: "v-plantar", dia: 0, titulo: "Posicionar o feijão", oQue: "Faça um buraco de 2 a 3 cm com o dedo, coloque o feijão, cubra e pressione de leve.", porque: "Na profundidade certa, a semente fica protegida e com ar.", ilu: { etapa: 0, pote: "Vaso" } },
            { id: "v-regar0", dia: 0, titulo: "Regar (umidade inicial) e escolher o local", oQue: "Regue devagar até sair um pouco de água pelo furo, deixe escorrer e coloque o vaso em um lugar bem iluminado.", porque: "A terra úmida (não encharcada) desperta a semente.", ilu: { etapa: 0, pote: "Vaso", opcoes: { gotas: true } } },

            { id: "v-umidade", dia: 1, ate: 10, cada: 1, titulo: "Verificar a umidade da terra", oQue: "Enfie o dedo 2 cm na terra: seca, regue devagar; úmida, espere. Esvazie o pratinho se tiver água parada.", porque: "Terra encharcada tira o ar da raiz; terra seca interrompe a germinação.", ilu: { etapa: 0, pote: "Vaso", opcoes: { gotas: true } } },
            { id: "v-mofo", dia: 2, ate: 14, cada: 2, titulo: "Observar sinais de mofo", oQue: "Se aparecerem manchas brancas fofas na terra, retire a camada afetada, regue menos e deixe o ambiente mais arejado.", porque: "Fungos aparecem quando há muita umidade e pouco ar.", ilu: { etapa: 0, pote: "Vaso" } },
            { id: "v-broto", dia: 4, titulo: "Registrar o broto rompendo a terra", oQue: "Quando o caule curvado aparecer na superfície, anote a data. Se ainda não apareceu, não marque: continue observando.", ref: "Referência aproximada: costuma acontecer entre os dias 4 e 10. A raiz já está crescendo, mas fica escondida na terra.", porque: "O caule em arco protege o broto enquanto empurra a terra.", ilu: { etapa: 1, pote: "Vaso" } },
            { id: "v-caule", dia: 6, titulo: "Acompanhar o caule", oQue: "Veja se o caule está firme e reto. Registre a altura aproximada e se os primeiros cotilédones (folhas iniciais grossas) já abriram.", porque: "Os cotilédones guardam o alimento que sustenta o broto no começo.", ilu: { etapa: 1, pote: "Vaso" } },
            { id: "v-registro", dia: 7, titulo: "Registrar alterações visíveis", oQue: "Fotografe o vaso e anote no Diário: altura, cor e o que mudou desde o último registro.", porque: "Comparar registros mostra o ritmo real da sua planta.", ilu: { etapa: 2, pote: "Vaso" } },

            { id: "v-luz", dia: 8, titulo: "Conferir a iluminação", oQue: "Veja se o vaso recebe várias horas de luz natural. Caule fino, comprido e pálido indica falta de luz.", porque: "Sem luz suficiente a planta estica e enfraquece.", ilu: { etapa: 2, pote: "Vaso", opcoes: { sol: true } } },
            { id: "v-altura", dia: 8, ate: 20, cada: 3, titulo: "Medir a altura da planta", oQue: "Meça da terra até a ponta e anote em centímetros.", porque: "A altura ao longo do tempo mostra a velocidade do crescimento.", ilu: { etapa: 2, pote: "Vaso" } },
            { id: "v-folhas", dia: 10, titulo: "Observar as primeiras folhas", oQue: "Conte as folhas abertas, veja a cor e o formato e registre.", ref: "Referência aproximada: as primeiras folhas verdadeiras costumam aparecer entre os dias 8 e 15.", porque: "As folhas fazem a fotossíntese e produzem alimento para a planta.", ilu: { etapa: 3, pote: "Vaso" } },
            { id: "v-umid2", dia: 11, ate: DIAS_PLANO, cada: 2, titulo: "Verificar a umidade da terra", oQue: "Teste com o dedo a 2 cm de profundidade antes de regar. Regue só quando estiver seca.", porque: "A necessidade de água muda com o calor e o tamanho da planta.", ilu: { etapa: 4, pote: "Vaso", opcoes: { gotas: true } } },
            { id: "v-suporte", dia: 14, titulo: "Avaliar se precisa de suporte", oQue: "Se o caule começar a se enrolar ou a tombar, coloque uma varinha ou cordão como apoio.", ref: "Referência aproximada: depende da variedade do feijão; nem toda variedade precisa de suporte.", porque: "Algumas variedades trepam e precisam de apoio para subir.", ilu: { etapa: 4, pote: "Vaso" } },

            { id: "v-sinais", dia: 15, ate: DIAS_PLANO, cada: 3, titulo: "Observar folhas amareladas, mofo ou excesso de água", oQue: "Olhe as folhas e a terra: folhas amarelas, terra escura com cheiro, mofo ou água parada no pratinho são sinais de alerta. Regue menos e esvazie o pratinho.", porque: "Excesso de água é uma das causas mais comuns de folhas amareladas.", ilu: { etapa: 4, pote: "Vaso" } },
            { id: "v-recipiente", dia: 22, ate: DIAS_PLANO, cada: 7, titulo: "Verificar as condições do vaso", oQue: "Veja se o furo de drenagem está livre, se o pratinho está sem água parada e se as raízes aparecem pelo furo (sinal de que o vaso pode estar pequeno).", porque: "Drenagem livre evita raízes apodrecidas.", ilu: { etapa: 5, pote: "Vaso" } }
        ]
    }
};
