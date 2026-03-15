import { readFileSync, writeFileSync } from 'fs';
import { resolve, basename, extname } from 'path';
import yaml from 'js-yaml';

export function convertCommand(file, options) {
  try {
    const filePath = resolve(file);
    const content = readFileSync(filePath, 'utf-8');
    const ext = extname(filePath).toLowerCase();

    let data;
    let outputFormat;

    if (ext === '.yaml' || ext === '.yml') {
      data = yaml.load(content);
      outputFormat = 'json';
    } else if (ext === '.json') {
      data = JSON.parse(content);
      outputFormat = 'yaml';
    } else {
      console.error('Formato non supportato. Usa file .json, .yaml o .yml');
      process.exit(1);
    }

    let outputStr;
    if (outputFormat === 'yaml') {
      outputStr = yaml.dump(data, { indent: 2, lineWidth: 120, noRefs: true });
    } else {
      outputStr = JSON.stringify(data, null, 2);
    }

    if (options.output) {
      const outPath = resolve(options.output);
      writeFileSync(outPath, outputStr, 'utf-8');
      console.log(`Convertito in: ${outPath}`);
    } else {
      const outFile = basename(filePath, ext) + (outputFormat === 'yaml' ? '.yaml' : '.json');
      const outPath = resolve(outFile);
      writeFileSync(outPath, outputStr, 'utf-8');
      console.log(`Convertito: ${filePath} → ${outPath}`);
    }

  } catch (error) {
    console.error(`Errore: ${error.message}`);
    process.exit(1);
  }
}
