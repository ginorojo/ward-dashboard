'use client';
import { useState, useEffect, useMemo } from 'react';
import { useFirebase, useUser } from '@/firebase';
import { Reunion } from '@/lib/types';
import { addDocument, deleteDocument, getCollection, updateDocument } from '@/lib/firebase/firestore';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { DataTable } from '@/components/dashboard/reuniones/data-table';
import { columns } from '@/components/dashboard/reuniones/columns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ReunionForm from '@/components/dashboard/reuniones/reunion-form';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { reunionSchema } from '@/lib/schemas';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/lib/i18n';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

type ReunionFormValues = z.infer<typeof reunionSchema>;

export default function ReunionesPage() {
  const { firestore, user } = useFirebase();
  const [reuniones, setReuniones] = useState<Reunion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReunion, setEditingReunion] = useState<Reunion | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const fetchReuniones = async () => {
    if (!firestore) return;
    setLoading(true);
    try {
      const reunionList = await getCollection<Reunion>(firestore, 'reuniones', { field: 'scheduledAt', direction: 'desc' });
      setReuniones(reunionList);
    } catch (error) {
      toast({ variant: 'destructive', title: t('common.error'), description: t('reuniones.failedToFetch') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReuniones();
  }, [firestore]);

  const handleFormSubmit = async (data: ReunionFormValues) => {
    if (!user || !firestore) return;
    
    const finalData = {
        ...data,
        participants: data.participants.split(',').map(p => p.trim()).filter(p => p),
    };

    try {
      if (editingReunion) {
        await updateDocument(firestore, 'reuniones', editingReunion.id, finalData, user.uid, 'reunion');
        toast({ title: t('common.success'), description: t('reuniones.reunionUpdated') });
      } else {
        await addDocument(firestore, 'reuniones', finalData, user.uid, 'reunion');
        toast({ title: t('common.success'), description: t('reuniones.reunionCreated') });
      }
      setIsFormOpen(false);
      setEditingReunion(null);
      fetchReuniones();
    } catch (error: any) {
      toast({ variant: 'destructive', title: t('common.error'), description: t('reuniones.failedToSave') });
    }
  };

  const openEditForm = (reunion: Reunion) => {
    setEditingReunion(reunion);
    setIsFormOpen(true);
  };
  
  const openNewForm = () => {
    setEditingReunion(null);
    setIsFormOpen(true);
  }

  const handleDelete = (id: string) => {
    if (!user || !firestore) return;
    deleteDocument(firestore, 'reuniones', id, user.uid, 'reunion');
    toast({ title: t('common.success'), description: t('reuniones.reunionDeleted') });
    fetchReuniones();
  };

  const tableColumns = useMemo(() => columns({ openEditForm, handleDelete, t }), [reuniones, t]);

  const dialogTitle = editingReunion ? t('reuniones.editReunion') : t('reuniones.createNewReunion');
  
  const formDefaultValues = editingReunion ? {
    ...editingReunion,
    scheduledAt: editingReunion.scheduledAt.toDate(),
    time: format(editingReunion.scheduledAt.toDate(), 'HH:mm'),
    participants: editingReunion.participants.join(', '),
  } : undefined;

  const renderMobileReuniones = () => (
    <div className="space-y-4">
      {reuniones.map(reunion => (
        <Card key={reunion.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className='text-lg'>{t('reuniones.reunionOn')} {format(reunion.scheduledAt.toDate(), 'dd/MM/yyyy')}</CardTitle>
                <CardDescription>{t('reuniones.at')} {format(reunion.scheduledAt.toDate(), 'p')}</CardDescription>
              </div>
               <AlertDialog>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditForm(reunion)}>{t('common.edit')}</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="text-destructive">{t('common.delete')}</DropdownMenuItem>
                    </AlertDialogTrigger>
                    </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>{t('reuniones.deleteConfirmTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('reuniones.deleteConfirmDescription')}
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(reunion.id)} className="bg-destructive hover:bg-destructive/90">
                        {t('common.delete')}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <p className="font-semibold">{t('reuniones.reason')}</p>
              <p className="text-muted-foreground">{reunion.reason}</p>
            </div>
            <div>
              <p className="font-semibold">{t('reuniones.participants')}</p>
              <p className="text-muted-foreground">{reunion.participants.join(', ')}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between sm: flex-col">
        <div>
          <h1 className="text-3xl font-bold font-headline">{t('reuniones.title')}</h1>
          <p className="text-muted-foreground">{t('reuniones.description')}</p>
        </div>
        <Button onClick={openNewForm}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('reuniones.addReunion')}
        </Button>
      </div>

       <Dialog open={isFormOpen} onOpenChange={ (isOpen) => { setIsFormOpen(isOpen); if (!isOpen) setEditingReunion(null); } }>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
            </DialogHeader>
            <ReunionForm onSubmit={handleFormSubmit} defaultValues={formDefaultValues} t={t} />
          </DialogContent>
        </Dialog>

      {loading ? (
         <div className="space-y-4">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-40 w-full" />
         </div>
      ) : isMobile ? (
        renderMobileReuniones()
      ) : (
        <DataTable columns={tableColumns} data={reuniones} t={t} />
      )}
    </div>
  );
}
