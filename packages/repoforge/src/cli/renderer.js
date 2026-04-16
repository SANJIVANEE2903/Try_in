import { createRequire } from 'module';

const require = createRequire(import.meta.url);

let chalk;
try {
  const chalkModule = await import('chalk');
  chalk = chalkModule.default;
} catch {
  chalk = null;
}

function colorEnabled() {
  return chalk !== null && process.env.NO_COLOR === undefined;
}

export const c = {
  green: (s) => (colorEnabled() ? chalk.green(s) : s),
  red: (s) => (colorEnabled() ? chalk.red(s) : s),
  yellow: (s) => (colorEnabled() ? chalk.yellow(s) : s),
  cyan: (s) => (colorEnabled() ? chalk.cyan(s) : s),
  white: (s) => (colorEnabled() ? chalk.white(s) : s),
  bold: (s) => (colorEnabled() ? chalk.bold(s) : s),
  dim: (s) => (colorEnabled() ? chalk.dim(s) : s),
  blue: (s) => (colorEnabled() ? chalk.blue(s) : s),
};

export function printBanner(config) {
  const model = config?.llm?.model || 'no model';
  const repo = config?._session?.repo || 'none';
  const branch = config?._session?.branch || config?.preferences?.default_branch || 'main';

  const version = 'v1.0';
  const topLine = `  RepoForge  ${version}  ●  ${model}  `;
  const botLine = `  Repo: ${repo}  │  Branch: ${branch}  `;
  const width = Math.max(topLine.length, botLine.length) + 2;
  const bar = '─'.repeat(width);

  console.log(c.cyan('┌' + bar + '┐'));
  console.log(c.cyan('│') + c.bold(topLine.padEnd(width)) + c.cyan('│'));
  console.log(c.cyan('│') + botLine.padEnd(width) + c.cyan('│'));
  console.log(c.cyan('└' + bar + '┘'));
}

export function printDivider() {
  console.log(c.dim('──────────────────────────────────────'));
}

export function printActionPreview(intent, sessionConfig) {
  const repo = intent.params?.repo || sessionConfig?.repo || 'not set';
  const branch = intent.params?.branch || sessionConfig?.branch || 'main';

  console.log('');
  printDivider();
  console.log(c.cyan('  ⚙  Action   : ') + c.bold(intent.action));

  const fields = [
    ['Repo', repo],
    ['Branch', branch],
    ['Message', intent.params?.message],
    ['Title', intent.params?.title],
    ['Head', intent.params?.head],
    ['Base', intent.params?.base],
    ['Visibility', intent.params?.visibility],
    ['Target', intent.params?.target],
  ];

  for (const [label, value] of fields) {
    if (value && value !== 'not set') {
      console.log(c.white(`     ${label.padEnd(10)}: `) + value);
    }
  }
  printDivider();
}

export function printSuccess(msg) {
  console.log(c.green('  ✔  ') + msg);
}

export function printError(msg) {
  console.log(c.red('  ✗  ') + msg);
}

export function printWarning(msg) {
  console.log(c.yellow('  ⚠  ') + msg);
}

export function printInfo(msg) {
  console.log(c.white('     ') + msg);
}

export function printProgress(msg) {
  console.log(c.cyan('  ⚙  ') + msg);
}

export function printHelp() {
  console.log('');
  console.log(c.bold(c.cyan('  RepoForge — Slash Commands')));
  printDivider();

  const commands = [
    ['/help', 'Show this help message'],
    ['/repo [name]', 'Set active repository context'],
    ['/branch [name]', 'Switch active branch'],
    ['/status', 'Show current session status'],
    ['/history', 'Show last 10 commands and results'],
    ['/config', 'Show current configuration'],
    ['/clear', 'Clear terminal output'],
    ['/exit', 'Exit RepoForge session'],
  ];

  for (const [cmd, desc] of commands) {
    console.log(
      c.cyan('  ' + cmd.padEnd(20)) + c.white(desc)
    );
  }
  console.log('');
  console.log(c.bold(c.cyan('  Natural Language Examples')));
  printDivider();

  const examples = [
    'create a new private repo called api-gateway',
    'commit everything with message "feat: add login"',
    'push to origin main',
    'open a PR from dev to main titled "Add auth flow"',
    'list all my repos',
    'delete the branch old-feature',
    'show me open PRs on this repo',
    'clone auth-service repo to current directory',
  ];

  for (const ex of examples) {
    console.log(c.dim('  > ') + c.white(ex));
  }
  console.log('');
}

export function printVersion() {
  console.log('repoforge v1.0.0');
}

export function printCliHelp() {
  console.log(`
${c.bold('RepoForge')} — AI-powered GitHub CLI

${c.bold('USAGE')}
  repoforge                     Start interactive REPL session
  repoforge "your prompt here"  Execute a single natural language command
  echo "prompt" | repoforge     Pipe mode for automation

${c.bold('FLAGS')}
  --version, -v         Show version number
  --help, -h            Show this help text
  --repo, -r [name]     Set repo context for this run
  --no-confirm          Skip confirmation prompts
  --dry-run             Show what would happen, don't execute
  --raw                 Show raw API response JSON
  --model [name]        Override LLM model for this run
  --endpoint [url]      Override LM Studio endpoint
  --verbose             Show full execution trace
  --history             Show command history

${c.bold('COMMANDS')}
  repoforge init        Run the interactive setup wizard
  repoforge config      Show current configuration

${c.bold('EXAMPLES')}
  ${c.dim('$')} repoforge
  ${c.dim('$')} repoforge "create a new private repo called my-api"
  ${c.dim('$')} repoforge --dry-run "push to origin main"
  ${c.dim('$')} echo "list all my repos" | repoforge
`);
}
