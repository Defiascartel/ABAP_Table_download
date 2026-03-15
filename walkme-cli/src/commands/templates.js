import { writeFileSync } from 'fs';
import { resolve } from 'path';
import yaml from 'js-yaml';
import { SAP_TRANSACTION_MAP } from '../templates/sap-fiori.js';
import { generateTemplateForTransaction } from '../generator.js';

export function templatesCommand(options) {
  const entries = Object.entries(SAP_TRANSACTION_MAP);
  let filtered = entries;

  if (options.module) {
    filtered = entries.filter(([, info]) => info.group === options.module.toUpperCase());
    if (filtered.length === 0) {
      console.log(`Nessun template trovato per il modulo "${options.module}".`);
      console.log('Moduli disponibili: SD, MM, FI, CO, PP, HCM, PM, PS, QM, CA');
      return;
    }
  }

  console.log('\nTemplate disponibili per transazioni SAP:\n');
  console.log('  TCode    Modulo  App Fiori');
  console.log('  ───────  ──────  ─────────────────────────────────');

  const grouped = {};
  filtered.forEach(([tcode, info]) => {
    if (!grouped[info.group]) grouped[info.group] = [];
    grouped[info.group].push({ tcode, ...info });
  });

  Object.entries(grouped).forEach(([group, items]) => {
    items.forEach(item => {
      console.log(`  ${item.tcode.padEnd(8)} ${item.group.padEnd(6)}  ${item.title}`);
    });
    console.log('');
  });

  console.log(`Totale: ${filtered.length} template`);
  console.log('\nUsa: walkme-cli template <tcode> per generare un flusso');
}

export function templateCommand(tcode, options) {
  const flow = generateTemplateForTransaction(tcode);

  if (!flow) {
    console.error(`Transazione "${tcode}" non trovata.`);
    console.log('Usa: walkme-cli templates per vedere le transazioni disponibili.');
    process.exit(1);
  }

  let outputStr;
  if (options.format === 'yaml') {
    outputStr = yaml.dump(flow, { indent: 2, lineWidth: 120, noRefs: true });
  } else {
    outputStr = JSON.stringify(flow, null, 2);
  }

  if (options.output) {
    const outPath = resolve(options.output);
    writeFileSync(outPath, outputStr, 'utf-8');
    console.log(`Template salvato in: ${outPath}`);
  } else {
    console.log(outputStr);
  }
}
