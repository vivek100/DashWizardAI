import React from 'react';
import { EnhancedChatMessage } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, User, Wrench, CheckCircle, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { format } from 'date-fns';
import AIComponentRenderer from './AIComponentRenderer';
//import ProgressAnimation from './ProgressAnimation';
import ProgressAnimationTypewriter from './ProgressAnimationTypewriter';
import { shouldShowProgress, getProgressConfig } from '@/utils/messageUtils';
import type { Message } from '@langchain/langgraph-sdk';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface ChatMessageProps {
  message: EnhancedChatMessage;
  onSuggestionClick: (suggestion: string) => void;
  onComponentAction: (action: string, componentId: string, data?: any) => void;
  collapsedToolResults: { [key: string]: boolean };
  setCollapsedToolResults: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>;
  isLoading?: boolean;
  isLastMessage?: boolean;
  rawMessage?: Message;
}

export default function ChatMessage({ 
  message, 
  onSuggestionClick, 
  onComponentAction, 
  collapsedToolResults, 
  setCollapsedToolResults,
  isLoading = false,
  isLastMessage = false,
  rawMessage
}: ChatMessageProps) {
  return (
    <div className={`flex items-start space-x-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
      {message.role === 'assistant' && (
        <Avatar className="w-8 h-8 bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 flex-shrink-0 shadow-sm">
          <AvatarFallback className="bg-transparent">
            {message.aiResponse?.components?.some(comp => comp.type === 'tool_call') ? (
              <Wrench className="w-4 h-4 text-white drop-shadow-sm" />
            ) : message.aiResponse?.components?.some(comp => comp.type === 'tool_result') ? (
              <CheckCircle className="w-4 h-4 text-white drop-shadow-sm" />
            ) : (
              <Brain className="w-4 h-4 text-white drop-shadow-sm" />
            )}
          </AvatarFallback>
        </Avatar>
      )}
      <div className={`max-w-[80%] min-w-0 ${message.role === 'user' ? 'order-first' : ''}`}>
        <Card className={`p-3 ${message.role === 'user' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200'} whitespace-pre-wrap break-words`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              table: ({ node, ...props }) => (
                <div className="my-4">
                  <ScrollArea className="w-full custom-scrollbar">
                    <div className="min-w-[200px]">
                      <Table {...props} />
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>
              ),
              thead: ({ node, ...props }) => <TableHeader {...props} />,
              tbody: ({ node, ...props }) => <TableBody {...props} />,
              tr: ({ node, ...props }) => <TableRow {...props} />,
              th: ({ node, ...props }) => (
                <TableHead className="min-w-[50px] max-w-[300px] break-words font-semibold text-gray-900 p-4" {...props} />
              ),
              td: ({ node, ...props }) => (
                <TableCell className="min-w-[50px] max-w-[300px] break-words font-mono text-xs text-gray-700 p-4" {...props} />
              ),
              h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4" {...props} />,
              h2: ({ node, ...props }) => <h2 className="text-xl font-semibold mb-3" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mb-2" {...props} />,
              h4: ({ node, ...props }) => <h4 className="text-base font-semibold mb-2" {...props} />,
              h5: ({ node, ...props }) => <h5 className="text-sm font-semibold mb-1" {...props} />,
              h6: ({ node, ...props }) => <h6 className="text-sm font-medium mb-1" {...props} />,
              p: ({ node, ...props }) => <p className="text-sm leading-relaxed break-words mb-2" {...props} />,
              ul: ({ node, ...props }) => <ul className="list-disc pl-6 text-sm leading-relaxed mb-2" {...props} />,
              ol: ({ node, ...props }) => <ol className="list-decimal pl-6 text-sm leading-relaxed mb-2" {...props} />,
              li: ({ node, ...props }) => <li className="ml-4 text-sm leading-relaxed mb-1">{props.children}</li>,
              code: ({ node, ...props }) => <code className="bg-gray-600 text-white px-2 py-1 rounded text-xs" {...props} />,
              strong: ({ node, ...props }) => <strong className="font-semibold text-sm" {...props} />,
              em: ({ node, ...props }) => <em className="italic text-sm" {...props} />,
            }}
          >
            {message.content}
          </ReactMarkdown>
          <div className="text-xs opacity-70 mt-2">
            {format(message.timestamp, 'HH:mm')}
          </div>
        </Card>
        {message.aiResponse?.components?.map((component) => (
          <AIComponentRenderer
            key={component.id}
            component={component}
            onComponentAction={onComponentAction}
            collapsedToolResults={collapsedToolResults}
            setCollapsedToolResults={setCollapsedToolResults}
          />
        ))}
        {/* Progress Animation for complex operations */}
        {rawMessage && shouldShowProgress(rawMessage, isLoading, isLastMessage) && (() => {
          const toolCall = rawMessage.tool_calls?.[0];
          const progressConfig = toolCall ? getProgressConfig(toolCall.name) : null;
          
          return progressConfig ? (
            <ProgressAnimationTypewriter
              steps={progressConfig.steps}
              duration={progressConfig.duration}
              title={progressConfig.name}
            />
          ) : null;
        })()}
        {message.suggestions && (
          <div className="flex flex-wrap gap-2 mt-3">
            {message.suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => onSuggestionClick(suggestion)}
                className="text-xs h-7 px-3 bg-gray-50 hover:bg-gray-100 border-gray-200"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                {suggestion}
              </Button>
            ))}
          </div>
        )}
      </div>
      {message.role === 'user' && (
        <Avatar className="w-8 h-8 bg-gray-100 flex-shrink-0">
          <AvatarFallback>
            <User className="w-4 h-4 text-gray-600" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
} 