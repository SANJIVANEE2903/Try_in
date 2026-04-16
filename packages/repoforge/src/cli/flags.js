import minimist from 'minimist';

export function parseFlags(argv = process.argv.slice(2)) {
  const args = minimist(argv, {
    boolean: ['version', 'help', 'no-confirm', 'dry-run', 'raw', 'verbose', 'history'],
    string: ['repo', 'model', 'endpoint'],
    alias: {
      v: 'version',
      h: 'help',
      r: 'repo',
    },
    '--': true,
  });

  return {
    version: args.version || false,
    help: args.help || false,
    repo: args.repo || null,
    noConfirm: args['no-confirm'] || false,
    dryRun: args['dry-run'] || false,
    raw: args.raw || false,
    model: args.model || null,
    endpoint: args.endpoint || null,
    verbose: args.verbose || false,
    history: args.history || false,
    prompt: args._.join(' ').trim() || null,
  };
}
