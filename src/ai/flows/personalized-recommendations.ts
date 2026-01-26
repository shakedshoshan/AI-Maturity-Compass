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

export async function generateRecommendations(
  input: RecommendationsInput
): Promise<RecommendationsOutput> {
  return personalizedRecommendationsFlow(input);
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
