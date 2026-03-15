/**
 * Gestione configurazione CLI (API key, preferenze)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_DIR = join(homedir(), '.walkme-cli');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG = {
  anthropicApiKey: null,
  defaultLanguage: 'it',
  defaultFormat: 'yaml',
  claudeModel: 'claude-sonnet-4-20250514',
  walkmeClientId: null,
  walkmeClientSecret: null,
  walkmeSystemId: null,
  walkmeRegion: 'us',
};

export function loadConfig() {
  try {
    if (existsSync(CONFIG_FILE)) {
      const data = readFileSync(CONFIG_FILE, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_CONFIG };
}

export function saveConfig(config) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

export function getApiKey() {
  // 1. Variabile d'ambiente
  if (process.env.ANTHROPIC_API_KEY) {
    return process.env.ANTHROPIC_API_KEY;
  }
  // 2. Config file
  const config = loadConfig();
  return config.anthropicApiKey || null;
}

export function setApiKey(key) {
  const config = loadConfig();
  config.anthropicApiKey = key;
  saveConfig(config);
}
