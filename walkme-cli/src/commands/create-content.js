/**
 * Comandi per generazione SmartTips, Launchers, ShoutOuts, Surveys, Shuttles, Resources
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import yaml from 'js-yaml';
import {
  generateSmartTipsFromSpec,
  generateLauncherFromSpec,
  generateShoutOutFromSpec,
  generateSurveyFromSpec,
  generateShuttleFromSpec,
  generateResourceMenuFromSpec,
  generateFromSpec,
  prepareFlowOutput,
} from '../generator.js';

/**
 * Utility: carica specifica da file o genera da opzioni
 */
function loadSpec(options, defaults = {}) {
  if (options.file) {
    const filePath = resolve(options.file);
    const content = readFileSync(filePath, 'utf-8');
    return filePath.endsWith('.yaml') || filePath.endsWith('.yml')
      ? yaml.load(content)
      : JSON.parse(content);
  }
  return { ...defaults };
}

/**
 * Utility: output risultato
 */
function outputResult(result, options) {
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
    console.log(`Salvato in: ${outPath}`);
  } else {
    console.log(outputStr);
  }

  if (result.validation.errors.length > 0) {
    console.error('\nErrori:');
    result.validation.errors.forEach(e => console.error(`  ! ${e}`));
  }
  if (result.validation.warnings.length > 0) {
    console.warn('\nAvvisi:');
    result.validation.warnings.forEach(w => console.warn(`  ~ ${w}`));
  }
}

// ─── SmartTips ─────────────────────────────────────────────

export async function smartTipsCommand(options) {
  try {
    let spec;
    if (options.file) {
      spec = loadSpec(options);
    } else {
      const { default: inquirer } = await import('inquirer');

      const answers = await inquirer.prompt([
        { type: 'input', name: 'name', message: 'Nome del set SmartTips:', validate: v => v.length > 0 || 'Obbligatorio' },
        { type: 'input', name: 'description', message: 'Descrizione:' },
        { type: 'input', name: 'transaction', message: 'Transazione SAP (opzionale):' },
      ]);

      const tips = [];
      let addMore = true;
      while (addMore) {
        console.log(`\n--- SmartTip ${tips.length + 1} ---`);
        const tip = await inquirer.prompt([
          { type: 'input', name: 'selector', message: 'Selettore CSS dell\'elemento:' },
          { type: 'input', name: 'title', message: 'Titolo tooltip:' },
          { type: 'input', name: 'content', message: 'Contenuto tooltip:' },
          { type: 'list', name: 'trigger', message: 'Trigger:', choices: ['hover', 'focus', 'click', 'always'] },
          { type: 'list', name: 'icon', message: 'Icona:', choices: ['info', 'warning', 'error', 'success', 'question', 'none'] },
        ]);
        tips.push(tip);
        const { more } = await inquirer.prompt([{ type: 'confirm', name: 'more', message: 'Aggiungere un altro SmartTip?', default: true }]);
        addMore = more;
      }

      spec = { ...answers, tips, contentType: 'SmartTips' };
    }

    const content = generateSmartTipsFromSpec(spec);
    const result = prepareFlowOutput(content, options.format);
    outputResult(result, options);
  } catch (error) {
    console.error(`Errore: ${error.message}`);
    process.exit(1);
  }
}

// ─── Launcher ──────────────────────────────────────────────

export async function launcherCommand(options) {
  try {
    let spec;
    if (options.file) {
      spec = loadSpec(options);
    } else {
      const { default: inquirer } = await import('inquirer');

      spec = await inquirer.prompt([
        { type: 'input', name: 'name', message: 'Nome del Launcher:', validate: v => v.length > 0 || 'Obbligatorio' },
        { type: 'input', name: 'description', message: 'Descrizione:' },
        { type: 'list', name: 'shape', message: 'Forma:', choices: ['button', 'badge', 'hotspot', 'beacon'] },
        { type: 'list', name: 'icon', message: 'Icona:', choices: ['play', 'help', 'info', 'arrow'] },
        { type: 'input', name: 'label', message: 'Etichetta (opzionale):' },
        { type: 'list', name: 'position', message: 'Posizione:', choices: ['bottom-right', 'bottom-left', 'top-right', 'top-left'] },
        {
          type: 'list', name: 'actionType', message: 'Azione al click:',
          choices: [
            { name: 'Avvia Smart Walk-Thru', value: 'startWalkThru' },
            { name: 'Apri URL', value: 'openUrl' },
            { name: 'Apri menu Resources', value: 'openResource' },
            { name: 'JavaScript custom', value: 'customJs' },
          ],
        },
        { type: 'input', name: 'actionTarget', message: 'Target (ID Walk-Thru / URL / codice JS):' },
      ]);

      spec.action = { type: spec.actionType, target: spec.actionTarget };
      spec.contentType = 'Launcher';
    }

    const content = generateLauncherFromSpec(spec);
    const result = prepareFlowOutput(content, options.format);
    outputResult(result, options);
  } catch (error) {
    console.error(`Errore: ${error.message}`);
    process.exit(1);
  }
}

