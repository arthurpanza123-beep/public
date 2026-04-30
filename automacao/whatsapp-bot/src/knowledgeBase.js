const stages = {
  initialFlow: 'initial_flow',
  waitingContactSaved: 'waiting_contact_saved',
  waitingName: 'waiting_name',
  waitingDevice: 'waiting_device',
  installingApp: 'installing_app',
  waitingLoginRelease: 'waiting_login_release',
  aiService: 'ai_service',
  renewal: 'renewal',
  human: 'human'
};

const intents = {
  priceRequest: 'price_request',
  testRequest: 'test_request',
  productExplanation: 'product_explanation',
  deviceQuestion: 'device_question',
  deviceLg: 'device_lg',
  deviceSamsung: 'device_samsung',
  deviceRoku: 'device_roku',
  deviceAndroid: 'device_android',
  deviceIphone: 'device_iphone',
  deviceTvbox: 'device_tvbox',
  deviceFirestick: 'device_firestick',
  installedApp: 'installed_app',
  contactSaved: 'contact_saved',
  affirmative: 'affirmative',
  renewal: 'renewal',
  supportProblem: 'support_problem',
  paymentQuestion: 'payment_question',
  humanRequest: 'human_request',
  unknown: 'unknown'
};

const facts = {
  productName: 'Primeflix',
  productSummary: 'A Primeflix reune filmes, series, canais e esportes em um unico aplicativo.',
  usageFlow: 'O cliente instala o aplicativo no aparelho, faz um teste gratuito de 1 hora e depois escolhe um plano.',
  testDuration: '1 hora',
  testIsFree: true,
  officialValueImage: 'valor.jpeg',
  brunoContactRule: 'Antes de liberar teste, pedir para salvar o contato do Bruno e mandar o nome.',
  audioContext: {
    audio01: 'Bruno se apresenta, pede para salvar o contato antes de liberar o teste gratuito e pede para o cliente enviar o nome.',
    audio02: 'Explica filmes, series, streamings, canais, esportes, suporte, qualidade e atualizacoes semanais.',
    qualTv: 'Pergunta se vai instalar na TV ou celular; se for TV, pergunta se e smart e qual marca.',
    renovacao: 'Pergunta se quer renovar mensal ou fazer upgrade para trimestral, semestral ou anual. O anual tem duas telas.'
  }
};

const rules = {
  general: [
    'Nao repetir o fluxo inicial.',
    'Nao inventar preco, plano, prazo, promocao ou desconto.',
    'Nao usar fallback para intencoes claras.',
    'Nao parecer robo.',
    'Responder como atendente humano, profissional e vendedor.'
  ],
  values: [
    'Quando a intencao for price_request, nao chamar KIE.',
    'Enviar valor.jpeg com a legenda oficial.',
    'Pode responder antes: Claro, vou te mandar os valores.',
    'Nunca dizer que nao vai passar por texto.',
    'Nunca inventar valores fora da arte oficial.'
  ],
  test: [
    'Teste e gratuito.',
    'Teste dura 1 hora.',
    'Antes de liberar teste, confirmar contato salvo e nome.',
    'Antes de criar teste, confirmar se o cliente esta com o aparelho em maos e consegue testar agora.'
  ]
};

const tone = {
  style: 'curto, natural, profissional e vendedor',
  maxSentences: 4,
  noMarkdown: true,
  noBold: true,
  lowEmoji: true,
  avoidRobotTone: true
};

const forbiddenPhrases = [
  'com isso eu te passo',
  'vou acompanhar',
  'nao vou passar por texto',
  'não vou passar por texto'
];

