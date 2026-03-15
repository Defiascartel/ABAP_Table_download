/**
 * Comandi per gestione Segments WalkMe (CRUD + members)
 */

import {
  listSegments,
  getSegment,
  createSegment,
  updateSegment,
  deleteSegment,
  getSegmentMembers,
} from '../utils/walkme-api.js';

export async function segmentsListCommand() {
  try {
    const data = await listSegments();
    const segments = Array.isArray(data) ? data : data?.data || data?.segments || [data];

    if (segments.length === 0) {
      console.log('Nessun segmento trovato.');
      return;
    }

    console.log(`\nSegmenti (${segments.length}):\n`);
    console.log('  ID'.padEnd(14) + 'Nome'.padEnd(40) + 'Membri');
    console.log('  ' + '─'.repeat(58));

    segments.forEach(s => {
      const id = String(s.id || s.segmentId || '?').padEnd(12);
      const name = (s.name || 'Senza nome').substring(0, 38).padEnd(38);
      const members = s.memberCount || s.members || '-';
      console.log(`  ${id}  ${name}  ${members}`);
    });
    console.log('');
  } catch (error) {
    console.error(`Errore: ${error.message}`);
    process.exit(1);
  }
}

export async function segmentsGetCommand(segmentId) {
  try {
    const segment = await getSegment(segmentId);
    console.log(JSON.stringify(segment, null, 2));
  } catch (error) {
    console.error(`Errore: ${error.message}`);
    process.exit(1);
  }
}

export async function segmentsCreateCommand(options) {
  try {
    const segmentData = {
      name: options.name,
    };
    if (options.description) segmentData.description = options.description;

    console.log(`Creazione segmento "${options.name}"...`);
    const result = await createSegment(segmentData);
    console.log('Segmento creato.');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`Errore: ${error.message}`);
    process.exit(1);
  }
}

export async function segmentsUpdateCommand(segmentId, options) {
  try {
    const segmentData = {};
    if (options.name) segmentData.name = options.name;
    if (options.description) segmentData.description = options.description;

    console.log(`Aggiornamento segmento ${segmentId}...`);
    const result = await updateSegment(segmentId, segmentData);
    console.log('Segmento aggiornato.');
    if (result) console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`Errore: ${error.message}`);
    process.exit(1);
  }
}

export async function segmentsDeleteCommand(segmentId) {
  try {
    console.log(`Eliminazione segmento ${segmentId}...`);
    await deleteSegment(segmentId);
    console.log('Segmento eliminato.');
  } catch (error) {
    console.error(`Errore: ${error.message}`);
    process.exit(1);
  }
}

export async function segmentsMembersCommand(segmentId) {
  try {
    const data = await getSegmentMembers(segmentId);
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Errore: ${error.message}`);
    process.exit(1);
  }
}
