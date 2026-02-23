import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from '@/lib/supabase';
import type { Event, EventFormData } from "@/types/event";
import type { SessionType } from "@/types/session";

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadEvents = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) throw error;
      
      if (mountedRef.current) {
        setEvents(data || []);
      }
    } catch (error) {
      console.error('❌ Erreur chargement événements:', error);
      if (mountedRef.current) {
        setError(error instanceof Error ? error.message : 'Erreur inconnue');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Fonctions utilitaires...
  const isDateExcludedFromStats = useCallback((
    date: string,
    group?: SessionType
  ): boolean => {
    const targetDate = new Date(date);
    
    return events.some(event => {
      if (!event.exclude_from_stats) return false;
      
      const startDate = new Date(event.start_date);
      const endDate = new Date(event.end_date);
      
      if (targetDate < startDate || targetDate > endDate) return false;
      
      if (group && event.groups && event.groups.length > 0) {
        return event.groups.includes(group);
      }
      
      return true;
    });
  }, [events]);

  const isVacationDay = useCallback((date: string): boolean => {
    return events.some(event => 
      event.event_type === 'vacation' &&
      new Date(date) >= new Date(event.start_date) &&
      new Date(date) <= new Date(event.end_date)
    );
  }, [events]);

  const getEventsForDate = useCallback((date: string): Event[] => {
    const targetDate = new Date(date);
    
    return events.filter(event => {
      const startDate = new Date(event.start_date);
      const endDate = new Date(event.end_date);
      return targetDate >= startDate && targetDate <= endDate;
    });
  }, [events]);

  const getEventById = useCallback((eventId: string): Event | undefined => {
    return events.find(event => event.id === eventId);
  }, [events]);

  // Fonction pour obtenir uniquement les vacances
  const getVacations = useCallback((): Event[] => {
    return events.filter(event => event.event_type === 'vacation');
  }, [events]);

  const createEvent = useCallback(async (
    eventData: EventFormData,
    userId: string
  ): Promise<Event | null> => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('events')
        .insert({
          ...eventData,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        setEvents(prev => [...prev, data]);
      }
      
      return data;
    } catch (error) {
      console.error('❌ Erreur création événement:', error);
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
      throw error;
    }
  }, []);

  const updateEvent = useCallback(async (
    eventId: string,
    eventData: Partial<EventFormData>
  ): Promise<Event | null> => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        setEvents(prev => prev.map(event => 
          event.id === eventId ? data : event
        ));
      }
      
      return data;
    } catch (error) {
      console.error('❌ Erreur modification événement:', error);
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
      throw error;
    }
  }, []);

  const deleteEvent = useCallback(async (eventId: string): Promise<void> => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      
      setEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('❌ Erreur suppression événement:', error);
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
      throw error;
    }
  }, []);

  return {
    events,
    loading,
    error,
    loadEvents,
    isDateExcludedFromStats,
    isVacationDay,
    getEventsForDate,
    getEventById,
    getVacations, // Nouvelle fonction
    createEvent,
    updateEvent,
    deleteEvent,
  };
};