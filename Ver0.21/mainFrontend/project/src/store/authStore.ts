import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  session: any | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithDemo: () => Promise<void>;
  logout: () => void;
  getAccessToken: () => string | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  session: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user && data.session) {
        const user: User = {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
          avatar: data.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.email}`
        };
        
        set({ 
          user, 
          isAuthenticated: true, 
          isLoading: false,
          session: data.session 
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  loginWithDemo: async () => {
    set({ isLoading: true });
    
    try {
      // Use the specific demo credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'mcptester@example.com',
        password: 'mcptester@312',
      });

      if (error) {
        console.error('Demo login error:', error);
        throw error;
      }

      if (data.user && data.session) {
        const user: User = {
          id: data.user.id,
          email: data.user.email || 'mcptester@example.com',
          name: 'Demo User',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo'
        };
        
        set({ 
          user, 
          isAuthenticated: true, 
          isLoading: false,
          session: data.session 
        });
      }
    } catch (error) {
      console.error('Demo login failed:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      set({ 
        user: null, 
        isAuthenticated: false, 
        session: null 
      });
    }
  },

  getAccessToken: () => {
    const { session } = get();
    return session?.access_token || null;
  }
}));

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  const setState = useAuthStore.setState;
  
  if (event === 'SIGNED_IN' && session?.user) {
    const user: User = {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
      avatar: session.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.email}`
    };
    
    setState({
      user,
      isAuthenticated: true,
      session
    });
  } else if (event === 'SIGNED_OUT') {
    setState({
      user: null,
      isAuthenticated: false,
      session: null
    });
  }
});