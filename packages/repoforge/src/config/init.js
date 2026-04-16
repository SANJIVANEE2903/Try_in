import readline from 'readline';
import { loadConfig, saveConfig, DEFAULT_CONFIG } from './loader.js';
import { c, printBanner, printDivider } from '../cli/renderer.js';

function prompt(rl, question, defaultVal = '') {
  return new Promise((resolve) => {
    const hint = defaultVal ? ` [${defaultVal}]` : '';
    rl.question(`${question}${hint}: `, (answer) => {
      resolve(answer.trim() || defaultVal);
    });
  });
}

export async function runInit(flags = {}) {
  const config = loadConfig();

  printBanner(config);
  console.log(c.cyan('\n  RepoForge Setup Wizard\n'));
  printDivider();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    console.log(c.white('\n  GitHub Configuration\n'));

    const token = await prompt(
      rl,
      '  GitHub Personal Access Token',
      config.github.token || ''
    );
    const username = await prompt(
      rl,
      '  GitHub Username',
      config.github.username || ''
    );
    const visibility = await prompt(
      rl,
      '  Default repo visibility (public/private)',
      config.github.default_visibility || 'private'
    );

    console.log(c.white('\n  LLM Configuration (LM Studio)\n'));

    const endpoint = await prompt(
      rl,
      '  LM Studio endpoint URL',
      config.llm.endpoint || DEFAULT_CONFIG.llm.endpoint
    );
    const model = await prompt(
      rl,
      '  Model name',
      config.llm.model || DEFAULT_CONFIG.llm.model
    );
    const tempStr = await prompt(
      rl,
      '  Temperature (0.1-0.3 recommended)',
      String(config.llm.temperature ?? DEFAULT_CONFIG.llm.temperature)
    );

    console.log(c.white('\n  n8n Configuration\n'));

    const webhookBase = await prompt(
      rl,
      '  n8n webhook base URL',
      config.n8n.webhook_base_url || DEFAULT_CONFIG.n8n.webhook_base_url
    );

    console.log(c.white('\n  Preferences\n'));

    const confirmStr = await prompt(
      rl,
      '  Confirm before executing? (y/n)',
      config.preferences.confirm_before_execute ? 'y' : 'n'
    );
    const defaultBranch = await prompt(
      rl,
      '  Default branch name',
      config.preferences.default_branch || 'main'
    );

    const newConfig = {
      github: {
        token,
        username,
        default_visibility: visibility === 'public' ? 'public' : 'private',
      },
      llm: {
        provider: 'lmstudio',
        endpoint,
        model,
        temperature: parseFloat(tempStr) || 0.2,
      },
      n8n: {
        webhook_base_url: webhookBase,
      },
      preferences: {
        confirm_before_execute: confirmStr.toLowerCase() !== 'n',
        show_raw_api_response: config.preferences.show_raw_api_response,
        output_color: true,
        default_branch: defaultBranch,
      },
    };

    saveConfig(newConfig);

    printDivider();
    console.log(c.green('\n  ✔  Configuration saved successfully!\n'));
    console.log(
      c.white(`  Config location: ~/.repoforge/config.json\n`)
    );
    console.log(c.white(`  Run ${c.cyan('repoforge')} to start.\n`));
  } finally {
    rl.close();
  }
}
