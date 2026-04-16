export const VALID_ACTIONS = new Set([
  'create_repo',
  'commit',
  'push',
  'pull',
  'create_pr',
  'list_repos',
  'list_prs',
  'delete_branch',
  'clone_repo',
  'merge_pr',
  'close_pr',
  'get_status',
]);

export function parseIntent(rawContent) {
  let json = rawContent.trim();

  const jsonMatch = json.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    json = jsonMatch[1].trim();
  }

  const firstBrace = json.indexOf('{');
  const lastBrace = json.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    json = json.slice(firstBrace, lastBrace + 1);
  }

  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new ParseError(`Could not parse LLM response as JSON: ${rawContent}`);
  }

  if (!parsed.action || typeof parsed.action !== 'string') {
    throw new ParseError('LLM response missing "action" field');
  }

  if (!VALID_ACTIONS.has(parsed.action)) {
    throw new ParseError(`Unknown action: ${parsed.action}`);
  }

  return {
    action: parsed.action,
    params: {
      repo: parsed.params?.repo ?? null,
      branch: parsed.params?.branch ?? null,
      message: parsed.params?.message ?? null,
      title: parsed.params?.title ?? null,
      base: parsed.params?.base ?? null,
      head: parsed.params?.head ?? null,
      visibility: parsed.params?.visibility ?? null,
      target: parsed.params?.target ?? null,
    },
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
    clarification_needed: parsed.clarification_needed === true,
    clarification_prompt: parsed.clarification_prompt ?? null,
  };
}

export class ParseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ParseError';
  }
}
