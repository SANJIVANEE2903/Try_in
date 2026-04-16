import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';

const HISTORY_DIR = join(homedir(), '.repoforge');
const HISTORY_PATH = join(HISTORY_DIR, 'history.json');
const MAX_HISTORY = 500;

export function loadHistory() {
  if (!existsSync(HISTORY_PATH)) return [];
  try {
    const raw = readFileSync(HISTORY_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function appendHistory(entry) {
  if (!existsSync(HISTORY_DIR)) {
    mkdirSync(HISTORY_DIR, { recursive: true });
  }
  const history = loadHistory();
  history.push({
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    ...entry,
  });
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }
  writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2), 'utf8');
}

export function getRecentHistory(n = 10) {
  const history = loadHistory();
  return history.slice(-n).reverse();
}

export function printHistory(items, c) {
  if (items.length === 0) {
    console.log(c.dim('  No history yet.'));
    return;
  }

  for (const entry of items) {
    const ts = new Date(entry.timestamp).toLocaleString();
    const statusIcon =
      entry.status === 'success'
        ? c.green('✔')
        : entry.status === 'cancelled'
        ? c.yellow('✗')
        : c.red('✗');
    console.log(
      `  ${statusIcon} ${c.dim(ts)}  ${c.bold(entry.parsed_action || '?')}  ${c.dim(entry.raw_input?.slice(0, 60) || '')}`
    );
  }
}