// ─── ShoutOut ──────────────────────────────────────────────

export async function shoutOutCommand(options) {
  try {
    let spec;
    if (options.file) {
      spec = loadSpec(options);
    } else {
      const { default: inquirer } = await import('inquirer');

      spec = await inquirer.prompt([
        { type: 'input', name: 'name', message: 'Nome dello ShoutOut:', validate: v => v.length > 0 || 'Obbligatorio' },
        { type: 'input', name: 'title', message: 'Titolo visualizzato:' },
        { type: 'input', name: 'content', message: 'Contenuto (testo/HTML):' },
        {
          type: 'list', name: 'template', message: 'Template:',
          choices: ['dialog', 'banner-top', 'banner-bottom', 'slide-in', 'fullscreen', 'notification'],
        },
        { type: 'list', name: 'position', message: 'Posizione:', choices: ['center', 'top', 'bottom', 'left', 'right'] },
        { type: 'list', name: 'frequency', message: 'Frequenza:', choices: ['once', 'always', 'session', 'daily', 'weekly'] },
      ]);

      const buttons = [];
      const { addButtons } = await inquirer.prompt([{ type: 'confirm', name: 'addButtons', message: 'Aggiungere pulsanti?', default: true }]);
      if (addButtons) {
        let addMore = true;
        while (addMore) {
          const btn = await inquirer.prompt([
            { type: 'input', name: 'label', message: 'Etichetta pulsante:' },
            {
              type: 'list', name: 'action', message: 'Azione:',
              choices: ['dismiss', 'startWalkThru', 'openUrl', 'nextShoutOut'],
            },
            { type: 'input', name: 'target', message: 'Target (opzionale):', when: a => a.action !== 'dismiss' },
            { type: 'list', name: 'style', message: 'Stile:', choices: ['primary', 'secondary'] },
          ]);
          buttons.push(btn);
          const { more } = await inquirer.prompt([{ type: 'confirm', name: 'more', message: 'Altro pulsante?', default: false }]);
          addMore = more;
        }
      }

      spec.buttons = buttons;
      spec.contentType = 'ShoutOut';
    }

    const content = generateShoutOutFromSpec(spec);
    const result = prepareFlowOutput(content, options.format);
    outputResult(result, options);
  } catch (error) {
    console.error(`Errore: ${error.message}`);
    process.exit(1);
  }
}

// ─── Survey ────────────────────────────────────────────────

export async function surveyCommand(options) {
  try {
    let spec;
    if (options.file) {
      spec = loadSpec(options);
    } else {
      const { default: inquirer } = await import('inquirer');

      const answers = await inquirer.prompt([
        { type: 'input', name: 'name', message: 'Nome del Survey:', validate: v => v.length > 0 || 'Obbligatorio' },
        { type: 'input', name: 'title', message: 'Titolo visualizzato:' },
        { type: 'list', name: 'frequency', message: 'Frequenza:', choices: ['once', 'always', 'session', 'daily', 'weekly'] },
      ]);

      const questions = [];
      let addMore = true;
      while (addMore) {
        console.log(`\n--- Domanda ${questions.length + 1} ---`);
        const q = await inquirer.prompt([
          { type: 'input', name: 'questionText', message: 'Testo della domanda:' },
          {
            type: 'list', name: 'type', message: 'Tipo:',
            choices: [
              { name: 'Rating (stelle)', value: 'rating' },
              { name: 'NPS (0-10)', value: 'nps' },
              { name: 'Scelta singola', value: 'singleChoice' },
              { name: 'Scelta multipla', value: 'multipleChoice' },
              { name: 'Testo libero', value: 'freeText' },
              { name: 'Si/No', value: 'yesNo' },
              { name: 'Scala', value: 'scale' },
            ],
          },
          {
            type: 'input', name: 'optionsRaw', message: 'Opzioni (separate da virgola):',
            when: a => ['singleChoice', 'multipleChoice'].includes(a.type),
          },
          { type: 'confirm', name: 'required', message: 'Obbligatoria?', default: true },
        ]);

        if (q.optionsRaw) {
          q.options = q.optionsRaw.split(',').map(o => o.trim());
          delete q.optionsRaw;
        }

        questions.push(q);
        const { more } = await inquirer.prompt([{ type: 'confirm', name: 'more', message: 'Aggiungere un\'altra domanda?', default: true }]);
        addMore = more;
      }

      spec = { ...answers, questions, contentType: 'Survey' };
    }

    const content = generateSurveyFromSpec(spec);
    const result = prepareFlowOutput(content, options.format);
    outputResult(result, options);
  } catch (error) {
    console.error(`Errore: ${error.message}`);
    process.exit(1);
  }
}

