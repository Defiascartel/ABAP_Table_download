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
