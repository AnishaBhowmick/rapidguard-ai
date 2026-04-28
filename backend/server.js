import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_BASE_URL = `https://generativelanguage.googleapis.com/v1beta2/models/${GEMINI_MODEL}`;

app.use(cors());
app.use(express.json());

app.use((err, _req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Invalid JSON payload received:', err.message);
    return res.status(400).json({ error: 'Invalid JSON payload received.' });
  }
  next(err);
});

const buildPrompt = (type) => `You are an emergency response AI.

Emergency: ${type}
Location: Room 412, Floor 4
3 alerts triggered
One exit blocked

Give:
- Risk level
- What will happen next
- Top 3 actions

Keep it short and clear.`;

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'RapidGuard backend is running.' });
});

app.post('/analyze', async (req, res) => {
  const { emergencyType } = req.body;
  if (!emergencyType) {
    return res.status(400).json({ error: 'Missing emergencyType in request body.' });
  }

  const prompt = buildPrompt(emergencyType);

  if (!API_KEY || API_KEY === 'YOUR_API_KEY') {
    console.warn('Missing or invalid Gemini API key. Returning demo response.');
    return res.json({
      text: `Risk level: High risk detected.\nWhat happens next: Smoke will continue to spread within minutes and may trap occupants.\nTop 3 actions:\n1. Evacuate the area immediately.\n2. Activate the nearest fire alarm and call emergency services.\n3. Close doors behind you to slow the spread of smoke.`,
    });
  }

  try {
    const geminiUrl = `${GEMINI_BASE_URL}:generateText?key=${API_KEY}`;
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: {
          text: prompt,
        },
        temperature: 0.2,
        candidateCount: 1,
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('Gemini API error', response.status, responseText);
      return res.status(response.status).json({ error: responseText || 'Gemini API request failed.' });
    }

    const data = JSON.parse(responseText);
    const candidate = data?.candidates?.[0];
    let aiText = null;

    if (typeof candidate?.output === 'string') {
      aiText = candidate.output;
    } else if (typeof data?.output === 'string') {
      aiText = data.output;
    } else if (candidate?.content) {
      aiText = candidate.content.map((item) => item.text || '').join('\n');
    } else if (candidate?.message?.content) {
      aiText = candidate.message.content.map((item) => item.text || '').join('\n');
    }

    if (!aiText) {
      console.error('Unexpected Gemini response structure:', data);
      return res.status(500).json({ error: 'Unexpected AI response format.' });
    }

    return res.json({ text: aiText });
  } catch (error) {
    console.error('Failed to call Gemini API:', error);
    return res.status(500).json({ error: 'Failed to call Gemini API.' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
