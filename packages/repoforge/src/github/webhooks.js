import { c, printDebug } from '../cli/renderer.js';

export class WebhookError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'WebhookError';
    this.code = code;
  }
}

export async function dispatchAction(intent, config, sessionContext = {}, verbose = false, debug = false) {
  const baseUrl = config.n8n.webhook_base_url;
  const action  = intent.action;
  // Routes via body.action — single webhook endpoint handles all actions
  const url     = baseUrl.endsWith('/repoforge') ? baseUrl : `${baseUrl}/repoforge`;

  const repo   = intent.params.repo   || sessionContext.repo   || null;
  const branch = intent.params.branch || sessionContext.branch || config.preferences.default_branch;

  const params = {
    ...intent.params,
    repo,
    name:    repo,
    branch,
    owner:    config.github.username || null,
    username: config.github.username || null,
    default_visibility: intent.params.visibility || config.github.default_visibility,
  };

  const payload = {
    action,
    github_token: config.github.token,
    params,
  };

  if (debug) {
    printDebug('REQUEST → ' + url, {
      action,
      params: { ...params, github_token: '••••••••' },
    });
  } else if (verbose) {
    console.log('\n  [verbose] POST →', url);
    console.log('  [verbose] Payload:', JSON.stringify({ ...payload, github_token: '••••••••' }, null, 2));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    let data;
    const text = await response.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = { status: response.ok ? 'success' : 'error', message: text };
    }

    if (debug) {
      printDebug('RESPONSE ← HTTP ' + response.status, data);
    } else if (verbose) {
      console.log('  [verbose] Status:', response.status);
      console.log('  [verbose] Response:', JSON.stringify(data, null, 2));
    }

    if (response.status === 404) {
      throw new WebhookError(
        `n8n workflow not found or not activated.\nActivate "repoforge/${action}" in your n8n editor.`,
        'n8n_not_found'
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new WebhookError(
        `GitHub auth failed.\nRun: repoforge init to re-authenticate.`,
        'github_auth_failed'
      );
    }

    if (response.status === 429) {
      const resetAt = data.data?.reset_at || 'unknown';
      throw new WebhookError(
        `GitHub API rate limit hit.\nResets at: ${resetAt}`,
        'github_rate_limit'
      );
    }

    if (response.status === 500) {
      const reason = data.message || data.error || 'n8n workflow returned an internal error';
      throw new WebhookError(reason, 'n8n_internal_error');
    }

    if (!response.ok || data.status === 'error') {
      const msg = data.message || data.error || `HTTP ${response.status}`;
      throw new WebhookError(msg, 'webhook_error');
    }

    return data;

  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new WebhookError(
        `n8n request timed out after 20s.\nCheck your n8n cloud at: ${baseUrl}`,
        'n8n_timeout'
      );
    }
    if (err instanceof WebhookError) throw err;
    throw new WebhookError(
      `Could not reach n8n.\nCheck your webhook URL: ${baseUrl}`,
      'n8n_unreachable'
    );
  }
}

export function formatWebhookResult(data, action) {
  const lines = [];

  if (data.message) lines.push(data.message);
  if (data.url)     lines.push(`URL: ${data.url}`);

  if (data.data && typeof data.data === 'object') {
    const d = data.data;

    if (Array.isArray(d)) {
      if (d.length === 0) {
        lines.push('No results found.');
      } else {
        lines.push(`Found ${d.length} item${d.length !== 1 ? 's' : ''}:`);
        d.slice(0, 20).forEach((item) => {
          if (typeof item === 'string') {
            lines.push(`  • ${item}`);
          } else if (item.full_name || item.name) {
            const vis = item.private ? 'private' : 'public';
            const updated = item.updated_at ? ` · updated ${new Date(item.updated_at).toLocaleDateString()}` : '';
            lines.push(`  • ${item.full_name || item.name}  (${vis})${updated}`);
          }
        });
        if (d.length > 20) lines.push(`  … and ${d.length - 20} more`);
      }
    } else {
      if (d.html_url)   lines.push(`URL: ${d.html_url}`);
      if (d.number)     lines.push(`PR #${d.number}`);
      if (d.sha)        lines.push(`SHA: ${d.sha.slice(0, 7)}`);
      if (d.full_name)  lines.push(`Repo: ${d.full_name}`);
      if (d.clone_url)  lines.push(`Clone: ${d.clone_url}`);
    }
  }

  if (lines.length === 0) lines.push('Action completed successfully.');

  return lines;
}
