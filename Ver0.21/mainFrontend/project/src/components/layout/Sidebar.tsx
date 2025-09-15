import React, { useState, useEffect } from 'react';
import { NavLink, useSearchParams, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { fetchThreads, createThread } from '@/utils/supabaseUtils';
import { Thread } from '@/types';
import { toast } from 'sonner';
import {
  Home,
  Database,
  BarChart3,
  Settings,
  HelpCircle,
  Brain,
  Bell,
  LogOut,
  User,
  Plus,
  Search,
  MessageSquare
} from 'lucide-react';

const footerNavigation = [
  {
    name: 'Data Sources',
    href: '/data',
    icon: Database,
    description: 'Manage your data and queries'
  },
  {
    name: 'Dashboards',
    href: '/dashboards',
    icon: BarChart3,
    description: 'View and edit dashboards'
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'App preferences and account'
  }
];

export function Sidebar() {
  const { isSidebarExpanded, setSidebarExpanded, alerts } = useAppStore();
  const { user, logout } = useAuthStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const currentThreadId = searchParams.get('thread_id');
  const unreadAlerts = alerts.filter(alert => !alert.read);

  // Load threads
  useEffect(() => {
    const loadThreads = async () => {
      if (!user) return;
      try {
        setIsLoadingThreads(true);
        const threadList = await fetchThreads();
        setThreads(threadList);
      } catch (error) {
        console.error('Failed to load threads:', error);
      } finally {
        setIsLoadingThreads(false);
      }
    };

    loadThreads();
  }, [user]);

  // Refresh threads function that can be called externally
  const refreshThreads = async () => {
    if (!user) return;
    try {
      const threadList = await fetchThreads();
      setThreads(threadList);
    } catch (error) {
      console.error('Failed to refresh threads:', error);
    }
  };

  // Expose refresh function globally for when new threads are created
  useEffect(() => {
    (window as any).refreshThreads = refreshThreads;
    return () => {
      delete (window as any).refreshThreads;
    };
  }, [user]);

  // Filter threads based on search query
  const filteredThreads = threads.filter(thread =>
    thread.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewChat = async () => {
    try {
      // Navigate to root path without thread_id to start fresh
      // LangGraph will create the thread when first message is sent
      navigate('/');
      // Adding this event so home page can trigger new chat even when a new chat is there
      window.dispatchEvent(new CustomEvent('newChat', { detail: Date.now().toString() }));
      toast.success('New chat started');
    } catch (error) {
      console.error('Failed to start new chat:', error);
      toast.error('Failed to start new chat');
    }
  };

  const handleThreadClick = (threadId: string) => {
    navigate(`/?thread_id=${threadId}`);
  };

  if (!user) return null;

  return (
    <>
      {/* Backdrop */}
      {isSidebarExpanded && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarExpanded(false)}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={cn(
          'fixed left-0 top-0 z-50 h-full bg-gray-900 border-r border-gray-800 transition-all duration-300 ease-in-out',
          'flex flex-col',
          isSidebarExpanded ? 'w-64' : 'w-16'
        )}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div className={cn(
              'flex flex-col transition-all duration-300 ease-in-out overflow-hidden',
              isSidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
            )}>
              <span className="text-sm font-semibold text-white whitespace-nowrap">DashboardAI</span>
              <span className="text-xs text-gray-400 whitespace-nowrap">Analytics Platform</span>
            </div>
          </div>
        </div>

        {/* AI Assistant Link */}
        <div className="px-2 py-4">
          <NavLink
            to="/"
            className={({ isActive }) =>
              cn(
                'group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                'hover:bg-gray-800 hover:text-white',
                (isActive && !currentThreadId) || (isActive && window.location.pathname === '/')
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300'
              )
            }
          >
            <Brain className="w-5 h-5 flex-shrink-0" />
            <div className={cn(
              'ml-3 min-w-0 flex-1 transition-all duration-300 ease-in-out overflow-hidden',
              isSidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
            )}>
              <div className="text-sm font-medium whitespace-nowrap">AI Assistant</div>
              <div className="text-xs text-gray-400 group-hover:text-gray-300 whitespace-nowrap">
                Chat with AI to create dashboards
              </div>
            </div>
          </NavLink>
        </div>

        {/* Chat History Section */}
        <div className="flex-1 flex flex-col overflow-hidden px-2">
          {/* Header with New Chat Button */}
          <div className="flex items-center justify-between mb-3">
            <div className={cn(
              'flex items-center transition-all duration-300 ease-in-out overflow-hidden',
              isSidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
            )}>
              <MessageSquare className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-300 whitespace-nowrap">Chat History</span>
            </div>
            <Button
              onClick={handleNewChat}
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0 flex-shrink-0 rounded-full transition-all duration-200",
                "bg-blue-600 text-white shadow",
                !isSidebarExpanded && "mx-auto"
              )}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          {/* Search Bar */}
          <div className={cn(
            'mb-3 transition-all duration-300 ease-in-out overflow-hidden',
            isSidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
          )}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500 h-9 text-sm"
              />
            </div>
          </div>

          {/* New Chat Button for Expanded View */}
          <div className={cn(
            'mb-3 transition-all duration-300 ease-in-out overflow-hidden',
            isSidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
          )}>
            <Button
              onClick={handleNewChat}
              variant="outline"
              size="sm"
              className="w-full h-9 text-sm border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="transition-all duration-300 ease-in-out">New Chat</span>
            </Button>
          </div>

          {/* Thread List */}
          <ScrollArea className="flex-1">
            <div className="space-y-1 pr-2">
              {isLoadingThreads ? (
                <div className={cn(
                  'text-center py-4 text-gray-500 transition-all duration-300 ease-in-out',
                  isSidebarExpanded ? 'opacity-100' : 'opacity-0'
                )}>
                  <div className="text-sm">Loading chats...</div>
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className={cn(
                  'text-center py-4 text-gray-500 transition-all duration-300 ease-in-out',
                  isSidebarExpanded ? 'opacity-100' : 'opacity-0'
                )}>
                  <div className="text-sm font-medium">No chats yet</div>
                  <div className="text-xs mt-1">Start a conversation with AI</div>
                </div>
              ) : (
                filteredThreads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => handleThreadClick(thread.id)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg transition-all duration-200 group',
                      'hover:bg-gray-800',
                      isSidebarExpanded ? thread.id === currentThreadId ? 'bg-blue-600 text-white' : 'text-gray-300' : 'text-gray-300 hover:text-white'
                    )}
                  >
                    <div className={cn(
                      'transition-all duration-300 ease-in-out overflow-hidden',
                      isSidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
                    )}>
                      <div className="text-sm font-medium truncate">
                        {thread.is_new ? 'New Chat' : thread.name}
                      </div>
                      <div className="text-xs opacity-70 truncate mt-1">
                        {new Date(thread.updated_at).toLocaleDateString()} {new Date(thread.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer Navigation */}
        <div className="border-t border-gray-800">
          {/* Footer Navigation Links */}
          <nav className="px-2 py-2 space-y-1">
            {footerNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  'hover:bg-gray-800 hover:text-white',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300'
                )
              }
            >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className={cn(
                  'ml-3 transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap',
                isSidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
              )}>
                  {item.name}
                </span>
            </NavLink>
          ))}
        </nav>

          {/* Notifications */}
          <div className="p-2">
            <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors relative">
              <div className="relative flex-shrink-0">
                <Bell className="w-4 h-4" />
                {unreadAlerts.length > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 w-3 h-3 p-0 text-xs flex items-center justify-center"
                  >
                    {unreadAlerts.length}
                  </Badge>
                )}
              </div>
              <span className={cn(
                'ml-3 transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap',
                isSidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
              )}>
                Notifications
              </span>
            </button>
          </div>

          {/* Help */}
          <div className="p-2">
            <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors">
              <HelpCircle className="w-4 h-4 flex-shrink-0" />
              <span className={cn(
                'ml-3 transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap',
                isSidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
              )}>
                Help & Support
              </span>
            </button>
          </div>

          {/* Logout */}
          <div className="p-2">
            <button 
              onClick={logout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span className={cn(
                'ml-3 transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap',
                isSidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
              )}>
                Log out
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}