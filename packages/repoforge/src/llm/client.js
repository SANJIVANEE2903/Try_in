import { buildMessages } from './prompt.js';

export async function callLLM(userInput, config, sessionContext = {}) {
  const endpoint = config.llm.endpoint;
  const model = config.llm.model;
  const temperature = config.llm.temperature ?? 0.2;

  const url = `${endpoint}/chat/completions`;
  const messages = buildMessages(userInput, sessionContext);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: 512,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new LLMError(`LLM request failed (${response.status}): ${text}`, 'llm_error');
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new LLMError('Empty response from LLM', 'llm_empty');
    }

    return content;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new LLMError(
        `Cannot reach LLM at ${endpoint}.\nRun: repoforge init to update the endpoint.`,
        'llm_unreachable'
      );
    }
    if (err instanceof LLMError) throw err;
    throw new LLMError(
      `Cannot reach LLM at ${endpoint}.\nRun: repoforge init to update the endpoint.`,
      'llm_unreachable'
    );
  } finally {
    clearTimeout(timeout);
  }
}

export class LLMError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'LLMError';
    this.code = code;
  }
}
