import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import yaml from 'js-yaml';
import { generateFlowFromSpec, prepareFlowOutput } from '../generator.js';

export async function generateCommand(options) {
  try {
    let spec;

    if (options.file) {
      // Carica specifica da file
      const filePath = resolve(options.file);
      const content = readFileSync(filePath, 'utf-8');

      if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
        spec = yaml.load(content);
      } else {
        spec = JSON.parse(content);
      }
    } else {
      // Modalità interattiva
      const { default: inquirer } = await import('inquirer');

      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Nome del flusso WalkMe:',
          validate: (v) => v.length > 0 || 'Il nome è obbligatorio',
        },
        {
          type: 'input',
          name: 'description',
          message: 'Descrizione del flusso:',
        },
        {
          type: 'input',
          name: 'transaction',
          message: 'Codice transazione SAP (opzionale, es. VA01):',
        },
        {
          type: 'input',
          name: 'tags',
          message: 'Tags (separati da virgola):',
        },
      ]);

      // Costruisci step interattivamente
      const steps = [];
      let addMore = true;

      while (addMore) {
        console.log(`\n--- Step ${steps.length + 1} ---`);
        const stepAnswers = await inquirer.prompt([
          {
            type: 'list',
            name: 'type',
            message: 'Tipo di step:',
            choices: [
              { name: 'Popup - Balloon informativo', value: 'popup' },
              { name: 'Click - Indica di cliccare', value: 'click' },
              { name: 'Type - Inserimento testo', value: 'type' },
              { name: 'Select - Selezione dropdown', value: 'select' },
              { name: 'Redirect - Navigazione URL', value: 'redirect' },
              { name: 'Wait - Attendi elemento', value: 'waitFor' },
              { name: 'Auto - Azione automatica', value: 'autoStep' },
              { name: 'Split - Branch condizionale', value: 'splitStep' },
            ],
          },
          {
            type: 'input',
            name: 'title',
            message: 'Titolo dello step:',
          },
          {
            type: 'input',
            name: 'content',
            message: 'Testo/contenuto dello step:',
          },
          {
            type: 'input',
            name: 'selector',
            message: 'Selettore CSS (o nome elemento Fiori, es. "create-btn", "save-btn"):',
            when: (a) => !['redirect', 'splitStep'].includes(a.type),
          },
          {
            type: 'input',
            name: 'url',
            message: 'URL di destinazione:',
            when: (a) => a.type === 'redirect',
          },
          {
            type: 'input',
            name: 'value',
            message: 'Valore da inserire/selezionare:',
            when: (a) => ['type', 'select'].includes(a.type),
          },
        ]);

        // Mappa nomi shorthand a fioriElement
        const fioriShorthand = [
          'shell-header', 'back-button', 'home-button', 'user-menu',
          'search', 'notifications', 'tile-container', 'filter-bar',
          'smart-table', 'toolbar', 'create-btn', 'edit-btn',
          'save-btn', 'delete-btn', 'cancel-btn', 'submit-btn',
          'go-btn', 'dialog', 'dialog-confirm', 'dialog-cancel',
          'object-page', 'anchor-bar',
        ];

        const step = {
          type: stepAnswers.type,
          title: stepAnswers.title,
          content: stepAnswers.content,
        };

        if (stepAnswers.selector) {
          if (fioriShorthand.includes(stepAnswers.selector)) {
            step.fioriElement = stepAnswers.selector;
          } else {
            step.selector = stepAnswers.selector;
          }
        }
        if (stepAnswers.url) step.url = stepAnswers.url;
        if (stepAnswers.value) step.inputValue = stepAnswers.value;

        steps.push(step);

        const { more } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'more',
            message: 'Aggiungere un altro step?',
            default: true,
          },
        ]);
        addMore = more;
      }

      spec = {
        name: answers.name,
        description: answers.description,
        transaction: answers.transaction || null,
        tags: answers.tags ? answers.tags.split(',').map(t => t.trim()) : [],
        steps,
      };
    }

    // Genera il flusso
    const flow = generateFlowFromSpec(spec);
    const result = prepareFlowOutput(flow, options.format);

    // Mostra validazione
    if (result.validation.errors.length > 0) {
      console.error('\nErrori di validazione:');
      result.validation.errors.forEach(e => console.error(`  ✗ ${e}`));
    }
    if (result.validation.warnings.length > 0) {
      console.warn('\nAvvisi:');
      result.validation.warnings.forEach(w => console.warn(`  ⚠ ${w}`));
    }

    // Output
    const outputData = options.simple ? result.simple : result.flow;
    let outputStr;
    if (options.format === 'yaml') {
      outputStr = yaml.dump(outputData, { indent: 2, lineWidth: 120, noRefs: true });
    } else {
      outputStr = JSON.stringify(outputData, null, 2);
    }

    if (options.output) {
      const outPath = resolve(options.output);
      writeFileSync(outPath, outputStr, 'utf-8');
      console.log(`\nFlusso salvato in: ${outPath}`);
    } else {
      console.log('\n--- Flusso Generato ---\n');
      console.log(outputStr);
    }

    if (result.validation.valid) {
      console.log('\n✓ Flusso valido e pronto per WalkMe Editor');
    }

  } catch (error) {
    console.error(`Errore: ${error.message}`);
    process.exit(1);
  }
}
