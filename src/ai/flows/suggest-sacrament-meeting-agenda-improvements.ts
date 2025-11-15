'use server';

/**
 * @fileOverview AI tool to suggest improvements to sacrament meeting agendas based on ward needs and past meeting data.
 *
 * - suggestSacramentMeetingAgendaImprovements - A function that takes ward needs and past meeting data to suggest agenda improvements.
 * - SuggestSacramentMeetingAgendaImprovementsInput - The input type for the suggestSacramentMeetingAgendaImprovements function.
 * - SuggestSacramentMeetingAgendaImprovementsOutput - The return type for the suggestSacramentMeetingAgendaImprovements function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSacramentMeetingAgendaImprovementsInputSchema = z.object({
  wardNeeds: z.string().describe('A description of the current needs and concerns of the ward members.'),
  pastMeetingData: z.string().describe('Data from past sacrament meetings, including themes, speakers, and attendance.'),
  currentAgenda: z.string().optional().describe('The current proposed agenda for the sacrament meeting.'),
});
export type SuggestSacramentMeetingAgendaImprovementsInput = z.infer<
  typeof SuggestSacramentMeetingAgendaImprovementsInputSchema
>;

const SuggestSacramentMeetingAgendaImprovementsOutputSchema = z.object({
  suggestedImprovements: z.string().describe('AI-suggested improvements to the sacrament meeting agenda, optimizing themes and speakers.'),
});
export type SuggestSacramentMeetingAgendaImprovementsOutput = z.infer<
  typeof SuggestSacramentMeetingAgendaImprovementsOutputSchema
>;

export async function suggestSacramentMeetingAgendaImprovements(
  input: SuggestSacramentMeetingAgendaImprovementsInput
): Promise<SuggestSacramentMeetingAgendaImprovementsOutput> {
  return suggestSacramentMeetingAgendaImprovementsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSacramentMeetingAgendaImprovementsPrompt',
  input: {schema: SuggestSacramentMeetingAgendaImprovementsInputSchema},
  output: {schema: SuggestSacramentMeetingAgendaImprovementsOutputSchema},
  prompt: `You are an AI assistant to a bishop, helping them create impactful sacrament meeting agendas.

  Based on the provided information about ward needs, past meeting data, and the current agenda (if available), suggest improvements to the agenda.
  Consider optimizing themes and speakers to best address the ward's needs.

  Ward Needs: {{{wardNeeds}}}
  Past Meeting Data: {{{pastMeetingData}}}
  Current Agenda: {{{currentAgenda}}}

  Suggested Improvements:`,
});

const suggestSacramentMeetingAgendaImprovementsFlow = ai.defineFlow(
  {
    name: 'suggestSacramentMeetingAgendaImprovementsFlow',
    inputSchema: SuggestSacramentMeetingAgendaImprovementsInputSchema,
    outputSchema: SuggestSacramentMeetingAgendaImprovementsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
