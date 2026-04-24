import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const CONFIG_DIR = join(homedir(), '.repoforge');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');

export const DEFAULT_CONFIG = {
  github: {
    token: '',
    username: '',
    default_visibility: 'private',
  },
  llm: {
    provider: 'lmstudio',
    endpoint: 'http://localhost:1234/v1',
    model: 'mistral-7b-instruct',
    temperature: 0.2,
  },
  n8n: {
    webhook_base_url: 'http://localhost:5678/webhook',
  },
  graphify: {
    enabled: false,
    graph_path: 'graphify-out/graph.json',
  },
  preferences: {
    confirm_before_execute: true,
    show_raw_api_response: false,
    output_color: true,
    default_branch: 'main',
    trusted_folders: [],
  },
};

export function getConfigPath() {
  return CONFIG_PATH;
}

export function configExists() {
  return existsSync(CONFIG_PATH);
}

export function loadConfig() {
  if (!existsSync(CONFIG_PATH)) {
    return { ...DEFAULT_CONFIG };
  }
  try {
    const raw = readFileSync(CONFIG_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return deepMerge(DEFAULT_CONFIG, parsed);
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config) {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  // Strip internal runtime-only properties (prefixed with _) before persisting
  const cleaned = Object.fromEntries(
    Object.entries(config).filter(([key]) => !key.startsWith('_'))
  );
  writeFileSync(CONFIG_PATH, JSON.stringify(cleaned, null, 2), 'utf8');
}

function deepMerge(defaults, overrides) {
  const result = { ...defaults };
  for (const key of Object.keys(overrides)) {
    if (
      overrides[key] !== null &&
      typeof overrides[key] === 'object' &&
      !Array.isArray(overrides[key]) &&
      typeof defaults[key] === 'object'
    ) {
      result[key] = deepMerge(defaults[key], overrides[key]);
    } else {
      result[key] = overrides[key];
    }
  }
  return result;
}
