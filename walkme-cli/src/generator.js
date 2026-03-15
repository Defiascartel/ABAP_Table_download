/**
 * WalkMe Flow Generator
 *
 * Genera flussi WalkMe a partire da un prompt strutturato.
 * Il generatore analizza il prompt e costruisce step WalkMe
 * usando i selettori SAP Fiori/BTP Work Zone.
 */

import {
  getSelectorSuggestion,
  getTransactionInfo,
  WALKME_STEP_TYPES,
  SAP_TRANSACTION_MAP,
  FIORI_SHELL,
  FIORI_LAUNCHPAD,
  BTP_WORKZONE,
  UI5_FORM,
  UI5_TABLE,
  UI5_TOOLBAR,
  UI5_DIALOG,
  UI5_OBJECT_PAGE,
  FIORI_NAVIGATION,
} from './templates/sap-fiori.js';

import {
  createFlow,
  createPopupStep,
  createClickStep,
  createTypeStep,
  createSelectStep,
  createRedirectStep,
  createWaitStep,
  createSplitStep,
  createAutoStep,
  createGoal,
  createSmartTipSet,
  createSmartTip,
  createLauncher,
  createShoutOut,
  createShoutOutButton,
  createSurvey,
  createSurveyQuestion,
  createShuttle,
  createShuttlePage,
  createResourceMenu,
  createResourceItem,
  validateFlow,
  flowToSimpleFormat,
} from './schema/walkme-flow.js';

/**
 * Analizza un prompt e genera un flusso WalkMe
 */
export function generateFlowFromSpec(spec) {
  const flow = createFlow({
    name: spec.name,
    description: spec.description || '',
    sapTransaction: spec.transaction || null,
    fioriApp: spec.fioriApp || null,
    targetUrl: spec.targetUrl || null,
    language: spec.language || 'it',
    tags: spec.tags || [],
  });

  // Se c'è un codice transazione, arricchisci con info Fiori
  if (spec.transaction) {
    const txInfo = getTransactionInfo(spec.transaction);
    if (txInfo) {
      flow.flow.sapContext.fioriApp = txInfo.fioriApp;
      if (!spec.name) {
        flow.flow.name = txInfo.title;
      }
    }
  }

  // Genera gli step dalla specifica
  if (spec.steps && Array.isArray(spec.steps)) {
    flow.flow.steps = spec.steps.map((stepSpec, index) => {
      return buildStep(stepSpec, index + 1);
    });
  }

  // Aggiungi goals
  if (spec.goals && Array.isArray(spec.goals)) {
    flow.flow.goals = spec.goals.map(g => createGoal(g));
  }

  return flow;
}

/**
 * Costruisce un singolo step WalkMe dalla specifica
 */
function buildStep(stepSpec, order) {
  // Risolvi il selettore se è un riferimento a un elemento noto
  const selector = resolveSelector(stepSpec);

  const builders = {
    popup: () => createPopupStep({
      title: stepSpec.title || `Step ${order}`,
      content: stepSpec.content || stepSpec.text || '',
      selector,
      position: stepSpec.position || 'auto',
      order,
    }),
    click: () => createClickStep({
      title: stepSpec.title || `Clicca`,
      content: stepSpec.content || stepSpec.text || '',
      selector,
      position: stepSpec.position || 'auto',
      order,
    }),
    type: () => createTypeStep({
      title: stepSpec.title || `Inserisci`,
      content: stepSpec.content || stepSpec.text || '',
      selector,
      inputValue: stepSpec.inputValue || stepSpec.value || '',
      placeholder: stepSpec.placeholder || '',
      order,
    }),
    select: () => createSelectStep({
      title: stepSpec.title || `Seleziona`,
      content: stepSpec.content || stepSpec.text || '',
      selector,
      selectValue: stepSpec.selectValue || stepSpec.value || '',
      options: stepSpec.options || [],
      order,
    }),
    redirect: () => createRedirectStep({
      title: stepSpec.title || `Navigazione`,
      content: stepSpec.content || stepSpec.text || '',
      url: stepSpec.url || '',
      order,
    }),
    waitFor: () => createWaitStep({
      title: stepSpec.title || 'Attendi...',
      content: stepSpec.content || stepSpec.text || '',
      selector,
      timeout: stepSpec.timeout || 10000,
      order,
    }),
    splitStep: () => createSplitStep({
      title: stepSpec.title || 'Condizione',
      condition: stepSpec.condition || '',
      trueBranch: (stepSpec.trueBranch || []).map((s, i) => buildStep(s, `${order}.T${i + 1}`)),
      falseBranch: (stepSpec.falseBranch || []).map((s, i) => buildStep(s, `${order}.F${i + 1}`)),
      order,
    }),
    autoStep: () => createAutoStep({
      title: stepSpec.title || 'Auto',
      selector,
      action: stepSpec.action || 'click',
      value: stepSpec.value || null,
      order,
    }),
  };

  const type = stepSpec.type || 'popup';
  const builder = builders[type];
  if (!builder) {
    return createPopupStep({
      title: stepSpec.title || `Step ${order}`,
      content: stepSpec.content || stepSpec.text || `Tipo sconosciuto: ${type}`,
      selector: selector || 'body',
      order,
    });
  }

  return builder();
}

