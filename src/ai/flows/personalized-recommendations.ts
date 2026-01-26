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
  maturityLevel: z.string().describe('The current AI maturity level of the school.'),
  domainScores: z
    .record(z.number())
    .describe('A map of domain names to their corresponding scores.'),
  weakness: z.string().describe('The weakest domain identified in the assessment.'),
});
export type RecommendationsInput = z.infer<typeof RecommendationsInputSchema>;

const RecommendationsOutputSchema = z.object({
  recommendation: z.string().describe('A personalized recommendation for improving AI maturity.'),
});
export type RecommendationsOutput = z.infer<typeof RecommendationsOutputSchema>;

/**
 * Retry configuration for API calls
 */
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 10000; // 10 seconds

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable (503, 429, or network errors)
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
      message.includes('network') ||
      message.includes('econnreset') ||
      message.includes('timeout')
    );
  }
  return false;
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
      
      // Calculate exponential backoff delay with jitter
      const baseDelay = Math.min(
        INITIAL_RETRY_DELAY * Math.pow(2, attempt),
        MAX_RETRY_DELAY
      );
      const jitter = Math.random() * 0.3 * baseDelay; // Add up to 30% jitter
      const delay = baseDelay + jitter;
      
      console.warn(
        `Recommendation API call failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${Math.round(delay)}ms...`,
        error
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
  prompt: `You are an AI assistant that provides personalized recommendations for schools to improve their AI maturity, based on their assessment results.

  The school's current AI maturity level is: {{{maturityLevel}}}.
  The school's scores across different domains are as follows:
  {{#each domainScores}}  - {{key}}: {{value}}
  {{/each}}
  The weakest domain identified in the assessment is: {{{weakness}}}.

  Based on this information, provide a concise and actionable recommendation to the school administrator for improving their AI maturity. Focus on the weakest domain and the school's current maturity level.
  The output should be a single string.`,
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
