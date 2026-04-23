import readline from 'readline';
import { execSync } from 'child_process';
import { callLLM, LLMError } from '../llm/client.js';
import { parseIntent } from '../llm/parser.js';
import { buildGraphifyEnhancedInput, getGraphifyContext } from '../graphify/context.js';
import { dispatchAction, formatWebhookResult, WebhookError } from '../github/webhooks.js';
import { appendHistory, getRecentHistory, printHistory } from '../history/logger.js';
import { saveConfig } from '../config/loader.js';
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
  printCompactHeader,
  printDivider,
  printTips,
  printDebug,
  createSpinner,
  printStage,
} from './renderer.js';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const MIN_INPUT_LENGTH = 3;

const EXAMPLE_COMMANDS = [
  'list repos',
  'create repo <name>',
  'create pr from <branch> to main',
  'delete branch <name>',
  'commit and push with message "your message"',
];

function validateInput(input) {
  if (!input || input.trim().length === 0) {
    return { valid: false, reason: 'empty' };
  }

  const trimmed = input.trim();

  if (trimmed.length < MIN_INPUT_LENGTH) {
    return { valid: false, reason: 'too_short' };
  }

  if (/^[^a-zA-Z]+$/.test(trimmed)) {
    return { valid: false, reason: 'no_words' };
  }

  return { valid: true };
}

