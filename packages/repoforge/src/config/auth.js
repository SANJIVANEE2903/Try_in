import readline from 'readline';
import { c, printBanner, printInfo, printError, printSuccess } from '../cli/renderer.js';
import { saveConfig } from './loader.js';
import { promptSecret } from './init.js';

export async function ensureAuthenticated(config) {
  if (config.github && config.github.token && config.github.token.trim() !== '') {
    if (!config._token_validated) {
      try {
        const response = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `token ${config.github.token}`,
            'User-Agent': 'RepoForge-CLI',
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          if (userData && userData.login && config.github.username !== userData.login) {
            config.github.username = userData.login;
            saveConfig(config);
          }
          config._token_validated = true;
          return;
        } else if (response.status === 401) {
          printError('Invalid GitHub token');
          config.github.token = ''; // Clear token to force re-authentication below
        } else {
          config._token_validated = true;
          return;
        }
      } catch (err) {
        config._token_validated = true;
        return;
      }
    } else {
      return;
    }
  }

  console.log('');
  printBanner(config);
  console.log('  ' + c.bold(c.cyan('◆ GitHub Authentication Required')));
  console.log('');
  console.log(c.dim('  It looks like this is your first time running RepoForge.'));
  console.log(c.dim('  You need a GitHub Personal Access Token (classic) with ' + c.white('repo') + ' and ' + c.white('pull_request') + ' scopes.'));
  console.log('');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  try {
    let token = '';
    let userData = null;
    while (!token) {
      token = await promptSecret(rl, 'Enter your GitHub Personal Access Token:');
      token = token.trim();
      
      if (!token) {
        process.stdout.write(c.red('  Token cannot be empty. Please try again.\n'));
        continue;
      }

      process.stdout.write(c.dim('\n  Validating token with GitHub...\n'));
      try {
        const response = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `token ${token}`,
            'User-Agent': 'RepoForge-CLI',
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        if (response.ok) {
          userData = await response.json();
        } else if (response.status === 401) {
          process.stdout.write(c.red('  Invalid token. Authentication failed. Please try again.\n'));
          token = '';
        } else {
          process.stdout.write(c.yellow(`  Warning: Could not validate token (HTTP ${response.status}). Proceeding anyway.\n`));
        }
      } catch (err) {
        process.stdout.write(c.yellow(`  Warning: Network error validating token. Proceeding anyway.\n`));
      }
    }

    // Basic format validation
    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
      process.stdout.write(c.yellow('  Warning: Token does not start with ghp_ or github_pat_. Assuming fine-grained or enterprise token.\n'));
    }

    config.github = config.github || {};
    config.github.token = token;
    if (userData && userData.login) {
      config.github.username = userData.login;
    }

    saveConfig(config);

    console.log('');
    printSuccess('Token saved successfully to ~/.repoforge/config.json');
    if (userData) {
      const displayName = userData.name || userData.login;
      console.log('  ' + c.green(`Welcome to RepoForge, ${c.bold(displayName)}!`));
    }
    console.log('');
  } finally {
    rl.close();
  }
}
