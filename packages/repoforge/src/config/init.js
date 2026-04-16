import readline from 'readline';
import { loadConfig, saveConfig, DEFAULT_CONFIG } from './loader.js';
import { c, printBanner, printDivider, printSuccess, printInfo } from '../cli/renderer.js';

function promptLine(rl, question, defaultVal = '') {
  return new Promise((resolve) => {
    const hint = defaultVal ? c.dim(` [${defaultVal}]`) : '';
    rl.question(`\n  ${c.dim('›')} ${question}${hint}\n  ${c.cyan('❯')} `, (answer) => {
      resolve(answer.trim() || defaultVal);
    });
  });
}

function promptSecret(rl, question) {
  return new Promise((resolve) => {
    process.stdout.write(`\n  ${c.dim('›')} ${question}\n  ${c.cyan('❯')} `);

    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    const chars = [];

    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    const onData = (key) => {
      if (key === '\r' || key === '\n') {
        stdin.setRawMode?.(wasRaw || false);
        stdin.pause();
        stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(chars.join(''));
      } else if (key === '\u0003') {
        process.exit();
      } else if (key === '\u007f') {
        chars.pop();
        process.stdout.clearLine(0);
        process.stdout.cursorTo(4);
        process.stdout.write('•'.repeat(chars.length));
      } else {
        chars.push(key);
        process.stdout.write('•');
      }
    };

    stdin.on('data', onData);
  });
}

export async function runInit() {
  const config = loadConfig();

  printBanner(config);

  console.log('  ' + c.bold(c.cyan('◆ RepoForge Setup Wizard')));
  console.log('');
  console.log(c.dim('  Answer each question — press Enter to accept the default value.'));
  console.log('');
  printDivider();

  const rl = readline.createInterface({
    input:    process.stdin,
    output:   process.stdout,
    terminal: true,
  });

  try {
    console.log('\n  ' + c.bold(c.white('GitHub')));

    const token    = await promptLine(rl, 'Personal Access Token' + c.dim(' (needs repo + pull_request scopes)'), config.github.token || '');
    const username = await promptLine(rl, 'GitHub Username', config.github.username || '');
    const visibility = await promptLine(rl, 'Default repo visibility', config.github.default_visibility || 'private');

    console.log('\n  ' + c.bold(c.white('LM Studio')));

    const endpoint = await promptLine(rl, 'LM Studio endpoint URL', config.llm.endpoint || DEFAULT_CONFIG.llm.endpoint);
    const model    = await promptLine(rl, 'Model name', config.llm.model || DEFAULT_CONFIG.llm.model);
    const tempStr  = await promptLine(rl, 'Temperature', String(config.llm.temperature ?? DEFAULT_CONFIG.llm.temperature));

    console.log('\n  ' + c.bold(c.white('n8n')));

    const webhookBase = await promptLine(rl, 'Webhook base URL', config.n8n.webhook_base_url || DEFAULT_CONFIG.n8n.webhook_base_url);

    console.log('\n  ' + c.bold(c.white('Preferences')));

    const confirmStr    = await promptLine(rl, 'Confirm before executing?', config.preferences.confirm_before_execute ? 'y' : 'n');
    const defaultBranch = await promptLine(rl, 'Default branch name', config.preferences.default_branch || 'main');

    const newConfig = {
      github: {
        token,
        username,
        default_visibility: visibility === 'public' ? 'public' : 'private',
      },
      llm: {
        provider:    'lmstudio',
        endpoint,
        model,
        temperature: parseFloat(tempStr) || 0.2,
      },
      n8n: {
        webhook_base_url: webhookBase,
      },
      preferences: {
        confirm_before_execute:  confirmStr.toLowerCase() !== 'n',
        show_raw_api_response:   config.preferences.show_raw_api_response,
        output_color:            true,
        default_branch:          defaultBranch,
      },
    };

    saveConfig(newConfig);

    console.log('');
    printDivider();
    console.log('');
    printSuccess('Configuration saved to ~/.repoforge/config.json');
    printInfo(`Run ${c.cyan('repoforge')} to start.`);
    console.log('');

  } finally {
    rl.close();
  }
}
