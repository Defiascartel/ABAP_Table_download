/**
 * Comando PDF - Analizza un PDF di documentazione SAP e genera un flusso WalkMe
 *
 * Workflow:
 *   1. Legge il PDF (testo + pagine come immagini)
 *   2. Invia a Claude API con un prompt specializzato SAP Fiori / WalkMe
 *   3. Claude analizza gli step di processo dalle immagini e dal testo
 *   4. Genera il flusso WalkMe in formato JSON/YAML
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, basename, extname } from 'path';
import Anthropic from '@anthropic-ai/sdk';
import yaml from 'js-yaml';
import { getApiKey } from '../utils/config.js';
import { generateFlowFromSpec, prepareFlowOutput } from '../generator.js';
import { WALKME_STEP_TYPES } from '../templates/sap-fiori.js';

const SYSTEM_PROMPT = `Sei un esperto di SAP Fiori, BTP Work Zone e WalkMe.
Analizza il documento PDF fornito che descrive un processo SAP.
Dalle immagini e dal testo, identifica ogni step del processo e genera una specifica
strutturata per un flusso WalkMe Smart Walk-Thru.

Per ogni step identificato, determina:
1. Il tipo di azione (popup, click, type, select, waitFor, redirect)
2. Il selettore CSS probabile per l'elemento UI5/Fiori target
3. Il titolo e il testo descrittivo per il balloon WalkMe
4. La posizione del balloon rispetto all'elemento

Usa questi selettori SAP Fiori/UI5 standard:
- Shell header: #shell-header
- Tile Launchpad: .sapUshellTile[title="..."]
- Input field: input[id*="fieldId"], [aria-label="..."] input
- Button Create: .sapMBarChild button[id*="Create"]
- Button Save: .sapMBarChild button[id*="Save"]
- Button Edit: .sapMBarChild button[id*="Edit"]
- Smart Filter Bar: .sapUiCompFilterBar
- Smart Table: .sapUiCompSmartTable
- Table row: .sapUiTableRow, .sapMLIB
- Dialog: .sapMDialog
- Dialog confirm: .sapMDialogFooter .sapMBtnEmphasized
- Object Page section: .sapUxAPObjectPageSection
- Tab: .sapMITBText:contains("...")
- Value Help icon: .sapMInputBaseIconContainer
- Message Strip: .sapMMsgStrip
- Back button: #backBtn

RISPONDI ESCLUSIVAMENTE con un JSON valido (senza markdown code blocks) con questa struttura:
{
  "name": "Nome del flusso",
  "description": "Descrizione",
  "transaction": "TCODE o null",
  "fioriApp": "SemanticObject-action o null",
  "language": "it",
  "tags": ["tag1", "tag2"],
  "steps": [
    {
      "type": "popup|click|type|select|waitFor|redirect",
      "title": "Titolo step",
      "content": "Testo descrittivo per l'utente",
      "selector": "selettore CSS",
      "position": "auto|top|bottom|left|right",
      "inputValue": "valore per step type (opzionale)",
      "selectValue": "valore per step select (opzionale)"
    }
  ],
  "goals": [
    {
      "name": "Goal description",
      "type": "custom"
    }
  ]
}`;

export async function pdfCommand(file, options) {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.error('API key Anthropic non configurata.\n');
    console.log('Configura con uno di questi metodi:');
    console.log('  1. export ANTHROPIC_API_KEY=sk-ant-...');
    console.log('  2. walkme-cli config --api-key sk-ant-...');
    console.log('\nOttieni la tua API key su: https://console.anthropic.com/');
    process.exit(1);
  }

  const filePath = resolve(file);
  const fileName = basename(filePath);

  console.log(`\nAnalisi PDF: ${fileName}`);
  console.log('Invio a Claude per analisi degli step di processo...\n');

  try {
    // Leggi il PDF come base64
    const pdfBuffer = readFileSync(filePath);
    const pdfBase64 = pdfBuffer.toString('base64');

    // Costruisci il prompt utente
    let userPrompt = `Analizza questo documento PDF che descrive un processo SAP.
Identifica tutti gli step del processo dalle immagini e dal testo,
e genera la specifica del flusso WalkMe.`;

    if (options.transaction) {
      userPrompt += `\n\nIl processo riguarda la transazione SAP: ${options.transaction}`;
    }

    if (options.context) {
      userPrompt += `\n\nContesto aggiuntivo: ${options.context}`;
    }

    // Chiama Claude API con il PDF
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: options.model || 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdfBase64,
              },
            },
            {
              type: 'text',
              text: userPrompt,
            },
          ],
        },
      ],
    });

    // Estrai la risposta JSON
    const responseText = message.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    console.log('Analisi completata. Generazione flusso WalkMe...\n');

    // Parse del JSON dalla risposta
    let spec;
    try {
      // Prova a parsare direttamente
      spec = JSON.parse(responseText);
    } catch {
      // Prova a estrarre JSON da eventuale markdown
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        spec = JSON.parse(jsonMatch[1]);
      } else {
        // Ultimo tentativo: cerca il primo { e l'ultimo }
        const start = responseText.indexOf('{');
        const end = responseText.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
          spec = JSON.parse(responseText.substring(start, end + 1));
        } else {
          console.error('Impossibile parsare la risposta di Claude.');
          console.error('Risposta raw:\n', responseText);
          process.exit(1);
        }
      }
    }

    // Genera il flusso WalkMe dalla specifica
    const flow = generateFlowFromSpec(spec);
    const result = prepareFlowOutput(flow, options.format);

    // Mostra validazione
    if (result.validation.errors.length > 0) {
      console.log('Avvisi di validazione:');
      result.validation.errors.forEach(e => console.log(`  ! ${e}`));
      console.log('');
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
      console.log(`Flusso WalkMe salvato in: ${outPath}`);
    } else {
      console.log('--- Flusso WalkMe Generato da PDF ---\n');
      console.log(outputStr);
    }

    // Info utilizzo token
    if (message.usage) {
      console.log(`\n[Token: ${message.usage.input_tokens} input, ${message.usage.output_tokens} output]`);
    }

    if (result.validation.valid) {
      console.log('\nFlusso valido e pronto per WalkMe Editor');
    }

  } catch (error) {
    if (error.status === 401) {
      console.error('API key non valida. Verifica la tua chiave Anthropic.');
    } else if (error.status === 429) {
      console.error('Rate limit raggiunto. Riprova tra qualche secondo.');
    } else {
      console.error(`Errore: ${error.message}`);
    }
    process.exit(1);
  }
}

/**
 * Modalità fallback: estrazione solo testo dal PDF (senza API)
 */
export async function pdfExtractCommand(file, options) {
  const filePath = resolve(file);
  const fileName = basename(filePath);

  console.log(`\nEstrazione testo da: ${fileName}`);

  try {
    const pdfBuffer = readFileSync(filePath);
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(pdfBuffer);

    console.log(`Pagine: ${data.numpages}`);
    console.log(`Caratteri: ${data.text.length}\n`);

    if (options.output) {
      const outPath = resolve(options.output);
      writeFileSync(outPath, data.text, 'utf-8');
      console.log(`Testo estratto salvato in: ${outPath}`);
    } else {
      console.log('--- Testo Estratto ---\n');
      console.log(data.text);
    }

    console.log('\nPer generare il flusso WalkMe dal testo estratto:');
    console.log('  1. Copia il testo e usalo come contesto per Claude');
    console.log('  2. Oppure configura ANTHROPIC_API_KEY e usa: walkme-cli pdf <file>');

  } catch (error) {
    console.error(`Errore lettura PDF: ${error.message}`);
    process.exit(1);
  }
}
