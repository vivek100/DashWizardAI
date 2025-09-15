import { EnhancedChatMessage, AIResponse, AIComponent } from '@/types';
import type { Message } from '@langchain/langgraph-sdk';
import { createRoutedComponent } from './componentRouter';

import { useDataStore } from '@/store/dataStore';
import { toast } from 'sonner';
// Static variables to persist across function calls
let processedTableNames: Set<string> = new Set();
let lastToolCalls: Set<{ toolName: string; tableName: string }> = new Set();

// Enhanced parsing interfaces
export interface ParsedToolResult {
  type: 'widget' | 'dashboard' | 'error' | 'upload_prompt' | 'generic';
  data: any;
  originalContent: any;
  parseError?: string;
}

export interface ProgressStepConfig {
  name: string;
  steps: string[];
  duration: number;
}

// Deduplicate messages (from demo app)
export function dedupeMessages(messages: Message[]): Message[] {
  const messageMap = new Map<string, Message>();
  messages.forEach(message => {
    const key = message.id || `${message.type}-${message.name || 'unknown'}-${JSON.stringify(message.content)}`;
    messageMap.set(key, message);
  });
  return Array.from(messageMap.values());
}

// Enhanced tool result parsing function
export function parseToolResultContent(content: any): ParsedToolResult {
  try {
    // If content is already an object, use it directly
    let parsedContent = content;
    
    // If content is a string, try to parse it as JSON
    if (typeof content === 'string') {
      try {
        parsedContent = JSON.parse(content);
      } catch (jsonError) {
        // If JSON parsing fails, return generic type
        return {
          type: 'generic',
          data: content,
          originalContent: content,
          parseError: 'Invalid JSON format'
        };
      }
    }

    // Check if parsed content has a type field
    if (!parsedContent || typeof parsedContent !== 'object' || !parsedContent.type) {
      return {
        type: 'generic',
        data: parsedContent,
        originalContent: content,
        parseError: 'Missing type field'
      };
    }

    // Validate known types
    const validTypes = ['widget', 'dashboard', 'error', 'upload_prompt'];
    if (!validTypes.includes(parsedContent.type)) {
      return {
        type: 'generic',
        data: parsedContent,
        originalContent: content,
        parseError: `Unknown type: ${parsedContent.type}`
      };
    }

    // Return parsed result with validated type
    return {
      type: parsedContent.type as 'widget' | 'dashboard' | 'error' | 'upload_prompt',
      data: parsedContent,
      originalContent: content
    };

  } catch (error) {
    // Catch any unexpected errors
    return {
      type: 'generic',
      data: content,
      originalContent: content,
      parseError: error instanceof Error ? error.message : 'Unknown parsing error'
    };
  }
}

// Check if progress animation should be shown
export function shouldShowProgress(message: Message, isLoading: boolean, isLastMessage: boolean): boolean {
  if (!isLoading || !isLastMessage) {
    return false;
  }

  // Check if this is an AI message with tool calls
  if (message.type === 'ai' && Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
    const toolCall = message.tool_calls[0];
    return toolCall.name === 'render_widget' || toolCall.name === 'render_dashboard';
  }

  return false;
}

// Get progress configuration for specific tool names
export function getProgressConfig(toolName: string): ProgressStepConfig | null {
  const configs: Record<string, ProgressStepConfig> = {
    'render_widget': {
      name: 'Creating Widget',
      steps: [
        'Analyzing user intent',
        'Gathering table data',
        'Generating SQL',
        'Creating widget'
      ],
      duration: 30000 // 3 seconds per step
    },
    'render_dashboard': {
      name: 'Creating Dashboard',
      steps: [
        'Analyzing user intent',
        'Creating dashboard plan',
        'Generating layout',
        'Initializing dashboard',
        'Generating data for widgets',
        'Generating widgets',
        'Finalizing changes',
        'Saving updated dashboard'
      ],
      duration: 60000 // 2.5 seconds per step
    }
  };

  return configs[toolName] || null;
}

// Convert agent messages to EnhancedChatMessage format
export function convertToEnhancedMessage(message: Message): EnhancedChatMessage {
  const role = message.type === 'human' ? 'user' : 'assistant';
  let aiResponse: AIResponse | undefined;
  let content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);

  // Debounce function for loadFromBackend
  let debounceTimeout: NodeJS.Timeout | null = null;

  const triggerReload = (tableName: string) => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      const { loadFromBackend, tables } = useDataStore.getState();
      if (!tables.some(t => t.name === tableName)) {
        loadFromBackend()
          .then(() => {
            toast.success(`Tables refreshed from backend due to new table creation: ${tableName}`);
          })
          .catch(error => {
            const errorMessage = error instanceof Error ? error.message : 'Failed to refresh tables';
            toast.error(errorMessage);
          });
      } else {
        processedTableNames.delete(tableName); // Clear if table already exists
      }
    }, 500);
  };


  if (message.type === 'ai' && Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
    content = "Tool Call Initiated: " + message.tool_calls[0].name + " was called.";
    aiResponse = {
      text: "Tool Call Initiated: " + message.tool_calls[0].name + " was called.",
      components: message.tool_calls.map((call, idx) => ({
        type: 'tool_call',
        id: call.id || `tool-call-${idx}`,
        data: {
          name: call.name,
          args: call.args
        }
      }))
    };

    // Record all tool_calls with create_table: true
    for (const toolCall of message.tool_calls) {
      if (toolCall.name === 'execute_pandas_query' && toolCall.args?.create_table) {
        const tableName = toolCall.args.result_table_name;
        if (tableName && !processedTableNames.has(tableName)) {
          lastToolCalls.add({ toolName: toolCall.name, tableName });
        }
      }
    }

  } else if (message.type === 'tool') {

    // Reload logic
    if (message.name) {
      const matchingToolCall = Array.from(lastToolCalls).find(
        call => call.toolName === message.name
      );
      if (matchingToolCall) {
        const tableName = matchingToolCall.tableName;
        if (!processedTableNames.has(tableName)) {
          processedTableNames.add(tableName);
          triggerReload(tableName);
        }
        lastToolCalls = new Set(
          Array.from(lastToolCalls).filter(call => call.tableName !== tableName)
        );
      }
    }

    // Parse the tool result content to determine component type
    const parsedResult = parseToolResultContent(message.content);
    
    // Use the component router to create the appropriate component
    const routedComponent = createRoutedComponent(
      parsedResult,
      message.id || `tool-result-${Date.now()}`,
      message.name || 'unknown'
    );
    
    // Set content based on component type
    if (parsedResult.type !== 'generic') {
      content = `Tool Call Completed: ${message.name || 'unknown'} returned ${parsedResult.type} data.`;
    } else {
      content = "Tool Call Completed: " + (message.name || 'unknown') + " tool returned a response.";
    }
    
    aiResponse = {
      text: content,
      components: [routedComponent]
    };
  } else if (message.type === 'ai') {
    aiResponse = { text: content };
  }

  return {
    id: message.id || Date.now().toString(),
    content,
    role,
    timestamp: new Date(),
    aiResponse,
    suggestions: message.type === 'ai' ? [
      'Create a dashboard from this',
      'Show more details',
      'Analyze further',
      'Export data'
    ] : undefined
  };
} 