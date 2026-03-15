/**
 * Comandi per gestione Goals WalkMe (CRUD + progress)
 */

import {
  listGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  getGoalProgress,
} from '../utils/walkme-api.js';

export async function goalsListCommand() {
  try {
    const data = await listGoals();
    const goals = Array.isArray(data) ? data : data?.data || data?.goals || [data];

    if (goals.length === 0) {
      console.log('Nessun goal trovato.');
      return;
    }

    console.log(`\nGoals (${goals.length}):\n`);
    console.log('  ID'.padEnd(14) + 'Nome'.padEnd(40) + 'Tipo');
    console.log('  ' + '─'.repeat(56));

    goals.forEach(g => {
      const id = String(g.id || g.goalId || '?').padEnd(12);
      const name = (g.name || 'Senza nome').substring(0, 38).padEnd(38);
      const type = g.type || '-';
      console.log(`  ${id}  ${name}  ${type}`);
    });
    console.log('');
  } catch (error) {
    console.error(`Errore: ${error.message}`);
    process.exit(1);
  }
}

export async function goalsGetCommand(goalId) {
  try {
    const goal = await getGoal(goalId);
    console.log(JSON.stringify(goal, null, 2));
  } catch (error) {
    console.error(`Errore: ${error.message}`);
    process.exit(1);
  }
}

export async function goalsCreateCommand(options) {
  try {
    const goalData = {
      name: options.name,
      type: options.type || 'custom',
    };

    if (options.description) goalData.description = options.description;

    console.log(`Creazione goal "${options.name}"...`);
    const result = await createGoal(goalData);
    console.log('Goal creato.');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`Errore: ${error.message}`);
    process.exit(1);
  }
}

export async function goalsUpdateCommand(goalId, options) {
  try {
    const goalData = {};
    if (options.name) goalData.name = options.name;
    if (options.type) goalData.type = options.type;
    if (options.description) goalData.description = options.description;

    console.log(`Aggiornamento goal ${goalId}...`);
    const result = await updateGoal(goalId, goalData);
    console.log('Goal aggiornato.');
    if (result) console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`Errore: ${error.message}`);
    process.exit(1);
  }
}

export async function goalsDeleteCommand(goalId) {
  try {
    console.log(`Eliminazione goal ${goalId}...`);
    await deleteGoal(goalId);
    console.log('Goal eliminato.');
  } catch (error) {
    console.error(`Errore: ${error.message}`);
    process.exit(1);
  }
}

export async function goalsProgressCommand(goalId) {
  try {
    const data = await getGoalProgress(goalId);
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Errore: ${error.message}`);
    process.exit(1);
  }
}
