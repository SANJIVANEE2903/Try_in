import inquirer from 'inquirer';
import { loadConfig, saveConfig, DEFAULT_CONFIG } from './loader.js';
import { c, printBanner, printDivider, printSuccess, printInfo } from '../cli/renderer.js';

export async function runInit() {
  const config = loadConfig();

  printBanner(config);

  console.log('  ' + c.bold(c.cyan('◆ RepoForge Setup Wizard')));
  console.log('');
  console.log(c.dim('  Answer each question — press Enter to accept the default value.'));
  console.log('');
  printDivider();

  try {
    console.log('\n  ' + c.bold(c.white('GitHub')));

    const ghAnswers = await inquirer.prompt([
      {
        type: 'password',
        name: 'token',
        message: 'Personal Access Token' + c.dim(' (needs repo + pull_request scopes)') + ':',
        default: config.github.token || '',
        mask: '*'
      },
      {
        type: 'list',
        name: 'visibility',
        message: 'Default repo visibility:',
        choices: ['private', 'public'],
        default: config.github.default_visibility || 'private'
      }
    ]);

    console.log('\n  ' + c.bold(c.white('LM Studio')));
    const llmAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'endpoint',
        message: 'LM Studio endpoint URL:',
        default: config.llm.endpoint || DEFAULT_CONFIG.llm.endpoint
      },
      {
        type: 'input',
        name: 'model',
        message: 'Model name:',
        default: config.llm.model || DEFAULT_CONFIG.llm.model
      },
      {
        type: 'input',
        name: 'temperature',
        message: 'Temperature:',
        default: String(config.llm.temperature ?? DEFAULT_CONFIG.llm.temperature)
      }
    ]);

    console.log('\n  ' + c.bold(c.white('n8n')));
    const n8nAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'webhookBase',
        message: 'Webhook base URL:',
        default: config.n8n.webhook_base_url || DEFAULT_CONFIG.n8n.webhook_base_url
      }
    ]);

    console.log('\n  ' + c.bold(c.white('Preferences')));
    const prefAnswers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmStr',
        message: 'Confirm before executing?',
        default: config.preferences.confirm_before_execute !== false
      },
      {
        type: 'input',
        name: 'defaultBranch',
        message: 'Default branch name:',
        default: config.preferences.default_branch || 'main'
      }
    ]);

    const newConfig = {
      github: {
        token: ghAnswers.token,
        username: config.github.username || '',
        default_visibility: ghAnswers.visibility,
      },
      llm: {
        provider:    'lmstudio',
        endpoint:    llmAnswers.endpoint,
        model:       llmAnswers.model,
        temperature: parseFloat(llmAnswers.temperature) || 0.2,
      },
      n8n: {
        webhook_base_url: n8nAnswers.webhookBase,
      },
      preferences: {
        confirm_before_execute:  prefAnswers.confirmStr,
        show_raw_api_response:   config.preferences.show_raw_api_response,
        output_color:            true,
        default_branch:          prefAnswers.defaultBranch,
        trusted_folders:         config.preferences.trusted_folders || [],
      },
    };

    saveConfig(newConfig);

    console.log('');
    printDivider();
    console.log('');
    printSuccess('Configuration saved to ~/.repoforge/config.json');
    printInfo(`Run ${c.cyan('repoforge')} to start.`);
    console.log('');

  } catch (err) {
    if (err.isTtyError) {
      console.error("Prompt couldn't be rendered in the current environment");
    } else {
      console.error(err);
    }
  }
}
