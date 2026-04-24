import readline from 'readline';
import { execSync } from 'child_process';
import fs, { existsSync } from 'fs';
import os from 'os';
import path from 'path';
import inquirer from 'inquirer';
import { callLLM, LLMError } from '../llm/client.js';
import { parseIntent } from '../llm/parser.js';
import { buildGraphifyEnhancedInput, getGraphifyContext } from '../graphify/context.js';
import { dispatchAction, WebhookError } from '../github/webhooks.js';
import { appendHistory, getRecentHistory, printHistory } from '../history/logger.js';
import { saveConfig } from '../config/loader.js';
import {
  c,
  printActionPreview,
  renderResult,
  printSuccess,
  printError,
  printWarning,
  printInfo,
  printProgress,
  printHelp,
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

async function promptProjectInit(clonedPath) {
  try {
    // Check if folder is empty (ignore .git)
    const files = fs.readdirSync(clonedPath).filter(f => f !== '.git');
    if (files.length > 0) return; // Not empty

    console.log('');
    const { template } = await inquirer.prompt([{
      type: 'list',
      name: 'template',
      message: '🛠️ Initialize a project:',
      choices: [
        'Node.js',
        'Express API',
        'React (Vite)',
        'Next.js',
        'Skip'
      ]
    }]);

    if (template === 'Skip') return;

    console.log(`\n⚡ Setting up ${template} project...\n`);
    
    let command = '';
    if (template === 'Node.js') {
      command = 'npm init -y';
    } else if (template === 'Express API') {
      command = 'npm init -y && npm install express';
    } else if (template === 'React (Vite)') {
      command = 'npm create vite@latest . -- --template react && npm install';
    } else if (template === 'Next.js') {
      command = 'npx create-next-app@latest . --use-npm --yes';
    }

    try {
      if (template === 'Express API') {
        execSync(command, { stdio: 'inherit', cwd: clonedPath });
        fs.writeFileSync(path.join(clonedPath, 'index.js'), "const express = require('express');\nconst app = express();\napp.get('/', (req, res) => res.send('Hello World!'));\napp.listen(3000, () => console.log('Server ready'));\n");
      } else {
        execSync(command, { stdio: 'inherit', cwd: clonedPath });
      }
      console.log('\n✔ Project initialized successfully!\n');
    } catch (e) {
      printError('\n❌ Failed to initialize project: ' + (e.stderr ? e.stderr.toString() : e.message));
    }
  } catch (e) {
    printError('\n❌ Error checking folder or prompting: ' + e.message);
  }
}

async function handleCherryPick(input, rl) {
  const gitInfo = detectLocalGit();
  if (!gitInfo.found) {
    printError('\n❌ You are not inside a Git repository.');
    return;
  }

  try {
    const statusOutput = execSync('git status', { encoding: 'utf-8', stdio: 'pipe' });
    if (statusOutput.toLowerCase().includes('you are currently cherry-picking')) {
      console.log('');
      console.log(c.yellow('⚠️ Cherry-pick already in progress\n'));
      
      if (rl) rl.pause();
      const { action } = await inquirer.prompt([{
        type: 'list',
        name: 'action',
        message: '💡 Choose an action:',
        choices: [
          { name: 'Continue (git cherry-pick --continue)', value: 'continue' },
          { name: 'Abort (git cherry-pick --abort)', value: 'abort' },
          { name: 'Cancel', value: 'cancel' }
        ]
      }]);
      if (rl) rl.resume();

      if (action === 'cancel') return;

      if (action === 'continue') {
        console.log('\n🚀 Continuing cherry-pick...\n');
        try {
          execSync('git cherry-pick --continue', { stdio: 'pipe', encoding: 'utf-8' });
          console.log(c.green('✔ Cherry-pick continued and completed successfully!\n'));
        } catch (e) {
          const outMsg = (e.stdout || '') + '\n' + (e.stderr || '') + '\n' + e.message;
          if (outMsg.toLowerCase().includes('conflict') || outMsg.toLowerCase().includes('unmerged files')) {
            console.log(c.red('❌ Still in merge conflict\n'));
            console.log(c.cyan('💡 Resolve conflicts, then run:'));
            console.log(c.white('   git add .'));
            console.log(c.white('   git cherry-pick --continue\n'));
          } else {
            printError('\n❌ Continue failed:\n' + outMsg);
          }
        }
      } else if (action === 'abort') {
        console.log('\n🛑 Aborting cherry-pick...\n');
        try {
          execSync('git cherry-pick --abort', { stdio: 'pipe', encoding: 'utf-8' });
          console.log(c.green('✔ Cherry-pick aborted successfully.\n'));
        } catch (e) {
          printError('\n❌ Abort failed: ' + e.message);
        }
      }
      return;
    }
  } catch (ignore) {}

  const parts = input.trim().split(/\s+/);
  let hash = parts.slice(2).join(' ').trim();

  if (!hash) {
    try {
      const logOutput = execSync('git log -n 15 --oneline', { encoding: 'utf-8' });
      const commits = logOutput.split('\n').filter(l => l.trim()).map(line => {
        const h = line.split(' ')[0];
        return { name: line, value: h };
      });

      if (commits.length === 0) {
        printError('\n❌ No commits found in log.');
        return;
      }

      console.log('');
      if (rl) rl.pause();
      const { selectedHash } = await inquirer.prompt([{
        type: 'list',
        name: 'selectedHash',
        message: '🍒 Select a commit to cherry-pick:',
        choices: [
          ...commits,
          { name: 'Cancel', value: 'CANCEL' }
        ],
        pageSize: 15
      }]);
      if (rl) rl.resume();

      if (selectedHash === 'CANCEL') return;
      hash = selectedHash;
    } catch (e) {
      if (rl) rl.resume();
      printError('\n❌ Failed to get git log: ' + e.message);
      return;
    }
  }

  console.log(`\n🍒 Cherry-picking commit ${hash}...\n`);
  try {
    execSync(`git cherry-pick ${hash}`, { stdio: 'pipe', encoding: 'utf-8' });
    console.log('✔ Cherry-pick completed successfully!\n');
  } catch (e) {
    const outMsg = (e.stdout || '') + '\n' + (e.stderr || '') + '\n' + e.message;
    const lowerOut = outMsg.toLowerCase();
    
    if (lowerOut.includes('previous cherry-pick is now empty') || lowerOut.includes('nothing to commit')) {
      console.log(c.yellow('⚠️ Nothing to apply\n'));
      console.log(c.cyan('💡 This commit is already present in the current branch\n'));
      try { execSync('git cherry-pick --abort', { stdio: 'pipe' }); } catch (ignore) {}
    } else if (lowerOut.includes('conflict')) {
      console.log(c.red('❌ Merge conflict detected\n'));
      console.log(c.cyan('💡 Resolve conflicts, then run:'));
      console.log(c.white('   git add .'));
      console.log(c.white('   git cherry-pick --continue\n'));
    } else {
      printError('\n❌ Cherry-pick failed:\n' + outMsg);
    }
  }
}

async function handleSwitchBranch(input, rl) {
  const gitInfo = detectLocalGit();
  if (!gitInfo.found) {
    printError('\n❌ You are not inside a Git repository.');
    return;
  }

  let branch = '';
  const lowerInput = input.trim().toLowerCase();
  
  if (lowerInput.startsWith('switch to ')) {
    branch = input.trim().slice('switch to '.length).trim();
  } else if (lowerInput.startsWith('checkout ')) {
    branch = input.trim().slice('checkout '.length).trim();
  } else if (lowerInput.startsWith('switch ')) {
    branch = input.trim().slice('switch '.length).trim();
  }

  if (!branch) {
    try {
      const branchOutput = execSync('git branch --format="%(refname:short)"', { encoding: 'utf-8' });
      const branches = branchOutput.split('\n').map(b => b.trim()).filter(b => b);

      if (branches.length === 0) {
        printError('\n❌ No branches found.');
        return;
      }

      console.log('');
      if (rl) rl.pause();
      const { selectedBranch } = await inquirer.prompt([{
        type: 'list',
        name: 'selectedBranch',
        message: '🌿 Select a branch to switch to:',
        choices: [
          ...branches,
          { name: 'Cancel', value: 'CANCEL' }
        ],
        pageSize: 15
      }]);
      if (rl) rl.resume();

      if (selectedBranch === 'CANCEL') return;
      branch = selectedBranch;
    } catch (e) {
      if (rl) rl.resume();
      printError('\n❌ Failed to get branches: ' + e.message);
      return;
    }
  }

  try {
    execSync(`git switch ${branch}`, { encoding: 'utf-8', stdio: 'pipe' });
    console.log(c.green(`\n✔ Switched to branch '${branch}'\n`));
  } catch (e) {
    const outMsg = (e.stdout || '') + '\n' + (e.stderr || '') + '\n' + e.message;
    const lowerOut = outMsg.toLowerCase();
    
    if (lowerOut.includes('overwritten by checkout') || lowerOut.includes('local changes')) {
      console.log(c.red('\n❌ Uncommitted changes detected\n'));
      console.log(c.cyan('💡 Please commit or stash your changes before switching branches.\n'));
    } else if (lowerOut.includes('invalid reference') || lowerOut.includes('did not match any')) {
      console.log(c.red(`\n❌ Branch '${branch}' not found\n`));
      console.log(c.cyan('💡 Check the branch name or run just "switch" to select from a list.\n'));
    } else {
      printError('\n❌ Failed to switch branch:\n' + outMsg);
    }
  }
}

async function handleCreateBranch(input) {
  const gitInfo = detectLocalGit();
  if (!gitInfo.found) {
    printError('\n❌ Not inside a Git repository');
    return;
  }

  let branch = '';
  const lowerInput = input.trim().toLowerCase();
  
  if (lowerInput.startsWith('create branch ')) {
    branch = input.trim().slice('create branch '.length).trim();
  } else if (lowerInput.startsWith('new branch ')) {
    branch = input.trim().slice('new branch '.length).trim();
  }

  if (!branch) {
    printError('\n❌ Branch name is required.');
    return;
  }

  console.log(`\n🌿 Creating branch ${branch}...\n`);
  try {
    execSync(`git switch -c ${branch}`, { encoding: 'utf-8', stdio: 'pipe' });
    console.log(c.green(`✔ Switched to new branch: ${branch}\n`));
  } catch (e) {
    const outMsg = (e.stdout || '') + '\n' + (e.stderr || '') + '\n' + e.message;
    const lowerOut = outMsg.toLowerCase();
    
    if (lowerOut.includes('already exists')) {
      console.log(c.red(`❌ Branch already exists\n`));
    } else {
      printError('\n❌ Failed to create branch:\n' + outMsg);
    }
  }
}

async function handlePushSafe(input) {
  const { execSync } = await import('child_process');

  try {
    // Check if inside git repo
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });

    // Get current branch
    const currentBranch = execSync('git branch --show-current', {
      encoding: 'utf-8'
    }).trim();

    // Extract branch from input (optional)
    let branch = currentBranch;
    const match = input.match(/push(?: branch)? (\S+)/i);
    if (match) {
      const extracted = match[1];
      if (extracted.toLowerCase() !== 'current') {
        branch = extracted;
      }
    }

    console.log(`\n🚀 Pushing branch ${branch}...\n`);

    try {
      // Try normal push
      execSync(`git push`, { stdio: 'inherit' });
    } catch {
      // First-time push → set upstream
      console.log('🔗 First push detected. Setting upstream...\n');
      execSync(`git push -u origin ${branch}`, { stdio: 'inherit' });
    }

    console.log(`\n✔ Branch '${branch}' pushed successfully\n`);

  } catch {
    console.log('\n❌ Not inside a Git repository\n');
  }
}