const deviceInstallation = {
  lg: {
    intent: intents.deviceLg,
    appOnly: 'Na loja de aplicativos da TV, procure por XcloudTV. Em alguns modelos, ele tambem pode aparecer como Premium IPTV.',
    localFallback: 'Ótimo! Sua TV LG é compatível.\n\nNa loja de aplicativos da TV, procure por XcloudTV. Em alguns modelos, ele também pode aparecer como Premium IPTV.\n\nApós instalar o aplicativo, é só me chamar por aqui para liberar o acesso.'
  },
  samsung: {
    intent: intents.deviceSamsung,
    appOnly: 'Na loja de aplicativos da TV, procure por XcloudTV ou Premium IPTV.',
    localFallback: 'Ótimo! Sua TV Samsung é compatível.\n\nNa loja de aplicativos da TV, procure por XcloudTV ou Premium IPTV.\n\nApós instalar o aplicativo, é só me chamar por aqui para liberar o acesso.'
  },
  roku: {
    intent: intents.deviceRoku,
    appOnly: 'Procure pelo aplicativo indicado na loja da TV. Se nao encontrar, pedir modelo para passar a alternativa correta.',
    localFallback: 'Ótimo! Sua TV Roku é compatível.\n\nProcure pelo aplicativo indicado na loja da TV. Se não encontrar, me avisa que eu te passo a alternativa correta para o seu modelo.'
  },
  android: {
    intent: intents.deviceAndroid,
    appOnly: 'No Android, instalar pelo link oficial: https://primeflixapp.com/pmf.apk',
    localFallback: 'No Android, você pode instalar pelo link oficial:\n\nhttps://primeflixapp.com/pmf.apk\n\nDepois de instalar, me chama aqui para liberar o acesso.'
  },
  iphone: {
    intent: intents.deviceIphone,
    appOnly: 'No iPhone, baixar o aplicativo Xcloud Mobile.',
    localFallback: 'No iPhone, baixe o aplicativo Xcloud Mobile.\n\nDepois que instalar, me chama aqui para liberar o acesso.'
  },
  tvbox: {
    intent: intents.deviceTvbox,
    appOnly: 'Na TV Box, baixar Downloader codigo 4648223. Alternativa: NtDown codigo 27422.',
    localFallback: 'Perfeito. Na TV Box, baixe o app Downloader e use o código 4648223.\n\nSe não abrir, use o NtDown com o código 27422.\n\nDepois que instalar, me chama por aqui para liberar o acesso.'
  },
  firestick: {
    intent: intents.deviceFirestick,
    appOnly: 'No Fire Stick, baixar Downloader e usar codigo 4648223.',
    localFallback: 'Perfeito. No Fire Stick, baixe o app Downloader e use o código 4648223.\n\nDepois de instalar o aplicativo, me chama aqui para liberar o acesso.'
  }
};

const loginRules = {
  provider: 'primeflixapp',
  providerOnlyAtLogin: true,
  rule: 'Provedor so pode ser enviado junto com usuario e senha, na etapa de liberar acesso/login. Nunca enviar provedor na etapa de instalacao.'
};

const commercialRules = {
  valuesImage: 'valor.jpeg',
  valueCaptionMustBeOfficial: true,
  renewal: 'Perguntar se quer continuar mensal ou fazer upgrade para trimestral, semestral ou anual. O anual tem duas telas.',
  payment: 'Depois que o cliente escolher o plano, enviar opcoes de pagamento. Pagamento confirmado deve chamar Arthur.'
};

const examplesApproved = {
  productExplanationIdeas: [
    'Explicar que instala o app, faz teste gratuito de 1 hora, avalia a qualidade e depois escolhe um plano.',
    'Citar filmes, series, canais e esportes em um unico aplicativo.',
    'Finalizar perguntando o aparelho ou oferecendo teste/valores de acordo com contexto.'
  ],
  smartTv: 'Funciona sim. Me fala a marca da sua TV: LG, Samsung, Roku, TCL ou outra? Assim eu te oriento com o app certo.',
  support: 'Entendi. Me fala qual aparelho voce esta usando e o que aparece na tela. Se puder, manda uma foto do erro para eu te orientar certinho.',
  testNoContact: 'Perfeito. Antes de liberar o teste, salva o contato do Bruno e me manda seu nome. O teste dura 1 hora, então o ideal é fazer quando você estiver com o aparelho em mãos.',
  testWithContact: 'Perfeito. Você está com o aparelho em mãos e consegue testar agora? O teste dura 1 hora.'
};

