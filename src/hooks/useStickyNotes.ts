/**
 * Sticky Notes + Comments — Anotaciones contextuales en el canvas
 * Prioridad ALTA del analisis SmartDraw
 */
import { useState, useCallback } from 'react';

export interface StickyNote {
  id: string;
  x: number;
  y: number;
  text: string;
  color: 'yellow' | 'green' | 'blue' | 'red' | 'purple';
  author: string;
  timestamp: number;
  resolved: boolean;
}

export interface Comment {
  id: string;
  targetId: string; // barrierId or sourceId
  targetType: 'barrier' | 'source' | 'general';
  text: string;
  author: string;
  timestamp: number;
  resolved: boolean;
}

const COLORS: Record<string, string> = {
  yellow: '#fef3c7',
  green: '#d1fae5',
  blue: '#dbeafe',
  red: '#fee2e2',
  purple: '#f3e8ff',
};

export function useStickyNotes() {
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [nextId, setNextId] = useState(1);

  const addNote = useCallback((x: number, y: number, text = '', color: StickyNote['color'] = 'yellow') => {
    const id = `note-${nextId}`;
    setNextId(n => n + 1);
    const note: StickyNote = {
      id, x, y,
      text: text || 'Nueva nota...',
      color,
      author: 'Usuario',
      timestamp: Date.now(),
      resolved: false,
    };
    setNotes(prev => [...prev, note]);
    return id;
  }, [nextId]);

  const updateNote = useCallback((id: string, updates: Partial<StickyNote>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const addComment = useCallback((targetId: string, targetType: Comment['targetType'], text: string) => {
    const id = `comment-${nextId}`;
    setNextId(n => n + 1);
    setComments(prev => [...prev, { id, targetId, targetType, text, author: 'Usuario', timestamp: Date.now(), resolved: false }]);
    return id;
  }, [nextId]);

  const getCommentsForTarget = useCallback((targetId: string) => {
    return comments.filter(c => c.targetId === targetId && !c.resolved);
  }, [comments]);

  const resolveComment = useCallback((id: string) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, resolved: true } : c));
  }, []);

  return {
    notes, comments, COLORS,
    addNote, updateNote, deleteNote,
    addComment, getCommentsForTarget, resolveComment,
  };
}
