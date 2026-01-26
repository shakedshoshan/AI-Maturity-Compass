import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Get API key from environment variables
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!apiKey) {
  throw new Error(
    'Missing API key: Please set GEMINI_API_KEY or GOOGLE_API_KEY environment variable. ' +
    'Create a .env.local file in the root directory with: GEMINI_API_KEY=your_api_key_here'
  );
}

export const ai = genkit({
  plugins: [googleAI({apiKey})],
  model: 'googleai/gemini-2.5-flash',
});
