import { writeFileSync } from 'fs';
import { resolve } from 'path';
import yaml from 'js-yaml';
import { getTransactionInfo } from '../templates/sap-fiori.js';

export function specCommand(options) {
  let spec = {
    name: 'Nome del flusso WalkMe',
    description: 'Descrizione del flusso',
    transaction: null,
    fioriApp: null,
    targetUrl: null,
    language: 'it',
    tags: ['SAP', 'Fiori'],
    steps: [
      {
        type: 'popup',
        title: 'Benvenuto',
        content: 'Testo del primo step',
        fioriElement: 'shell-header',
        position: 'bottom',
      },
      {
        type: 'click',
        title: 'Esempio click',
        content: 'Clicca qui per continuare',
        selector: '.sapUshellTile[title="App Name"]',
      },
      {
        type: 'type',
        title: 'Esempio input',
        content: 'Inserisci il valore richiesto',
        selector: 'input[id*="fieldId"]',
        inputValue: 'valore esempio',
      },
      {
        type: 'click',
        title: 'Salva',
        content: 'Clicca Salva per completare',
        fioriElement: 'save-btn',
      },
    ],
    goals: [
      {
        name: 'Operazione completata',
        type: 'custom',
      },
    ],
  };

  // Pre-compila con info transazione se fornita
  if (options.transaction) {
    const txInfo = getTransactionInfo(options.transaction);
    if (txInfo) {
      spec.name = `Guida: ${txInfo.title} (${options.transaction})`;
      spec.description = `Smart Walk-Thru per ${txInfo.title} in SAP Fiori`;
      spec.transaction = options.transaction.toUpperCase();
      spec.fioriApp = txInfo.fioriApp;
      spec.tags = [txInfo.group, options.transaction.toUpperCase(), 'SAP Fiori'];
    } else {
      spec.transaction = options.transaction.toUpperCase();
      console.warn(`Transazione "${options.transaction}" non trovata nel catalogo. Template generico creato.`);
    }
  }

  let outputStr;
  if (options.format === 'yaml') {
    outputStr = '# Specifica flusso WalkMe per SAP Fiori / BTP Work Zone\n';
    outputStr += '# Modifica questo file e poi genera il flusso con:\n';
    outputStr += '#   walkme-cli generate -f <questo-file>\n';
    outputStr += '#\n';
    outputStr += '# Tipi di step disponibili: popup, click, type, select, redirect, waitFor, autoStep, splitStep\n';
    outputStr += '# Elementi Fiori shorthand: shell-header, back-button, home-button, user-menu,\n';
    outputStr += '#   search, create-btn, edit-btn, save-btn, delete-btn, cancel-btn, submit-btn,\n';
    outputStr += '#   go-btn, filter-bar, smart-table, dialog-confirm, dialog-cancel, object-page\n';
    outputStr += '#\n';
    outputStr += '# Per i selettori CSS completi, usa: walkme-cli selectors\n\n';
    outputStr += yaml.dump(spec, { indent: 2, lineWidth: 120, noRefs: true });
  } else {
    outputStr = JSON.stringify(spec, null, 2);
  }

  if (options.output) {
    const outPath = resolve(options.output);
    writeFileSync(outPath, outputStr, 'utf-8');
    console.log(`Specifica creata: ${outPath}`);
    console.log(`\nProssimi passi:`);
    console.log(`  1. Modifica il file con i tuoi step`);
    console.log(`  2. Genera il flusso: walkme-cli generate -f ${options.output}`);
  } else {
    console.log(outputStr);
  }
}