/**
 * Risolve un selettore da una specifica step.
 * Accetta sia selettori CSS diretti che riferimenti a elementi noti.
 */
function resolveSelector(stepSpec) {
  // Se c'è un selettore CSS diretto, usalo
  if (stepSpec.selector) return stepSpec.selector;

  // Se c'è un riferimento a un tipo di elemento, risolvi
  if (stepSpec.element) {
    const suggestion = getSelectorSuggestion(stepSpec.element, {
      title: stepSpec.elementTitle,
      id: stepSpec.elementId,
      label: stepSpec.elementLabel,
      text: stepSpec.elementText,
      index: stepSpec.elementIndex,
    });
    if (suggestion) return suggestion;
  }

  // Riferimenti shorthand
  if (stepSpec.fioriElement) {
    const elementMap = {
      'shell-header': FIORI_SHELL.header,
      'back-button': FIORI_SHELL.backButton,
      'home-button': FIORI_SHELL.homeButton,
      'user-menu': FIORI_SHELL.userActionsMenu,
      'search': FIORI_SHELL.searchButton,
      'notifications': FIORI_SHELL.notificationsButton,
      'tile-container': FIORI_LAUNCHPAD.tileContainer,
      'filter-bar': UI5_FORM.smartFilterBar,
      'smart-table': UI5_FORM.smartTable,
      'toolbar': UI5_TOOLBAR.toolbar,
      'create-btn': UI5_TOOLBAR.createButton,
      'edit-btn': UI5_TOOLBAR.editButton,
      'save-btn': UI5_TOOLBAR.saveButton,
      'delete-btn': UI5_TOOLBAR.deleteButton,
      'cancel-btn': UI5_TOOLBAR.cancelButton,
      'submit-btn': UI5_TOOLBAR.submitButton,
      'go-btn': UI5_TOOLBAR.goButton,
      'dialog': UI5_DIALOG.dialog,
      'dialog-confirm': UI5_DIALOG.confirmButton,
      'dialog-cancel': UI5_DIALOG.cancelButton,
      'object-page': UI5_OBJECT_PAGE.objectPage,
      'anchor-bar': UI5_OBJECT_PAGE.anchorBar,
    };
    return elementMap[stepSpec.fioriElement] || stepSpec.fioriElement;
  }

  return null;
}

/**
 * Genera un flusso di esempio per una transazione SAP
 */
export function generateTemplateForTransaction(tcode) {
  const txInfo = getTransactionInfo(tcode);
  if (!txInfo) return null;

  const spec = {
    name: `Guida: ${txInfo.title} (${tcode})`,
    description: `Smart Walk-Thru per ${txInfo.title} in SAP Fiori`,
    transaction: tcode,
    fioriApp: txInfo.fioriApp,
    tags: [txInfo.group, tcode, 'SAP Fiori'],
    steps: [
      {
        type: 'popup',
        title: 'Benvenuto',
        content: `Questa guida ti mostrerà come ${txInfo.title.toLowerCase()} in SAP Fiori.`,
        fioriElement: 'shell-header',
        position: 'bottom',
      },
      {
        type: 'click',
        title: 'Apri l\'applicazione',
        content: `Cerca e clicca sul tile "${txInfo.title}" nel Launchpad.`,
        element: 'tile',
        elementTitle: txInfo.title,
      },
      {
        type: 'waitFor',
        title: 'Caricamento...',
        content: 'Attendi il caricamento dell\'applicazione.',
        fioriElement: 'filter-bar',
        timeout: 15000,
      },
    ],
    goals: [
      {
        name: `${txInfo.title} completato`,
        type: 'custom',
      },
    ],
  };

  return generateFlowFromSpec(spec);
}

// ─── Generatori per tutti i tipi di contenuto ─────────────

/**
 * Genera un set di SmartTips da specifica
 */
export function generateSmartTipsFromSpec(spec) {
  const tipSet = createSmartTipSet({
    name: spec.name,
    description: spec.description || '',
    sapTransaction: spec.transaction || null,
    fioriApp: spec.fioriApp || null,
    language: spec.language || 'it',
    tags: spec.tags || [],
  });

  if (spec.tips && Array.isArray(spec.tips)) {
    tipSet.smartTips.tips = spec.tips.map((tipSpec, i) => {
      const selector = resolveSelector(tipSpec);
      return createSmartTip({
        selector,
        title: tipSpec.title || '',
        content: tipSpec.content || tipSpec.text || '',
        position: tipSpec.position || 'auto',
        trigger: tipSpec.trigger || 'hover',
        icon: tipSpec.icon || 'info',
        rules: tipSpec.rules || null,
        order: i + 1,
      });
    });
  }

  return tipSet;
}

/**
 * Genera un Launcher da specifica
 */
