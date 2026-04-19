import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,  // ← AJOUTER CET IMPORT
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calendar, 
  Clock, 
  Edit, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Save,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useProfessorHours } from '@/hooks/useProfessorHours';
import { toast } from 'sonner';

export function SessionsTable() {
  const { 
    sessions, 
    loading,
    monthlyStats,
    currentYear, 
    currentMonth, 
    setCurrentYear,
    setCurrentMonth,
    saveSession,
    updateSession,
    refresh 
  } = useProfessorHours();
  
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  
  const [editStartTime, setEditStartTime] = useState("16:30");
  const [editEndTime, setEditEndTime] = useState("18:30");
  const [editNotes, setEditNotes] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  // Jours de cours (Samedi et Dimanche uniquement)
  const PROFESSOR_SESSION_DAYS = [6, 0];

  const getSessionList = () => {
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const sessionsMap = new Map(sessions.map(s => [s.date, s]));
    const list = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth - 1, day);
      const dayOfWeek = date.getDay();
      const isSessionDay = PROFESSOR_SESSION_DAYS.includes(dayOfWeek);
      
      if (isSessionDay) {
        const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const existingSession = sessionsMap.get(dateStr);
        
        list.push({
          date: dateStr,
          dayNumber: day,
          dayName: dayNames[dayOfWeek],
          dayOfWeek: dayOfWeek,
          session: existingSession || null,
          status: existingSession?.status === 'cancelled' ? 'cancelled' 
                  : existingSession ? 'completed' 
                  : 'pending'
        });
      }
    }
    return list;
  };

  const sessionList = getSessionList();

  // Format date DD/MM/YYYY
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleEditSession = (sessionItem: any) => {
    setSelectedSession(sessionItem);
    if (sessionItem.session && sessionItem.status === 'completed') {
      setEditStartTime(sessionItem.session.startTime);
      setEditEndTime(sessionItem.session.endTime);
      setEditNotes(sessionItem.session.notes || '');
    } else {
      setEditStartTime("16:30");
      setEditEndTime("18:30");
      setEditNotes("");
    }
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedSession) return;

    const start = new Date(`2000-01-01T${editStartTime}`);
    const end = new Date(`2000-01-01T${editEndTime}`);
    const actualHours = parseFloat(((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(2));

    try {
      if (selectedSession.session) {
        await updateSession(selectedSession.session.id, {
          startTime: editStartTime,
          endTime: editEndTime,
          actualHours: actualHours,
          notes: editNotes,
          status: 'completed'
        });
        toast.success(`Séance modifiée`);
      } else {
        await saveSession({
          date: selectedSession.date,
          startTime: editStartTime,
          endTime: editEndTime,
          actualHours: actualHours,
          notes: editNotes,
          status: 'completed'
        });
        toast.success(`Séance enregistrée`);
      }
      setShowEditModal(false);
      await refresh();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCancelSession = (sessionItem: any) => {
    setSelectedSession(sessionItem);
    setCancelReason("");
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedSession) return;
    
    try {
      if (selectedSession.session) {
        await updateSession(selectedSession.session.id, {
          actualHours: 0,
          startTime: "00:00",
          endTime: "00:00",
          notes: `[ANNULÉE] ${cancelReason || 'Séance annulée'}`,
          status: 'cancelled'
        });
        toast.warning(`Séance annulée`);
      } else {
        await saveSession({
          date: selectedSession.date,
          startTime: "00:00",
          endTime: "00:00",
          actualHours: 0,
          notes: `[ANNULÉE] ${cancelReason || 'Séance annulée'}`,
          status: 'cancelled'
        });
        toast.warning(`Séance annulée (0h)`);
      }
      setShowCancelDialog(false);
      await refresh();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRestoreSession = (sessionItem: any) => {
    setSelectedSession(sessionItem);
    setShowRestoreDialog(true);
  };

  const handleConfirmRestore = async () => {
    if (!selectedSession?.session) return;
    
    try {
      await updateSession(selectedSession.session.id, {
        actualHours: 2,
        startTime: "16:30",
        endTime: "18:30",
        notes: selectedSession.session.notes?.replace('[ANNULÉE]', '').trim() || '',
        status: 'completed'
      });
      toast.success(`Séance restaurée`);
      setShowRestoreDialog(false);
      await refresh();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Effectuée
        </Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          Annulée (0h)
        </Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          À enregistrer
        </Badge>;
    }
  };

  const previousMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  if (loading) {
    return (
      <Card className="mt-6">
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="mt-6 shadow-lg border-0 bg-gradient-to-br from-white to-slate-50">
        <CardHeader className="border-b bg-white/50 backdrop-blur-sm rounded-t-xl">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">
                  {monthNames[currentMonth - 1]} {currentYear}
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Séances du mois • {monthlyStats.sessionsCount} réalisées sur {sessionList.length}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Mois préc.
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                setCurrentYear(new Date().getFullYear());
                setCurrentMonth(new Date().getMonth() + 1);
              }}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Ce mois
              </Button>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                Mois suiv.
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{sessionList.length}</div>
              <div className="text-xs text-blue-600">Total séances</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{monthlyStats.sessionsCount}</div>
              <div className="text-xs text-green-600">Effectuées</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">{monthlyStats.totalHours}h</div>
              <div className="text-xs text-purple-600">Heures totales</div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-28 text-center">Date</TableHead>
                  <TableHead className="text-center">Jour</TableHead>
                  <TableHead className="text-center">Horaires</TableHead>
                  <TableHead className="text-center">Durée</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="text-center">Notes</TableHead>
                  <TableHead className="text-center w-40">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionList.map((item) => (
                  <TableRow key={item.date} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="text-center font-mono text-sm">
                      {formatDate(item.date)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium">
                        {item.dayName}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.session && item.status !== 'cancelled' ? (
                        <div className="flex items-center justify-center gap-1 text-sm font-mono">
                          <Clock className="h-3 w-3 text-gray-400" />
                          {item.session.startTime} - {item.session.endTime}
                        </div>
                      ) : item.status === 'cancelled' ? (
                        <span className="text-sm text-red-500 line-through">Annulée</span>
                      ) : (
                        <span className="text-sm text-gray-400">--:--</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.session && item.status !== 'cancelled' ? (
                        <span className="font-semibold text-blue-600">
                          {item.session.actualHours}h
                        </span>
                      ) : item.status === 'cancelled' ? (
                        <span className="font-semibold text-red-500">0h</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        {getStatusBadge(item.status)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm text-gray-500 line-clamp-1 max-w-[150px] block mx-auto">
                        {item.session?.notes?.replace('[ANNULÉE]', '').trim() || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        {item.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditSession(item)}
                            className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                          >
                            <Save className="h-3 w-3 mr-1" />
                            Enregistrer
                          </Button>
                        )}
                        
                        {item.status === 'completed' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditSession(item)}
                              className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Modifier
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelSession(item)}
                              className="bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Annuler
                            </Button>
                          </>
                        )}
                        
                        {item.status === 'cancelled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestoreSession(item)}
                            className="bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-700"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Restaurer
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {sessionList.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucune séance ce mois-ci</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal d'édition - AJOUT DE DialogDescription */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedSession?.session ? '✏️ Modifier la séance' : '📝 Enregistrer la séance'}
            </DialogTitle>
            <DialogDescription>
              {selectedSession && new Date(selectedSession.date).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Heure de début</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endTime">Heure de fin</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={editEndTime}
                  onChange={(e) => setEditEndTime(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Sujets abordés, remarques..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Annuler</Button>
            <Button onClick={handleSaveEdit} className="bg-blue-600">Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog d'annulation */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler la séance</AlertDialogTitle>
            <AlertDialogDescription>
              <Textarea
                placeholder="Raison de l'annulation..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="mt-2"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Retour</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel} className="bg-red-600">
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de restauration */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurer la séance</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous restaurer cette séance avec les horaires par défaut (16:30 - 18:30) ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRestore} className="bg-yellow-600">
              Restaurer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}