import { parseFlags } from './cli/flags.js';
import { loadConfig, configExists } from './config/loader.js';
import { runInit } from './config/init.js';
import { ensureAuthenticated } from './config/auth.js';
import { runRepl, processNaturalLanguage } from './cli/repl.js';
import {
  c,
  printVersion,
  printCliHelp,
  printBanner,
  printDivider,
  printWarning,
  printInfo,
} from './cli/renderer.js';
import { loadHistory, printHistory } from './history/logger.js';

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
    await runInit();
    process.exit(0);
  }

  if (subcommand === 'config') {
    const config = loadConfig();
    printBanner(config);
    console.log('  ' + c.bold(c.cyan('◆ Configuration')));
    console.log('');
    const display = JSON.parse(JSON.stringify(config));
    if (display.github?.token && display.github.token.length > 4) {
      display.github.token = display.github.token.slice(0, 4) + '••••••••';
    }
    console.log(
      JSON.stringify(display, null, 2)
        .split('\n')
        .map((l) => '  ' + l)
        .join('\n')
    );
    console.log('');
    printDivider();
    process.exit(0);
  }

  if (flags.history) {
    const items = loadHistory().reverse().slice(0, 50);
    printDivider();
    console.log('');
    console.log('  ' + c.bold(c.cyan('◆ Command History')));
    console.log('');
    printHistory(items, c);
    printDivider();
    process.exit(0);
  }

  const config = loadConfig();

  if (flags.model) config.llm.model = flags.model;
  if (flags.endpoint) config.llm.endpoint = flags.endpoint;
  if (flags.noConfirm) config.preferences.confirm_before_execute = false;

  await ensureAuthenticated(config);

  if (flags.prompt) {
    const session = {
      repo: flags.repo || null,
      branch: config.preferences.default_branch || 'main',
    };
    config._session = session;
    // Execute the first command
    await processNaturalLanguage(flags.prompt, config, session, flags);
    // Then continue into REPL for more commands
    await runRepl(config, flags);
    return;
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

  await runRepl(config, flags);
}