const localFallbackByIntent = {
  [intents.productExplanation]: 'Funciona assim: você instala o aplicativo no seu aparelho, faz um teste gratuito de 1 hora e vê a qualidade antes de assinar. A Primeflix reúne filmes, séries, canais e esportes em um só lugar. Me fala onde você pretende usar: TV Smart, TV Box, Fire Stick, celular ou outro aparelho?',
  [intents.deviceQuestion]: 'Funciona sim. Me fala a marca da sua TV: LG, Samsung, Roku, TCL ou outra? Assim eu te oriento com o app certo.',
  [intents.deviceLg]: deviceInstallation.lg.localFallback,
  [intents.deviceSamsung]: deviceInstallation.samsung.localFallback,
  [intents.deviceRoku]: deviceInstallation.roku.localFallback,
  [intents.deviceAndroid]: deviceInstallation.android.localFallback,
  [intents.deviceIphone]: deviceInstallation.iphone.localFallback,
  [intents.deviceTvbox]: deviceInstallation.tvbox.localFallback,
  [intents.deviceFirestick]: deviceInstallation.firestick.localFallback,
  [intents.testRequest]: examplesApproved.testNoContact,
  [intents.renewal]: 'Perfeito. Você quer continuar no plano mensal ou fazer upgrade para trimestral, semestral ou anual? Lembrando que o plano anual tem duas telas.',
  [intents.supportProblem]: examplesApproved.support,
  [intents.paymentQuestion]: 'Depois que você escolher o plano, eu te envio as opções de pagamento. Assim que confirmar, faço a ativação do seu acesso.',
  [intents.installedApp]: 'Perfeito. Você está com o aparelho em mãos para testar agora? Se sim, eu libero o acesso de teste.'
};

const fallback = 'Me fala se você quer ver valores, instalar no aparelho ou liberar um teste. Assim eu te ajudo pelo caminho certo.';

const intentPatterns = [
  {
    intent: intents.priceRequest,
    patterns: ['valor', 'valores', 'preco', 'precos', 'preço', 'preços', 'quanto custa', 'planos', 'mensal', 'mensalidade', 'tabela', 'quero saber os valores', 'me manda os valores', 'quero ver os planos']
  },
  {
    intent: intents.testRequest,
    patterns: ['teste', 'quero testar', 'liberar teste', 'teste gratis', 'teste grátis', 'gratuito']
  },
  {
    intent: intents.productExplanation,
    patterns: ['como funciona', 'me explica', 'o que e', 'o que é', 'como e', 'como é', 'como usa', 'como funciona o produto', 'o que vem']
  },
  {
    intent: intents.deviceLg,
    patterns: ['lg', 'tv lg', 'minha tv e lg', 'minha tv é lg']
  },
  {
    intent: intents.deviceSamsung,
    patterns: ['samsung', 'tv samsung', 'minha tv e samsung', 'minha tv é samsung']
  },
  {
    intent: intents.deviceRoku,
    patterns: ['roku', 'tv roku']
  },
  {
    intent: intents.deviceAndroid,
    patterns: ['android', 'celular android', 'apk']
  },
  {
    intent: intents.deviceIphone,
    patterns: ['iphone', 'ios', 'apple']
  },
  {
    intent: intents.deviceTvbox,
    patterns: ['tv box', 'box', 'android box']
  },
  {
    intent: intents.deviceFirestick,
    patterns: ['fire stick', 'firestick', 'fire tv']
  },
  {
    intent: intents.installedApp,
    patterns: ['ja instalei', 'já instalei', 'instalei', 'baixei', 'ja baixei', 'já baixei']
  },
  {
    intent: intents.contactSaved,
    patterns: ['salvei', 'ja salvei', 'já salvei', 'salvei o contato', 'contato salvo']
  },
  {
    intent: intents.affirmative,
    patterns: ['sim', 'ok', 'pode', 'pode sim', 'estou sim', 'to sim', 'tô sim', 'estou com aparelho', 'estou com a tv', 'estou com tv']
  },
  {
    intent: intents.deviceQuestion,
    patterns: ['tv smart', 'smart tv', 'smart', 'minha tv e smart', 'minha tv é smart', 'e smart sim', 'é smart sim']
  },
  {
    intent: intents.renewal,
    patterns: ['renovar', 'renovacao', 'renovação', 'vencido', 'venceu']
  },
  {
    intent: intents.supportProblem,
    patterns: ['travando', 'erro', 'nao abre', 'não abre', 'nao funciona', 'não funciona', 'caiu', 'sem sinal', 'tela preta']
  },
  {
    intent: intents.paymentQuestion,
    patterns: ['pagamento', 'pagar', 'pix', 'cartao', 'cartão', 'paguei']
  },
  {
    intent: intents.humanRequest,
    patterns: ['atendente', 'humano', 'falar com atendente', 'falar com suporte', 'falar com alguem', 'falar com alguém', 'chama o arthur', 'falar com arthur']
  }
];

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
  const match = intentPatterns.find((item) => includesAny(messageText, item.patterns));
  return match ? match.intent : intents.unknown;
}

