import { create } from 'zustand';
import { Alert, ChatMessage } from '@/types';

interface AppState {
  alerts: Alert[];
  chatMessages: ChatMessage[];
  isSidebarExpanded: boolean;
  currentPage: string;
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'read'>) => void;
  markAlertAsRead: (id: string) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setSidebarExpanded: (expanded: boolean) => void;
  setCurrentPage: (page: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  alerts: [
    {
      id: '1',
      title: 'Data Upload Complete',
      message: 'Sales data has been successfully uploaded and processed',
      type: 'success',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      read: false
    },
    {
      id: '2',
      title: 'Dashboard Published',
      message: 'Your Q4 Analytics dashboard is now live',
      type: 'info',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      read: false
    }
  ],
  chatMessages: [
    {
      id: '1',
      content: 'Hello! I\'m your AI assistant. I can help you create dashboards, analyze data, and answer questions about your analytics. What would you like to work on today?',
      role: 'assistant',
      timestamp: new Date(),
      suggestions: [
        'Create a sales dashboard',
        'Analyze customer data',
        'Show me revenue trends',
        'Help with data upload'
      ]
    }
  ],
  isSidebarExpanded: false,
  currentPage: 'home',

  addAlert: (alert) => {
    const newAlert: Alert = {
      ...alert,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };
    
    set(state => ({
      alerts: [newAlert, ...state.alerts]
    }));
  },

  markAlertAsRead: (id) => {
    set(state => ({
      alerts: state.alerts.map(alert =>
        alert.id === id ? { ...alert, read: true } : alert
      )
    }));
  },

  addChatMessage: (message) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    
    set(state => ({
      chatMessages: [...state.chatMessages, newMessage]
    }));
  },

  setSidebarExpanded: (expanded) => {
    set({ isSidebarExpanded: expanded });
  },

  setCurrentPage: (page) => {
    set({ currentPage: page });
  }
}));