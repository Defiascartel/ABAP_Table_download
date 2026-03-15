import { loadConfig, saveConfig, setApiKey } from '../utils/config.js';

export function configCommand(options) {
  const config = loadConfig();
  let changed = false;

  if (options.apiKey) {
    setApiKey(options.apiKey);
    console.log('API key Anthropic salvata.');
    return;
  }

  const simpleOptions = {
    language: ['defaultLanguage', 'Lingua default'],
    format: ['defaultFormat', 'Formato default'],
    model: ['claudeModel', 'Modello Claude'],
    walkmeClientId: ['walkmeClientId', 'WalkMe Client ID'],
    walkmeClientSecret: ['walkmeClientSecret', 'WalkMe Client Secret'],
    walkmeSystemId: ['walkmeSystemId', 'WalkMe System ID'],
    walkmeRegion: ['walkmeRegion', 'WalkMe Regione'],
  };

  for (const [opt, [key, label]] of Object.entries(simpleOptions)) {
    if (options[opt]) {
      config[key] = options[opt];
      changed = true;
      console.log(`${label}: ${key.includes('Secret') ? '****' : options[opt]}`);
    }
  }

  if (changed) {
    saveConfig(config);
    return;
  }

  // Mostra config attuale
  const mask = (v) => v ? v.substring(0, 8) + '...' : '(non configurato)';

  console.log('\nConfigurazione walkme-cli:\n');
  console.log('  --- Claude AI ---');
  console.log(`  API Key Anthropic:    ${mask(config.anthropicApiKey)}`);
  console.log(`  Modello:              ${config.claudeModel}`);
  console.log('');
  console.log('  --- WalkMe API ---');
  console.log(`  Client ID:            ${mask(config.walkmeClientId)}`);
  console.log(`  Client Secret:        ${config.walkmeClientSecret ? '********' : '(non configurato)'}`);
  console.log(`  System ID:            ${config.walkmeSystemId || '(non configurato)'}`);
  console.log(`  Regione:              ${config.walkmeRegion}`);
  console.log('');
  console.log('  --- Preferenze ---');
  console.log(`  Lingua:               ${config.defaultLanguage}`);
  console.log(`  Formato:              ${config.defaultFormat}`);

  console.log('\nSetup rapido WalkMe:');
  console.log('  walkme-cli config --walkme-client-id <id>');
  console.log('  walkme-cli config --walkme-client-secret <secret>');
  console.log('  walkme-cli config --walkme-system-id <GUID>');
  console.log('  walkme-cli config --walkme-region us|eu|fedramp|canada');
  console.log('\nSetup Claude AI:');
  console.log('  walkme-cli config --api-key sk-ant-...');
}
