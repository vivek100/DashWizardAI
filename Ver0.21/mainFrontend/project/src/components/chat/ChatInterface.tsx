import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Brain } from 'lucide-react';
import { Dashboard, EnhancedChatMessage } from '@/types';
import { useChatInterface } from '@/hooks/useChatInterface';
import ChatMessage from './ChatMessage';
import InputArea from './InputArea';
import WelcomeMessage from './WelcomeMessage';
import { CSVUploadDialog } from '@/components/data/CSVUploadDialog';

interface ChatInterfaceProps {
  onDashboardAction?: (action: 'create' | 'edit', dashboard: Dashboard) => void;
  currentDashboard?: Dashboard | null;
  threadId?: string | null;
}

export function ChatInterface({ onDashboardAction, currentDashboard, threadId }: ChatInterfaceProps) {
  const {
    // State
    input,
    setInput,
    isTyping,
    uploadDialogOpen,
    setUploadDialogOpen,
    isInitializing,
    threadLoading,
    lastUserInput,
    lastUserMessageId,
    collapsedToolResults,
    setCollapsedToolResults,
    
    // Data
    displayMessages,
    rawMessages,
    suggestedPrompts,
    scrollRef,
    error,
    isLoading,
    
    // Actions
    handleSend,
    handleComponentAction,
    handleUploadSuccess,
    handleSuggestionClick,
  } = useChatInterface({ onDashboardAction, currentDashboard, threadId });

  // Show loading state while database initializes
  if (isInitializing) {
    return (
      <div className="flex h-full">
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="space-y-2">
                <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8 bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 flex-shrink-0 shadow-sm">
                    <AvatarFallback className="bg-transparent">
                      <Brain className="w-4 h-4 text-white drop-shadow-sm" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="max-w-[80%] min-w-0">
                    <Card className="p-3 bg-white border-gray-200">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-gray-600">Initializing database and sample data...</span>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          <InputArea
            input=""
            setInput={() => {}}
            handleSend={() => {}}
            isLoading={true}
            error={null}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 p-4 overflow-x-hidden">
          <div className="space-y-4 max-w-4xl mx-auto">
            {displayMessages.length === 0 && !isTyping && !threadLoading ? (
              <WelcomeMessage 
                setInput={setInput} 
                setUploadDialogOpen={setUploadDialogOpen} 
                suggestedPrompts={suggestedPrompts} 
              />
            ) : threadLoading ? (
              <div className="flex items-start space-x-3">
                <Avatar className="w-8 h-8 bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 flex-shrink-0 shadow-sm">
                  <AvatarFallback className="bg-transparent">
                    <Brain className="w-4 h-4 text-white drop-shadow-sm" />
                  </AvatarFallback>
                </Avatar>
                <div className="max-w-[80%] min-w-0">
                  <Card className="p-3 bg-white border-gray-200">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-gray-600">Loading conversation...</span>
                    </div>
                  </Card>
                </div>
              </div>
            ) : (
              <>
                {[...displayMessages, ...(isTyping && lastUserInput && !threadLoading && displayMessages[displayMessages.length - 1]?.role !== 'user' && !displayMessages.some(msg => msg.role === 'assistant' && msg.timestamp > new Date(Date.now() - 1000)) ? [{
                  id: Date.now().toString(),
                  content: lastUserInput,
                  role: 'user',
                  timestamp: new Date(),
                } as EnhancedChatMessage] : [])].map((message, index, allMessages) => {
                  // Find the corresponding raw message
                  const rawMessage = rawMessages.find(raw => raw.id === message.id);
                  const isLastMessage = index === allMessages.length - 1;
                  
                  return (
                    <div key={message.id} className="space-y-2">
                      <ChatMessage
                        message={message}
                        onSuggestionClick={handleSuggestionClick}
                        onComponentAction={handleComponentAction}
                        collapsedToolResults={collapsedToolResults}
                        setCollapsedToolResults={setCollapsedToolResults}
                        isLoading={isLoading}
                        isLastMessage={isLastMessage}
                        rawMessage={rawMessage}
                      />
                    </div>
                  );
                })}
                {isTyping && lastUserInput && !threadLoading && !displayMessages.some((msg, index) => msg.role === 'assistant' && index > displayMessages.findIndex(m => m.id === lastUserMessageId)) && (
                  <div className="flex items-start space-x-3">
                    <Avatar className="w-8 h-8 bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 shadow-sm">
                      <AvatarFallback className="bg-transparent">
                        <Brain className="w-4 h-4 text-white drop-shadow-sm" />
                      </AvatarFallback>
                    </Avatar>
                    <Card className="p-3 bg-white border-gray-200">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </Card>
                  </div>
                )}
                <div ref={scrollRef} />
              </>
            )}
          </div>
        </ScrollArea>
        <InputArea 
          input={input} 
          setInput={setInput} 
          handleSend={handleSend} 
          isLoading={isLoading} 
          error={error} 
        />
      </div>
      <CSVUploadDialog 
        open={uploadDialogOpen} 
        onOpenChange={setUploadDialogOpen}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
} 