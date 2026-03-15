/**
 * WalkMe Flow Schema
 *
 * Definisce la struttura JSON per i flussi WalkMe generati dalla CLI.
 * Compatibile con il formato di import/export di WalkMe Editor.
 */

/**
 * Crea un nuovo flusso WalkMe vuoto
 */
export function createFlow({
  name,
  description = '',
  sapTransaction = null,
  fioriApp = null,
  targetUrl = null,
  language = 'it',
  tags = [],
}) {
  return {
    _meta: {
      generator: 'walkme-cli',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      language,
    },
    flow: {
      name,
      description,
      type: 'SmartWalkThru',
      sapContext: {
        transaction: sapTransaction,
        fioriApp,
        targetUrl,
      },
      settings: {
        autoStart: false,
        segmentation: null,
        frequency: 'always',
        balloonTheme: 'default',
        allowRestart: true,
      },
      tags,
      goals: [],
      steps: [],
    },
  };
}

/**
 * Crea uno step di tipo Popup (balloon informativo)
 */
export function createPopupStep({
  title,
  content,
  selector,
  position = 'auto',
  waitForSelector = true,
  order,
}) {
  return {
    order,
    type: 'popup',
    title,
    content,
    selector,
    settings: {
      position,
      waitForSelector,
      highlightElement: true,
      overlayEnabled: true,
    },
  };
}

/**
 * Crea uno step di tipo Click
 */
export function createClickStep({
  title,
  content,
  selector,
  position = 'auto',
  order,
}) {
  return {
    order,
    type: 'click',
    title,
    content,
    selector,
    settings: {
      position,
      waitForSelector: true,
      highlightElement: true,
      triggerOnClick: true,
    },
  };
}

/**
 * Crea uno step di tipo Type (inserimento testo)
 */
export function createTypeStep({
  title,
  content,
  selector,
  inputValue = '',
  placeholder = '',
  position = 'auto',
  order,
}) {
  return {
    order,
    type: 'type',
    title,
    content,
    selector,
    inputValue,
    placeholder,
    settings: {
      position,
      waitForSelector: true,
      highlightElement: true,
      validateInput: false,
    },
  };
}

/**
 * Crea uno step di tipo Select (selezione da dropdown)
 */
export function createSelectStep({
  title,
  content,
  selector,
  selectValue = '',
  options = [],
  position = 'auto',
  order,
}) {
  return {
    order,
    type: 'select',
    title,
    content,
    selector,
    selectValue,
    options,
    settings: {
      position,
      waitForSelector: true,
      highlightElement: true,
    },
  };
}

/**
 * Crea uno step di tipo Redirect
 */
export function createRedirectStep({
  title,
  content,
  url,
  order,
}) {
  return {
    order,
    type: 'redirect',
    title,
    content,
    url,
    settings: {
      waitForPageLoad: true,
    },
  };
}

/**
 * Crea uno step di tipo Wait
 */
export function createWaitStep({
  title = 'Attendi...',
  content,
  selector = null,
  timeout = 10000,
  condition = null,
  order,
}) {
  return {
    order,
    type: 'waitFor',
    title,
    content,
    selector,
    timeout,
    condition,
  };
}

/**
 * Crea uno step di tipo Split (branch condizionale)
 */
export function createSplitStep({
  title,
  condition,
  trueBranch = [],
  falseBranch = [],
  order,
}) {
  return {
    order,
    type: 'splitStep',
    title,
    condition,
    trueBranch,
    falseBranch,
  };
}

/**
 * Crea uno step auto-eseguito
 */
export function createAutoStep({
  title,
  selector,
  action, // 'click', 'setValue', 'addClass', 'hide', 'show'
  value = null,
  order,
}) {
  return {
    order,
    type: 'autoStep',
    title,
    selector,
    action,
    value,
  };
}

/**
 * Aggiunge un goal al flusso
 */
export function createGoal({ name, type = 'elementClick', selector = null, url = null }) {
  return {
    name,
    type, // 'elementClick', 'pageVisit', 'custom'
    selector,
    url,
  };
}

// ─── SmartTips ─────────────────────────────────────────────

/**
 * Crea un set di SmartTips (tooltip contestuali su elementi UI)
 */
export function createSmartTipSet({
  name,
  description = '',
  sapTransaction = null,
  fioriApp = null,
  language = 'it',
  tags = [],
  tips = [],
}) {
  return {
    _meta: {
      generator: 'walkme-cli',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      language,
    },
    smartTips: {
      name,
      description,
      type: 'SmartTips',
      sapContext: { transaction: sapTransaction, fioriApp },
      tags,
      tips,
    },
  };
}

