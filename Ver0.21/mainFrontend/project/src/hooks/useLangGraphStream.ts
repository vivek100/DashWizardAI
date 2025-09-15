'use client'

import { useStream } from '@langchain/langgraph-sdk/react';
import type { Message } from '@langchain/langgraph-sdk';
import { useState, useCallback, useEffect } from 'react';
import { createThread } from '@/utils/supabaseUtils';
import { toast } from 'sonner';

export type { Message }

export function useAgentStream(threadId?: string | null) {
  const [actualThreadId, setActualThreadId] = useState<string | undefined>(threadId || undefined);
  const [newSource, setNewSource] = useState<string | null>(null);
  const [newThreadId, setNewThreadId] = useState<string | null>(null);
  useEffect(() => {
    //console.log('threadId update from use langraph', threadId);
    //console.log('actualThreadId before update', actualThreadId);
    setActualThreadId(threadId || undefined);
    //console.log('actualThreadId after update', actualThreadId);
  }, [threadId]);

  const { messages, submit, isLoading, error, ...rest } = useStream<{
    messages: Message[]
  }>({
    apiUrl: import.meta.env.VITE_BACKEND_ENDPOINT || 'http://localhost:2024',
    assistantId: 'dashboard_agent',
    messagesKey: 'messages',
    threadId: actualThreadId,
    reconnectOnMount: true,
    onThreadId: async (newThreadId) => {
      //console.log('LangGraph created new thread:', newThreadId);
      setActualThreadId(newThreadId);
      
      // Only create in Supabase if this is a truly new thread (no existing threadId)
      if (!threadId) {
        try {
          await createThread('New Chat', newThreadId);
          //console.log('Saved thread to Supabase:', newThreadId);
          
          // Update URL without causing reinitialization
          const newUrl = `/?thread_id=${newThreadId}`;
          window.history.replaceState({}, '', newUrl);

          // Set New Source and Thread Id
          //setNewSource('agent');
          setNewThreadId(newThreadId);  
          
          // Refresh thread list in sidebar
          if ((window as any).refreshThreads) {
            (window as any).refreshThreads();
          }
        } catch (error) {
          console.error('Failed to create thread in Supabase:', error);
          // Don't show error to user as this is background operation
        }
      }
    },
    onCreated: (run) => {
      window.sessionStorage.setItem(`resume:${run.thread_id}`, run.run_id);
    },
    onFinish: (_, run) => {
      window.sessionStorage.removeItem(`resume:${run?.thread_id}`);
    },
    onError: (err) => {
      if (err instanceof Error && err.message.includes('not found')) {
        toast.error('Thread not found. Please start a new chat.');
      } else {
        toast.error(`LangGraph error: ${err instanceof Error ? err.message : String(err)}`);
      }
    },
  });

  const wrappedSubmit = useCallback(
    async (input: { messages: Message[] }, options?: any) => {
      try {
        return await submit(input, { ...options, streamResumable: true });
      } catch (err: any) {
        if (err.message.includes('not found')) {
          toast.error('Thread not found. Please start a new chat.');
        } else {
          toast.error(`Failed to submit message: ${err instanceof Error ? err.message : String(err)}`);
        }
        throw err;
      }
    },
    [submit]
  );

  return {
    messages,
    submit: wrappedSubmit,
    isLoading,
    error,
    threadId: actualThreadId,
    newSource,
    newThreadId,
    ...rest,
  };
}