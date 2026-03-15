import {
  FIORI_SHELL,
  FIORI_LAUNCHPAD,
  BTP_WORKZONE,
  UI5_FORM,
  UI5_TABLE,
  UI5_TOOLBAR,
  UI5_DIALOG,
  UI5_OBJECT_PAGE,
  FIORI_NAVIGATION,
} from '../templates/sap-fiori.js';

const GROUPS = {
  shell: { label: 'Fiori Shell (Header)', data: FIORI_SHELL },
  launchpad: { label: 'Fiori Launchpad', data: FIORI_LAUNCHPAD },
  btp: { label: 'BTP Work Zone', data: BTP_WORKZONE },
  form: { label: 'UI5 Form Elements', data: UI5_FORM },
  table: { label: 'UI5 Table/List', data: UI5_TABLE },
  toolbar: { label: 'UI5 Toolbar Actions', data: UI5_TOOLBAR },
  dialog: { label: 'UI5 Dialog/Messages', data: UI5_DIALOG },
  objectpage: { label: 'UI5 Object Page', data: UI5_OBJECT_PAGE },
  navigation: { label: 'Fiori Navigation', data: FIORI_NAVIGATION },
};

export function selectorsCommand(options) {
  const groupsToShow = options.group
    ? { [options.group]: GROUPS[options.group] }
    : GROUPS;

  if (options.group && !GROUPS[options.group]) {
    console.error(`Gruppo "${options.group}" non trovato.`);
    console.log('Gruppi disponibili: ' + Object.keys(GROUPS).join(', '));
    process.exit(1);
  }

  Object.entries(groupsToShow).forEach(([key, group]) => {
    console.log(`\n${group.label}`);
    console.log('─'.repeat(50));

    Object.entries(group.data).forEach(([name, value]) => {
      if (typeof value === 'function') {
        console.log(`  ${name}(...)  → funzione dinamica`);
      } else {
        console.log(`  ${name.padEnd(24)} ${value}`);
      }
    });
  });

  console.log('\nNota: i selettori con (...) sono funzioni che accettano parametri.');
  console.log('Nella specifica del flusso, usa "element" e "elementTitle"/"elementId" per invocarli.');
}
