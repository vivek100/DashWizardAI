import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { useDataStore } from '@/store/dataStore';
import { useAuthStore } from '@/store/authStore';
import { useAgentStream, Message } from '@/hooks/useLangGraphStream';
import { dedupeMessages, convertToEnhancedMessage } from '@/utils/messageUtils';
import { findAvailablePosition } from '@/utils/dashboardUtils';
import { createThread, updateThread, fetchThreads } from '@/utils/supabaseUtils';
import { toast } from 'sonner';
import { Dashboard, Widget, EnhancedChatMessage } from '@/types';

interface ChatInterfaceProps {
  onDashboardAction?: (action: 'create' | 'edit', dashboard: Dashboard) => void;
  currentDashboard?: Dashboard | null;
  threadId?: string | null;
}

export function useChatInterface({ onDashboardAction, currentDashboard, threadId }: ChatInterfaceProps) {
  const { addAlert } = useAppStore();
  const { 
    dashboards, setCurrentDashboard, 
    createDashboard, updateDashboard, addWidget 
  } = useDashboardStore();
  const { tables, views, executeQuery, addDataSource, isInitialized, initialize } = useDataStore();
  const { user } = useAuthStore();
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [threadLoading, setThreadLoading] = useState(true);
  const [lastUserInput, setLastUserInput] = useState('');
  const [lastUserMessageId, setLastUserMessageId] = useState<string>('');
  const [collapsedToolResults, setCollapsedToolResults] = useState<{ [key: string]: boolean }>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const [localThreadId, setLocalThreadId] = useState<string | null>(threadId || null);
  const [source, setSource] = useState<string>('sidebar');
  
  const { messages, submit, isLoading, error, newSource, newThreadId } = useAgentStream(threadId);
  useEffect(() => {
    //console.log("THIS IS THE NEW THREAD ID", newThreadId);
    //console.log("THIS IS THE LOCAL THREAD ID", localThreadId);
    if ((newThreadId) && (newThreadId !== localThreadId)) {
      setLocalThreadId(newThreadId);
      setSource('agent');
    }
  }, [newSource, newThreadId]);
  const displayMessages = dedupeMessages(messages).map(convertToEnhancedMessage);
  const [previousMessageCount, setPreviousMessageCount] = useState(0);

  const suggestedPrompts = [
    "Analyze the uploaded CSV file and provide insights",
    "Generate a comprehensive report with recommendations",
    "Perform sentiment analysis on text columns",
    "Show statistical summary of numerical data",
    "Compare different departments or categories"
  ];

  // Hide thread loading when messages are loaded or after a timeout for empty threads
  useEffect(() => {
    //console.log("THREAD LOADING Use effect was called", threadLoading);
    if (threadLoading) {
      //console.log("Display Messages Length", displayMessages.length);
      if (displayMessages.length > 0) {
        setThreadLoading(false);
      }
    }
  }, [displayMessages.length, threadLoading]);

  // Initialize welcome message and handle thread loading
  useEffect(() => {
    //console.log("THIS IS THE SOURCE", source);
    //console.log("THIS IS THE THREAD LOADING", threadLoading);
    if (source === 'sidebar') {
      const initializeAndSetWelcome = async () => {
        try {
          //console.log("INITIALIZING CHAT and setting intializing to true");
          setIsInitializing(true);
          setThreadLoading(true);
          await initialize();
          // If no threadId, we'll start fresh and let LangGraph create a new thread when first message is sent
        } catch (error) {
          console.error('Failed to initialize chat:', error);
          toast.error('Failed to initialize chat');
        } finally {
          setIsInitializing(false);
          if(displayMessages.length > 0) {
            setThreadLoading(false);

          } else {
            if(localThreadId) {
            setThreadLoading(true);
            //set time out for three seconds
            setTimeout(() => {
                setThreadLoading(false);
              }, 2000);
            } else {
              setThreadLoading(false);
            }
          }
        }
      };
      initializeAndSetWelcome();
    }

  }, [initialize, localThreadId, dashboards, onDashboardAction]);

  // Handle thread naming and scroll when new messages are added
  useEffect(() => {
    if (displayMessages.length > previousMessageCount && localThreadId) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      setPreviousMessageCount(displayMessages.length);
      
      // Update thread name based on first user message
      if (displayMessages.length > 0 && displayMessages[0].role === 'user') {
        fetchThreads().then(threads => {
          const thread = threads.find(t => t.id === localThreadId);
          if (thread?.is_new) {
            const firstMessage = displayMessages[0].content.slice(0, 100).replace(/[^a-zA-Z0-9\s]/g, '');
            
            updateThread(localThreadId, { name: firstMessage || 'New Chat', is_new: false })
              .then(() => {
                // Refresh thread list in sidebar if available
                if ((window as any).refreshThreads) {
                  (window as any).refreshThreads();
                }
              })
              .catch(error => {
                console.error('Failed to update thread name:', error);
                toast.error('Failed to update thread name');
              });
          }
        }).catch(error => {
          console.error('Failed to fetch threads:', error);
        });
      }
    }
  }, [displayMessages.length, previousMessageCount, localThreadId]);


  const handleSend = async () => {
    if (!input.trim() || !user) return;
  
    const userInput = input.trim();
    const userMessageId = Date.now().toString();
    const userMessage: Message = {
      id: userMessageId,
      type: 'human',
      content: userInput,
    };
  
    setLastUserInput(userInput);
    setLastUserMessageId(userMessageId);
    setInput('');
    setIsTyping(true);
    
    try {
      // Prepare the dashboards data to send only the active dashboard
      const dashboardsToSend = currentDashboard ? [currentDashboard] : [];
      //console.log("this is the user", user);
      //console.log("THIS IS THE THREAD ID", localThreadId);
      //console.log("this is the current dashboard", currentDashboard);
      // Prepare submit options - only include threadId if it exists
      const submitOptions: any = { 
        config: { 
          configurable: { 
            activeDashboard: dashboardsToSend,
            run_id: localThreadId,
            user_id: user.id,
            user_email: user.email,
            user_name: user.name,
          } 
        },
        streamResumable: true,
      };

      // Only add threadId to options if it exists (not null)
      if (localThreadId) {
        submitOptions.threadId = localThreadId;
      }

      await submit(
        { messages: [userMessage] },
        submitOptions
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setLastError(errorMessage);
      toast.error(`Action failed: ${errorMessage}`);
    } finally {
      setIsTyping(false);
    }
  };

  const handleComponentAction = async (action: string, componentId: string, data?: any) => {
    try {
      switch (action) {
        case 'save_dashboard':
        case 'open_editor':
          if (data?.dashboard) {
            const dashboardAction = action === 'save_dashboard' ? 'create' : 'edit';
            const newDashboard = action === 'save_dashboard'
              ? createDashboard(data.dashboard.name, data.dashboard.description)
              : data.dashboard;
              
            if (action === 'save_dashboard') {
              for (const widget of data.dashboard.widgets) {
                addWidget(newDashboard.id, widget);
              }
              toast.success(`Dashboard "${newDashboard.name}" saved successfully!`);
              addAlert({
                title: 'Dashboard Saved',
                message: `${newDashboard.name} has been created and saved`,
                type: 'success',
              });
            }
            
            if (onDashboardAction) {
              onDashboardAction(dashboardAction, { ...newDashboard, widgets: data.dashboard.widgets || [] });
            }
            
            if (localThreadId) {
              updateThread(localThreadId, { dashboard_id: newDashboard.id }).catch(() => {
                toast.error('Failed to update thread dashboard');
              });
            }
            
            toast.success(`Dashboard "${newDashboard.name}" opened in ${dashboardAction} mode!`);
          }
          break;
          
        case 'close_dashboard':
          if (localThreadId) {
            updateThread(localThreadId, { dashboard_id: null }).catch(() => {
              toast.error('Failed to update thread dashboard');
            });
          }
          break;
        
        case 'add_to_dashboard':
          if (data?.widget) {
            if (currentDashboard) {
              const position = findAvailablePosition(currentDashboard.widgets, data.widget);
              const widgetWithPosition = { ...data.widget, position };
              addWidget(currentDashboard.id, widgetWithPosition);
              toast.success(`Widget added to "${currentDashboard.name}"`);
              toast.success(`Widget "${data.widget.title}" added to "${currentDashboard.name}"`);
            } else {
              const newDashboard = createDashboard('New Dashboard', 'Created from AI chat');
              addWidget(newDashboard.id, data.widget);
              if (onDashboardAction) {
                onDashboardAction('edit', { ...newDashboard, widgets: [data.widget] });
              }
              toast.success('Widget added to new dashboard');
              toast.success(`Created new dashboard "${newDashboard.name}" with your widget and opened it in edit mode!`);
            }
          }
          break;
        
        case 'upload_csv':
          setUploadDialogOpen(true);
          break;
        
        case 'execute_query':
          if (data?.query) {
            try {
              const result = await executeQuery(data.query);
              toast.success(`Query executed successfully! Found ${result.length} rows.`);
              toast.success(`Query executed successfully! Found ${result.length} rows.`);
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Query execution failed';
              setLastError(errorMessage);
              toast.error(`Query failed: ${errorMessage}`);
              toast.error(`Query failed: ${errorMessage}`);
            }
          }
          break;

        case 'export_csv':
          if (data?.result) {
            const csvContent = [
              Object.keys(data.result[0] || {}).join(','),
              ...data.result.map((row: any) =>
                Object.values(row).map(val =>
                  typeof val === 'string' && val.includes(',') ? `"${val}"` : val
                ).join(',')
              )
            ].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'query_results.csv';
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Data exported to CSV');
          }
          break;

        case 'update_dashboard':
          if (data?.config && currentDashboard) {
            updateDashboard(currentDashboard.id, data.config);
            toast.success('Dashboard updated successfully');
            toast.success(`Dashboard "${currentDashboard.name}" updated successfully!`);
          } else if (data?.config && !currentDashboard) {
            toast.error('No dashboard is currently open. Please open a dashboard first to apply edits.');
          }
          break;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Action failed';
      setLastError(errorMessage);
      toast.error(`Action failed: ${errorMessage}`);
      toast.error(`Action failed: ${errorMessage}`);
    }
  };

  const handleUploadSuccess = (tableName: string, rowCount: number) => {
    toast.success(`Successfully uploaded data to table "${tableName}" with ${rowCount} rows!`);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  return {
    // State
    input,
    setInput,
    isTyping,
    uploadDialogOpen,
    setUploadDialogOpen,
    lastError,
    isInitializing,
    threadLoading,
    lastUserInput,
    lastUserMessageId,
    collapsedToolResults,
    setCollapsedToolResults,
    
    // Data
    displayMessages,
    rawMessages: messages,
    suggestedPrompts,
    scrollRef,
    error,
    isLoading,
    
    // Actions
    handleSend,
    handleComponentAction,
    handleUploadSuccess,
    handleSuggestionClick,
  };
} 