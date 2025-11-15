'use client';
import { useState, useEffect, useMemo } from 'react';
import { useFirebase, useUser } from '@/firebase';
import { SacramentMeeting } from '@/lib/types';
import { addDocument, deleteDocument, getCollection, updateDocument } from '@/lib/firebase/firestore';
import { Button } from '@/components/ui/button';
import { FilePlus, List, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { sacramentMeetingSchema } from '@/lib/schemas';
import AgendaForm from '@/components/dashboard/sacrament-meeting/agenda-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import AIAgendaHelper from '@/components/dashboard/sacrament-meeting/ai-agenda-helper';

type AgendaFormValues = z.infer<typeof sacramentMeetingSchema>;

export default function SacramentMeetingPage() {
  const { firestore, user } = useFirebase();
  const [agendas, setAgendas] = useState<SacramentMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'list' | 'form'>('list');
  const [selectedAgenda, setSelectedAgenda] = useState<SacramentMeeting | null>(null);
  const { toast } = useToast();

  const fetchAgendas = async () => {
    if (!firestore) return;
    setLoading(true);
    try {
      const agendaList = await getCollection<SacramentMeeting>(firestore, 'sacramentMeetings', { field: 'date', direction: 'desc' });
      setAgendas(agendaList);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch agendas.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentView === 'list') {
      fetchAgendas();
    }
  }, [firestore, currentView]);

  const handleSaveAgenda = async (data: AgendaFormValues) => {
    if (!user || !firestore) return;
    
    // Filter out empty speakers
    const finalData = {
        ...data,
        speakers: data.speakers.filter(s => s && s.trim() !== ''),
    };

    try {
      if (selectedAgenda) {
        await updateDocument(firestore, 'sacramentMeetings', selectedAgenda.id, finalData, user.uid, 'sacramentMeeting');
        toast({ title: 'Success', description: 'Agenda updated successfully.' });
      } else {
        await addDocument(firestore, 'sacramentMeetings', finalData, user.uid, 'sacramentMeeting');
        toast({ title: 'Success', description: 'Agenda created successfully.' });
      }
      setCurrentView('list');
      setSelectedAgenda(null);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to save agenda.' });
    }
  };

  const handleDeleteAgenda = async () => {
    if (!user || !firestore || !selectedAgenda) return;
    try {
      await deleteDocument(firestore, 'sacramentMeetings', selectedAgenda.id, user.uid, 'sacramentMeeting');
      toast({ title: 'Success', description: 'Agenda deleted successfully.' });
      setCurrentView('list');
      setSelectedAgenda(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete agenda.' });
    }
  };
  
  const handleEdit = (agenda: SacramentMeeting) => {
      setSelectedAgenda(agenda);
      setCurrentView('form');
  }

  const handleCreateNew = () => {
    setSelectedAgenda(null);
    setCurrentView('form');
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Sacrament Meeting</h1>
          <p className="text-muted-foreground">Manage agendas for sacrament meetings.</p>
        </div>
        <div className="flex gap-2">
            {currentView === 'form' && <AIAgendaHelper currentAgenda={selectedAgenda} />}
            <Button variant="outline" onClick={() => setCurrentView(currentView === 'list' ? 'form' : 'list')}>
                {currentView === 'list' ? <FilePlus className="mr-2 h-4 w-4" /> : <List className="mr-2 h-4 w-4" />}
                {currentView === 'list' ? 'Create New' : 'View All'}
            </Button>
        </div>
      </div>

      {currentView === 'list' && (
        loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1,2,3].map(i => <Skeleton key={i} className="h-48" />)}
            </div>
        ) : agendas.length === 0 ? (
             <Card className="text-center py-16">
                <CardContent>
                    <h3 className="text-lg font-semibold">No Agendas Found</h3>
                    <p className="text-muted-foreground text-sm">Create a new agenda to get started.</p>
                </CardContent>
            </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agendas.map(agenda => (
              <Card key={agenda.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{format(agenda.date.toDate(), 'PPP')}</CardTitle>
                  <CardDescription>Conducted by: {agenda.dirige}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-sm font-semibold">Speakers:</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {agenda.speakers.filter(s => s).map((speaker, i) => (
                            <li key={i}>{speaker}</li>
                        ))}
                    </ul>
                </CardContent>
                <div className="p-6 pt-0">
                    <Button onClick={() => handleEdit(agenda)} className="w-full">
                        <FileText className="mr-2 h-4 w-4" />
                        View/Edit Agenda
                    </Button>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {currentView === 'form' && (
        <AgendaForm 
          onSave={handleSaveAgenda} 
          onDelete={selectedAgenda ? handleDeleteAgenda : undefined}
          initialData={selectedAgenda}
        />
      )}
    </div>
  );
}
