import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const GEMINI_MODEL = 'gemini-1.5-flash';

// ✅ Correct API endpoint (v1 + generateContent)
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`;

app.use(cors());
app.use(express.json());

// Handle bad JSON
app.use((err, _req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload.' });
  }
  next(err);
});

// Prompt builder
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

// Health check
app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'RapidGuard backend is running.' });
});

// Main API
app.post('/analyze', async (req, res) => {
  const { emergencyType } = req.body;

  if (!emergencyType) {
    return res.status(400).json({ error: 'Missing emergencyType.' });
  }

  const prompt = buildPrompt(emergencyType);

  // Fallback if API key missing
  if (!API_KEY || API_KEY === 'YOUR_API_KEY') {
    return res.json({
      text: `Risk level: High risk detected.
What happens next: Situation may escalate quickly.
Top 3 actions:
1. Evacuate immediately
2. Alert authorities
3. Secure the area`,
    });
  }

  try {
    const response = await fetch(`${GEMINI_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // ✅ Correct request format
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API error:', data);
      return res.status(response.status).json({ error: data });
    }

    // ✅ Correct response parsing
    const aiText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

    return res.json({ text: aiText });

  } catch (error) {
    console.error('Error calling Gemini:', error);
    return res.status(500).json({ error: 'AI request failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});