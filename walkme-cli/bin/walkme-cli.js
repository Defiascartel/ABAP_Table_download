#!/usr/bin/env node

/**
 * WalkMe CLI - Generatore e gestore flussi WalkMe per SAP Fiori / BTP Work Zone
 *
 * Generazione flussi:
 *   walkme-cli generate              Genera un flusso da prompt interattivo
 *   walkme-cli generate -f spec.json Genera da file di specifica JSON/YAML
 *   walkme-cli pdf <file>            Analizza un PDF di processo SAP con Claude AI
 *   walkme-cli pdf-extract <file>    Estrai solo testo dal PDF (senza API)
 *   walkme-cli spec                  Crea una specifica vuota da compilare
 *   walkme-cli template <tcode>      Genera un template per transazione SAP
 *
 * Gestione contenuti WalkMe (richiede API WalkMe):
 *   walkme-cli list                  Lista Smart Walk-Thrus
 *   walkme-cli get <id>              Dettagli di un contenuto
 *   walkme-cli publish <id>          Pubblica un flusso
 *   walkme-cli unpublish <id>        Rimuovi dalla produzione
 *   walkme-cli analytics [id]        Metriche di utilizzo
 *   walkme-cli versions <id>         Storico versioni
 *   walkme-cli rollback <id> <ver>   Ripristina versione
 *
 * Goals e Segments:
 *   walkme-cli goals                 Gestisci goals
 *   walkme-cli segments              Gestisci segmenti utente
 *
 * Utilità:
 *   walkme-cli templates             Lista template transazioni SAP
 *   walkme-cli selectors             Mostra selettori CSS SAP Fiori
 *   walkme-cli validate <file>       Valida un flusso WalkMe
 *   walkme-cli convert <file>        Converte tra JSON e YAML
 *   walkme-cli config                Gestisci configurazione
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
import {
  listContentCommand, getContentCommand,
  publishCommand, unpublishCommand,
  analyticsCommand, versionsCommand, rollbackCommand,
} from '../src/commands/content.js';
import {
  goalsListCommand, goalsGetCommand, goalsCreateCommand,
  goalsUpdateCommand, goalsDeleteCommand, goalsProgressCommand,
} from '../src/commands/goals.js';
import {
  segmentsListCommand, segmentsGetCommand, segmentsCreateCommand,
  segmentsUpdateCommand, segmentsDeleteCommand, segmentsMembersCommand,
} from '../src/commands/segments.js';
import {
  smartTipsCommand, launcherCommand, shoutOutCommand,
  surveyCommand, shuttleCommand, resourceCommand,
} from '../src/commands/create-content.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

const program = new Command();

program
  .name('walkme-cli')
  .description('CLI per generare e gestire flussi WalkMe per SAP Fiori / BTP Work Zone')
  .version(pkg.version);

// ─── Generazione Flussi ────────────────────────────────────

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
  .command('spec')
  .alias('s')
  .description('Crea una specifica di flusso vuota (template) da compilare')
  .option('-t, --transaction <tcode>', 'Codice transazione SAP per pre-compilare')
  .option('-o, --output <path>', 'File di output')
  .option('--format <format>', 'Formato: json o yaml', 'yaml')
  .action(specCommand);

program
  .command('template <tcode>')
  .description('Genera un flusso template per una transazione SAP specifica')
  .option('-o, --output <path>', 'File di output')
  .option('--format <format>', 'Formato: json o yaml', 'json')
  .action(templateCommand);

// ─── Creazione altri tipi di contenuto ─────────────────────

const CONTENT_OPTS = [
  ['-f, --file <path>', 'File di specifica JSON o YAML'],
  ['-o, --output <path>', 'File di output'],
  ['--format <format>', 'Formato: json o yaml', 'json'],
  ['--simple', 'Output semplificato'],
];

function addContentOpts(cmd) {
  CONTENT_OPTS.forEach(opt => cmd.option(...opt));
  return cmd;
}

addContentOpts(program
  .command('smarttips')
  .alias('tips')
  .description('Genera un set di SmartTips (tooltip contestuali su elementi UI)'))
  .action(smartTipsCommand);

addContentOpts(program
  .command('launcher')
  .description('Genera un Launcher (pulsante/widget che avvia azioni)'))
  .action(launcherCommand);

addContentOpts(program
  .command('shoutout')
  .description('Genera uno ShoutOut (banner/popup overlay informativo)'))
  .action(shoutOutCommand);

addContentOpts(program
  .command('survey')
  .description('Genera un Survey (sondaggio in-app)'))
  .action(surveyCommand);

addContentOpts(program
  .command('shuttle')
  .description('Genera uno Shuttle (popup informativo multi-pagina)'))
  .action(shuttleCommand);

addContentOpts(program
  .command('resource')
  .alias('res')
  .description('Genera un menu Resources (help center in-app)'))
  .action(resourceCommand);

// ─── Gestione Contenuti WalkMe ─────────────────────────────

program
  .command('list')
  .alias('ls')
  .description('Lista Smart Walk-Thrus nel sistema WalkMe')
  .option('-a, --all', 'Mostra tutti i tipi di contenuto')
  .action(listContentCommand);

program
  .command('get <contentId>')
  .description('Mostra i dettagli di un contenuto WalkMe')
  .action(getContentCommand);

program
  .command('publish <contentId>')
  .description('Pubblica un contenuto WalkMe')
  .option('--test', 'Pubblica nell\'ambiente di test invece che in produzione')
  .action(publishCommand);

program
  .command('unpublish <contentId>')
  .description('Rimuovi un contenuto dalla produzione')
  .option('--test', 'Rimuovi dall\'ambiente di test')
  .action(unpublishCommand);

program
  .command('analytics [contentId]')
  .description('Mostra metriche di utilizzo (globali o per contenuto specifico)')
  .option('--engagement', 'Mostra engagement utenti (senza contentId)')
  .option('--completion', 'Mostra tassi di completamento (senza contentId)')
  .action(analyticsCommand);

program
  .command('versions <contentId>')
  .description('Mostra lo storico versioni di un contenuto')
  .action(versionsCommand);

program
  .command('rollback <contentId> <versionId>')
  .description('Ripristina una versione precedente di un contenuto')
  .action(rollbackCommand);

// ─── Goals ─────────────────────────────────────────────────

const goalsCmd = program
  .command('goals')
  .description('Gestisci goals WalkMe');

goalsCmd
  .command('list')
  .alias('ls')
  .description('Lista tutti i goals')
  .action(goalsListCommand);

goalsCmd
  .command('get <goalId>')
  .description('Dettagli di un goal')
  .action(goalsGetCommand);

goalsCmd
  .command('create')
  .description('Crea un nuovo goal')
  .requiredOption('-n, --name <name>', 'Nome del goal')
  .option('--type <type>', 'Tipo di goal', 'custom')
  .option('-d, --description <desc>', 'Descrizione')
  .action(goalsCreateCommand);

goalsCmd
  .command('update <goalId>')
  .description('Aggiorna un goal')
  .option('-n, --name <name>', 'Nuovo nome')
  .option('--type <type>', 'Nuovo tipo')
  .option('-d, --description <desc>', 'Nuova descrizione')
  .action(goalsUpdateCommand);

goalsCmd
  .command('delete <goalId>')
  .description('Elimina un goal')
  .action(goalsDeleteCommand);

goalsCmd
  .command('progress <goalId>')
  .description('Mostra il progresso di un goal')
  .action(goalsProgressCommand);

// ─── Segments ──────────────────────────────────────────────

const segmentsCmd = program
  .command('segments')
  .description('Gestisci segmenti utente WalkMe');

segmentsCmd
  .command('list')
  .alias('ls')
  .description('Lista tutti i segmenti')
  .action(segmentsListCommand);

segmentsCmd
  .command('get <segmentId>')
  .description('Dettagli di un segmento')
  .action(segmentsGetCommand);

segmentsCmd
  .command('create')
  .description('Crea un nuovo segmento')
  .requiredOption('-n, --name <name>', 'Nome del segmento')
  .option('-d, --description <desc>', 'Descrizione')
  .action(segmentsCreateCommand);

segmentsCmd
  .command('update <segmentId>')
  .description('Aggiorna un segmento')
  .option('-n, --name <name>', 'Nuovo nome')
  .option('-d, --description <desc>', 'Nuova descrizione')
  .action(segmentsUpdateCommand);

segmentsCmd
  .command('delete <segmentId>')
  .description('Elimina un segmento')
  .action(segmentsDeleteCommand);

segmentsCmd
  .command('members <segmentId>')
  .description('Mostra i membri di un segmento')
  .action(segmentsMembersCommand);

// ─── Utilità ───────────────────────────────────────────────

program
  .command('templates')
  .alias('tpl')
  .description('Lista i template di flusso disponibili per transazioni SAP')
  .option('-m, --module <module>', 'Filtra per modulo SAP (SD, MM, FI, CO, PP, HCM, PM, PS, QM, CA)')
  .action(templatesCommand);

program
  .command('selectors')
  .alias('sel')
  .description('Mostra i selettori CSS disponibili per SAP Fiori / BTP Work Zone')
  .option('-g, --group <group>', 'Gruppo: shell, launchpad, btp, form, table, toolbar, dialog, objectpage, navigation')
  .action(selectorsCommand);

program
  .command('validate')
  .description('Valida un file di flusso WalkMe')
  .argument('<file>', 'File JSON o YAML da validare')
  .action(validateCommand);

program
  .command('convert')
  .description('Converte un flusso tra JSON e YAML')
  .argument('<file>', 'File da convertire')
  .option('-o, --output <path>', 'File di output')
  .action(convertCommand);

program
  .command('config')
  .description('Gestisci configurazione (API keys, preferenze)')
  .option('--api-key <key>', 'Imposta API key Anthropic')
  .option('--walkme-client-id <id>', 'Imposta WalkMe Client ID')
  .option('--walkme-client-secret <secret>', 'Imposta WalkMe Client Secret')
  .option('--walkme-system-id <guid>', 'Imposta WalkMe System ID (GUID)')
  .option('--walkme-region <region>', 'Regione WalkMe: us, eu, fedramp, canada')
  .option('--language <lang>', 'Lingua default (it, en, de, fr)')
  .option('--format <format>', 'Formato default (json, yaml)')
  .option('--model <model>', 'Modello Claude default')
  .action(configCommand);

program.parse();
