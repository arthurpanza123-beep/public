const productOverview = {
  name: 'Primeflix',
  summary: 'Plataforma de conteudos com filmes, series, canais e esportes em um unico aplicativo.',
  goal: 'Conduzir o cliente para entender o produto, instalar o app correto, testar e assinar com seguranca.',
  test: {
    isFree: true,
    duration: '1 hora',
    beforeRelease: 'Pedir para salvar o contato do Bruno, enviar o nome e confirmar que esta com o aparelho em maos.'
  }
};

const serviceRules = [
  'Nao usar markdown nas respostas do WhatsApp.',
  'Nao usar negrito.',
  'Nao usar excesso de emoji.',
  'Nao usar a frase "com isso eu te passo".',
  'Nao parecer robo.',
  'Nao repetir o fluxo inicial.',
  'Nao inventar preco, plano, prazo, promocao ou desconto.',
  'Nao falar provedor antes da etapa de usuario e senha.',
  'Na etapa de instalacao, falar apenas o app ou caminho de instalacao.',
  'Responder curto, natural, profissional e com foco em conduzir o cliente.'
];

const flowStages = [
  'fluxo_inicial',
  'salvou_contato',
  'pedir_nome',
  'explicar_produto',
  'perguntar_aparelho',
  'orientar_instalacao',
  'liberar_login',
  'enviar_valores',
  'confirmar_teste',
  'aguardar_arthur',
  'renovacao',
  'suporte'
];

const officialAudioContext = {
  AUDIO_01: 'Bruno se apresenta, pede para salvar o contato antes de liberar o teste gratuito, explica que algumas pessoas nao recebem acesso ou recebem fora de ordem, pede para o cliente salvar o contato e enviar o nome.',
  AUDIO_02: 'Explica que o cliente tera filmes e series dos principais streamings em um unico app, canais, esportes, conteudos ao vivo, suporte, qualidade e atualizacoes semanais.',
  AUDIO_QUAL_TV: 'Pergunta se o cliente vai instalar na TV ou celular. Se for TV, pergunta se e smart e qual marca. Se for Fire Stick, TV Box ou outro aparelho, pede para informar.',
  AUDIO_RENOVACAO: 'Pergunta se o cliente quer renovar no mensal ou fazer upgrade para trimestral, semestral ou anual. O anual tem duas telas.'
};

const commercialRules = {
  values: {
    action: 'send_values_image',
    image: 'valor.jpeg',
    captionSource: 'IMAGE_VALORES_CAPTION',
    triggers: ['valor', 'valores', 'preco', 'preço', 'mensalidade', 'plano', 'planos', 'quanto custa'],
    localAnswer: 'Claro, vou te mandar os valores.'
  },
  test: {
    triggers: ['teste', 'testar', 'teste gratis', 'teste grátis', 'quero teste', 'fazer teste'],
    localAnswer: 'Perfeito. Antes de liberar o teste, salva o contato do Bruno e me manda seu nome. O teste dura 1 hora, então o ideal é fazer quando você estiver com o aparelho em mãos.'
  },
  payment: {
    triggers: ['pagar', 'pagamento', 'pix', 'cartao', 'cartão', 'paguei'],
    localAnswer: 'Depois que você escolher o plano, eu te envio as opções de pagamento. Assim que confirmar, faço a ativação do seu acesso.'
  },
  renewal: {
    triggers: ['renovar', 'renovacao', 'renovação', 'vencido', 'venceu'],
    localAnswer: 'Perfeito. Você quer continuar no plano mensal ou fazer upgrade para trimestral, semestral ou anual? Lembrando que o plano anual tem duas telas.'
  }
};

