/**
 * SAP Fiori / BTP Work Zone - Elemento Library
 *
 * Mappatura dei selettori CSS/jQuery per gli elementi UI5 comuni
 * nell'interfaccia SAP Fiori Launchpad e BTP Work Zone.
 */

// Selettori per aree principali di SAP Fiori Launchpad / BTP Work Zone
export const FIORI_SHELL = {
  header: '#shell-header',
  headerLogo: '#shell-header-logo',
  headerTitle: '.sapUshellShellHeadTitle',
  searchButton: '#sf',
  notificationsButton: '#NotificationsCountButton',
  userActionsMenu: '#meAreaHeaderButton',
  backButton: '#backBtn',
  homeButton: '#homeBtn',
  appFinderButton: '#openCatalogBtn',
};

export const FIORI_LAUNCHPAD = {
  tileContainer: '.sapUshellTileContainer',
  tile: '.sapUshellTile',
  tileByTitle: (title) => `.sapUshellTile[title="${title}"]`,
  tileByAppId: (appId) => `[data-tile-id="${appId}"]`,
  groupHeader: '.sapUshellGroupHeaderVisible',
  searchField: '.sapUshellSearchField input',
  myHome: '#Shell-home',
};

// Selettori per BTP Work Zone specifici
export const BTP_WORKZONE = {
  workspace: '.sapCepWorkspace',
  workPage: '.sapCepWorkPage',
  sideNavigation: '.sapTntSideNavigation',
  appContainer: '#canvas',
  shellBarMenu: '.sapFShellBarMenuButton',
  shellBarSearch: '.sapFShellBarSearch',
  pageHeader: '.sapCepPageHeader',
  section: '.sapCepSection',
  card: '.sapFCard',
  cardByTitle: (title) => `.sapFCard:has(.sapFCardTitle:contains("${title}"))`,
};

// Selettori comuni per elementi UI5 nei form SAP
export const UI5_FORM = {
  input: (id) => `input[id*="${id}"]`,
  inputByLabel: (label) => `[aria-label="${label}"] input, label:contains("${label}") ~ input`,
  select: (id) => `[id*="${id}"].sapMSlt`,
  comboBox: (id) => `[id*="${id}"].sapMCb`,
  dateField: (id) => `[id*="${id}"].sapMDP`,
  textArea: (id) => `[id*="${id}"].sapMTextArea textarea`,
  checkbox: (id) => `[id*="${id}"].sapMCb`,
  radioButton: (id) => `[id*="${id}"].sapMRb`,
  switch: (id) => `[id*="${id}"].sapMSwt`,
  valueHelp: (id) => `[id*="${id}"] .sapMInputBaseIconContainer`,
  smartField: (id) => `[id*="${id}"].sapUiCompSmartField`,
  smartFilterBar: '.sapUiCompFilterBar',
  smartTable: '.sapUiCompSmartTable',
};

// Selettori per tabelle e liste UI5
export const UI5_TABLE = {
  table: '.sapMList, .sapUiTable',
  row: '.sapMLIB, .sapUiTableRow',
  cell: '.sapMListTblCell, .sapUiTableCell',
  headerCell: '.sapMListTblHeaderCell, .sapUiTableHeaderCell',
  selectAll: '.sapMListTblSelCol .sapMCb',
  rowByIndex: (i) => `.sapUiTableRow:nth-child(${i + 1})`,
  columnByTitle: (title) => `.sapUiTableHeaderCell:contains("${title}")`,
  sortButton: '.sapMListTblSortIcon',
  filterButton: '.sapMListTblFilterIcon',
  paginatorNext: '.sapMPagBtnNext',
  paginatorPrev: '.sapMPagBtnPrev',
};

// Toolbar e azioni
export const UI5_TOOLBAR = {
  toolbar: '.sapMTB',
  createButton: '.sapMBarChild button[id*="addEntry"], .sapMBarChild button[id*="Create"]',
  editButton: '.sapMBarChild button[id*="edit"], .sapMBarChild button[id*="Edit"]',
  deleteButton: '.sapMBarChild button[id*="delete"], .sapMBarChild button[id*="Delete"]',
  saveButton: '.sapMBarChild button[id*="save"], .sapMBarChild button[id*="Save"]',
  cancelButton: '.sapMBarChild button[id*="cancel"], .sapMBarChild button[id*="Cancel"]',
  submitButton: '.sapMBarChild button[id*="submit"], .sapMBarChild button[id*="Submit"]',
  postButton: '.sapMBarChild button[id*="post"], .sapMBarChild button[id*="Post"]',
  filterButton: '.sapMBarChild button[id*="filter"]',
  sortButton: '.sapMBarChild button[id*="sort"]',
  exportButton: '.sapMBarChild button[id*="export"]',
  settingsButton: '.sapMBarChild button[id*="settings"]',
  goButton: '.sapMBarChild button[id*="btnGo"]',
};

