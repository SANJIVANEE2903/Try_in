import chalk from 'chalk';
import gradient from 'gradient-string';

function ce(enabled) {
  return enabled !== false && process.env.NO_COLOR === undefined;
}

export const c = {
  green:  (s) => ce() ? chalk.green(s)            : s,
  red:    (s) => ce() ? chalk.red(s)              : s,
  yellow: (s) => ce() ? chalk.yellow(s)           : s,
  cyan:   (s) => ce() ? chalk.cyan(s)             : s,
  blue:   (s) => ce() ? chalk.blue(s)             : s,
  white:  (s) => ce() ? chalk.white(s)            : s,
  bold:   (s) => ce() ? chalk.bold(s)             : s,
  dim:    (s) => ce() ? chalk.dim(s)              : s,
  magenta:(s) => ce() ? chalk.magenta(s)          : s,
  bgBlue: (s) => ce() ? chalk.bgBlue.white.bold(s): s,
  italic: (s) => ce() ? chalk.italic(s)           : s,
};

const LOGO = `
  ██████╗ ███████╗██████╗  ██████╗ ███████╗ ██████╗ ██████╗  ██████╗ ███████╗
  ██╔══██╗██╔════╝██╔══██╗██╔═══██╗██╔════╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝
  ██████╔╝█████╗  ██████╔╝██║   ██║█████╗  ██║   ██║██████╔╝██║  ███╗█████╗  
  ██╔══██╗██╔══╝  ██╔═══╝ ██║   ██║██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══╝  
  ██║  ██║███████╗██║     ╚██████╔╝██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗
  ╚═╝  ╚═╝╚══════╝╚═╝      ╚═════╝ ╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝
`;

export function printBanner(config) {
  const model   = config?.llm?.model   || 'no model';
  const repo    = config?._session?.repo || 'none';
  const branch  = config?._session?.branch || config?.preferences?.default_branch || 'main';
  const version = 'v1.0.0';

  console.log(gradient.pastel.multiline(LOGO));
  console.log(
    '  ' +
    c.bold(c.white('RepoForge AI - Control GitHub with natural language')) +
    '  ' + c.dim('·') + '  ' +
    c.dim(version) + '  ' + c.dim('·') + '  ' +
    c.dim('model: ') + c.cyan(model)
  );
  console.log('');
  console.log(
    '  ' + c.dim('repo:') + ' ' + c.cyan(repo) +
    '   ' + c.dim('branch:') + ' ' + c.cyan(branch)
  );
  console.log('');
  printDivider();
}

export function printCompactHeader(config) {
  const model  = config?.llm?.model || 'no model';
  const repo   = config?._session?.repo || 'none';
  const branch = config?._session?.branch || config?.preferences?.default_branch || 'main';
  process.stdout.write(
    c.cyan('  ◆ RepoForge') +
    c.dim('  ' + model + '  ·  repo: ' + repo + '  ·  branch: ' + branch) +
    '\n\n'
  );
}

export function printDivider() {
  console.log(c.dim('  ' + '─'.repeat(66)));
}

export function printTips() {
  console.log(c.dim('  Tips:'));
  console.log(c.dim('  › Type in plain English — "create a private repo called api-gateway"'));
  console.log(c.dim('  › Use /help for slash commands  ·  /exit to quit  ·  --debug for full logs'));
  console.log('');
}

