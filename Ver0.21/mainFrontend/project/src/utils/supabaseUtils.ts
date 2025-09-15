import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Thread } from '@/types';
import { toast } from 'sonner';

export async function createThread(name: string, threadId?: string): Promise<Thread> {
  const { user } = useAuthStore.getState();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('threads')
    .insert({ id: threadId, name, user_id: user.id, is_new: true })
    .select()
    .single();

  if (error) {
    toast.error(`Failed to create thread: ${error.message}`);
    throw new Error(`Failed to create thread: ${error.message}`);
  }
  return data;
}

export async function fetchThreads(): Promise<Thread[]> {
  const { user } = useAuthStore.getState();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('threads')
    .select('id, user_id, name, created_at, updated_at, dashboard_id, is_new')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    toast.error(`Failed to fetch threads: ${error.message}`);
    throw new Error(`Failed to fetch threads: ${error.message}`);
  }
  return data || [];
}

export async function updateThread(id: string, updates: Partial<Thread>): Promise<Thread> {
  const { data, error } = await supabase
    .from('threads')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    toast.error(`Failed to update thread: ${error.message}`);
    throw new Error(`Failed to update thread: ${error.message}`);
  }
  return data;
} 