export function generateLauncherFromSpec(spec) {
  return createLauncher({
    name: spec.name,
    description: spec.description || '',
    sapTransaction: spec.transaction || null,
    fioriApp: spec.fioriApp || null,
    language: spec.language || 'it',
    tags: spec.tags || [],
    shape: spec.shape || 'button',
    icon: spec.icon || 'play',
    label: spec.label || '',
    position: spec.position || 'bottom-right',
    action: spec.action || { type: 'startWalkThru', target: null },
    rules: spec.rules || null,
  });
}

/**
 * Genera uno ShoutOut da specifica
 */
export function generateShoutOutFromSpec(spec) {
  const shoutOut = createShoutOut({
    name: spec.name,
    description: spec.description || '',
    language: spec.language || 'it',
    tags: spec.tags || [],
    template: spec.template || 'dialog',
    title: spec.title || spec.name,
    content: spec.content || '',
    position: spec.position || 'center',
    frequency: spec.frequency || 'once',
    segmentation: spec.segmentation || null,
    rules: spec.rules || null,
  });

  if (spec.buttons && Array.isArray(spec.buttons)) {
    shoutOut.shoutOut.buttons = spec.buttons.map(b => createShoutOutButton(b));
  }

  if (spec.media) {
    shoutOut.shoutOut.media = spec.media;
  }

  return shoutOut;
}

/**
 * Genera un Survey da specifica
 */
export function generateSurveyFromSpec(spec) {
  const survey = createSurvey({
    name: spec.name,
    description: spec.description || '',
    language: spec.language || 'it',
    tags: spec.tags || [],
    title: spec.title || spec.name,
    thankYouMessage: spec.thankYouMessage || 'Grazie per il tuo feedback!',
    frequency: spec.frequency || 'once',
    segmentation: spec.segmentation || null,
    rules: spec.rules || null,
  });

  if (spec.questions && Array.isArray(spec.questions)) {
    survey.survey.questions = spec.questions.map((q, i) =>
      createSurveyQuestion({
        questionText: q.questionText || q.text || q.question || '',
        type: q.type || 'rating',
        required: q.required !== false,
        options: q.options || [],
        scaleMin: q.scaleMin || 1,
        scaleMax: q.scaleMax || 5,
        scaleLabels: q.scaleLabels || null,
        placeholder: q.placeholder || '',
        order: i + 1,
      })
    );
  }

  return survey;
}

/**
 * Genera uno Shuttle da specifica
 */
export function generateShuttleFromSpec(spec) {
  const shuttle = createShuttle({
    name: spec.name,
    description: spec.description || '',
    language: spec.language || 'it',
    tags: spec.tags || [],
    title: spec.title || spec.name,
    position: spec.position || 'center',
    frequency: spec.frequency || 'once',
    segmentation: spec.segmentation || null,
    rules: spec.rules || null,
  });

  if (spec.pages && Array.isArray(spec.pages)) {
    shuttle.shuttle.pages = spec.pages.map((p, i) =>
      createShuttlePage({
        title: p.title || '',
        content: p.content || p.text || '',
        media: p.media || null,
        buttons: p.buttons || [],
        order: i + 1,
      })
    );
  }

  return shuttle;
}

/**
 * Genera un Resource menu da specifica
 */
export function generateResourceMenuFromSpec(spec) {
  const menu = createResourceMenu({
    name: spec.name,
    description: spec.description || '',
    language: spec.language || 'it',
    tags: spec.tags || [],
    title: spec.title || 'Risorse',
    icon: spec.icon || 'help',
    position: spec.position || 'bottom-right',
    searchEnabled: spec.searchEnabled !== false,
    rules: spec.rules || null,
  });

  if (spec.items && Array.isArray(spec.items)) {
    menu.resource.items = spec.items.map((item, i) =>
      createResourceItem({
        title: item.title || '',
        description: item.description || '',
        type: item.type || 'walkthru',
        target: item.target || null,
        icon: item.icon || null,
        category: item.category || null,
        order: i + 1,
      })
    );
  }

  return menu;
}

/**
 * Genera qualsiasi tipo di contenuto WalkMe da specifica
 */
export function generateFromSpec(spec) {
  const contentType = (spec.contentType || spec.type || 'SmartWalkThru').toLowerCase();

  const generators = {
    smartwalkthru: generateFlowFromSpec,
    walkthru: generateFlowFromSpec,
    flow: generateFlowFromSpec,
    smarttips: generateSmartTipsFromSpec,
    tips: generateSmartTipsFromSpec,
    launcher: generateLauncherFromSpec,
    shoutout: generateShoutOutFromSpec,
    survey: generateSurveyFromSpec,
    shuttle: generateShuttleFromSpec,
    resource: generateResourceMenuFromSpec,
    resources: generateResourceMenuFromSpec,
  };

  const generator = generators[contentType];
  if (!generator) {
    throw new Error(`Tipo di contenuto non supportato: ${contentType}. Usa: SmartWalkThru, SmartTips, Launcher, ShoutOut, Survey, Shuttle, Resource`);
  }

  return generator(spec);
}

/**
 * Valida e formatta un flusso per l'output
 */
export function prepareFlowOutput(flow, format = 'json') {
  const validation = validateFlow(flow);

  return {
    flow,
    validation,
    simple: flowToSimpleFormat(flow),
  };
}
