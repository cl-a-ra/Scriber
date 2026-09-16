import { GoogleGenAI } from '@google/genai';
import { QuoteCategory, FontChoice, BackgroundStyle } from '../types/quote';

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface GenerateQuoteParams {
  userInput?: string;
  category?: QuoteCategory;
  aestheticStyle?: 'reggae-roots' | 'gen-z' | 'earthy-minimal' | 'locs-crown' | 'vintage-dub';
  vibe?: string;
  authorName?: string;
}

export interface GeneratedQuoteResult {
  text: string;
  authorName: string;
  category: QuoteCategory;
  visualStyle: string;
  fontFamily: FontChoice;
  backgroundStyle: BackgroundStyle;
  accentColor: string;
  highlightWords: string[];
  vibeBadge: string;
  stylingNotes: string;
}

export async function generateArtisticQuote(params: GenerateQuoteParams): Promise<GeneratedQuoteResult> {
  const client = getGeminiClient();

  const prompt = `You are Scriber's typography designer and quote poet specializing in earthy tones, dreadlocs/locs hair appreciation, roots reggae philosophy, and relatable Gen-Z affirmations.
Craft an original, evocative, deeply resonant quote based on these preferences:
- User Input / Topic: ${params.userInput || 'Authentic living, patience, and crown appreciation'}
- Target Category: ${params.category || 'locs-hair'}
- Aesthetic Style: ${params.aestheticStyle || 'earthy-minimal'}
${params.category === 'locs-hair' ? '- SPECIAL LOCS FOCUS: Celebrate the beauty, history, patience, spiritual journey, or daily crown care of dreadlocs/locs.' : ''}
${params.aestheticStyle === 'reggae-roots' ? '- SPECIAL REGGAE FOCUS: Infuse authentic roots reggae consciousness, oneness, acoustic earth vibrations, dub poetry.' : ''}
${params.aestheticStyle === 'gen-z' ? '- SPECIAL GEN-Z FOCUS: Infuse modern, relatable, cozy lo-fi, soft-boundaries, unbothered matcha-energy authenticity.' : ''}

Respond with strict JSON ONLY (no markdown formatting, no backticks):
{
  "text": "The quote text (15-35 words, poetic, memorable, striking)",
  "authorName": "Attribution or poetic pseudonym (e.g. 'Crown Scribe', 'Roots Voice', user name)",
  "category": "${params.category || 'locs-hair'}",
  "visualStyle": "Aesthetic style name (e.g. 'Cozy Terracotta', 'Roots Vinyl', 'Matcha Lo-Fi', 'Royal Crown')",
  "fontFamily": "One of: 'fraunces' | 'syne' | 'playfair' | 'jakarta' | 'mono' | 'hand' | 'reggae'",
  "backgroundStyle": "One of: 'texture-linen' | 'reggae-roots-art' | 'locs-crown-art' | 'genz-aesthetic-art' | 'gradient-earth' | 'gradient-terracotta' | 'gradient-forest' | 'gradient-matcha' | 'minimal-solid'",
  "accentColor": "Hex color code in earthy tones (e.g. '#c98a4b', '#4e5b31', '#9e6241', '#d4a343', '#7d4926')",
  "highlightWords": ["2 to 4 key words in the quote to emphasize with distinct typography styling"],
  "vibeBadge": "Short 2-3 word aesthetic label (e.g. 'Locs Crown', 'Roots Vibration', 'Gen-Z Glow')",
  "stylingNotes": "Brief creative typography guidance"
}`;

  if (!client) {
    // Fallback if API key is not yet set in environment
    return getCuratedFallback(params);
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text?.trim() || '';
    const cleaned = responseText.replace(/^```json/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      text: parsed.text || 'Every strand of my crown tells a story of perseverance and royal grace.',
      authorName: parsed.authorName || params.authorName || 'Scriber Muse',
      category: (parsed.category as QuoteCategory) || params.category || 'locs-hair',
      visualStyle: parsed.visualStyle || 'Locs Sanctuary',
      fontFamily: validateFont(parsed.fontFamily),
      backgroundStyle: validateBg(parsed.backgroundStyle),
      accentColor: parsed.accentColor || '#c98a4b',
      highlightWords: Array.isArray(parsed.highlightWords) ? parsed.highlightWords : ['crown', 'grace'],
      vibeBadge: parsed.vibeBadge || 'Organic Reflection',
      stylingNotes: parsed.stylingNotes || 'Balanced letter-spacing and earthy contrast'
    };
  } catch (error) {
    console.error('Error generating quote with Gemini:', error);
    return getCuratedFallback(params);
  }
}

function validateFont(font: string): FontChoice {
  const allowed: FontChoice[] = ['fraunces', 'syne', 'playfair', 'jakarta', 'mono', 'hand', 'reggae'];
  return allowed.includes(font as FontChoice) ? (font as FontChoice) : 'fraunces';
}

function validateBg(bg: string): BackgroundStyle {
  const allowed: BackgroundStyle[] = [
    'texture-linen', 'reggae-roots-art', 'locs-crown-art', 'genz-aesthetic-art',
    'gradient-earth', 'gradient-terracotta', 'gradient-forest', 'gradient-matcha', 'minimal-solid'
  ];
  return allowed.includes(bg as BackgroundStyle) ? (bg as BackgroundStyle) : 'texture-linen';
}

function getCuratedFallback(params: GenerateQuoteParams): GeneratedQuoteResult {
  const userInput = (params.userInput || '').toLowerCase();
  
  if (params.category === 'locs-hair' || userInput.includes('loc') || userInput.includes('hair') || userInput.includes('dread')) {
    return {
      text: "My dreadlocs are sacred roots grown skyward. I do not ask for permission to let my natural crown flourish.",
      authorName: params.authorName || "Locs Sanctuary",
      category: "locs-hair",
      visualStyle: "Crown Elevation",
      fontFamily: "playfair",
      backgroundStyle: "locs-crown-art",
      accentColor: "#c98a4b",
      highlightWords: ["sacred", "roots", "crown", "flourish"],
      vibeBadge: "Dreadlocs Pride",
      stylingNotes: "Serif elegance with golden earthy warmth"
    };
  }

  if (params.aestheticStyle === 'reggae-roots' || params.category === 'reggae-roots' || userInput.includes('reggae') || userInput.includes('dub')) {
    return {
      text: "When the rhythm of truth hits you, no noise of Babylon can shake your inner sanctuary. Keep the roots deep.",
      authorName: params.authorName || "Dub Scribe",
      category: "reggae-roots",
      visualStyle: "Roots Vinyl",
      fontFamily: "reggae",
      backgroundStyle: "reggae-roots-art",
      accentColor: "#d4a343",
      highlightWords: ["rhythm", "truth", "sanctuary", "roots"],
      vibeBadge: "Reggae Consciousness",
      stylingNotes: "Bold roots display with golden mustard accents"
    };
  }

  if (params.aestheticStyle === 'gen-z' || params.category === 'gen-z-motivation' || userInput.includes('gen z') || userInput.includes('vibe')) {
    return {
      text: "Protecting my peace looks like declining chaos without feeling guilty. Cozy heart, clear boundaries, matcha in hand.",
      authorName: params.authorName || "Quietly Thriving",
      category: "gen-z-motivation",
      visualStyle: "Matcha Minimalist",
      fontFamily: "syne",
      backgroundStyle: "genz-aesthetic-art",
      accentColor: "#82957b",
      highlightWords: ["peace", "boundaries", "thriving"],
      vibeBadge: "Gen-Z Soft Life",
      stylingNotes: "Experimental modern display with sage tones"
    };
  }

  return {
    text: "There is immense strength in gentleness, and supreme wisdom in allowing things to unfold in organic time.",
    authorName: params.authorName || "Scriber Journal",
    category: params.category || "earthy-zen",
    visualStyle: "Cozy Linen",
    fontFamily: "fraunces",
    backgroundStyle: "texture-linen",
    accentColor: "#7d4926",
    highlightWords: ["strength", "gentleness", "wisdom"],
    vibeBadge: "Quiet Wisdom",
    stylingNotes: "Generous margins with warm editorial serif"
  };
}
