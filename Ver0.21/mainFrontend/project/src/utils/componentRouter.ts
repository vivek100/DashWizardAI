import { AIComponent } from '@/types';
import { ParsedToolResult } from './messageUtils';

export interface ComponentRouterResult {
  componentType: AIComponent['type'];
  componentData: any;
  fallbackToGeneric: boolean;
  warningMessage?: string;
}

// Validation schemas for different tool result types
interface WidgetToolResultData {
  widget: {
    id: string;
    type: string;
    title: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    config: any;
  };
  query?: string;
  table_names?: string[];
  show_sql?: boolean;
}

interface DashboardToolResultData {
  dashboard: {
    id: string;
    name: string;
    description?: string;
    widgets: any[];
    isPublished?: boolean;
    isTemplate?: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
  previewMode?: boolean;
}

interface ErrorToolResultData {
  error: string;
  code?: string;
  suggestions?: string[];
  stack_trace?: string;
}

interface UploadPromptToolResultData {
  message: string;
  acceptedTypes: string[];
  targetTable?: string;
}

// Validation functions
function validateWidgetData(data: any): data is { data: WidgetToolResultData } {
  return (
    data &&
    data.data &&
    data.data.widget &&
    typeof data.data.widget.id === 'string' &&
    typeof data.data.widget.type === 'string' &&
    typeof data.data.widget.title === 'string' &&
    data.data.widget.position &&
    typeof data.data.widget.position.x === 'number' &&
    typeof data.data.widget.position.y === 'number' &&
    data.data.widget.size &&
    typeof data.data.widget.size.width === 'number' &&
    typeof data.data.widget.size.height === 'number' &&
    data.data.widget.config
  );
}

function validateDashboardData(data: any): data is { data: DashboardToolResultData } {
  return (
    data &&
    data.data &&
    data.data.dashboard &&
    typeof data.data.dashboard.id === 'string' &&
    typeof data.data.dashboard.name === 'string' &&
    Array.isArray(data.data.dashboard.widgets)
  );
}

function validateErrorData(data: any): data is { data: ErrorToolResultData } {
  return (
    data &&
    data.data &&
    typeof data.data.error === 'string'
  );
}

function validateUploadPromptData(data: any): data is { data: UploadPromptToolResultData } {
  return (
    data &&
    data.data &&
    typeof data.data.message === 'string' &&
    Array.isArray(data.data.acceptedTypes)
  );
}

// Main routing function
export function routeToolResultToComponent(parsedResult: ParsedToolResult): ComponentRouterResult {
  try {
    switch (parsedResult.type) {
      case 'widget':
        if (validateWidgetData(parsedResult.data)) {
          return {
            componentType: 'widget',
            componentData: {
              widget: parsedResult.data.data.widget,
              queryResult: parsedResult.data.data.queryResult,
              showSQL: parsedResult.data.data.show_sql || false
            },
            fallbackToGeneric: false
          };
        } else {
          return {
            componentType: 'tool_result',
            componentData: {
              name: 'widget_parser',
              result: parsedResult.originalContent
            },
            fallbackToGeneric: true,
            warningMessage: 'Invalid widget data structure'
          };
        }

      case 'dashboard':
        if (validateDashboardData(parsedResult.data)) {
          return {
            componentType: 'dashboard',
            componentData: {
              dashboard: parsedResult.data.data.dashboard,
              previewMode: parsedResult.data.data.previewMode || false
            },
            fallbackToGeneric: false
          };
        } else {
          return {
            componentType: 'tool_result',
            componentData: {
              name: 'dashboard_parser',
              result: parsedResult.originalContent
            },
            fallbackToGeneric: true,
            warningMessage: 'Invalid dashboard data structure'
          };
        }

      case 'error':
        if (validateErrorData(parsedResult.data)) {
          return {
            componentType: 'error',
            componentData: {
              error: parsedResult.data.data.error,
              code: parsedResult.data.data.code,
              suggestions: parsedResult.data.data.suggestions || []
            },
            fallbackToGeneric: false
          };
        } else {
          return {
            componentType: 'tool_result',
            componentData: {
              name: 'error_parser',
              result: parsedResult.originalContent
            },
            fallbackToGeneric: true,
            warningMessage: 'Invalid error data structure'
          };
        }

      case 'upload_prompt':
        if (validateUploadPromptData(parsedResult.data)) {
          return {
            componentType: 'upload_prompt',
            componentData: {
              message: parsedResult.data.data.message,
              acceptedTypes: parsedResult.data.data.acceptedTypes,
              targetTable: parsedResult.data.data.targetTable
            },
            fallbackToGeneric: false
          };
        } else {
          return {
            componentType: 'tool_result',
            componentData: {
              name: 'upload_prompt_parser',
              result: parsedResult.originalContent
            },
            fallbackToGeneric: true,
            warningMessage: 'Invalid upload prompt data structure'
          };
        }

      case 'generic':
      default:
        return {
          componentType: 'tool_result',
          componentData: {
            name: 'unknown',
            result: parsedResult.originalContent,
            parseError: parsedResult.parseError
          },
          fallbackToGeneric: true,
          warningMessage: parsedResult.parseError || 'Unknown component type'
        };
    }
  } catch (error) {
    // Catch any unexpected errors during routing
    return {
      componentType: 'tool_result',
      componentData: {
        name: 'router_error',
        result: parsedResult.originalContent
      },
      fallbackToGeneric: true,
      warningMessage: error instanceof Error ? error.message : 'Routing error occurred'
    };
  }
}

// Helper function to create component with routing
export function createRoutedComponent(
  parsedResult: ParsedToolResult,
  messageId: string,
  messageName: string
): AIComponent {
  const routerResult = routeToolResultToComponent(parsedResult);
  
  return {
    type: routerResult.componentType,
    id: messageId || `${routerResult.componentType}-${Date.now()}`,
    data: routerResult.fallbackToGeneric ? {
      ...routerResult.componentData,
      name: messageName || routerResult.componentData.name,
      warningMessage: routerResult.warningMessage
    } : routerResult.componentData
  } as AIComponent;
}