const deviceGuide = {
  lg: {
    triggers: ['lg'],
    stage: 'orientar_instalacao',
    answer: 'Ótimo! Sua TV LG é compatível. Na loja de aplicativos da TV, procure por XcloudTV. Em alguns modelos, ele também pode aparecer como Premium IPTV. Após instalar o aplicativo, é só me chamar por aqui para liberar o acesso.'
  },
  samsung: {
    triggers: ['samsung'],
    stage: 'orientar_instalacao',
    answer: 'Ótimo! Sua TV Samsung é compatível. Na loja de aplicativos da TV, procure por XcloudTV ou Premium IPTV. Após instalar o aplicativo, me chama por aqui para liberar o acesso.'
  },
  roku: {
    triggers: ['roku'],
    stage: 'orientar_instalacao',
    answer: 'Ótimo! Sua TV Roku é compatível. Procure pelo aplicativo indicado na loja da TV. Se não encontrar, me avisa que eu te passo a alternativa correta para o seu modelo.'
  },
  tcl: {
    triggers: ['tcl'],
    stage: 'orientar_instalacao',
    answer: 'Certo. Na TCL, normalmente o caminho é instalar pelo Downloader. Baixe o app Downloader e use o código 4648223. Se não abrir, a alternativa é usar o NtDown com o código 27422. Depois de instalar, me chama para liberar o acesso.'
  },
  tvBox: {
    triggers: ['tv box', 'box'],
    stage: 'orientar_instalacao',
    answer: 'Perfeito. Na TV Box, baixe o app Downloader e use o código 4648223. Se não abrir, use o NtDown com o código 27422. Depois que instalar, me chama por aqui para liberar o acesso.'
  },
  fireStick: {
    triggers: ['fire stick', 'firestick'],
    stage: 'orientar_instalacao',
    answer: 'Perfeito. No Fire Stick, baixe o app Downloader e use o código 4648223. Depois de instalar o aplicativo, me chama aqui para liberar o acesso.'
  },
  miStick: {
    triggers: ['mi stick', 'mistick'],
    stage: 'orientar_instalacao',
    answer: 'Perfeito. No Mi Stick, baixe o app Downloader e use o código 4648223. Se não funcionar, use o NtDown com o código 27422. Quando instalar, me chama para liberar o acesso.'
  },
  downloaderDevices: {
    triggers: ['aiwa', 'projetor', 'philco'],
    stage: 'orientar_instalacao',
    answer: 'Nesse aparelho, normalmente o caminho é pelo Downloader. Baixe o app Downloader e use o código 4648223. Se não abrir, use o NtDown com o código 27422. Depois me chama para liberar o acesso.'
  },
  android: {
    triggers: ['android', 'celular android'],
    stage: 'orientar_instalacao',
    answer: 'No Android, você pode instalar pelo link oficial: https://primeflixapp.com/pmf.apk Depois de instalar, me chama aqui para liberar o acesso.'
  },
  iphone: {
    triggers: ['iphone', 'ios'],
    stage: 'orientar_instalacao',
    answer: 'No iPhone, baixe o aplicativo Xcloud Mobile. Depois que instalar, me chama aqui para liberar o acesso.'
  },
  smartTv: {
    triggers: ['tv smart', 'smart tv', 'smart', 'minha tv é smart', 'minha tv e smart', 'é smart', 'e smart'],
    stage: 'perguntar_aparelho',
    answer: 'Funciona sim. Me fala a marca da sua TV: LG, Samsung, Roku, TCL ou outra? Assim eu te passo o aplicativo certo para instalar.'
  }
};