export async function runRepl(config, flags = {}) {
  const session = {
    repo:   flags.repo || null,
    branch: config.preferences.default_branch || 'main',
  };

  config._session = session;

  printBanner(config);
  printTips();

  const rl = readline.createInterface({
    input:    process.stdin,
    output:   process.stdout,
    terminal: true,
  });

  const promptUser = () =>
    new Promise((resolve) => {
      rl.question(c.cyan('\n  ❯ '), (line) => resolve(line));
    });

  let running = true;
  rl.on('close', () => { running = false; });

  while (running) {
    let input;
    try {
      input = await promptUser();
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

    const validation = validateInput(input);
    if (!validation.valid) {
      console.log('');
      printWarning('Invalid command. Try:');
      for (const ex of EXAMPLE_COMMANDS) {
        console.log(c.dim('    › ') + c.italic(c.white(ex)));
      }
      continue;
    }

    await processNaturalLanguage(input, config, session, flags, rl);
  }

  rl.close();
}

async function handleSlash(input, session, config, rl, flags) {
  const parts = input.slice(1).split(/\s+/);
  const cmd   = parts[0].toLowerCase();
  const arg   = parts.slice(1).join(' ').trim();

  switch (cmd) {
    case 'help':
      printHelp();
      break;

    case 'repo':
      if (arg) {
        session.repo = arg;
        config._session = session;
        console.log('');
        printSuccess(`Active repo set to: ${c.bold(arg)}`);
      } else if (session.repo) {
        printInfo(`Active repo: ${c.bold(session.repo)}`);
      } else {
        printWarning('No active repo set. Usage: /repo [name]');
      }
      break;

    case 'branch':
      if (arg) {
        session.branch = arg;
        console.log('');
        printSuccess(`Active branch set to: ${c.bold(arg)}`);
      } else {
        printInfo(`Active branch: ${c.bold(session.branch)}`);
      }
      break;

    case 'status':
      console.log('');
      console.log('  ' + c.bold(c.cyan('◆ Session Status')));
      console.log('');
      printInfo(`Repo     ${c.bold(session.repo || c.dim('not set'))}`);
      printInfo(`Branch   ${c.bold(session.branch)}`);
      printInfo(`Model    ${c.bold(config.llm.model)}`);
      printInfo(`LLM      ${c.bold(config.llm.endpoint)}`);
      printInfo(`n8n      ${c.bold(config.n8n.webhook_base_url)}`);
      printInfo(`Confirm  ${c.bold(config.preferences.confirm_before_execute ? 'yes' : 'no')}`);
      printInfo(`Debug    ${c.bold(flags.debug ? 'on' : 'off')}`);
      console.log('');
      break;

    case 'history': {
      const items = getRecentHistory(10);
      console.log('');
      console.log('  ' + c.bold(c.cyan('◆ Recent History')));
      console.log('');
      printHistory(items, c);
      break;
    }

    case 'config': {
      const display = JSON.parse(JSON.stringify(config));
      delete display._session;
      if (display.github?.token && display.github.token.length > 4) {
        display.github.token = display.github.token.slice(0, 4) + '••••••••';
      }
      console.log('');
      console.log('  ' + c.bold(c.cyan('◆ Configuration')));
      console.log('');
      console.log(
        JSON.stringify(display, null, 2)
          .split('\n')
          .map((l) => '  ' + l)
          .join('\n')
      );
      console.log('');
      break;
    }

    case 'clear':
      process.stdout.write('\x1Bc');
      printCompactHeader(config);
      break;

    case 'exit':
    case 'quit':
    case 'q':
      console.log('');
      console.log(c.dim('  Goodbye. ◆\n'));
      return false;

    default:
      printWarning(`Unknown command: /${cmd} — type /help for available commands.`);
  }

  return true;
}

export async function processNaturalLanguage(input, config, session, flags = {}, rl = null) {
  const startTime = Date.now();
  let intent      = null;
  let status      = 'failed';
  let outputLines = [];

  const validation = validateInput(input);
  if (!validation.valid) {
    console.log('');
    printWarning('Invalid command. Try: ' + EXAMPLE_COMMANDS.join(', '));
    return;
  }

  const spinner = createSpinner('🧠 Understanding your request...');
  let execSpinner = null;

  if (rl) {
    // Attempt to erase the prompt line to prevent duplicate input display
    readline.moveCursor(process.stdout, 0, -1);
    readline.clearLine(process.stdout, 0);
  }

  const innerLen = input.length + 4;
  console.log('');
  console.log('  ╭' + '─'.repeat(innerLen) + '╮');
  console.log('  │ ' + c.cyan('❯ ') + input + ' │');
  console.log('  ╰' + '─'.repeat(innerLen) + '╯');

  try {
    console.log('');
    spinner.start();
    await sleep(300); // Stage 1 Cinematic Delay

    const graphifyContext = await getGraphifyContext(input, config);
    if (flags.debug && graphifyContext) {
      printDebug('GRAPHIFY CONTEXT USED', graphifyContext);
    }

    const llmInput = buildGraphifyEnhancedInput(input, graphifyContext);
    const raw = await callLLM(llmInput, config, session);

    if (flags.verbose) {
      printInfo(c.dim('LLM raw → ' + raw));
    }

    intent = parseIntent(raw);

    if (intent.action === 'commit' || intent.action === 'push') {
      intent.action = 'commit_and_push';
    }

    if (flags.debug) {
      printDebug('PARSED INTENT', {
        action:     intent.action,
        params:     intent.params,
        confidence: intent.confidence,
      });
    }

    if (intent.confidence < 0.5) {
      spinner.stopAndClear();
      printWarning(
        `Not sure what you mean. (confidence: ${(intent.confidence * 100).toFixed(0)}%)\n` +
        `Try: ${EXAMPLE_COMMANDS.slice(0, 3).join(', ')}`
      );
      appendHistory({
        raw_input: input, parsed_action: intent?.action || 'unknown',
        params: intent?.params || {}, status: 'cancelled',
        output: 'Low confidence', duration_ms: Date.now() - startTime,
      });
      return;
    }

    if (intent.clarification_needed && intent.clarification_prompt) {
      spinner.stopAndClear();
      console.log('');
      printWarning(intent.clarification_prompt);
      if (rl) {
        const clarification = await new Promise((resolve) =>
          rl.question(c.cyan('\n  ❯ '), resolve)
        );
        if (clarification.trim()) {
          await processNaturalLanguage(input + ' ' + clarification.trim(), config, session, flags, rl);
          return;
        }
      }
      return;
    }

    if (flags.dryRun) {
      spinner.stopAndClear();
      printActionPreview(intent, session);
      console.log(c.yellow('  [dry-run] Action previewed — nothing was executed.\n'));
      return;
    }

    spinner.stopAndClear();
    printStage(`🔍 Interpreting intent → ${c.bold(intent.action)}`);
    await sleep(300); // Stage 2 Cinematic Delay

    printActionPreview(intent, session);

    if (!config.github.token) {
      printError('GitHub token not configured.\nRun: repoforge init to authenticate.');
      return;
    }

    // ── Local git commit_and_push ──────────────────────────────────
    if (intent.action === 'commit_and_push') {
      const currentFolder = process.cwd();
      const trustedFolders = config.preferences?.trusted_folders || [];
      const isTrusted = trustedFolders.includes(currentFolder);

      if (!isTrusted) {
        if (rl) {
          const allowStr = await new Promise((resolve) =>
            rl.question(c.yellow(`\n  🔐 This folder is not trusted. Allow Git operations here? (y/n)\n  ❯ `), resolve)
          );
          if (allowStr.trim().toLowerCase() !== 'y') {
            console.log('');
            printError('❌ Operation cancelled (untrusted folder)');
            appendHistory({
              raw_input: input, parsed_action: intent.action,
              params: intent.params || {}, status: 'cancelled',
              output: 'Untrusted folder', duration_ms: Date.now() - startTime,
            });
            return;
          }
          
          config.preferences.trusted_folders = [...trustedFolders, currentFolder];
          saveConfig(config);
          console.log('');
          printSuccess('Folder added to trusted workspaces.');
          await sleep(300);
        } else {
          console.log('');
          printError('❌ Operation cancelled (untrusted folder, non-interactive mode)');
          return;
        }
      }

      console.log('');
      execSpinner = createSpinner('🔍 Checking local Git repository...');
      execSpinner.start();
      await sleep(300);

      try {
        execSync('git rev-parse --is-inside-work-tree', { stdio: 'pipe' });
      } catch {
        execSpinner.fail('Not a Git repo');
        printError('Not inside a Git repository. Run this inside your project folder.');
        appendHistory({
          raw_input: input, parsed_action: intent.action,
          params: intent.params || {}, status: 'failed',
          output: 'Not inside a Git repository', duration_ms: Date.now() - startTime,
        });
        return;
      }

      const commitMsg = intent.params?.message || intent.params?.commit_message || 'Update via RepoForge';

      execSpinner.text('📂 Staging all changes...');
      await sleep(200);

      try {
        execSync('git add .', { stdio: 'pipe' });
      } catch (e) {
        execSpinner.fail('Stage failed');
        printError('Failed to stage files: ' + e.message);
        return;
      }

      execSpinner.text(`💾 Committing: "${commitMsg}"...`);
      await sleep(200);

      let commitOutput = '';
      try {
        commitOutput = execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, { stdio: 'pipe', encoding: 'utf-8' });
      } catch (e) {
        const stderr = e.stderr?.toString() || e.message;
        if (stderr.includes('nothing to commit')) {
          execSpinner.stopAndClear();
          printWarning('Nothing to commit — working tree is clean.');
          appendHistory({
            raw_input: input, parsed_action: intent.action,
            params: intent.params || {}, status: 'success',
            output: 'Nothing to commit', duration_ms: Date.now() - startTime,
          });
          return;
        }
        execSpinner.fail('Commit failed');
        printError('Git commit failed: ' + stderr);
        return;
      }

      execSpinner.text('🚀 Pushing to remote...');
      await sleep(200);

      let pushOutput = '';
      try {
        pushOutput = execSync('git push', { stdio: 'pipe', encoding: 'utf-8' });
      } catch (e) {
        const stderr = e.stderr?.toString() || e.message;
        execSpinner.fail('Push failed');
        printError('Git push failed: ' + stderr);
        return;
      }

      execSpinner.stopAndClear();

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      const lines = commitOutput.trim().split('\n');

      console.log('');
      console.log('  ' + c.bold(c.green('✔ Committed & Pushed Successfully')));
      console.log('');
      console.log('  ' + c.cyan('  Message:  ') + c.white(commitMsg));
      for (const line of lines) {
        if (line.trim()) {
          console.log('  ' + c.dim('  ' + line.trim()));
        }
      }
      console.log('');
      printSuccess(`Done in ${duration}s`);
      status = 'success';
      outputLines.push('Committed and pushed: ' + commitMsg);

      console.log('');
      console.log('  ' + c.dim('─────────────────────────────'));

      appendHistory({
        raw_input: input, parsed_action: intent.action,
        params: intent.params || {}, status,
        output: outputLines.join('\n'), duration_ms: Date.now() - startTime,
      });
      return;
    }

    // ── n8n webhook dispatch (all other actions) ──────────────────
    console.log('');
    execSpinner = createSpinner(`⚡ Sending request to n8n...`);
    execSpinner.start();
    await sleep(300); // Stage 3 Cinematic Delay 1

    execSpinner.text(`🌐 Connecting to GitHub...`);
    await sleep(200); // Stage 3 Cinematic Delay 2

    const result = await dispatchAction(intent, config, session, flags.verbose, flags.debug);
    
    execSpinner.text(`📦 Processing response...`);
    await sleep(300); // Stage 4 Cinematic Delay
    
    execSpinner.stopAndClear();

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const lines    = formatWebhookResult(result, intent.action);

    console.log('');
    for (const line of lines) {
      outputLines.push(line);
      if (line.trim().startsWith('•') || line.trim().startsWith('…') || line.trim().match(/^\d+\./)) {
        console.log('  ' + c.cyan(line));
      } else {
        console.log('  ' + c.white(line));
      }
    }

    console.log('');
    printSuccess(`Done in ${duration}s`);
    status = 'success';

    if (flags.raw && !flags.debug) {
      console.log('');
      printInfo(c.dim('Raw response:'));
      console.log(
        JSON.stringify(result, null, 2)
          .split('\n')
          .map((l) => '  ' + l)
          .join('\n')
      );
    }

    console.log('');
    console.log('  ' + c.dim('─────────────────────────────'));
  } catch (err) {
    spinner.stop();
    if (execSpinner) execSpinner.fail('Failed');
    
    let errMsg = err.message || 'An unexpected error occurred.';
    if (config.github && config.github.token) {
      errMsg = errMsg.split(config.github.token).join('••••••••');
    }

    if (err instanceof LLMError || err instanceof WebhookError) {
      printError(errMsg);
    } else {
      printError(errMsg);
      if (flags.verbose || flags.debug) {
        console.error(err.stack ? err.stack.split(config.github?.token).join('••••••••') : err);
      }
    }
    status = 'failed';
    outputLines.push('Error: ' + errMsg);

    console.log('');
    console.log('  ' + c.dim('─────────────────────────────'));
  }

  appendHistory({
    raw_input:      input,
    parsed_action:  intent?.action || 'unknown',
    params:         intent?.params || {},
    status,
    output:         outputLines.join('\n'),
    duration_ms:    Date.now() - startTime,
  });
}
