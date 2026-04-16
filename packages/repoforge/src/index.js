import { parseFlags } from './cli/flags.js';
import { loadConfig, configExists } from './config/loader.js';
import { runInit } from './config/init.js';
import { runRepl, processNaturalLanguage } from './cli/repl.js';
import {
  c,
  printVersion,
  printCliHelp,
  printBanner,
  printDivider,
} from './cli/renderer.js';
import { getRecentHistory, loadHistory, printHistory } from './history/logger.js';

export async function main() {
  const flags = parseFlags();

  if (flags.version) {
    printVersion();
    process.exit(0);
  }

  if (flags.help) {
    printCliHelp();
    process.exit(0);
  }

  const subcommand = process.argv[2];

  if (subcommand === 'init') {
    const config = loadConfig();
    await runInit(flags);
    process.exit(0);
  }

  if (subcommand === 'config') {
    const config = loadConfig();
    printBanner(config);
    printDivider();
    console.log(c.cyan('\n  Current Configuration:\n'));
    const display = { ...config };
    if (display.github?.token) {
      display.github = { ...display.github, token: display.github.token.slice(0, 4) + '...' };
    }
    console.log(
      JSON.stringify(display, null, 2)
        .split('\n')
        .map((l) => '  ' + l)
        .join('\n')
    );
    printDivider();
    process.exit(0);
  }

  if (flags.history) {
    const items = loadHistory().reverse();
    printDivider();
    console.log(c.bold(c.cyan('  Command History\n')));
    printHistory(items.slice(0, 50), c);
    printDivider();
    process.exit(0);
  }

  const config = loadConfig();

  if (flags.model) {
    config.llm.model = flags.model;
  }
  if (flags.endpoint) {
    config.llm.endpoint = flags.endpoint;
  }
  if (flags.noConfirm) {
    config.preferences.confirm_before_execute = false;
  }

  if (!configExists()) {
    printBanner(config);
    console.log(
      c.yellow('\n  ⚠  No config found. Run ') +
        c.cyan('repoforge init') +
        c.yellow(' to set up RepoForge.\n')
    );
  }

  const isPiped = !process.stdin.isTTY;

  if (isPiped) {
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    const input = Buffer.concat(chunks).toString('utf8').trim();
    if (input) {
      const session = {
        repo: flags.repo || null,
        branch: config.preferences.default_branch || 'main',
      };
      config._session = session;
      await processNaturalLanguage(input, config, session, flags);
    }
    process.exit(0);
  }

  if (flags.prompt) {
    const session = {
      repo: flags.repo || null,
      branch: config.preferences.default_branch || 'main',
    };
    config._session = session;
    await processNaturalLanguage(flags.prompt, config, session, flags);
    process.exit(0);
  }

  await runRepl(config, flags);
}
