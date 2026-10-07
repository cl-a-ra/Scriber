import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { test } from 'node:test';
import { createApiApp } from './app';
import { ApiError } from './apiError';
import { createAIService, type AIService } from './geminiService';
import { parseGeneratedQuote, parseManifestationRequest, parseQuoteRequest } from '../lib/aiContracts';

const quote = {
  text: 'Love grows in the quiet moments when we choose to listen, make room, and meet each other with kindness.',
  authorName: 'Scriber Notes', category: 'love', visualStyle: 'Aurora Bloom',
  fontFamily: 'playfair', backgroundStyle: 'aurora-bloom', accentColor: '#6940b5',
  highlightWords: ['Love', 'quiet'], vibeBadge: 'Soft Connections', stylingNotes: 'A calm serif with generous spacing.',
};
const quoteInput = { userInput: 'love that feels like home', category: 'love', aestheticStyle: 'earthy-minimal' };
const manifestationInput = { intention: 'a creative career', feeling: 'confident', action: 'work on my portfolio', focus: 'Career & creativity', method: 'freewrite' };
const reflectionPrompts = ['What is one thing I already have?', 'What would progress look like today?', 'Who can support my next step?'];
const prose = Array.from({ length: 5 }, () => 'I choose calm confidence as I take one practical step toward a meaningful creative life and learn with patience.').join(' ');

