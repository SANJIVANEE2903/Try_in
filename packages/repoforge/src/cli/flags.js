import minimist from 'minimist';

export function parseFlags(argv = process.argv.slice(2)) {
  const args = minimist(argv, {
    boolean: ['version', 'help', 'no-confirm', 'dry-run', 'raw', 'verbose', 'history', 'debug'],
    string: ['repo', 'model', 'endpoint'],
    alias: {
      v: 'version',
      h: 'help',
      r: 'repo',
      d: 'debug',
    },
    '--': true,
  });

  return {
    version:   args.version || false,
    help:      args.help    || false,
    repo:      args.repo    || null,
    noConfirm: args['no-confirm'] || false,
    dryRun:    args['dry-run']    || false,
    raw:       args.raw     || false,
    model:     args.model   || null,
    endpoint:  args.endpoint || null,
    verbose:   args.verbose || false,
    debug:     args.debug   || false,
    history:   args.history || false,
    prompt:    args._.join(' ').trim() || null,
  };
}