/**
 * Crea un singolo SmartTip
 */
export function createSmartTip({
  selector,
  title,
  content,
  position = 'auto',
  trigger = 'hover',
  icon = 'info',
  rules = null,
  order = 0,
}) {
  return {
    order,
    selector,
    title,
    content,
    trigger, // 'hover', 'focus', 'click', 'always'
    icon,    // 'info', 'warning', 'error', 'success', 'question', 'none'
    settings: {
      position,
      showOnce: false,
      animate: true,
    },
    rules,   // condizioni di visibilità (segmenti, URL, ecc.)
  };
}

// ─── Launchers ─────────────────────────────────────────────

/**
 * Crea un Launcher (pulsante/widget flottante che avvia azioni)
 */
export function createLauncher({
  name,
  description = '',
  sapTransaction = null,
  fioriApp = null,
  language = 'it',
  tags = [],
  shape = 'button',
  icon = 'play',
  label = '',
  position = 'bottom-right',
  action = {},
  rules = null,
}) {
  return {
    _meta: {
      generator: 'walkme-cli',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      language,
    },
    launcher: {
      name,
      description,
      type: 'Launcher',
      sapContext: { transaction: sapTransaction, fioriApp },
      tags,
      shape,       // 'button', 'badge', 'hotspot', 'beacon'
      icon,        // 'play', 'help', 'info', 'arrow', 'custom'
      label,
      position,    // 'bottom-right', 'bottom-left', 'top-right', 'top-left', 'custom'
      anchorSelector: null, // se shape=hotspot/beacon, ancora a un elemento
      action,      // { type: 'startWalkThru'|'openUrl'|'openResource'|'customJs', target: '...' }
      settings: {
        alwaysVisible: true,
        animate: true,
        showLabel: !!label,
        zIndex: 9999,
      },
      rules,
    },
  };
}

// ─── ShoutOuts ─────────────────────────────────────────────

/**
 * Crea uno ShoutOut (banner/popup overlay informativo)
 */
export function createShoutOut({
  name,
  description = '',
  language = 'it',
  tags = [],
  template = 'dialog',
  title = '',
  content = '',
  buttons = [],
  position = 'center',
  frequency = 'once',
  segmentation = null,
  rules = null,
}) {
  return {
    _meta: {
      generator: 'walkme-cli',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      language,
    },
    shoutOut: {
      name,
      description,
      type: 'ShoutOut',
      tags,
      template,    // 'dialog', 'banner-top', 'banner-bottom', 'slide-in', 'fullscreen', 'notification'
      title,
      content,     // HTML supportato
      buttons,     // [{ label, action: 'dismiss'|'startWalkThru'|'openUrl'|'nextShoutOut', target, style: 'primary'|'secondary' }]
      media: null,  // { type: 'image'|'video', url }
      position,    // 'center', 'top', 'bottom', 'left', 'right'
      settings: {
        frequency,   // 'once', 'always', 'session', 'daily', 'weekly'
        closeable: true,
        overlayEnabled: template === 'dialog' || template === 'fullscreen',
        autoClose: null, // secondi, null = manuale
        animation: 'fade', // 'fade', 'slide', 'none'
      },
      segmentation,
      rules,
    },
  };
}

/**
 * Crea un pulsante per ShoutOut
 */
export function createShoutOutButton({
  label,
  action = 'dismiss',
  target = null,
  style = 'primary',
}) {
  return { label, action, target, style };
}

// ─── Surveys ───────────────────────────────────────────────

/**
 * Crea un Survey (sondaggio in-app)
 */
export function createSurvey({
  name,
  description = '',
  language = 'it',
  tags = [],
  title = '',
  questions = [],
  thankYouMessage = 'Grazie per il tuo feedback!',
  frequency = 'once',
  segmentation = null,
  rules = null,
}) {
  return {
    _meta: {
      generator: 'walkme-cli',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      language,
    },
    survey: {
      name,
      description,
      type: 'Survey',
      tags,
      title,
      questions,
      thankYouMessage,
      settings: {
        frequency,     // 'once', 'always', 'session', 'daily', 'weekly'
        showProgress: true,
        allowSkip: false,
        randomize: false,
      },
      segmentation,
      rules,
    },
  };
}

/**
 * Crea una domanda per Survey
 */
export function createSurveyQuestion({
  questionText,
  type = 'rating',
  required = true,
  options = [],
  scaleMin = 1,
  scaleMax = 5,
  scaleLabels = null,
  placeholder = '',
  order = 0,
}) {
  return {
    order,
    questionText,
    type,        // 'rating', 'nps', 'multipleChoice', 'singleChoice', 'freeText', 'yesNo', 'scale'
    required,
    options,     // per multipleChoice / singleChoice
    scaleMin,    // per rating / nps / scale
    scaleMax,
    scaleLabels, // { min: 'Non soddisfatto', max: 'Molto soddisfatto' }
    placeholder, // per freeText
  };
}