export function printActionPreview(intent, sessionConfig) {
  const repo   = intent.params?.repo   || sessionConfig?.repo   || c.dim('from config');
  const branch = intent.params?.branch || sessionConfig?.branch || 'main';

  console.log('');

  if (intent.explanation) {
    console.log('  ' + c.yellow('💡 ') + c.italic(c.dim(intent.explanation)));
    console.log('');
  }

  const actionTitle = intent.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  console.log(
    '  ' + c.bgBlue(' ACTION ') + '  ' + c.bold(c.white(actionTitle))
  );
  console.log('');

  const visibilityStr = intent.params?.visibility ? ` ${c.magenta(`(${intent.params.visibility})`)}` : '';
  const repoDisplay = repo + visibilityStr;

  const fields = [
    ['Action',     intent.action],
    ['Repo',       repoDisplay],
    ['Branch',     branch],
    ['Message',    intent.params?.message],
    ['Title',      intent.params?.title],
    ['Head',       intent.params?.head],
    ['Base',       intent.params?.base],
    ['Visibility', intent.params?.visibility ? c.magenta(intent.params.visibility) : null],
    ['Target',     intent.params?.target],
  ];

  for (const [label, value] of fields) {
    if (value && label !== 'Visibility' || (label === 'Visibility' && intent.params?.visibility && !repoDisplay.includes(intent.params.visibility))) {
      console.log(
        '  ' + c.dim(label.padEnd(12)) + c.white(value)
      );
    }
  }
  console.log('');
  printDivider();
}

export function printSuccess(msg) {
  console.log(c.green('  ✅ ') + c.white('Action completed successfully.'));
  if (msg) console.log('     ' + c.dim(msg));
}

export function printError(msg) {
  const lines = msg.split('\n');
  console.log('');
  console.log(c.red('  ❌ Error: ') + c.white(lines[0]));
  if (lines.length > 1) {
    for (const line of lines.slice(1)) {
      if (line.trim() && !line.includes('Error:') && !line.includes('stack')) {
         console.log(c.dim('     ' + line.trim()));
      }
    }
  }
  console.log('');
}

export function printWarning(msg) {
  console.log(c.yellow('  ⚠ ') + c.yellow(msg));
}

export function printInfo(msg) {
  console.log(c.dim('  · ') + c.white(msg));
}

export function printProgress(msg) {
  process.stdout.write(c.cyan('  ◆ ') + c.dim(msg) + '\n');
}

export function printStage(msg) {
  process.stdout.write(`\r\x1B[K  ${c.dim('⋮')} ${c.white(msg)}\n`);
}

export function printDebug(label, data) {
  const border = c.dim('  ' + '┄'.repeat(58));
  console.log('');
  console.log(border);
  console.log(c.cyan('  [debug] ') + c.bold(label));
  console.log(border);
  const lines = JSON.stringify(data, null, 2).split('\n');
  for (const line of lines) {
    console.log(c.dim('  ') + c.dim(line));
  }
  console.log(border);
  console.log('');
}

const SPINNER_FRAMES = ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'];

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  const toHex = (x) => Math.round(255 * x).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function waveRainbow(text, phase) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const hue = ((i * 360 / text.length) + phase) % 360;
    result += chalk.hex(hslToHex(hue, 100, 65))(text[i]);
  }
  return result;
}

export function createSpinner(initialText) {
  let interval = null;
  let frameIdx = 0;
  let text = initialText;
  const isTTY = process.stderr.isTTY;

  return {
    text(newText) {
      text = newText;
      if (!isTTY) {
        process.stderr.write('  ⏳ ' + text + '\n');
      }
      return this;
    },

    start() {
      if (!isTTY) {
        process.stderr.write('  ⏳ ' + text + '\n');
        return this;
      }
      process.stderr.write('\x1B[?25l');
      interval = setInterval(() => {
        const phase = (frameIdx * 12) % 360;
        const frame = SPINNER_FRAMES[frameIdx % SPINNER_FRAMES.length];
        const coloredFrame = chalk.hex(hslToHex((phase + 180) % 360, 100, 65))(frame);
        const coloredText = waveRainbow(text, phase);
        process.stderr.write(`\r  ${coloredFrame} ${coloredText}  `);
        frameIdx++;
      }, 80);
      return this;
    },

    stop() {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      if (isTTY) {
        process.stderr.write('\r\x1B[K\x1B[?25h');
      }
      return this;
    },

    succeed(msg) {
      this.stop();
      process.stderr.write('  ' + chalk.green('✔') + ' ' + chalk.green(msg || text) + '\n');
      return this;
    },

    fail(msg) {
      this.stop();
      process.stderr.write('  ' + chalk.red('✖') + ' ' + chalk.red(msg || text) + '\n');
      return this;
    },
    
    stopAndClear() {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      if (isTTY) {
        process.stderr.write('\r\x1B[K\x1B[?25h');
      }
      return this;
    }
  };
}