// Dialog e messaggi
export const UI5_DIALOG = {
  dialog: '.sapMDialog',
  dialogTitle: '.sapMDialogTitle',
  dialogContent: '.sapMDialogSection',
  messageBox: '.sapMMessageBox',
  messageStrip: '.sapMMsgStrip',
  messagePopover: '.sapMMsgPopover',
  confirmButton: '.sapMDialogFooter .sapMBtnAccept, .sapMBtnEmphasized',
  cancelButton: '.sapMDialogFooter .sapMBtnReject',
  closeButton: '.sapMDialogFooter button[id*="close"]',
};

// Object Page (dettaglio oggetto SAP)
export const UI5_OBJECT_PAGE = {
  objectPage: '.sapUxAPObjectPageLayout',
  headerTitle: '.sapUxAPObjectPageHeaderTitle',
  headerContent: '.sapUxAPObjectPageHeaderContent',
  section: '.sapUxAPObjectPageSection',
  sectionByTitle: (title) => `.sapUxAPObjectPageSection:has(.sapUxAPObjectPageSectionTitle:contains("${title}"))`,
  subSection: '.sapUxAPObjectPageSubSection',
  anchorBar: '.sapUxAPAnchorBar',
  anchorBarButton: (sectionName) => `.sapUxAPAnchorBarButton:contains("${sectionName}")`,
  editButton: '.sapUxAPObjectPageHeaderContent button[id*="edit"]',
};

// Navigazione e routing
export const FIORI_NAVIGATION = {
  semanticObject: (obj, action) => `#${obj}-${action}`,
  appByIntent: (intent) => `a[href*="${intent}"]`,
  breadcrumb: '.sapMBreadcrumbs',
  breadcrumbLink: '.sapMBreadcrumbsLink',
  tabBar: '.sapMITB',
  tabByText: (text) => `.sapMITBText:contains("${text}")`,
  iconTabFilter: '.sapMITBFilter',
};

// Mappatura Transazioni SAP -> App Fiori
export const SAP_TRANSACTION_MAP = {
  // Sales & Distribution (SD)
  VA01: { fioriApp: 'SalesOrder-create', title: 'Create Sales Order', group: 'SD' },
  VA02: { fioriApp: 'SalesOrder-change', title: 'Change Sales Order', group: 'SD' },
  VA03: { fioriApp: 'SalesOrder-display', title: 'Display Sales Order', group: 'SD' },
  VL01N: { fioriApp: 'OutboundDelivery-create', title: 'Create Outbound Delivery', group: 'SD' },
  VF01: { fioriApp: 'BillingDocument-create', title: 'Create Billing Document', group: 'SD' },
  VF02: { fioriApp: 'BillingDocument-change', title: 'Change Billing Document', group: 'SD' },

  // Materials Management (MM)
  ME21N: { fioriApp: 'PurchaseOrder-create', title: 'Create Purchase Order', group: 'MM' },
  ME22N: { fioriApp: 'PurchaseOrder-change', title: 'Change Purchase Order', group: 'MM' },
  ME23N: { fioriApp: 'PurchaseOrder-display', title: 'Display Purchase Order', group: 'MM' },
  ME51N: { fioriApp: 'PurchaseRequisition-create', title: 'Create Purchase Requisition', group: 'MM' },
  MIGO: { fioriApp: 'GoodsMovement-create', title: 'Goods Movement', group: 'MM' },
  MIRO: { fioriApp: 'IncomingInvoice-create', title: 'Enter Incoming Invoice', group: 'MM' },
  MM01: { fioriApp: 'Material-create', title: 'Create Material', group: 'MM' },
  MM02: { fioriApp: 'Material-change', title: 'Change Material', group: 'MM' },

  // Finance (FI)
  FB01: { fioriApp: 'AccountingDocument-create', title: 'Post Document', group: 'FI' },
  FB02: { fioriApp: 'AccountingDocument-change', title: 'Change Document', group: 'FI' },
  FB03: { fioriApp: 'AccountingDocument-display', title: 'Display Document', group: 'FI' },
  F110: { fioriApp: 'PaymentRun-manage', title: 'Payment Run', group: 'FI' },
  FBL1N: { fioriApp: 'VendorLineItems-display', title: 'Vendor Line Items', group: 'FI' },
  FBL5N: { fioriApp: 'CustomerLineItems-display', title: 'Customer Line Items', group: 'FI' },

  // Controlling (CO)
  KS01: { fioriApp: 'CostCenter-create', title: 'Create Cost Center', group: 'CO' },
  KP06: { fioriApp: 'CostPlanning-change', title: 'Change Cost Planning', group: 'CO' },

  // Production Planning (PP)
  CO01: { fioriApp: 'ProductionOrder-create', title: 'Create Production Order', group: 'PP' },
  CO02: { fioriApp: 'ProductionOrder-change', title: 'Change Production Order', group: 'PP' },
  MD04: { fioriApp: 'StockRequirementsList-display', title: 'Stock/Requirements List', group: 'PP' },

  // Human Capital Management (HCM)
  PA20: { fioriApp: 'EmployeeMaster-display', title: 'Display HR Master Data', group: 'HCM' },
  PA30: { fioriApp: 'EmployeeMaster-maintain', title: 'Maintain HR Master Data', group: 'HCM' },

  // Plant Maintenance (PM)
  IW21: { fioriApp: 'MaintenanceNotification-create', title: 'Create Notification', group: 'PM' },
  IW31: { fioriApp: 'MaintenanceOrder-create', title: 'Create Maintenance Order', group: 'PM' },

  // Project System (PS)
  CJ20N: { fioriApp: 'Project-edit', title: 'Project Builder', group: 'PS' },

  // Quality Management (QM)
  QA01: { fioriApp: 'InspectionLot-create', title: 'Create Inspection Lot', group: 'QM' },

  // Cross-Application
  BP: { fioriApp: 'BusinessPartner-manage', title: 'Business Partner', group: 'CA' },
  NWBC: { fioriApp: 'Launchpad-open', title: 'NetWeaver Business Client', group: 'CA' },
};

