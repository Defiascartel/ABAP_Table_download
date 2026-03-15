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

/**
 * Valida un flusso WalkMe
 */
export function validateFlow(flow) {
  const errors = [];
  const warnings = [];

  if (!flow.flow?.name) {
    errors.push('Il flusso deve avere un nome');
  }

  if (!flow.flow?.steps || flow.flow.steps.length === 0) {
    errors.push('Il flusso deve avere almeno uno step');
  }

  flow.flow?.steps?.forEach((step, i) => {
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
  const simple = {
    name: flow.flow.name,
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
  return simple;
}