async function withApi(run: (base: string) => Promise<void>, ai?: AIService, generationLimit = 100): Promise<void> {
  const app = createApiApp({ ai, generationLimit });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${address.port}/api`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

function post(base: string, endpoint: string, body: unknown) {
  return fetch(`${base}/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

test('quote request validation accepts custom topics, trims input, and rejects invalid types', () => {
  assert.equal(parseQuoteRequest({ userInput: '  embracing my hair  ' }).userInput, 'embracing my hair');
  for (const body of [null, [], {}, { userInput: 42 }, { userInput: ' ' }, { userInput: 'x'.repeat(1001) }, { userInput: 'love', category: 'invalid' }, { userInput: 'love', extra: true }]) {
    assert.throws(() => parseQuoteRequest(body));
  }
});

test('manifestation requests validate all required fields and enum values', () => {
  assert.equal(parseManifestationRequest(manifestationInput).method, 'freewrite');
  for (const body of [{}, { ...manifestationInput, action: '' }, { ...manifestationInput, method: 'invalid' }, { ...manifestationInput, focus: 'invalid' }, { ...manifestationInput, intention: 'x'.repeat(181) }]) {
    assert.throws(() => parseManifestationRequest(body));
  }
});

test('generated quote validation measures exact word thresholds and output shape', () => {
  for (const count of [15, 35]) {
    const text = Array.from({ length: count }, (_, index) => index % 2 ? 'kindness' : 'love').join(' ');
    assert.equal(parseGeneratedQuote({ ...quote, text, highlightWords: ['love', 'kindness'] }).text.split(/\s+/).length, count);
  }
  for (const count of [14, 36]) assert.throws(() => parseGeneratedQuote({ ...quote, text: 'love '.repeat(count).trim(), highlightWords: ['love', 'love'] }));
  assert.throws(() => parseGeneratedQuote({ ...quote, accentColor: 'red' }));
  assert.throws(() => parseGeneratedQuote({ ...quote, highlightWords: ['missing', 'words'] }));
  assert.throws(() => parseGeneratedQuote({ ...quote, fontFamily: 'unknown' }));
});

test('quote API forwards the exact topic to generation and returns typed JSON', async () => {
  let requestedTopic = '';
  const ai = createAIService(async (system, input) => {
    assert.match(system, /Prioritize the user's specific topic/);
    if ('userInput' in input && typeof input.userInput === 'string') requestedTopic = input.userInput;
    return quote;
  });
  await withApi(async (base) => {
    const response = await post(base, 'generate-quote', { ...quoteInput, userInput: '  love and embracing natural hair  ' });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.deepEqual(await response.json(), quote);
    assert.equal(requestedTopic, 'love and embracing natural hair');
  }, ai);
});

test('manifestation API generates all writing methods and formats exactly 3/6/9 repetitions', async () => {
  const ai = createAIService(async (_system, input) => ({
    text: 'method' in input && input.method === '369' ? quote.text : prose, reflectionPrompts,
  }));
  await withApi(async (base) => {
    for (const method of ['freewrite', 'future-self', 'gratitude', '369']) {
      const response = await post(base, 'generate-manifestation', { ...manifestationInput, method });
      assert.equal(response.status, 200);
      const result = await response.json();
      assert.deepEqual(result.reflectionPrompts, reflectionPrompts);
      if (method === '369') {
        const sections = result.text.split('\n\n').slice(1);
        assert.deepEqual(sections.map((section: string) => section.split('\n').length - 1), [3, 6, 9]);
        assert.match(result.text, /work on my portfolio/);
      } else {
        assert.equal(result.text, prose);
      }
    }
  }, ai);
});

test('invalid requests never reach the AI provider', async () => {
  let calls = 0;
  const ai = createAIService(async () => { calls++; return quote; });
  await withApi(async (base) => {
    for (const [endpoint, body] of [['generate-quote', { userInput: 42 }], ['generate-manifestation', { ...manifestationInput, method: 'bad' }]] as const) {
      const response = await post(base, endpoint, body);
      assert.equal(response.status, 400);
      assert.equal((await response.json()).code, 'INVALID_REQUEST');
    }
    assert.equal(calls, 0);
  }, ai);
});

test('unconfigured AI returns 503 instead of success-shaped curated fallback', async () => {
  const previous = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    await withApi(async (base) => {
      const health = await (await fetch(`${base}/health`)).json();
      assert.equal(health.aiConfigured, false);
      for (const [endpoint, body] of [['generate-quote', quoteInput], ['generate-manifestation', manifestationInput]] as const) {
        const response = await post(base, endpoint, body);
        assert.equal(response.status, 503);
        const payload = await response.json();
        assert.equal(payload.code, 'AI_NOT_CONFIGURED');
        assert.equal(payload.text, undefined);
      }
    });
  } finally {
    if (previous === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previous;
  }
});

test('invalid model output returns 502 without fabricated replacement content', async () => {
  const ai = createAIService(async () => ({ ...quote, text: 'too short' }));
  await withApi(async (base) => {
    const response = await post(base, 'generate-quote', quoteInput);
    assert.equal(response.status, 502);
    assert.equal((await response.json()).code, 'AI_INVALID_RESPONSE');
  }, ai);
});

test('AI attribution is bound to the requested author instead of model-invented attribution', async () => {
  const ai = createAIService(async () => ({ ...quote, authorName: 'An invented public figure attribution' }));
  const request = parseQuoteRequest({ ...quoteInput, authorName: 'My own voice' });
  assert.equal((await ai.generateQuote(request)).authorName, 'My own voice');
  assert.equal((await ai.generateQuote(parseQuoteRequest(quoteInput))).authorName, 'Scriber Notes');
});

test('manifestation generation checks prose and ritual word-count boundaries', async () => {
  for (const count of [80, 220]) {
    const ai = createAIService(async () => ({ text: 'calm '.repeat(count).trim(), reflectionPrompts }));
    const result = await ai.generateManifestation(parseManifestationRequest(manifestationInput));
    assert.equal(result.text.split(/\s+/).length, count);
  }
  for (const count of [79, 221]) {
    const ai = createAIService(async () => ({ text: 'calm '.repeat(count).trim(), reflectionPrompts }));
    await assert.rejects(ai.generateManifestation(parseManifestationRequest(manifestationInput)), { code: 'AI_INVALID_RESPONSE' });
  }
  for (const count of [14, 36]) {
    const ai = createAIService(async () => ({ text: 'calm '.repeat(count).trim(), reflectionPrompts }));
    await assert.rejects(ai.generateManifestation(parseManifestationRequest({ ...manifestationInput, method: '369' })), { code: 'AI_INVALID_RESPONSE' });
  }
  const ai = createAIService(async () => ({ text: prose, reflectionPrompts: ['Only one'] }));
  await assert.rejects(ai.generateManifestation(parseManifestationRequest(manifestationInput)), { code: 'AI_INVALID_RESPONSE' });
});

test('provider failures propagate explicit status and do not leak internal errors', async () => {
  const ai = createAIService(async () => { throw new ApiError(504, 'AI_TIMEOUT', 'AI generation took too long.'); });
  await withApi(async (base) => {
    const response = await post(base, 'generate-quote', quoteInput);
    assert.equal(response.status, 504);
    assert.deepEqual(await response.json(), { error: 'AI generation took too long.', code: 'AI_TIMEOUT' });
  }, ai);
});

test('generation rate limit is shared across both AI endpoints but not health', async () => {
  const ai = createAIService(async () => quote);
  await withApi(async (base) => {
    assert.equal((await post(base, 'generate-quote', quoteInput)).status, 200);
    const limited = await post(base, 'generate-manifestation', manifestationInput);
    assert.equal(limited.status, 429);
    assert.equal((await limited.json()).code, 'RATE_LIMITED');
    assert.ok(limited.headers.get('Retry-After'));
    assert.equal((await fetch(`${base}/health`)).status, 200);
  }, ai, 1);
});

test('API rejects malformed JSON, non-JSON bodies, oversized bodies, and unknown endpoints', async () => {
  await withApi(async (base) => {
    const malformed = await fetch(`${base}/generate-quote`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{invalid' });
    assert.equal(malformed.status, 400);
    assert.equal((await malformed.json()).code, 'INVALID_JSON');
    const plain = await fetch(`${base}/generate-quote`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: 'love' });
    assert.equal(plain.status, 415);
    const oversized = await post(base, 'generate-quote', { userInput: 'x'.repeat(40000) });
    assert.equal(oversized.status, 413);
    const missing = await fetch(`${base}/does-not-exist`);
    assert.equal(missing.status, 404);
    assert.equal((await missing.json()).code, 'NOT_FOUND');
  });
});
