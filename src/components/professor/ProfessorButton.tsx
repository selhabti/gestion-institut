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

  const todayMinutes = monthlyStats?.totalHours ?? 0;

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setIsOpen(true)}
        title="Enregistrer les heures de cours"
      >
        <Clock className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">Cours</span>
        {todayMinutes > 0 && (
          <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
            {todayMinutes}h
          </span>
        )}
      </Button>
      <SessionReminderModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSave={handleSave}
      />
    </>
  );
}