const approvedAnswers = [
  {
    id: 'como_funciona',
    triggers: ['como funciona', 'como funciona o produto', 'como funciona isso'],
    stage: 'explicar_produto',
    answer: 'Funciona assim: você instala o aplicativo no seu aparelho, faz um teste gratuito e vê a qualidade antes de assinar. Dentro da plataforma você encontra filmes, séries, canais e esportes em um só lugar. Me fala onde você pretende usar: TV Smart, TV Box, Fire Stick, celular ou outro aparelho?'
  },
  {
    id: 'o_que_e_primeflix',
    triggers: ['o que é a primeflix', 'o que e a primeflix', 'primeflix é o que', 'primeflix e o que'],
    stage: 'explicar_produto',
    answer: 'A Primeflix é uma plataforma de conteúdos onde você acessa filmes, séries, canais e esportes em um único aplicativo. O ideal é você fazer o teste gratuito no seu aparelho para ver a qualidade antes de escolher um plano.'
  },
  {
    id: 'teste_gratis',
    triggers: ['tem teste grátis', 'tem teste gratis'],
    stage: 'confirmar_teste',
    answer: 'Tem sim. O teste é gratuito e dura 1 hora. Pra liberar certinho, salva o contato do Bruno e me manda seu nome. Depois disso eu te direciono para instalar no seu aparelho.'
  },
  {
    id: 'ja_salvei',
    triggers: ['já salvei', 'ja salvei', 'salvei o contato', 'salvei contato'],
    stage: 'pedir_nome',
    answer: 'Perfeito. Me manda seu nome também, por favor, para eu salvar seu contato certinho aqui e seguir com a liberação.'
  },
  {
    id: 'nome_cliente',
    triggers: ['meu nome é', 'meu nome e', 'sou o', 'sou a'],
    stage: 'perguntar_aparelho',
    answer: 'Obrigado. Agora me fala onde você vai usar: TV Smart, TV Box, Fire Stick, celular ou outro aparelho?'
  },
  {
    id: 'filmes_series',
    triggers: ['tem filmes', 'tem series', 'tem séries', 'filmes e series', 'filmes e séries'],
    stage: 'explicar_produto',
    answer: 'Tem sim. A plataforma reúne filmes, séries, canais e esportes em um só lugar. Você consegue testar antes de assinar para ver se atende bem no seu aparelho.'
  },
  {
    id: 'streamings',
    triggers: ['tem netflix', 'tem disney', 'netflix disney', 'outros streamings'],
    stage: 'explicar_produto',
    answer: 'Dentro da plataforma você encontra conteúdos de vários streamings em um único aplicativo. O ideal é fazer o teste gratuito para ver a organização e a qualidade direto no seu aparelho.'
  },
  {
    id: 'canais',
    triggers: ['tem canais', 'canal', 'canais'],
    stage: 'explicar_produto',
    answer: 'Tem canais sim, incluindo opções de filmes, esportes e entretenimento. Se quiser, posso te liberar um teste para você ver a qualidade ao vivo.'
  },
  {
    id: 'futebol',
    triggers: ['tem futebol', 'futebol', 'jogo', 'esporte', 'esportes'],
    stage: 'explicar_produto',
    answer: 'Tem conteúdos esportivos sim. O melhor é fazer o teste no horário que você costuma assistir, para ver a qualidade no seu aparelho.'
  },
  {
    id: 'trava',
    triggers: ['trava', 'travando', 'fica travando'],
    stage: 'suporte',
    answer: 'A qualidade depende da internet e do aparelho, mas o servidor é focado em estabilidade e carregamento rápido. Por isso o teste é importante: você vê a qualidade antes de assinar.'
  },
  {
    id: 'internet_fraca',
    triggers: ['internet fraca', 'minha internet é fraca', 'minha internet e fraca'],
    stage: 'suporte',
    answer: 'Pode funcionar, mas o ideal é testar no seu aparelho. O teste gratuito serve justamente para você ver se roda bem na sua internet antes de escolher um plano.'
  },
  {
    id: 'confiavel',
    triggers: ['é confiável', 'e confiavel', 'confiável', 'confiavel'],
    stage: 'explicar_produto',
    answer: 'Sim. A melhor forma de você confirmar é fazendo o teste gratuito antes de assinar. Você vê a qualidade, o suporte e decide com segurança.'
  },
  {
    id: 'duas_telas',
    triggers: ['duas telas', '2 telas', 'duas tv', 'dois aparelhos'],
    stage: 'enviar_valores',
    answer: 'Tem opção para duas telas sim, dependendo do plano. Se você quiser, eu te mando a tabela de valores para escolher o melhor plano.',
    followUpAction: 'send_values_if_pricing'
  },
  {
    id: 'erro_suporte',
    triggers: ['deu erro', 'está travando', 'esta travando', 'problema', 'não abre', 'nao abre'],
    stage: 'suporte',
    answer: 'Entendi. Me fala qual aparelho você está usando e o que aparece na tela. Se puder, manda uma foto do erro para eu te orientar certinho.'
  }
];

const faq = approvedAnswers;

const whenToAskArthur = [
  'Cliente pediu algo fora da base.',
  'Cliente esta irritado.',
  'Erro ao criar teste.',
  'Pedido de desconto especial.',
  'Pagamento confirmado.',
  'Renovacao com duvida.',
  'Problema tecnico que nao foi resolvido.',
  'Cliente perguntou algo sensivel ou comercial que nao esta aprovado.'
];

const neverDo = [
  'Nunca inventar preco.',
  'Nunca mandar provedor na etapa de instalacao.',
  'Nunca dizer que nao vai passar valores por texto.',
  'Nunca repetir fluxo inicial.',
  'Nunca enviar promocao sem Arthur.',
  'Nunca usar markdown, negrito ou resposta robotica.'
];

const fallback = 'Vou confirmar essa informação rapidinho para te passar certinho.';

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s:/.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function includesAny(text, patterns) {
  const normalized = normalizeText(text);
  return patterns.some((pattern) => normalized.includes(normalizeText(pattern)));
}

function detectIntent(messageText) {
  if (includesAny(messageText, commercialRules.values.triggers)) return { intent: 'pricing', action: 'send_values_image' };
  if (includesAny(messageText, commercialRules.test.triggers)) return { intent: 'test_request', action: 'reply_text' };
  if (includesAny(messageText, commercialRules.payment.triggers)) return { intent: 'payment', action: 'reply_text' };
  if (includesAny(messageText, commercialRules.renewal.triggers)) return { intent: 'renewal', action: 'reply_text' };
  if (includesAny(messageText, ['atendente', 'arthur', 'humano', 'suporte humano'])) return { intent: 'human_help', action: 'needs_arthur' };
  if (Object.values(deviceGuide).some((item) => includesAny(messageText, item.triggers))) return { intent: 'device_setup', action: 'reply_text' };
  return { intent: 'unknown', action: 'ai_reply' };
}

