import { execFile } from 'child_process';
import { existsSync } from 'fs';
import { dirname, isAbsolute, join, resolve } from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export async function getGraphifyContext(userInput, config) {
  if (!config.graphify?.enabled) {
    return '';
  }

  const graphPath = resolveGraphPath(config.graphify.graph_path || 'graphify-out/graph.json');

  try {
    const { stdout } = await execFileAsync(
      'graphify',
      ['query', userInput, '--graph', graphPath],
      {
        timeout: 30000,
        maxBuffer: 1024 * 1024,
      }
    );

    return stdout.trim();
  } catch {
    return '';
  }
}

function resolveGraphPath(graphPath) {
  if (isAbsolute(graphPath)) {
    return graphPath;
  }

  let current = process.cwd();
  while (true) {
    const candidate = join(current, graphPath);
    if (existsSync(candidate)) {
      return candidate;
    }

    const parent = dirname(current);
    if (parent === current) {
      return resolve(process.cwd(), graphPath);
    }
    current = parent;
  }
}

export function buildGraphifyEnhancedInput(userInput, graphifyContext) {
  if (!graphifyContext) {
    return userInput;
  }

  return `Graphify context:\n${graphifyContext}\n\nUser input:\n${userInput}`;
}