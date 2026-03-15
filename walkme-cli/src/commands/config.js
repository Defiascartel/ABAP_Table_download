import { loadConfig, saveConfig, setApiKey } from '../utils/config.js';

export function configCommand(options) {
  const config = loadConfig();

  if (options.apiKey) {
    setApiKey(options.apiKey);
    console.log('API key Anthropic salvata.');
    return;
  }

  if (options.language) {
    config.defaultLanguage = options.language;
    saveConfig(config);
    console.log(`Lingua default: ${options.language}`);
    return;
  }

  if (options.format) {
    config.defaultFormat = options.format;
    saveConfig(config);
    console.log(`Formato default: ${options.format}`);
    return;
  }

  if (options.model) {
    config.claudeModel = options.model;
    saveConfig(config);
    console.log(`Modello Claude: ${options.model}`);
    return;
  }

  // Mostra config attuale
  console.log('\nConfigurazione walkme-cli:\n');
  console.log(`  API Key:   ${config.anthropicApiKey ? config.anthropicApiKey.substring(0, 12) + '...' : '(non configurata)'}`);
  console.log(`  Lingua:    ${config.defaultLanguage}`);
  console.log(`  Formato:   ${config.defaultFormat}`);
  console.log(`  Modello:   ${config.claudeModel}`);
  console.log('\nModifica con:');
  console.log('  walkme-cli config --api-key sk-ant-...');
  console.log('  walkme-cli config --language it|en|de|fr');
  console.log('  walkme-cli config --format json|yaml');
  console.log('  walkme-cli config --model claude-sonnet-4-20250514');
}
