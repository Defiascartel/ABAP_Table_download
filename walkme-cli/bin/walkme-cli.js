#!/usr/bin/env node

/**
 * WalkMe CLI - Generatore di flussi WalkMe per SAP Fiori / BTP Work Zone
 *
 * Uso:
 *   walkme-cli generate              Genera un flusso da prompt interattivo
 *   walkme-cli generate -f spec.json Genera da file di specifica JSON/YAML
 *   walkme-cli templates             Lista i template disponibili
 *   walkme-cli template <tcode>      Genera un template per transazione SAP
 *   walkme-cli validate <file>       Valida un flusso WalkMe
 *   walkme-cli convert <file>        Converte tra JSON e YAML
 *   walkme-cli selectors             Mostra i selettori SAP Fiori disponibili
 *   walkme-cli pdf <file>            Analizza un PDF di processo SAP con Claude AI
 *   walkme-cli pdf-extract <file>    Estrai solo testo dal PDF (senza API)
 *   walkme-cli config                Gestisci configurazione (API key, ecc.)
 */

import { Command } from 'commander';
import { createRequire } from 'module';
import { generateCommand } from '../src/commands/generate.js';
import { templatesCommand, templateCommand } from '../src/commands/templates.js';
import { validateCommand } from '../src/commands/validate.js';
import { convertCommand } from '../src/commands/convert.js';
import { selectorsCommand } from '../src/commands/selectors.js';
import { specCommand } from '../src/commands/spec.js';
import { pdfCommand, pdfExtractCommand } from '../src/commands/pdf.js';
import { configCommand } from '../src/commands/config.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

const program = new Command();

program
  .name('walkme-cli')
  .description('CLI per generare flussi WalkMe per SAP Fiori / BTP Work Zone')
  .version(pkg.version);

program
  .command('generate')
  .alias('g')
  .description('Genera un flusso WalkMe da un prompt interattivo o da file di specifica')
  .option('-f, --file <path>', 'File di specifica JSON o YAML')
  .option('-o, --output <path>', 'File di output (default: stdout)')
  .option('--format <format>', 'Formato output: json o yaml', 'json')
  .option('--simple', 'Output in formato semplificato')
  .action(generateCommand);

program
  .command('spec')
  .alias('s')
  .description('Crea una specifica di flusso vuota (template) da compilare')
  .option('-t, --transaction <tcode>', 'Codice transazione SAP per pre-compilare')
  .option('-o, --output <path>', 'File di output')
  .option('--format <format>', 'Formato: json o yaml', 'yaml')
  .action(specCommand);

program
  .command('templates')
  .alias('tpl')
  .description('Lista i template di flusso disponibili per transazioni SAP')
  .option('-m, --module <module>', 'Filtra per modulo SAP (SD, MM, FI, CO, PP, HCM, PM, PS, QM, CA)')
  .action(templatesCommand);

program
  .command('template <tcode>')
  .description('Genera un flusso template per una transazione SAP specifica')
  .option('-o, --output <path>', 'File di output')
  .option('--format <format>', 'Formato: json o yaml', 'json')
  .action(templateCommand);

program
  .command('validate')
  .alias('v')
  .description('Valida un file di flusso WalkMe')
  .argument('<file>', 'File JSON o YAML da validare')
  .action(validateCommand);

program
  .command('convert')
  .alias('c')
  .description('Converte un flusso tra JSON e YAML')
  .argument('<file>', 'File da convertire')
  .option('-o, --output <path>', 'File di output')
  .action(convertCommand);

program
  .command('selectors')
  .alias('sel')
  .description('Mostra i selettori CSS disponibili per SAP Fiori / BTP Work Zone')
  .option('-g, --group <group>', 'Gruppo: shell, launchpad, btp, form, table, toolbar, dialog, objectpage, navigation')
  .action(selectorsCommand);

program
  .command('pdf')
  .description('Analizza un PDF di processo SAP con Claude AI e genera il flusso WalkMe')
  .argument('<file>', 'File PDF da analizzare')
  .option('-o, --output <path>', 'File di output')
  .option('--format <format>', 'Formato: json o yaml', 'yaml')
  .option('--simple', 'Output in formato semplificato')
  .option('-t, --transaction <tcode>', 'Codice transazione SAP per contesto')
  .option('-c, --context <text>', 'Contesto aggiuntivo per l\'analisi')
  .option('--model <model>', 'Modello Claude da usare', 'claude-sonnet-4-20250514')
  .action(pdfCommand);

program
  .command('pdf-extract')
  .description('Estrai solo il testo da un PDF (senza API key)')
  .argument('<file>', 'File PDF')
  .option('-o, --output <path>', 'File di output per il testo estratto')
  .action(pdfExtractCommand);

program
  .command('config')
  .description('Gestisci configurazione (API key, preferenze)')
  .option('--api-key <key>', 'Imposta API key Anthropic')
  .option('--language <lang>', 'Lingua default (it, en, de, fr)')
  .option('--format <format>', 'Formato default (json, yaml)')
  .option('--model <model>', 'Modello Claude default')
  .action(configCommand);

program.parse();