function stageFromCustomer(customer = {}) {
  if (customer.stage) return customer.stage;
  if (!customer.flow_initial_sent) return stages.initialFlow;
  if (customer.assigned_to_human) return stages.human;
  return stages.aiService;
}

function actionForIntent(intent, stage) {
  if (intent === intents.priceRequest) return { type: 'send_values', nextStage: stages.aiService };
  if (intent === intents.humanRequest) return { type: 'needs_arthur', nextStage: stages.human };
  if (intent === intents.paymentQuestion) return { type: 'local_reply', needsArthur: true, nextStage: stages.aiService };
  if (intent === intents.contactSaved) return { type: 'local_reply', nextStage: stages.waitingName };
  if (intent === intents.affirmative && [stages.waitingLoginRelease, stages.human].includes(stage)) return { type: 'fake_or_request_test', nextStage: stages.aiService };
  if (intent === intents.affirmative && stage === stages.waitingContactSaved) return { type: 'local_reply', nextStage: stages.waitingName };
  if (intent === intents.testRequest) return { type: 'local_reply', nextStage: stage === stages.waitingDevice || stage === stages.installingApp || stage === stages.waitingLoginRelease ? stages.waitingLoginRelease : stages.waitingContactSaved };
  if (intent === intents.installedApp) return { type: 'local_reply', needsArthur: true, nextStage: stages.waitingLoginRelease };

  const directInstallIntents = new Set([
    intents.deviceQuestion,
    intents.deviceLg,
    intents.deviceSamsung,
    intents.deviceRoku,
    intents.deviceAndroid,
    intents.deviceIphone,
    intents.deviceTvbox,
    intents.deviceFirestick,
    intents.supportProblem,
    intents.renewal
  ]);

  if (directInstallIntents.has(intent)) return { type: 'local_reply', nextStage: intent === intents.renewal ? stages.renewal : stages.installingApp };
  return { type: 'ai_reply', nextStage: stages.aiService };
}

function localFallbackForIntent(intent, stage) {
  if (intent === intents.unknown) {
    return fallback;
  }
  if (intent === intents.contactSaved) {
    return 'Perfeito. Me manda seu nome também, por favor, para eu salvar seu contato certinho aqui e seguir com a liberação.';
  }
  if (intent === intents.affirmative && stage === stages.waitingContactSaved) {
    return 'Perfeito. Agora me manda seu nome, por favor, para eu seguir com a liberação.';
  }
  if (intent === intents.testRequest && stage === stages.waitingContactSaved) {
    return 'Perfeito. Me manda seu nome também, por favor, para eu salvar seu contato certinho aqui e seguir com a liberação.';
  }
  if (intent === intents.testRequest && stage === stages.waitingName) {
    return 'Obrigado. Agora me fala onde você vai usar: TV Smart, TV Box, Fire Stick, celular ou outro aparelho?';
  }
  if (intent === intents.testRequest && [stages.waitingDevice, stages.installingApp, stages.waitingLoginRelease].includes(stage)) {
    return examplesApproved.testWithContact;
  }
  return localFallbackByIntent[intent] || fallback;
}