// ─── Shuttles ──────────────────────────────────────────────

/**
 * Crea uno Shuttle (popup informativo multi-pagina, non ancorato)
 */
export function createShuttle({
  name,
  description = '',
  language = 'it',
  tags = [],
  title = '',
  pages = [],
  position = 'center',
  frequency = 'once',
  segmentation = null,
  rules = null,
}) {
  return {
    _meta: {
      generator: 'walkme-cli',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      language,
    },
    shuttle: {
      name,
      description,
      type: 'Shuttle',
      tags,
      title,
      pages,
      position, // 'center', 'bottom-right', 'bottom-left'
      settings: {
        frequency,
        showProgress: true,
        closeable: true,
        autoAdvance: null, // secondi per auto-avanzamento, null = manuale
        animation: 'slide',
      },
      segmentation,
      rules,
    },
  };
}

/**
 * Crea una pagina per Shuttle
 */
export function createShuttlePage({
  title = '',
  content = '',
  media = null,
  buttons = [],
  order = 0,
}) {
  return {
    order,
    title,
    content,     // HTML supportato
    media,       // { type: 'image'|'video'|'gif', url }
    buttons,     // [{ label, action: 'next'|'prev'|'dismiss'|'startWalkThru'|'openUrl', target }]
  };
}

// ─── Resources ─────────────────────────────────────────────

/**
 * Crea un menu Resources (help center in-app)
 */
export function createResourceMenu({
  name,
  description = '',
  language = 'it',
  tags = [],
  title = 'Risorse',
  icon = 'help',
  position = 'bottom-right',
  items = [],
  searchEnabled = true,
  rules = null,
}) {
  return {
    _meta: {
      generator: 'walkme-cli',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      language,
    },
    resource: {
      name,
      description,
      type: 'Resource',
      tags,
      title,
      icon,        // 'help', 'book', 'info', 'question', 'custom'
      position,    // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
      items,
      settings: {
        searchEnabled,
        groupByCategory: true,
        maxVisibleItems: 10,
      },
      rules,
    },
  };
}

/**
 * Crea un item per il menu Resources
 */
export function createResourceItem({
  title,
  description = '',
  type = 'walkthru',
  target = null,
  icon = null,
  category = null,
  order = 0,
}) {
  return {
    order,
    title,
    description,
    type,      // 'walkthru', 'article', 'video', 'link', 'shuttle', 'survey'
    target,    // ID del walkthru, URL, ecc.
    icon,
    category,  // per raggruppamento
  };
}

// ─── Validazione ───────────────────────────────────────────

/**
 * Valida un flusso WalkMe (qualsiasi tipo)
 */