// ─── Shuttle ───────────────────────────────────────────────

export async function shuttleCommand(options) {
  try {
    let spec;
    if (options.file) {
      spec = loadSpec(options);
    } else {
      const { default: inquirer } = await import('inquirer');

      const answers = await inquirer.prompt([
        { type: 'input', name: 'name', message: 'Nome dello Shuttle:', validate: v => v.length > 0 || 'Obbligatorio' },
        { type: 'input', name: 'title', message: 'Titolo visualizzato:' },
        { type: 'input', name: 'description', message: 'Descrizione:' },
        { type: 'list', name: 'position', message: 'Posizione:', choices: ['center', 'bottom-right', 'bottom-left'] },
        { type: 'list', name: 'frequency', message: 'Frequenza:', choices: ['once', 'always', 'session', 'daily', 'weekly'] },
      ]);

      const pages = [];
      let addMore = true;
      while (addMore) {
        console.log(`\n--- Pagina ${pages.length + 1} ---`);
        const page = await inquirer.prompt([
          { type: 'input', name: 'title', message: 'Titolo pagina:' },
          { type: 'input', name: 'content', message: 'Contenuto (testo/HTML):' },
        ]);
        pages.push(page);
        const { more } = await inquirer.prompt([{ type: 'confirm', name: 'more', message: 'Aggiungere un\'altra pagina?', default: true }]);
        addMore = more;
      }

      spec = { ...answers, pages, contentType: 'Shuttle' };
    }

    const content = generateShuttleFromSpec(spec);
    const result = prepareFlowOutput(content, options.format);
    outputResult(result, options);
  } catch (error) {
    console.error(`Errore: ${error.message}`);
    process.exit(1);
  }
}

// ─── Resource Menu ─────────────────────────────────────────

export async function resourceCommand(options) {
  try {
    let spec;
    if (options.file) {
      spec = loadSpec(options);
    } else {
      const { default: inquirer } = await import('inquirer');

      const answers = await inquirer.prompt([
        { type: 'input', name: 'name', message: 'Nome del menu Resources:', validate: v => v.length > 0 || 'Obbligatorio' },
        { type: 'input', name: 'title', message: 'Titolo visualizzato:', default: 'Risorse' },
        { type: 'list', name: 'icon', message: 'Icona:', choices: ['help', 'book', 'info', 'question'] },
        { type: 'list', name: 'position', message: 'Posizione:', choices: ['bottom-right', 'bottom-left', 'top-right', 'top-left'] },
      ]);

      const items = [];
      let addMore = true;
      while (addMore) {
        console.log(`\n--- Risorsa ${items.length + 1} ---`);
        const item = await inquirer.prompt([
          { type: 'input', name: 'title', message: 'Titolo risorsa:' },
          { type: 'input', name: 'description', message: 'Descrizione:' },
          {
            type: 'list', name: 'type', message: 'Tipo:',
            choices: [
              { name: 'Smart Walk-Thru', value: 'walkthru' },
              { name: 'Articolo/pagina', value: 'article' },
              { name: 'Video', value: 'video' },
              { name: 'Link esterno', value: 'link' },
              { name: 'Shuttle', value: 'shuttle' },
              { name: 'Survey', value: 'survey' },
            ],
          },
          { type: 'input', name: 'target', message: 'Target (ID / URL):' },
          { type: 'input', name: 'category', message: 'Categoria (opzionale):' },
        ]);
        items.push(item);
        const { more } = await inquirer.prompt([{ type: 'confirm', name: 'more', message: 'Aggiungere un\'altra risorsa?', default: true }]);
        addMore = more;
      }

      spec = { ...answers, items, contentType: 'Resource' };
    }

    const content = generateResourceMenuFromSpec(spec);
    const result = prepareFlowOutput(content, options.format);
    outputResult(result, options);
  } catch (error) {
    console.error(`Errore: ${error.message}`);
    process.exit(1);
  }
}
