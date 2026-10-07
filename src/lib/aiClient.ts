import { ContractError, GeneratedQuoteResult, parseGeneratedManifestation, parseGeneratedQuote, QuoteGenerationRequest } from './aiContracts';
import { GeneratedManifestationGuide, ManifestationGuideRequest } from '../types/manifestation';

async function request<T>(endpoint: string, input: object, parse: (value: unknown) => T): Promise<T> {
  if (!navigator.onLine) throw new Error('You are offline. Keep writing locally or use a writing template; AI needs an internet connection.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input), signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') throw new Error('AI generation took too long. Please try again.');
      throw new Error('Could not reach the server. Check your connection and try again.');
    }
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new Error('The server returned an unreadable response. Please try again.');
    }
    if (!response.ok) {
      if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') throw new Error(data.error);
      throw new Error(`Generation failed (HTTP ${response.status}). Please try again.`);
    }
    try {
      return parse(data);
    } catch (error) {
      if (!(error instanceof ContractError)) throw error;
      console.error('Generation response validation failed', { endpoint });
      throw new Error('The server returned an invalid generation response. Your existing writing has been preserved.');
    }
  } finally {
    clearTimeout(timeout);
  }
}

export function generateQuote(input: QuoteGenerationRequest): Promise<GeneratedQuoteResult> {
  return request('/api/generate-quote', input, parseGeneratedQuote);
}

export function generateManifestationGuide(input: ManifestationGuideRequest): Promise<GeneratedManifestationGuide> {
  return request('/api/generate-manifestation', input, parseGeneratedManifestation);
}
