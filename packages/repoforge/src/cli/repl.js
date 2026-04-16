import readline from 'readline';
import { callLLM, LLMError } from '../llm/client.js';
import { parseIntent, ParseError } from '../llm/parser.js';
import { dispatchAction, formatWebhookResult, WebhookError } from '../github/webhooks.js';
import { appendHistory, getRecentHistory, printHistory } from '../history/logger.js';
import {
  c,
  printActionPreview,
  printSuccess,
  printError,
  printWarning,
  printInfo,
  printProgress,
  printHelp,
  printBanner,
  printDivider,
} from './renderer.js';

function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

export async function runRepl(config, flags = {}) {
  const session = {
    repo: flags.repo || null,
    branch: config.preferences.default_branch || 'main',
  };

  config._session = session;

  printBanner(config);
  console.log(c.dim('\n  Type a command in plain English, /help for commands, or /exit to quit.\n'));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  const prompt = () =>
    new Promise((resolve) => {
      rl.question(c.cyan('> '), (line) => resolve(line));
    });

  let running = true;

  rl.on('close', () => {
    running = false;
  });

  while (running) {
    let input;
    try {
      input = await prompt();
    } catch {
      break;
    }

    input = input.trim();
    if (!input) continue;

    if (input.startsWith('/')) {
      const handled = await handleSlash(input, session, config, rl, flags);
      if (!handled) running = false;
      continue;
    }

    await processNaturalLanguage(input, config, session, flags, rl);
  }

  rl.close();
}

async function handleSlash(input, session, config, rl, flags) {
  const parts = input.slice(1).split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const arg = parts.slice(1).join(' ').trim();

  switch (cmd) {
    case 'help':
      printHelp();
      break;

    case 'repo':
      if (arg) {
        session.repo = arg;
        config._session = session;
        printSuccess(`Active repo set to: ${c.bold(arg)}`);
      } else if (session.repo) {
        printInfo(`Active repo: ${c.bold(session.repo)}`);
      } else {
        printWarning('No active repo. Usage: /repo [name]');
      }
      break;

    case 'branch':
      if (arg) {
        session.branch = arg;
        printSuccess(`Active branch set to: ${c.bold(arg)}`);
      } else {
        printInfo(`Active branch: ${c.bold(session.branch)}`);
      }
      break;

    case 'status':
      printDivider();
      printInfo(`Repo   : ${c.bold(session.repo || 'not set')}`);
      printInfo(`Branch : ${c.bold(session.branch)}`);
      printInfo(`Model  : ${c.bold(config.llm.model)}`);
      printInfo(`LLM    : ${c.bold(config.llm.endpoint)}`);
      printInfo(`n8n    : ${c.bold(config.n8n.webhook_base_url)}`);
      printDivider();
      break;

    case 'history': {
      const items = getRecentHistory(10);
      console.log('');
      console.log(c.bold(c.cyan('  Recent History')));
      printDivider();
      printHistory(items, c);
      console.log('');
      break;
    }

    case 'config':
      printDivider();
      console.log(c.cyan('  Current Configuration:\n'));
      const display = { ...config };
      delete display._session;
      if (display.github?.token) {
        display.github = { ...display.github, token: display.github.token.slice(0, 4) + '...' };
      }
      console.log(JSON.stringify(display, null, 2)
        .split('\n')
        .map((l) => '  ' + l)
        .join('\n'));
      printDivider();
      break;

    case 'clear':
      process.stdout.write('\x1Bc');
      break;

    case 'exit':
    case 'quit':
    case 'q':
      console.log(c.dim('\n  Goodbye!\n'));
      return false;

    default:
      printWarning(`Unknown command: /${cmd}. Type /help for available commands.`);
  }

  return true;
}

export async function processNaturalLanguage(input, config, session, flags = {}, rl = null) {
  const startTime = Date.now();
  let intent = null;
  let status = 'failed';
  let outputLines = [];

  try {
    printProgress('Parsing intent...');

    const raw = await callLLM(input, config, session);

    if (flags.verbose) {
      console.log(c.dim('  [verbose] LLM raw response: ' + raw));
    }

    intent = parseIntent(raw);

    if (intent.confidence < 0.5) {
      printWarning(
        `Not sure what you mean (confidence: ${(intent.confidence * 100).toFixed(0)}%).`
      );
      if (intent.action) {
        printWarning(`Did you mean: ${c.bold(intent.action)}?`);
      }
      printInfo('Rephrase your command or type /help.');
      appendHistory({
        raw_input: input,
        parsed_action: intent?.action || 'unknown',
        params: intent?.params || {},
        status: 'cancelled',
        output: 'Low confidence',
        duration_ms: Date.now() - startTime,
      });
      return;
    }

    if (intent.clarification_needed && intent.clarification_prompt) {
      console.log('');
      printWarning(intent.clarification_prompt);

      if (rl) {
        const clarification = await new Promise((resolve) =>
          rl.question(c.cyan('  > '), resolve)
        );
        if (clarification.trim()) {
          await processNaturalLanguage(
            input + ' ' + clarification.trim(),
            config,
            session,
            flags,
            rl
          );
          return;
        }
      }
      return;
    }

    if (flags.dryRun) {
      printActionPreview(intent, session);
      console.log(c.yellow('\n  [dry-run] No action executed.\n'));
      return;
    }

    printActionPreview(intent, session);

    const shouldConfirm =
      !flags.noConfirm &&
      config.preferences.confirm_before_execute &&
      intent.confidence >= 0.75;

    if (shouldConfirm) {
      let answer;
      if (rl) {
        answer = await new Promise((resolve) => rl.question(c.white('  Proceed? (y/n): '), resolve));
      } else {
        answer = 'y';
      }

      if (answer.trim().toLowerCase() !== 'y') {
        printInfo('Cancelled.');
        appendHistory({
          raw_input: input,
          parsed_action: intent.action,
          params: intent.params,
          status: 'cancelled',
          output: 'User cancelled',
          duration_ms: Date.now() - startTime,
        });
        return;
      }
    }

    if (!config.github.token) {
      printWarning('No active repo selected. Use /repo [name] to set one.');
      printError('GitHub token not configured.\nRun: repoforge init to authenticate.');
      return;
    }

    console.log('');
    printProgress(`Executing ${intent.action}...`);

    const result = await dispatchAction(intent, config, session, flags.verbose);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const lines = formatWebhookResult(result);

    for (const line of lines) {
      outputLines.push(line);
      printSuccess(line);
    }

    printSuccess(`Done  (${duration}s)`);
    status = 'success';

    if (flags.raw) {
      console.log('\n' + c.dim('  Raw response:'));
      console.log(JSON.stringify(result, null, 2)
        .split('\n')
        .map((l) => '  ' + l)
        .join('\n'));
    }
  } catch (err) {
    if (err instanceof LLMError) {
      printError(err.message);
    } else if (err instanceof WebhookError) {
      printError(err.message);
    } else {
      printError(err.message || 'An unexpected error occurred.');
      if (flags.verbose) console.error(err);
    }
    status = 'failed';
  }

  appendHistory({
    raw_input: input,
    parsed_action: intent?.action || 'unknown',
    params: intent?.params || {},
    status,
    output: outputLines.join('\n'),
    duration_ms: Date.now() - startTime,
  });
}
