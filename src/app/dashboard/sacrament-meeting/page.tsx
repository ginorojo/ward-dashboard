'use client';
import { useState, useEffect, useCallback } from 'react';
import AgendaForm from '@/components/dashboard/sacrament-meeting/agenda-form';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2, PlusCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getCollection, addDocument, updateDocument, deleteDocument } from '@/lib/firebase/firestore';
import { SacramentMeeting } from '@/lib/types';
import { sacramentMeetingSchema } from '@/lib/schemas';
import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AIAgendaHelper from '@/components/dashboard/sacrament-meeting/ai-agenda-helper';

type AgendaFormValues = z.infer<typeof sacramentMeetingSchema>;

export default function SacramentMeetingPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [agendas, setAgendas] = useState<SacramentMeeting[]>([]);
  const [selectedAgenda, setSelectedAgenda] = useState<SacramentMeeting | null>(null);
  const [isNew, setIsNew] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchAgendas = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCollection<SacramentMeeting>('sacramentMeetings', { field: 'date', direction: 'desc' });
      setAgendas(data);
      if(data.length > 0 && !selectedAgenda) {
        setSelectedAgenda(data[0]);
        setIsNew(false);
      } else if (data.length === 0) {
        setIsNew(true);
        setSelectedAgenda(null);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch agendas.' });
    } finally {
      setLoading(false);
    }
  }, [toast, selectedAgenda]);

  useEffect(() => {
    fetchAgendas();
  }, [fetchAgendas]);

  const handleSelectAgenda = (id: string) => {
    if (id === 'new') {
      setSelectedAgenda(null);
      setIsNew(true);
    } else {
      const agenda = agendas.find(a => a.id === id);
      if (agenda) {
        setSelectedAgenda(agenda);
        setIsNew(false);
      }
    }
  };

  const handleSaveAgenda = async (data: AgendaFormValues) => {
    if (!user) return;

    const agendaData = {
      ...data,
      date: Timestamp.fromDate(data.date),
      speakers: data.speakers.filter(s => s.trim() !== ''),
    };

    try {
      if (isNew || !selectedAgenda) {
        const newId = await addDocument('sacramentMeetings', agendaData, user.uid, 'sacramentMeeting');
        toast({ title: 'Success', description: 'Agenda created successfully.' });
        // After creating, we need to refetch to get the new agenda and select it
        await fetchAgendas();
        handleSelectAgenda(newId);
      } else {
        await updateDocument('sacramentMeetings', selectedAgenda.id, agendaData, user.uid, 'sacramentMeeting');
        toast({ title: 'Success', description: 'Agenda updated successfully.' });
        await fetchAgendas();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save agenda.' });
    }
  };

  const handleDeleteAgenda = async () => {
    if (!user || !selectedAgenda) return;
    try {
        await deleteDocument('sacramentMeetings', selectedAgenda.id, user.uid, 'sacramentMeeting');
        toast({ title: 'Success', description: 'Agenda deleted successfully.' });
        setSelectedAgenda(null);
        setIsNew(true);
        await fetchAgendas();
    } catch(error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete agenda.' });
    }
  }

  const exportToPDF = () => {
    if (!selectedAgenda) {
        toast({ variant: 'destructive', title: 'No Agenda Selected' });
        return;
    }
    const doc = new jsPDF();
    const data = selectedAgenda;
    const margin = 15;
    let y = 20;

    doc.setFontSize(18);
    doc.text('Sacrament Meeting Agenda', doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
    y += 10;
    doc.setFontSize(12);
    doc.text(format(data.date.toDate(), 'MMMM do, yyyy'), doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
    y += 15;

    doc.setFont(undefined, 'bold');
    doc.text('Presiding:', margin, y);
    doc.setFont(undefined, 'normal');
    doc.text(data.preside, 50, y);
    y += 8;

    doc.setFont(undefined, 'bold');
    doc.text('Conducting:', margin, y);
    doc.setFont(undefined, 'normal');
    doc.text(data.dirige, 50, y);
    y += 12;

    if (data.authorities) {
        doc.setFontSize(10);
        doc.text(`Welcome to visiting authorities: ${data.authorities}`, margin, y);
        y += 10;
    }

    doc.setFontSize(12);
    doc.text('Opening Hymn:', margin, y);
    doc.text(`${data.hymnSacramental.number} - ${data.hymnSacramental.name}`, 60, y);
    y+=8;

    doc.text('Opening Prayer:', margin, y);
    doc.text('By assignment', 60, y);
    y+=12;

    doc.text('Ward Business', margin, y);
    y+=8;
    
    if (data.asuntosDelBarrio && data.asuntosDelBarrio.length > 0) {
        data.asuntosDelBarrio.forEach(asunto => {
            doc.text(`${asunto.type === 'sostenimiento' ? 'Sustaining' : 'Release'}: ${asunto.personName} as ${asunto.calling}`, margin + 5, y);
            y+=6;
        });
    } else {
        doc.text('None', margin + 5, y);
        y+=6;
    }
    y+=6;

    doc.text('Sacrament Hymn:', margin, y);
    doc.text(`${data.hymnSacramental.number} - ${data.hymnSacramental.name}`, 60, y);
    y += 8;
    
    doc.setFontSize(10);
    doc.text('Administration of the Sacrament', margin, y);
    y += 12;

    doc.setFontSize(12);
    doc.text('Speakers', margin, y);
    y += 8;

    data.speakers.forEach(speaker => {
        doc.text(speaker, margin + 5, y);
        y += 7;
    });
    y += 5;

    doc.text('Closing Hymn:', margin, y);
    doc.text(`${data.hymnFinal.number} - ${data.hymnFinal.name}`, 60, y);
    y += 8;

    doc.text('Closing Prayer:', margin, y);
    doc.text(data.closingPrayer, 60, y);
    y += 8;

    doc.save(`Sacrament_Agenda_${format(data.date.toDate(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Sacrament Meeting Agenda</h1>
          <p className="text-muted-foreground">Plan and organize sacrament meetings.</p>
        </div>
        <div className="flex items-center gap-2">
           <AIAgendaHelper currentAgenda={selectedAgenda} />
           <Button variant="outline" onClick={exportToPDF} disabled={isNew || !selectedAgenda}>
                <FileDown className="mr-2 h-4 w-4" />
                Export PDF
            </Button>
            <Select onValueChange={handleSelectAgenda} value={isNew ? "new" : selectedAgenda?.id}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select an agenda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">
                    <span className='flex items-center'><PlusCircle className='h-4 w-4 mr-2'/> Create New Agenda</span>
                </SelectItem>
                {agendas.map(agenda => (
                  <SelectItem key={agenda.id} value={agenda.id}>
                    {format(agenda.date.toDate(), 'PPP')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <AgendaForm
          key={selectedAgenda?.id || 'new'}
          onSave={handleSaveAgenda}
          onDelete={isNew ? undefined : handleDeleteAgenda}
          initialData={selectedAgenda}
        />
      )}
    </div>
  );
}
