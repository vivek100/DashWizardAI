import { useState, useCallback } from 'react';

type Undoable<T> = {
  present: T;
  set: (newPresent: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

/**
 * Keeps a past/present/future history for any value T.
 * Automatically snapshots present->past on every set().
 */
export function useUndoable<T>(initial: T, limit = 50): Undoable<T> {
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState<T>(initial);
  const [future, setFuture] = useState<T[]>([]);

  const set = useCallback((newPresent: T) => {
    setPast(p => [...p, present].slice(-limit));
    setPresent(newPresent);
    setFuture([]);
  }, [present, limit]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setFuture(f => [present, ...f]);
    setPresent(previous);
    setPast(p => p.slice(0, -1));
  }, [past, present]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setPast(p => [...p, present].slice(-limit));
    setPresent(next);
    setFuture(f => f.slice(1));
  }, [future, present, limit]);

  return {
    present,
    set,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
