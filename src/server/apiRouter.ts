import { Router, Request, Response } from 'express';
import { generateArtisticQuote } from './geminiService';
import { getCurrentSixHourTheme, DAILY_AFFIRMATIONS_BANK } from '../lib/cycleThemes';

export const apiRouter = Router();

apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'scriber-api' });
});

apiRouter.post('/generate-quote', async (req: Request, res: Response) => {
  try {
    const { userInput, category, aestheticStyle, authorName } = req.body || {};
    const result = await generateArtisticQuote({
      userInput,
      category,
      aestheticStyle,
      authorName
    });
    res.json(result);
  } catch (error) {
    console.error('API Error in /api/generate-quote:', error);
    res.status(500).json({ error: 'Failed to generate quote' });
  }
});

apiRouter.get('/trending-themes', (_req: Request, res: Response) => {
  try {
    const theme = getCurrentSixHourTheme();
    res.json(theme);
  } catch (error) {
    console.error('API Error in /api/trending-themes:', error);
    res.status(500).json({ error: 'Failed to fetch trending theme' });
  }
});

apiRouter.get('/affirmation-of-the-day', (_req: Request, res: Response) => {
  try {
    const dayIndex = new Date().getDate() % DAILY_AFFIRMATIONS_BANK.length;
    const affirmation = DAILY_AFFIRMATIONS_BANK[dayIndex];
    res.json(affirmation);
  } catch (error) {
    console.error('API Error in /api/affirmation-of-the-day:', error);
    res.status(500).json({ error: 'Failed to fetch daily affirmation' });
  }
});
