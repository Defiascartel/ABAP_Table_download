/**
 * Comandi per gestione contenuti WalkMe (list, publish, analytics, versions, rollback)
 */

import {
  listSmartWalkThrus,
  listAllContent,
  getContentItem,
  publishContent,
  unpublishContent,
  getContentAnalytics,
  getContentVersions,
  rollbackContent,
} from '../utils/walkme-api.js';

export async function listContentCommand(options) {
  try {
    const data = options.all
      ? await listAllContent()
      : await listSmartWalkThrus();

    const items = Array.isArray(data) ? data : data?.data || data?.items || [data];

    if (items.length === 0) {
      console.log('Nessun contenuto trovato.');
      return;
    }

    console.log(`\n${options.all ? 'Tutti i contenuti' : 'Smart Walk-Thrus'} (${items.length}):\n`);
    console.log('  ID'.padEnd(14) + 'Nome'.padEnd(40) + 'Stato'.padEnd(14) + 'Tipo');
    console.log('  ' + '─'.repeat(70));

    items.forEach(item => {
      const id = String(item.id || item.contentId || '?').padEnd(12);
      const name = (item.name || item.title || 'Senza nome').substring(0, 38).padEnd(38);
      const status = (item.status || item.state || '-').padEnd(12);
      const type = item.type || item.contentType || '-';
      console.log(`  ${id}  ${name}  ${status}  ${type}`);
    });

    console.log('');
  } catch (error) {
    console.error(`Errore: ${error.message}`);
    process.exit(1);
  }
}

export async function getContentCommand(contentId) {
  try {
    const item = await getContentItem(contentId);
    console.log(JSON.stringify(item, null, 2));
  } catch (error) {
    console.error(`Errore: ${error.message}`);
    process.exit(1);
  }
}

export async function publishCommand(contentId, options) {
  try {
    const env = options.test ? 'test' : 'production';
    console.log(`Pubblicazione ${contentId} in ${env}...`);
    const result = await publishContent(contentId, env);
    console.log(`Pubblicato in ${env}.`);
    if (result) console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`Errore: ${error.message}`);
    process.exit(1);
  }
}

export async function unpublishCommand(contentId, options) {
  try {
    const env = options.test ? 'test' : 'production';
    console.log(`Rimozione ${contentId} da ${env}...`);
    const result = await unpublishContent(contentId, env);
    console.log(`Rimosso da ${env}.`);
    if (result) console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`Errore: ${error.message}`);
    process.exit(1);
  }
}

export async function analyticsCommand(contentId, options) {
  try {
    let data;
    if (contentId) {
      data = await getContentAnalytics(contentId);
    } else {
      // Import dinamico per analytics globali
      const api = await import('../utils/walkme-api.js');
      data = options.engagement
        ? await api.getUserEngagement()
        : options.completion
          ? await api.getCompletionRates()
          : await api.getAnalyticsOverview();
    }

    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Errore: ${error.message}`);
    process.exit(1);
  }
}

export async function versionsCommand(contentId) {
  try {
    const data = await getContentVersions(contentId);
    const versions = Array.isArray(data) ? data : data?.data || data?.versions || [data];

    console.log(`\nVersioni per ${contentId}:\n`);
    versions.forEach((v, i) => {
      const date = v.createdAt || v.date || v.timestamp || '-';
      const id = v.versionId || v.id || '?';
      const author = v.author || v.user || '-';
      console.log(`  ${i + 1}. [${id}] ${date}  by ${author}`);
    });
    console.log('');
  } catch (error) {
    console.error(`Errore: ${error.message}`);
    process.exit(1);
  }
}

export async function rollbackCommand(contentId, versionId) {
  try {
    console.log(`Rollback ${contentId} alla versione ${versionId}...`);
    const result = await rollbackContent(contentId, versionId);
    console.log('Rollback completato.');
    if (result) console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`Errore: ${error.message}`);
    process.exit(1);
  }
}
