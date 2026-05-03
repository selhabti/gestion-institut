import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { SessionReminderModal } from './SessionReminderModal';
import { useProfessorHours } from '@/hooks/useProfessorHours';
import { toast } from 'sonner';

interface ProfessorButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function ProfessorButton({ variant = 'outline', size = 'sm', className = '' }: ProfessorButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { saveSession, monthlyStats, loading } = useProfessorHours();  // ← change stats → monthlyStats
  
  const handleSave = async (session: { startTime: string; endTime: string; actualHours: number; notes: string }) => {
    try {
      await saveSession({
        date: new Date().toISOString().split('T')[0],
        startTime: session.startTime,
        endTime: session.endTime,
        actualHours: session.actualHours,
        notes: session.notes,
        status: 'completed'
      });
      toast.success(`✅ ${session.actualHours}h enregistrées pour aujourd'hui`);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'enregistrement");
    }
  };

  return (
    <>
      
      <SessionReminderModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSave={handleSave}
      />
    </>
  );
}