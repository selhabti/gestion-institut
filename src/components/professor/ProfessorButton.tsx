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
      <Button 
        variant={variant} 
        size={size} 
        onClick={() => setIsOpen(true)}
        className={`relative ${className}`}
      >
        <Clock className="h-4 w-4 mr-2" />
        Heures prof
        {!loading && monthlyStats.totalHours > 0 && (  // ← monthlyStats.totalHours
          <span className="ml-2 text-xs bg-blue-100 text-blue-700 rounded-full px-1.5 py-0.5">
            {monthlyStats.totalHours}h
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