// Step types WalkMe disponibili
export const WALKME_STEP_TYPES = {
  popup: {
    name: 'Popup',
    description: 'Balloon informativo con testo, ancorato a un elemento',
    fields: ['selector', 'title', 'content', 'position'],
  },
  click: {
    name: 'Click',
    description: 'Indica all\'utente di cliccare su un elemento specifico',
    fields: ['selector', 'title', 'content'],
  },
  type: {
    name: 'Type',
    description: 'Indica all\'utente di inserire testo in un campo',
    fields: ['selector', 'title', 'content', 'inputValue'],
  },
  select: {
    name: 'Select',
    description: 'Indica all\'utente di selezionare un valore da un dropdown',
    fields: ['selector', 'title', 'content', 'selectValue'],
  },
  redirect: {
    name: 'Redirect',
    description: 'Naviga l\'utente a un URL specifico',
    fields: ['url', 'title', 'content'],
  },
  splitStep: {
    name: 'Split Step',
    description: 'Branch condizionale nel flusso',
    fields: ['condition', 'trueBranch', 'falseBranch'],
  },
  autoStep: {
    name: 'Auto Step',
    description: 'Azione automatica senza interazione utente',
    fields: ['selector', 'action', 'value'],
  },
  waitFor: {
    name: 'Wait For',
    description: 'Attende che un elemento appaia o che una condizione sia vera',
    fields: ['selector', 'timeout', 'condition'],
  },
};

// Posizioni del balloon
export const BALLOON_POSITIONS = [
  'top', 'bottom', 'left', 'right',
  'top-left', 'top-right', 'bottom-left', 'bottom-right',
  'auto',
];

/**
 * Ritorna il selettore suggerito per un tipo di elemento Fiori
 */
export function getSelectorSuggestion(elementType, context = {}) {
  const suggestions = {
    'tile': context.title ? FIORI_LAUNCHPAD.tileByTitle(context.title) : FIORI_LAUNCHPAD.tile,
    'input': context.id ? UI5_FORM.input(context.id) : context.label ? UI5_FORM.inputByLabel(context.label) : 'input.sapMInputBaseInner',
    'button-create': UI5_TOOLBAR.createButton,
    'button-edit': UI5_TOOLBAR.editButton,
    'button-save': UI5_TOOLBAR.saveButton,
    'button-delete': UI5_TOOLBAR.deleteButton,
    'button-cancel': UI5_TOOLBAR.cancelButton,
    'button-submit': UI5_TOOLBAR.submitButton,
    'button-go': UI5_TOOLBAR.goButton,
    'value-help': context.id ? UI5_FORM.valueHelp(context.id) : '.sapMInputBaseIconContainer',
    'table': UI5_TABLE.table,
    'table-row': context.index !== undefined ? UI5_TABLE.rowByIndex(context.index) : UI5_TABLE.row,
    'dialog-confirm': UI5_DIALOG.confirmButton,
    'dialog-cancel': UI5_DIALOG.cancelButton,
    'section': context.title ? UI5_OBJECT_PAGE.sectionByTitle(context.title) : UI5_OBJECT_PAGE.section,
    'tab': context.text ? FIORI_NAVIGATION.tabByText(context.text) : FIORI_NAVIGATION.tabBar,
    'back': FIORI_SHELL.backButton,
    'home': FIORI_SHELL.homeButton,
    'user-menu': FIORI_SHELL.userActionsMenu,
    'search': FIORI_SHELL.searchButton,
    'filter-bar': UI5_FORM.smartFilterBar,
    'smart-table': UI5_FORM.smartTable,
  };

  return suggestions[elementType] || null;
}

/**
 * Dato un codice transazione SAP, ritorna le info dell'app Fiori
 */
export function getTransactionInfo(tcode) {
  return SAP_TRANSACTION_MAP[tcode.toUpperCase()] || null;
}

/**
 * Lista tutte le transazioni per modulo
 */
export function getTransactionsByModule(module) {
  return Object.entries(SAP_TRANSACTION_MAP)
    .filter(([, info]) => info.group === module.toUpperCase())
    .map(([tcode, info]) => ({ tcode, ...info }));
}
