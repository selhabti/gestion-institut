import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,  // ← AJOUTÉ
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface SessionReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (session: { startTime: string; endTime: string; actualHours: number; notes: string }) => void;
  defaultStartTime?: string;
  defaultEndTime?: string;
}

export function SessionReminderModal({ 
  isOpen, 
  onClose, 
  onSave, 
  defaultStartTime = "16:30", 
  defaultEndTime = "18:30" 
}: SessionReminderModalProps) {
  const [startTime, setStartTime] = useState(defaultStartTime);
  const [endTime, setEndTime] = useState(defaultEndTime);
  const [actualHours, setActualHours] = useState(2);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const calculateHours = () => {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      if (diff > 0) {
        setActualHours(parseFloat(diff.toFixed(2)));
      }
    };
    calculateHours();
  }, [startTime, endTime]);

  const handleSave = () => {
    onSave({ startTime, endTime, actualHours, notes });
    onClose();
    setStartTime(defaultStartTime);
    setEndTime(defaultEndTime);
    setNotes("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>📊 Enregistrer les heures du cours</DialogTitle>
          <DialogDescription>
            Renseignez les horaires de début et de fin pour calculer automatiquement la durée de la séance.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Heure de début</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endTime">Heure de fin</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Durée totale</Label>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {actualHours} heure{actualHours > 1 ? 's' : ''}
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Sujets abordés, remarques..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}