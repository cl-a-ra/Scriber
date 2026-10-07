import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { ContractError, parseManifestationRequest, parseQuoteRequest } from '../lib/aiContracts';
import { getCurrentSixHourTheme, DAILY_AFFIRMATIONS_BANK } from '../lib/cycleThemes';
import { createAIService, type AIService } from './geminiService';
import { ApiError } from './apiError';

export interface ApiRouterOptions {
  ai?: AIService;
  generationLimit?: number;
}

export function createApiRouter({ ai = createAIService(), generationLimit = 10 }: ApiRouterOptions = {}) {
  const router = Router();
  const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, limit: generationLimit,
    standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: 'Too many generation requests. Please wait before trying again.', code: 'RATE_LIMITED' },
    skipSuccessfulRequests: false,
  });
  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'scriber-api', aiConfigured: ai.isConfigured() });
  });
  router.post(['/generate-quote', '/generate-manifestation'], limiter, async (req, res, next) => {
    try {
      if (!req.is('application/json')) throw new ApiError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Send requests as application/json.');
      const result = req.path === '/generate-quote'
        ? await ai.generateQuote(parseQuoteRequest(req.body))
        : await ai.generateManifestation(parseManifestationRequest(req.body));
      res.json(result);
    } catch (error) {
      next(error instanceof ContractError ? new ApiError(400, 'INVALID_REQUEST', error.message) : error);
    }
  });
  router.get('/trending-themes', (_req, res) => res.json(getCurrentSixHourTheme()));
  router.get('/affirmation-of-the-day', (_req, res) => {
    const day = new Date().getDate();
    res.json(DAILY_AFFIRMATIONS_BANK[day % DAILY_AFFIRMATIONS_BANK.length]);
  });
  return router;
}