async function promptForCloneDestination() {
  const desktopPath = path.join(os.homedir(), 'Desktop');
  const documentsPath = path.join(os.homedir(), 'Documents');
  const currentFolder = process.cwd();

  const choices = [
    { name: `Desktop (${desktopPath})`, value: desktopPath },
    { name: `Documents (${documentsPath})`, value: documentsPath },
    { name: `Current Folder (${currentFolder})`, value: currentFolder },
    { name: 'Browse Folders...', value: 'BROWSE' }
  ];

  let answer = await inquirer.prompt([{
    type: 'list',
    name: 'destination',
    message: 'Select clone destination:',
    choices
  }]);

  if (answer.destination !== 'BROWSE') {
    return answer.destination;
  }

  let currentBrowsePath = currentFolder;
  while (true) {
    let items;
    try {
      items = fs.readdirSync(currentBrowsePath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);
    } catch (e) {
      items = [];
    }

    const browseChoices = [
      { name: c.green('✅ [Select this folder]'), value: 'SELECT' },
      { name: c.yellow('🔙 .. (go back)'), value: 'BACK' }
    ];

    items.forEach(item => {
      browseChoices.push({ name: `📁 ${item}`, value: item });
    });

    console.log('');
    console.log(c.cyan(`📂 Current path: ${currentBrowsePath}`));
    console.log(c.dim('  (Use arrow keys to navigate)'));

    const res = await inquirer.prompt([{
      type: 'list',
      name: 'choice',
      message: 'Choose a folder:',
      choices: browseChoices,
      pageSize: 15
    }]);

    if (res.choice === 'SELECT') {
      return currentBrowsePath;
    } else if (res.choice === 'BACK') {
      currentBrowsePath = path.dirname(currentBrowsePath);
    } else {
      currentBrowsePath = path.join(currentBrowsePath, res.choice);
    }
  }
}