export function validateFlow(flow) {
  const errors = [];
  const warnings = [];

  // Smart Walk-Thru
  if (flow.flow) {
    if (!flow.flow.name) {
      errors.push('Il flusso deve avere un nome');
    }
    if (!flow.flow.steps || flow.flow.steps.length === 0) {
      errors.push('Il flusso deve avere almeno uno step');
    }
    flow.flow.steps?.forEach((step, i) => {
      if (!step.type) {
        errors.push(`Step ${i + 1}: tipo mancante`);
      }
      if (!step.title) {
        warnings.push(`Step ${i + 1}: titolo mancante (consigliato)`);
      }
      if (['popup', 'click', 'type', 'select'].includes(step.type) && !step.selector) {
        errors.push(`Step ${i + 1} (${step.type}): selettore CSS mancante`);
      }
      if (step.type === 'redirect' && !step.url) {
        errors.push(`Step ${i + 1} (redirect): URL mancante`);
      }
      if (step.type === 'type' && !step.inputValue && !step.placeholder) {
        warnings.push(`Step ${i + 1} (type): nessun valore o placeholder specificato`);
      }
    });
  }

  // SmartTips
  if (flow.smartTips) {
    if (!flow.smartTips.name) errors.push('Il set SmartTips deve avere un nome');
    if (!flow.smartTips.tips || flow.smartTips.tips.length === 0) {
      errors.push('Il set deve avere almeno un SmartTip');
    }
    flow.smartTips.tips?.forEach((tip, i) => {
      if (!tip.selector) errors.push(`SmartTip ${i + 1}: selettore mancante`);
      if (!tip.content) warnings.push(`SmartTip ${i + 1}: contenuto mancante`);
    });
  }

  // Launcher
  if (flow.launcher) {
    if (!flow.launcher.name) errors.push('Il Launcher deve avere un nome');
    if (!flow.launcher.action?.type) errors.push('Il Launcher deve avere un\'azione');
    if (flow.launcher.shape === 'hotspot' && !flow.launcher.anchorSelector) {
      errors.push('Un Launcher hotspot deve avere un anchorSelector');
    }
  }

  // ShoutOut
  if (flow.shoutOut) {
    if (!flow.shoutOut.name) errors.push('Lo ShoutOut deve avere un nome');
    if (!flow.shoutOut.content && !flow.shoutOut.title) {
      errors.push('Lo ShoutOut deve avere un titolo o contenuto');
    }
  }

  // Survey
  if (flow.survey) {
    if (!flow.survey.name) errors.push('Il Survey deve avere un nome');
    if (!flow.survey.questions || flow.survey.questions.length === 0) {
      errors.push('Il Survey deve avere almeno una domanda');
    }
    flow.survey.questions?.forEach((q, i) => {
      if (!q.questionText) errors.push(`Domanda ${i + 1}: testo mancante`);
      if (['multipleChoice', 'singleChoice'].includes(q.type) && (!q.options || q.options.length < 2)) {
        errors.push(`Domanda ${i + 1}: servono almeno 2 opzioni`);
      }
    });
  }

  // Shuttle
  if (flow.shuttle) {
    if (!flow.shuttle.name) errors.push('Lo Shuttle deve avere un nome');
    if (!flow.shuttle.pages || flow.shuttle.pages.length === 0) {
      errors.push('Lo Shuttle deve avere almeno una pagina');
    }
  }

  // Resource
  if (flow.resource) {
    if (!flow.resource.name) errors.push('Il Resource menu deve avere un nome');
    if (!flow.resource.items || flow.resource.items.length === 0) {
      warnings.push('Il Resource menu non ha items');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Esporta il flusso in formato YAML-friendly (struttura piatta)
 */
export function flowToSimpleFormat(flow) {
  // Smart Walk-Thru
  if (flow.flow) {
    return {
      name: flow.flow.name,
      type: 'SmartWalkThru',
      description: flow.flow.description,
      sap_transaction: flow.flow.sapContext?.transaction,
      fiori_app: flow.flow.sapContext?.fioriApp,
      steps: flow.flow.steps.map((step, i) => {
        const s = {
          step: i + 1,
          type: step.type,
          title: step.title,
          content: step.content,
        };
        if (step.selector) s.selector = step.selector;
        if (step.inputValue) s.input_value = step.inputValue;
        if (step.selectValue) s.select_value = step.selectValue;
        if (step.url) s.url = step.url;
        if (step.settings?.position) s.position = step.settings.position;
        return s;
      }),
    };
  }

  // SmartTips
  if (flow.smartTips) {
    return {
      name: flow.smartTips.name,
      type: 'SmartTips',
      description: flow.smartTips.description,
      tips: flow.smartTips.tips.map((tip, i) => ({
        tip: i + 1,
        selector: tip.selector,
        title: tip.title,
        content: tip.content,
        trigger: tip.trigger,
      })),
    };
  }

  // Launcher
  if (flow.launcher) {
    return {
      name: flow.launcher.name,
      type: 'Launcher',
      shape: flow.launcher.shape,
      label: flow.launcher.label,
      position: flow.launcher.position,
      action: flow.launcher.action,
    };
  }

  // ShoutOut
  if (flow.shoutOut) {
    return {
      name: flow.shoutOut.name,
      type: 'ShoutOut',
      template: flow.shoutOut.template,
      title: flow.shoutOut.title,
      content: flow.shoutOut.content,
      buttons: flow.shoutOut.buttons,
    };
  }

  // Survey
  if (flow.survey) {
    return {
      name: flow.survey.name,
      type: 'Survey',
      title: flow.survey.title,
      questions: flow.survey.questions.map((q, i) => ({
        question: i + 1,
        text: q.questionText,
        type: q.type,
        options: q.options,
      })),
    };
  }

  // Shuttle
  if (flow.shuttle) {
    return {
      name: flow.shuttle.name,
      type: 'Shuttle',
      title: flow.shuttle.title,
      pages: flow.shuttle.pages.map((p, i) => ({
        page: i + 1,
        title: p.title,
        content: p.content,
      })),
    };
  }

  // Resource
  if (flow.resource) {
    return {
      name: flow.resource.name,
      type: 'Resource',
      title: flow.resource.title,
      items: flow.resource.items.map((item, i) => ({
        item: i + 1,
        title: item.title,
        type: item.type,
        target: item.target,
        category: item.category,
      })),
    };
  }

  return flow;
}