function relevantContextForIntent(intent, stage) {
  const deviceEntry = Object.values(deviceInstallation).find((item) => item.intent === intent);
  return {
    facts,
    rules,
    tone,
    forbiddenPhrases,
    stage,
    intent,
    deviceInstallation: deviceEntry || null,
    loginRules,
    commercialRules,
    examplesApproved: {
      productExplanationIdeas: examplesApproved.productExplanationIdeas,
      smartTv: examplesApproved.smartTv,
      support: examplesApproved.support
    },
    fallbackRules: {
      fallback,
      doNotUseFallbackFor: [
        intents.priceRequest,
        intents.testRequest,
        intents.productExplanation,
        intents.deviceQuestion,
        intents.deviceLg,
        intents.deviceSamsung,
        intents.deviceAndroid,
        intents.deviceIphone,
        intents.deviceTvbox,
        intents.deviceFirestick,
        intents.supportProblem
      ]
    }
  };
}

function buildSystemPrompt({ messageText = '', customerStage = '', intent = '' } = {}) {
  const detectedIntent = intent || detectIntent(messageText);
  const context = relevantContextForIntent(detectedIntent, customerStage || stages.aiService);
  return [
    'Voce e atendente humano/vendedor da Primeflix.',
    'Use a base de conhecimento para raciocinar e escrever uma resposta natural.',
    'Nao copie scripts longos. Varie a frase sem sair das regras.',
    'Responda em 1 a 4 frases curtas.',
    'Nao use markdown, negrito ou excesso de emoji.',
    'Nao use as frases proibidas.',
    'Nao invente preco, plano, prazo, promocao ou desconto.',
    'Nao fale provedor na etapa de instalacao. Provedor so junto de usuario e senha.',
    'Se a intencao for TV Smart, pergunte a marca da TV.',
    `Contexto relevante: ${JSON.stringify(context)}`
  ].join('\n');
}

function removeProviderIfInstalling(text, stage, intent) {
  const installingIntents = new Set([
    intents.deviceLg,
    intents.deviceSamsung,
    intents.deviceRoku,
    intents.deviceAndroid,
    intents.deviceIphone,
    intents.deviceTvbox,
    intents.deviceFirestick,
    intents.deviceQuestion
  ]);
  if (stage !== stages.installingApp && !installingIntents.has(intent)) return text;
  return text
    .replace(/provedor\s*:?\s*primeflixapp/gi, '')
    .replace(/primeflixapp/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function sanitizeWhatsAppReply(text, { stage = '', intent = '' } = {}) {
  let value = String(text || fallback);
  value = value.replace(/\*\*(.*?)\*\*/g, '$1');
  value = value.replace(/__(.*?)__/g, '$1');
  value = value.replace(/[*_`>#]/g, '');
  forbiddenPhrases.forEach((phrase) => {
    value = value.replace(new RegExp(phrase, 'gi'), '');
  });
  value = removeProviderIfInstalling(value, stage, intent);
  value = value.replace(/\s{2,}/g, ' ').trim();

  const emojiMatches = value.match(/\p{Extended_Pictographic}/gu) || [];
  if (emojiMatches.length > 2) {
    let count = 0;
    value = value.replace(/\p{Extended_Pictographic}/gu, (emoji) => {
      count += 1;
      return count <= 2 ? emoji : '';
    });
  }

  const sentences = value.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length > tone.maxSentences) value = sentences.slice(0, tone.maxSentences).join(' ');

  return value || fallback;
}

module.exports = {
  stages,
  intents,
  facts,
  rules,
  tone,
  forbiddenPhrases,
  deviceInstallation,
  loginRules,
  commercialRules,
  examplesApproved,
  fallback,
  normalizeText,
  detectIntent,
  stageFromCustomer,
  actionForIntent,
  localFallbackForIntent,
  relevantContextForIntent,
  buildSystemPrompt,
  sanitizeWhatsAppReply
};