export function printHelp() {
  console.log('');
  console.log('  ' + c.bold(c.cyan('◆ Slash Commands')));
  console.log('');

  const commands = [
    ['/help',          'Show this help'],
    ['/repo [name]',   'Set active repository'],
    ['/branch [name]', 'Switch active branch'],
    ['/status',        'Show session status'],
    ['/history',       'Show last 10 commands'],
    ['/config',        'Show current config'],
    ['/clear',         'Clear the terminal'],
    ['/exit',          'Quit RepoForge'],
  ];

  for (const [cmd, desc] of commands) {
    console.log(
      '  ' + c.cyan(cmd.padEnd(18)) + c.dim(desc)
    );
  }

  console.log('');
  console.log('  ' + c.bold(c.cyan('◆ Natural Language Examples')));
  console.log('');

  const examples = [
    'list all my repos',
    'create a new private repo called api-gateway',
    'open a PR from dev to main titled "Add auth flow"',
    'commit everything with message "feat: add login"',
    'push to origin main',
    'delete the branch old-feature',
    'show me open PRs on this repo',
    'clone auth-service repo to current directory',
  ];

  for (const ex of examples) {
    console.log(c.dim('  > ') + c.italic(c.white(ex)));
  }
  console.log('');
  console.log('  ' + c.bold(c.cyan('◆ CLI Flags')));
  console.log('');
  console.log('  ' + c.cyan('--debug'.padEnd(18))   + c.dim('Show full request + response JSON'));
  console.log('  ' + c.cyan('--dry-run'.padEnd(18)) + c.dim('Preview action without executing'));
  console.log('  ' + c.cyan('--verbose'.padEnd(18)) + c.dim('Show execution trace'));
  console.log('  ' + c.cyan('--no-confirm'.padEnd(18)) + c.dim('Skip confirmation prompts'));
  console.log('');
}

export function printVersion() {
  console.log('repoforge v1.0.0');
}

export function printCliHelp() {
  console.log('');
  console.log(c.bold(c.cyan('  ◆ RepoForge')) + c.dim(' — AI-powered GitHub CLI  v1.0.0'));
  console.log('');
  console.log(c.bold('  USAGE'));
  console.log(c.dim('  ──────────────────────────────────────────'));
  console.log('  repoforge                      ' + c.dim('Start interactive REPL'));
  console.log('  repoforge "your prompt"        ' + c.dim('One-shot command'));
  console.log('  echo "prompt" | repoforge      ' + c.dim('Pipe mode'));
  console.log('  repoforge init                 ' + c.dim('Run setup wizard'));
  console.log('  repoforge config               ' + c.dim('Show current config'));
  console.log('');
  console.log(c.bold('  FLAGS'));
  console.log(c.dim('  ──────────────────────────────────────────'));

  const flags = [
    ['--version, -v',    'Show version'],
    ['--help, -h',       'Show this help'],
    ['--repo, -r [n]',   'Set repo context'],
    ['--no-confirm',     'Skip confirmation prompts'],
    ['--dry-run',        'Preview without executing'],
    ['--raw',            'Show raw API response JSON'],
    ['--debug, -d',      'Show full request + response JSON'],
    ['--model [name]',   'Override LLM model'],
    ['--endpoint [url]', 'Override LM Studio endpoint'],
    ['--verbose',        'Show full execution trace'],
    ['--history',        'Show command history'],
  ];

  for (const [flag, desc] of flags) {
    console.log('  ' + c.cyan(flag.padEnd(22)) + c.dim(desc));
  }
  console.log('');
}