// ── Auto-detect local Git repository ────────────────────────────
function detectLocalGit() {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'pipe' });
    let repoName = null;
    let branch   = null;
    let hasRemote = false;
    // folder name as reliable fallback
    const folderName = path.basename(execSync('git rev-parse --show-toplevel', { stdio: 'pipe', encoding: 'utf-8' }).trim());
    try {
      const remoteUrl = execSync('git config --get remote.origin.url', { stdio: 'pipe', encoding: 'utf-8' }).trim();
      if (remoteUrl) {
        hasRemote = true;
        const parts = remoteUrl.split('/');
        repoName = parts[parts.length - 1].replace(/\.git$/, '');
      }
    } catch {}
    try {
      branch = execSync('git branch --show-current', { stdio: 'pipe', encoding: 'utf-8' }).trim() || null;
    } catch {}
    return { found: true, repoName: repoName || folderName, folderName, branch, hasRemote };
  } catch {
    return { found: false, repoName: null, folderName: null, branch: null, hasRemote: false };
  }
}

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
  const session = config._session || {
    repo:   flags.repo || null,
    branch: config.preferences.default_branch || 'main',
  };

  config._session = session;
  printTips();

  const rl = readline.createInterface({
    input:    process.stdin,
    output:   process.stdout,
    terminal: true,
  });

  const promptUser = () => {
    const git = detectLocalGit();
    let prefix;
    if (git.found) {
      const repoLabel = git.repoName || git.folderName || 'git';
      const branchLabel = git.branch || session.branch;
      prefix = c.dim('[') + c.cyan(repoLabel) + c.dim(' | ') + c.green(branchLabel) + c.dim(']');
    } else {
      prefix = c.dim('[') + c.yellow('no repo') + c.dim(']');
    }
    return new Promise((resolve) => {
      rl.question('\n  ' + prefix + ' ' + c.cyan('❯ '), (line) => resolve(line));
    });
  };

  let running = true;
  let authMode = false;
  rl.on('close', () => { running = false; });

  while (running) {
    let input;
    try {
      if (authMode) {
        if (rl) rl.pause();
        const res = await inquirer.prompt([{
          type: 'password',
          name: 'token',
          message: '🔐 Enter your GitHub Personal Access Token:',
          mask: '*'
        }]);
        input = res.token;
        if (rl) rl.resume();
      } else {
        input = await promptUser();
      }
    } catch {
      break;
    }

    input = input.trim();
    if (!input) continue;

    if (authMode) {
      if (input.toLowerCase() === '/exit' || input.toLowerCase() === '/quit') {
        running = false;
        continue;
      }
      
      const spinner = createSpinner('Validating token...');
      spinner.start();
      try {
        const res = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `Bearer ${input}`,
            'User-Agent': 'RepoForge-CLI'
          }
        });
        if (res.ok) {
          const data = await res.json();
          config.github = config.github || {};
          config.github.token = input;
          config.github.username = data.login;
          saveConfig(config);
          authMode = false;
          spinner.stopAndClear();
          console.log('');
          printSuccess(`Authenticated as ${c.bold(data.login)}`);
        } else {
          spinner.stopAndClear();
          printError('Invalid token, try again.');
        }
      } catch (e) {
        spinner.stopAndClear();
        printError('Network error validating token. Try again.');
      }
      continue;
    }

    if (input.startsWith('/')) {
      const state = { running, authMode };
      const handled = await handleSlash(input, session, config, rl, flags, state);
      running = state.running;
      authMode = state.authMode;
      if (!handled && !running) break;
      continue;
    }

    const lowerInput = input.trim().toLowerCase();
    
    if (lowerInput.startsWith('cherry pick')) {
      await handleCherryPick(input, rl);
      continue;
    }

    if (
      lowerInput.startsWith('switch to ') || 
      lowerInput.startsWith('checkout ') || 
      lowerInput.startsWith('switch ') || 
      lowerInput === 'switch' || 
      lowerInput === 'checkout'
    ) {
      await handleSwitchBranch(input, rl);
      continue;
    }

    if (lowerInput.startsWith('create branch ') || lowerInput.startsWith('new branch ')) {
      await handleCreateBranch(input);
      continue;
    }

    if (lowerInput.startsWith('push')) {
      await handlePushSafe(input);
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

async function handleSlash(input, session, config, rl, flags, state = null) {
  const parts = input.slice(1).split(/\s+/);
  const cmd   = parts[0].toLowerCase();
  const arg   = parts.slice(1).join(' ').trim();

  switch (cmd) {
    case 'cd':
      if (arg) {
        try {
          const target = path.resolve(process.cwd(), arg);
          if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
            process.chdir(target);
            console.log('');
            printSuccess(`Directory changed to: ${c.bold(process.cwd())}`);
          } else {
            console.log('');
            printError(`Path is not a valid directory: ${target}`);
          }
        } catch (e) {
          console.log('');
          printError(`Failed to change directory: ${e.message}`);
        }
      } else {
        if (rl) rl.pause();
        try {
          const selectedPath = await promptForCloneDestination();
          if (selectedPath && fs.existsSync(selectedPath) && fs.statSync(selectedPath).isDirectory()) {
            process.chdir(selectedPath);
            console.log('');
            printSuccess(`Directory changed to: ${c.bold(process.cwd())}`);
          }
        } catch (err) {
          console.log('');
          printError('Directory selection cancelled.');
        }
        if (rl) rl.resume();
      }
      break;

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

    case 'reauth':
    case 'logout':
      if (config.github) {
        config.github.token = '';
        saveConfig(config);
        console.log('');
        if (state) state.authMode = true;
      } else {
        printWarning('No GitHub configuration found.');
      }
      break;

    case 'clear':
      process.stdout.write('\x1Bc');
      printCompactHeader(config);
      break;

    case 'exit':
    case 'quit':
    case 'q':
      console.log('');
      console.log(c.dim('  Goodbye. 👋\n'));
      process.exit(0);

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

    // ── Auto-detect git repo for local actions ─────────────────────
    const GIT_DEPENDENT_ACTIONS = ['commit_and_push', 'create_pr', 'delete_branch', 'merge_pr', 'close_pr', 'pull'];
    if (GIT_DEPENDENT_ACTIONS.includes(intent.action)) {
      const gitInfo = detectLocalGit();
      if (!gitInfo.found) {
        // Not in a git repo — guide user with arrow-key menu
        spinner.stopAndClear();
        console.log('');
        console.log('  ' + c.bold(c.red('❌ No local repository found')));
        console.log('  ' + c.dim('   You are not inside a Git repository.'));
        console.log('');

        if (rl) rl.pause();
        try {
          const { nextAction } = await inquirer.prompt([{
            type: 'list',
            name: 'nextAction',
            message: '💡 What would you like to do?',
            choices: [
              { name: '📥  Clone an existing repository', value: 'clone' },
              { name: '🆕  Create a new repository', value: 'create' },
              { name: '↩️   Cancel', value: 'cancel' },
            ]
          }]);

          if (nextAction === 'clone') {
            if (rl) rl.resume();
            await processNaturalLanguage('clone a repo', config, session, flags, rl);
          } else if (nextAction === 'create') {
            if (rl) rl.resume();
            await processNaturalLanguage('create a new repo', config, session, flags, rl);
          } else {
            if (rl) rl.resume();
            console.log('');
            printInfo('Operation cancelled.');
          }
        } catch {
          if (rl) rl.resume();
        }
        appendHistory({
          raw_input: input, parsed_action: intent.action,
          params: intent.params || {}, status: 'cancelled',
          output: 'No local git repo found', duration_ms: Date.now() - startTime,
        });
        return;
      }
      // gitInfo.found === true → context already shown in prompt, proceed normally
    }

    // ── Local git clone_repo ───────────────────────────────────────
    if (intent.action === 'clone_repo') {
      const repoName = intent.params?.repo || intent.params?.name;
      const username = config.github?.username;

      if (!repoName) {
        printError('Repository name is required for cloning.');
        appendHistory({
          raw_input: input, parsed_action: intent.action,
          params: intent.params || {}, status: 'failed',
          output: 'Missing repo name', duration_ms: Date.now() - startTime,
        });
        return;
      }

      if (!username) {
        printError('GitHub username is not configured. Please run repoforge init or set it in ~/.repoforge/config.json.');
        appendHistory({
          raw_input: input, parsed_action: intent.action,
          params: intent.params || {}, status: 'failed',
          output: 'Missing GitHub username', duration_ms: Date.now() - startTime,
        });
        return;
      }

      if (rl) rl.pause();
      let selectedPath;
      try {
        selectedPath = await promptForCloneDestination();
      } catch (err) {
        if (rl) rl.resume();
        printError('Folder selection cancelled.');
        return;
      }
      if (rl) rl.resume();

      const targetFolder = path.join(selectedPath, repoName);

      if (existsSync(targetFolder)) {
        printError('❌ Folder already exists: ' + targetFolder);
        appendHistory({
          raw_input: input, parsed_action: intent.action,
          params: intent.params || {}, status: 'failed',
          output: 'Folder already exists', duration_ms: Date.now() - startTime,
        });
        return;
      }

      console.log('');
      const cloneSpinner = createSpinner(`🌐 Cloning from GitHub...`);
      cloneSpinner.start();
      await sleep(300);

      cloneSpinner.text(`🚀 Cloning repository...`);
      const repoUrl = `https://github.com/${username}/${repoName}.git`;

      try {
        execSync(`git clone ${repoUrl} "${targetFolder}"`, { stdio: 'pipe' });
        cloneSpinner.stopAndClear();
        
        console.log('');
        console.log('  ' + c.bold(c.green('✔ Clone completed successfully')));
        console.log('  ' + c.cyan('📁 Folder: ') + c.white(targetFolder));
        console.log('  ' + c.cyan('🔗 ') + c.white(repoUrl));
        console.log('');
        
        process.chdir(targetFolder);
        await promptProjectInit(targetFolder);

        status = 'success';
        outputLines.push(`Cloned repository: ${repoName} into ${targetFolder}`);
      } catch (e) {
        cloneSpinner.fail('Clone failed');
        const stderr = e.stderr?.toString() || e.message;
        if (stderr.includes('Repository not found') || stderr.includes('not found')) {
          printError('❌ Repository not found: ' + repoName);
        } else {
          printError('❌ Git clone failed: ' + stderr);
        }
        status = 'failed';
        outputLines.push('Error during clone: ' + stderr);
      }

      appendHistory({
        raw_input: input, parsed_action: intent.action,
        params: intent.params || {}, status,
        output: outputLines.join('\n'), duration_ms: Date.now() - startTime,
      });
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

      // Git repo already verified by the guard block above — get details
      const gitContext = detectLocalGit();
      const repoName = gitContext.repoName;

      const commitMsg = intent.params?.message || intent.params?.commit_message || 'Update via RepoForge';

      console.log('');
      execSpinner = createSpinner('📂 Staging all changes...');
      execSpinner.start();
      await sleep(300);

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
        const outMsg = (e.stdout?.toString() || '') + (e.stderr?.toString() || '') + e.message;
        if (outMsg.includes('nothing to commit')) {
          execSpinner.stopAndClear();
          console.log('');
          console.log('  ' + c.yellow('⚠️  No changes to commit'));
          console.log('');
          console.log('  ' + c.cyan('💡 Git does not track empty folders'));
          console.log('');
          console.log('  ' + c.dim('👉 Add a file inside your folder:'));
          console.log('  ' + c.dim('   e.g., my-folder/README.md'));
          console.log('');
          console.log('  ' + c.dim('Then run:'));
          console.log('  ' + c.white('   commit and push "initial commit"'));
          console.log('');
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

      // ── No remote configured — offer to link before pushing ──────
      if (!gitContext.hasRemote) {
        execSpinner.stopAndClear();
        console.log('');
        console.log('  ' + c.yellow('⚠️  No remote repository configured'));
        console.log('  ' + c.dim('   This repo has no origin remote linked to GitHub.'));
        console.log('');
        let shouldLink = false;
        if (rl) {
          const ans = await new Promise((resolve) =>
            rl.question(c.cyan('  💡 Do you want to link this repo to GitHub? (y/n)\n  ❯ '), resolve)
          );
          shouldLink = ans.trim().toLowerCase() === 'y';
        }
        if (shouldLink) {
          const username = config.github?.username;
          const repoLabel = gitContext.folderName || gitContext.repoName;
          if (username && repoLabel) {
            const remoteUrl = `https://github.com/${username}/${repoLabel}.git`;
            try {
              execSync(`git remote add origin ${remoteUrl}`, { stdio: 'pipe' });
              printSuccess(`Remote linked: ${remoteUrl}`);
              console.log('');
            } catch (e) {
              printError('Failed to add remote: ' + e.message);
              appendHistory({
                raw_input: input, parsed_action: intent.action,
                params: intent.params || {}, status: 'failed',
                output: 'Failed to add remote', duration_ms: Date.now() - startTime,
              });
              return;
            }
          } else {
            printError('Cannot link — GitHub username not configured. Run: repoforge init');
            return;
          }
        } else {
          printInfo('Push skipped. Commit was saved locally.');
          appendHistory({
            raw_input: input, parsed_action: intent.action,
            params: intent.params || {}, status: 'success',
            output: 'Committed locally, push skipped (no remote)', duration_ms: Date.now() - startTime,
          });
          return;
        }
      }

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

      const branchName = gitContext.branch || session.branch;

      console.log('');
      console.log('  ' + c.bold(c.green('✔ Committed & Pushed Successfully')));
      console.log('');
      if (repoName) {
        console.log('  ' + c.cyan('📦 Repo:    ') + c.white(repoName));
      } else {
        console.log('  ' + c.yellow('⚠️ No remote repository configured'));
      }
      console.log('  ' + c.cyan('🌿 Branch:  ') + c.white(branchName));
      console.log('  ' + c.cyan('💬 Message: ') + c.white(commitMsg));
      console.log('');
      console.log('  ' + c.dim('─────────────────────────────'));
      console.log('');

      for (const line of lines) {
        if (line.trim()) {
          console.log('  ' + c.dim(line.trim()));
        }
      }
      
      console.log('');
      console.log('  ' + c.cyan(`⏱ Done in ${duration}s`));
      
      status = 'success';
      outputLines.push('Committed and pushed: ' + commitMsg);

      appendHistory({
        raw_input: input, parsed_action: intent.action,
        params: intent.params || {}, status,
        output: outputLines.join('\n'), duration_ms: Date.now() - startTime,
      });
      return;
    }

    // ── Local git pull ─────────────────────────────────────────────
    if (intent.action === 'pull') {
      const gitContext = detectLocalGit();
      const repoName = gitContext.repoName || gitContext.folderName;
      const branchName = gitContext.branch || session.branch;

      console.log('');
      execSpinner = createSpinner('🔄 Pulling latest changes...');
      execSpinner.start();
      await sleep(300);

      if (!gitContext.hasRemote) {
        execSpinner.stopAndClear();
        printWarning('No remote repository configured');
        appendHistory({
          raw_input: input, parsed_action: intent.action,
          params: intent.params || {}, status: 'failed',
          output: 'No remote configured', duration_ms: Date.now() - startTime,
        });
        return;
      }

      let pullOutput = '';
      try {
        pullOutput = execSync('git pull', { stdio: 'pipe', encoding: 'utf-8' });
      } catch (e) {
        const stderr = e.stderr?.toString() || e.message;
        execSpinner.stopAndClear();
        if (stderr.toLowerCase().includes('conflict')) {
          printError('Merge conflict detected');
        } else {
          printError('Git pull failed: ' + stderr);
        }
        return;
      }

      execSpinner.stopAndClear();

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      const lines = pullOutput.trim().split('\n');

      console.log('');
      console.log('  ' + c.bold(c.green('✔ Repository updated successfully')));
      console.log('');
      console.log('  ' + c.cyan('📦 Repo:    ') + c.white(repoName));
      console.log('  ' + c.cyan('🌿 Branch:  ') + c.white(branchName));
      console.log('');
      console.log('  ' + c.dim('─────────────────────────────'));
      console.log('');

      for (const line of lines) {
        if (line.trim()) {
          console.log('  ' + c.dim(line.trim()));
        }
      }
      
      console.log('');
      console.log('  ' + c.cyan(`⏱ Done in ${duration}s`));
      
      status = 'success';
      outputLines.push('Pulled latest changes');

      appendHistory({
        raw_input: input, parsed_action: intent.action,
        params: intent.params || {}, status,
        output: outputLines.join('\n'), duration_ms: Date.now() - startTime,
      });
      return;
    }

    // ── No remote configured check for PRs ───────────────────────
    if (intent.action === 'create_pr') {
      const gitContext = detectLocalGit();
      if (!gitContext.hasRemote) {
        console.log('');
        console.log('  ' + c.yellow('⚠️  No remote repository configured'));
        console.log('  ' + c.dim('   This repo has no origin remote linked to GitHub.'));
        console.log('');
        let shouldLink = false;
        if (rl) {
          const ans = await new Promise((resolve) =>
            rl.question(c.cyan('  💡 Do you want to link this repo to GitHub? (y/n)\n  ❯ '), resolve)
          );
          shouldLink = ans.trim().toLowerCase() === 'y';
        }
        if (shouldLink) {
          const username = config.github?.username;
          const repoLabel = gitContext.folderName || gitContext.repoName;
          if (username && repoLabel) {
            const remoteUrl = `https://github.com/${username}/${repoLabel}.git`;
            try {
              execSync(`git remote add origin ${remoteUrl}`, { stdio: 'pipe' });
              printSuccess(`Remote linked: ${remoteUrl}`);
              console.log('  ' + c.dim('Please push your branch before creating a PR.'));
              console.log('');
            } catch (e) {
              printError('Failed to add remote: ' + e.message);
              appendHistory({
                raw_input: input, parsed_action: intent.action,
                params: intent.params || {}, status: 'failed',
                output: 'Failed to add remote', duration_ms: Date.now() - startTime,
              });
              return;
            }
          } else {
            printError('Cannot link — GitHub username not configured. Run: repoforge init');
            return;
          }
        } else {
          printInfo('PR creation cancelled.');
          appendHistory({
            raw_input: input, parsed_action: intent.action,
            params: intent.params || {}, status: 'cancelled',
            output: 'PR creation skipped (no remote)', duration_ms: Date.now() - startTime,
          });
          return;
        }
      }
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

    // ── Validate n8n result for create_repo ─────────────────────
    let createRepoSucceeded = true;
    if (intent.action === 'create_repo') {
      const repoData = result.data || result.result || result;
      const repoObj = Array.isArray(repoData) ? repoData[0] : repoData;
      const hasName = !!(repoObj?.name);
      const hasUrl = !!(repoObj?.html_url || repoObj?.url);
      if (!hasName && !hasUrl) {
        createRepoSucceeded = false;
        console.log('');
        console.log('  ' + c.bold(c.red('❌ Repository creation failed')));
        console.log('  ' + c.yellow('⚠️  n8n workflow did not return repo data.'));
        console.log('  ' + c.dim('    Make sure the workflow is active and the GitHub token has repo scope.'));
        console.log('');
        console.log('  ' + c.cyan(`⏱ Done in ${duration}s`));
        status = 'error';
        outputLines.push('create_repo failed — no result data returned');
      }
    }

    if (createRepoSucceeded) {
      console.log('');
      renderResult(intent.action, result);
      console.log('');
      console.log('  ' + c.cyan(`⏱ Done in ${duration}s`));
      status = 'success';
      outputLines.push(`Action ${intent.action} completed`);
    }

    // ── Clone suggestion after create_repo ──────────────────────
    if (intent.action === 'create_repo' && rl && createRepoSucceeded) {
      const repoData = result.data || result.result || result;
      const repoObj = Array.isArray(repoData) ? repoData[0] : repoData;
      const repoName = repoObj?.name || intent.params?.repo || intent.params?.name;
      // Prefer URL from n8n response, fallback to constructing from config
      const resultUrl = repoObj?.html_url || repoObj?.url;
      const username = config.github?.username;

      if (repoName) {
        console.log('');
        rl.pause();
        try {
          const { wantClone } = await inquirer.prompt([{
            type: 'confirm',
            name: 'wantClone',
            message: '💡 Do you want to clone this repository locally?',
            default: true
          }]);

          if (wantClone) {
            // Build clone URL: prefer n8n result URL, fallback to config username
            let cloneUrl;
            if (resultUrl) {
              cloneUrl = resultUrl.endsWith('.git') ? resultUrl : resultUrl + '.git';
            } else if (username) {
              cloneUrl = `https://github.com/${username}/${repoName}.git`;
            } else {
              printError('Cannot determine clone URL — no URL from response and no username configured.');
              rl.resume();
              return;
            }

            let selectedPath;
            try {
              selectedPath = await promptForCloneDestination();
            } catch (err) {
              rl.resume();
              printError('Folder selection cancelled.');
              selectedPath = null;
            }

            if (selectedPath) {
              const targetFolder = path.join(selectedPath, repoName);
              if (existsSync(targetFolder)) {
                printError('Folder already exists: ' + targetFolder);
              } else {
                console.log('');
                const cloneSpinner = createSpinner('🚀 Waiting for GitHub to propagate...');
                cloneSpinner.start();
                // GitHub propagation delay — repo may not be immediately cloneable
                await sleep(2000);
                cloneSpinner.text('🚀 Cloning repository...');

                try {
                  execSync(`git clone ${cloneUrl} "${targetFolder}"`, { stdio: 'pipe' });
                  cloneSpinner.stopAndClear();
                  console.log('');
                  console.log('  ' + c.bold(c.green('✔ Clone completed successfully')));
                  console.log('  ' + c.cyan('📁 Folder: ') + c.white(targetFolder));
                  console.log('  ' + c.cyan('🔗 ') + c.white(cloneUrl));
                  console.log('');
                  
                  process.chdir(targetFolder);
                  await promptProjectInit(targetFolder);

                  outputLines.push(`Cloned to ${targetFolder}`);
                } catch (e) {
                  cloneSpinner.stopAndClear();
                  const stderr = e.stderr?.toString() || e.message;
                  if (stderr.includes('not found') || stderr.includes('not exist') || stderr.includes('Repository not found')) {
                    printError('Repository not found or not accessible.\n  URL: ' + cloneUrl + '\n  The repo may still be propagating — try cloning manually in a few seconds.');
                  } else {
                    printError('Git clone failed: ' + stderr);
                  }
                }
              }
            }
          }
        } catch (e) {
          // User cancelled prompt — skip clone silently
        }
        rl.resume();
      }
    }

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