function findLocalAnswer(messageText, customerStage = '') {
  if (includesAny(messageText, commercialRules.values.triggers)) {
    return {
      source: 'commercialRules.values',
      intent: 'pricing',
      stage: 'enviar_valores',
      action: 'send_values_image',
      answer: commercialRules.values.localAnswer
    };
  }

  if (includesAny(messageText, commercialRules.test.triggers)) {
    return {
      source: 'commercialRules.test',
      intent: 'test_request',
      stage: 'confirmar_teste',
      action: 'reply_text',
      answer: commercialRules.test.localAnswer
    };
  }

  if (includesAny(messageText, commercialRules.payment.triggers)) {
    return {
      source: 'commercialRules.payment',
      intent: 'payment',
      stage: 'aguardar_arthur',
      action: 'reply_text',
      answer: commercialRules.payment.localAnswer,
      needsArthur: true
    };
  }

  if (includesAny(messageText, commercialRules.renewal.triggers)) {
    return {
      source: 'commercialRules.renewal',
      intent: 'renewal',
      stage: 'renovacao',
      action: 'reply_text',
      answer: commercialRules.renewal.localAnswer
    };
  }

  const deviceAnswer = Object.entries(deviceGuide).find(([, item]) => includesAny(messageText, item.triggers));
  if (deviceAnswer) {
    const [source, item] = deviceAnswer;
    return {
      source: `deviceGuide.${source}`,
      intent: 'device_setup',
      stage: item.stage,
      action: 'reply_text',
      answer: item.answer
    };
  }

  const approved = approvedAnswers.find((item) => includesAny(messageText, item.triggers));
  if (approved) {
    return {
      source: `approvedAnswers.${approved.id}`,
      intent: approved.stage,
      stage: approved.stage || customerStage,
      action: 'reply_text',
      answer: approved.answer,
      followUpAction: approved.followUpAction
    };
  }

  return null;
}

function getRelevantContext(messageText, customerStage = '') {
  const localAnswer = findLocalAnswer(messageText, customerStage);
  const intent = detectIntent(messageText);
  const relevantDevices = Object.fromEntries(
    Object.entries(deviceGuide).filter(([, item]) => includesAny(messageText, item.triggers))
  );

  return {
    productOverview,
    serviceRules,
    currentStage: customerStage || localAnswer?.stage || 'suporte',
    detectedIntent: intent,
    relevantLocalAnswer: localAnswer,
    relevantCommercialRule: commercialRules[intent.intent === 'pricing' ? 'values' : intent.intent === 'test_request' ? 'test' : intent.intent] || null,
    relevantDeviceGuide: Object.keys(relevantDevices).length ? relevantDevices : null,
    whenToAskArthur,
    neverDo,
    fallback
  };
}

function buildSystemPrompt({ messageText = '', customerStage = '' } = {}) {
  const context = getRelevantContext(messageText, customerStage);
  return [
    'Você é atendente humano/vendedor da Primeflix.',
    'Responda curto, natural, profissional e com foco em conduzir o cliente.',
    'Não use markdown, negrito ou excesso de emoji.',
    'Não use a frase "com isso eu te passo".',
    'Não invente preço, plano, prazo, promoção ou desconto.',
    'Não fale provedor antes da etapa de liberar usuário e senha.',
    'Na instalação, fale somente o aplicativo ou caminho de instalação.',
    'Não repita o fluxo inicial.',
    `Etapa atual: ${context.currentStage}.`,
    `Intenção detectada: ${context.detectedIntent.intent}.`,
    `Contexto relevante: ${JSON.stringify(context)}`
  ].join('\n');
}

function sanitizeWhatsAppReply(text) {
  let value = String(text || fallback);
  value = value.replace(/\*\*(.*?)\*\*/g, '$1');
  value = value.replace(/__(.*?)__/g, '$1');
  value = value.replace(/[*_`>#-]/g, '');
  value = value.replace(/com isso eu te passo/gi, 'assim eu te oriento');
  value = value.replace(/\s{2,}/g, ' ').trim();

  const emojiMatches = value.match(/\p{Extended_Pictographic}/gu) || [];
  if (emojiMatches.length > 2) {
    let count = 0;
    value = value.replace(/\p{Extended_Pictographic}/gu, (emoji) => {
      count += 1;
      return count <= 2 ? emoji : '';
    });
  }

  return value || fallback;
}

module.exports = {
  productOverview,
  serviceRules,
  flowStages,
  officialAudioContext,
  deviceGuide,
  commercialRules,
  approvedAnswers,
  faq,
  whenToAskArthur,
  neverDo,
  fallback,
  normalizeText,
  detectIntent,
  findLocalAnswer,
  getRelevantContext,
  buildSystemPrompt,
  sanitizeWhatsAppReply
};
