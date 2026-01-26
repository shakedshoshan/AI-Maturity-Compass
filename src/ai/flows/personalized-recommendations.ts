'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating personalized recommendations
 *  to improve AI maturity based on assessment results.
 *
 * - generateRecommendations - A function that generates personalized recommendations.
 * - RecommendationsInput - The input type for the generateRecommendations function.
 * - RecommendationsOutput - The return type for the generateRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendationsInputSchema = z.object({
  maturityLevel: z.string().describe('רמת הבשלות הנוכחית של בית הספר בתחום הבינה המלאכותית.'),
  domainScores: z
    .record(z.number())
    .describe('מיפוי של שמות התחומים לציונים המתאימים שלהם.'),
  weakness: z.string().describe('התחום החלש ביותר שזוהה בהערכה.'),
});
export type RecommendationsInput = z.infer<typeof RecommendationsInputSchema>;

const RecommendationsOutputSchema = z.object({
  recommendation: z.string().describe('המלצה מותאמת אישית לשיפור הבשלות בתחום הבינה המלאכותית. חייב להיות בעברית.'),
});
export type RecommendationsOutput = z.infer<typeof RecommendationsOutputSchema>;

/**
 * Retry configuration for API calls
 */
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 60000; // 60 seconds (for quota errors that may require longer waits)

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable (503, 429, quota, or network errors)
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('503') ||
      message.includes('service unavailable') ||
      message.includes('overloaded') ||
      message.includes('429') ||
      message.includes('too many requests') ||
      message.includes('quota') ||
      message.includes('rate limit') ||
      message.includes('rate-limit') ||
      message.includes('please retry') ||
      message.includes('network') ||
      message.includes('econnreset') ||
      message.includes('timeout')
    );
  }
  return false;
}

/**
 * Extract retry delay from error message if available
 */
function extractRetryDelay(error: unknown): number | null {
  if (error instanceof Error) {
    const message = error.message;
    // Look for "Please retry in X.XXs" pattern
    const retryMatch = message.match(/retry in ([\d.]+)s/i);
    if (retryMatch) {
      const seconds = parseFloat(retryMatch[1]);
      return Math.ceil(seconds * 1000); // Convert to milliseconds
    }
  }
  return null;
}

/**
 * Generate recommendations with retry logic for handling API overload/errors
 */
export async function generateRecommendations(
  input: RecommendationsInput
): Promise<RecommendationsOutput> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await personalizedRecommendationsFlow(input);
    } catch (error) {
      lastError = error;
      
      // If it's not a retryable error or we've exhausted retries, throw immediately
      if (!isRetryableError(error) || attempt === MAX_RETRIES) {
        throw error;
      }
      
      // Try to extract retry delay from error message (for quota/rate limit errors)
      const suggestedDelay = extractRetryDelay(error);
      
      // Calculate exponential backoff delay with jitter
      // Use suggested delay if available, otherwise use exponential backoff
      const baseDelay = suggestedDelay || Math.min(
        INITIAL_RETRY_DELAY * Math.pow(2, attempt),
        MAX_RETRY_DELAY
      );
      const jitter = suggestedDelay ? 0 : Math.random() * 0.3 * baseDelay; // No jitter for quota delays
      const delay = Math.min(baseDelay + jitter, MAX_RETRY_DELAY);
      
      const delaySeconds = Math.round(delay / 1000);
      console.warn(
        `Recommendation API call failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${delaySeconds}s...`,
        error instanceof Error ? error.message : error
      );
      
      await sleep(delay);
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Failed to generate recommendations after retries');
}

const prompt = ai.definePrompt({
  name: 'personalizedRecommendationsPrompt',
  input: {schema: RecommendationsInputSchema},
  output: {schema: RecommendationsOutputSchema},
  prompt: `אתה עוזר AI שמספק המלצות מותאמות אישית לבתי ספר לשיפור הבשלות שלהם בתחום הבינה המלאכותית, בהתבסס על תוצאות ההערכה.

  רמת הבשלות הנוכחית של בית הספר היא: {{{maturityLevel}}}.
  הציונים של בית הספר בתחומים השונים הם:
  {{#each domainScores}}  - {{key}}: {{value}}
  {{/each}}
  התחום החלש ביותר שזוהה בהערכה הוא: {{{weakness}}}.

  בהתבסס על מידע זה, ספק המלצה תמציתית ופרקטית למנהל בית הספר לשיפור הבשלות שלהם בתחום הבינה המלאכותית. התמקד בתחום החלש ביותר וברמת הבשלות הנוכחית של בית הספר.
  הפלט חייב להיות בעברית בלבד, מחרוזת אחת בלבד.`,
});

const personalizedRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedRecommendationsFlow',
    inputSchema: RecommendationsInputSchema,
    outputSchema: RecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
