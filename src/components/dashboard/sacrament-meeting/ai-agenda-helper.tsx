'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { suggestSacramentMeetingAgendaImprovements } from '@/ai/flows/suggest-sacrament-meeting-agenda-improvements';
import { SacramentMeeting } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';

interface AIAgendaHelperProps {
  currentAgenda: SacramentMeeting | null;
  t: (key: string) => string;
}

export default function AIAgendaHelper({ currentAgenda, t }: AIAgendaHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [wardNeeds, setWardNeeds] = useState('');
  const [pastMeetings, setPastMeetings] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getAgendaString = () => {
    if (!currentAgenda) return "No current agenda provided.";
    return `
        Date: ${currentAgenda.date.toDate().toLocaleDateString()}
        Presiding: ${currentAgenda.preside}
        Conducting: ${currentAgenda.dirige}
        Speakers: ${currentAgenda.speakers.join(', ')}
        Sacramental Hymn: ${currentAgenda.hymnSacramental.name} (#${currentAgenda.hymnSacramental.number})
        Closing Hymn: ${currentAgenda.hymnFinal.name} (#${currentAgenda.hymnFinal.number})
    `;
  };

  const handleGenerateSuggestion = async () => {
    if (!wardNeeds || !pastMeetings) {
      toast({
        variant: 'destructive',
        title: t('sacramentMeeting.missingInfo'),
        description: t('sacramentMeeting.missingInfoDescription'),
      });
      return;
    }

    setLoading(true);
    setSuggestion('');
    try {
      const result = await suggestSacramentMeetingAgendaImprovements({
        wardNeeds,
        pastMeetingData: pastMeetings,
        currentAgenda: getAgendaString(),
      });
      setSuggestion(result.suggestedImprovements);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('sacramentMeeting.aiFailed'),
        description: t('sacramentMeeting.aiFailedDescription'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Sparkles className="mr-2 h-4 w-4" />
          {t('sacramentMeeting.aiHelper')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('sacramentMeeting.aiHelperTitle')}</DialogTitle>
          <DialogDescription>
            {t('sacramentMeeting.aiHelperDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="ward-needs">{t('sacramentMeeting.wardNeeds')}</Label>
            <Textarea
              id="ward-needs"
              placeholder={t('sacramentMeeting.wardNeedsPlaceholder')}
              value={wardNeeds}
              onChange={(e) => setWardNeeds(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="past-meetings">{t('sacramentMeeting.pastMeetingData')}</Label>
            <Textarea
              id="past-meetings"
              placeholder={t('sacramentMeeting.pastMeetingDataPlaceholder')}
              value={pastMeetings}
              onChange={(e) => setPastMeetings(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={handleGenerateSuggestion} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('sacramentMeeting.generateSuggestions')}
        </Button>

        {suggestion && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">{t('sacramentMeeting.suggestedImprovements')}</h3>
            <Card>
                <CardContent className="p-4 text-sm bg-secondary rounded-md">
                    <p className='whitespace-pre-wrap'>{suggestion}</p>
                </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
