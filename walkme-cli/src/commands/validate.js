import { readFileSync } from 'fs';
import { resolve } from 'path';
import yaml from 'js-yaml';
import { validateFlow } from '../schema/walkme-flow.js';

export function validateCommand(file) {
  try {
    const filePath = resolve(file);
    const content = readFileSync(filePath, 'utf-8');

    let flow;
    if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
      flow = yaml.load(content);
    } else {
      flow = JSON.parse(content);
    }

    const result = validateFlow(flow);

    console.log(`\nValidazione: ${filePath}\n`);

    if (result.errors.length > 0) {
      console.log('Errori:');
      result.errors.forEach(e => console.log(`  ✗ ${e}`));
    }

    if (result.warnings.length > 0) {
      console.log('\nAvvisi:');
      result.warnings.forEach(w => console.log(`  ⚠ ${w}`));
    }

    if (result.valid) {
      console.log('✓ Flusso valido');
    } else {
      console.log('\n✗ Flusso non valido - correggi gli errori sopra');
      process.exit(1);
    }

  } catch (error) {
    console.error(`Errore: ${error.message}`);
    process.exit(1);
  }
}
