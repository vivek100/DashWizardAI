import React from 'react';
import { Brain, Upload, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeMessageProps {
  setInput: (value: string) => void;
  setUploadDialogOpen: (value: boolean) => void;
  suggestedPrompts: string[];
}

export default function WelcomeMessage({ setInput, setUploadDialogOpen, suggestedPrompts }: WelcomeMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <Brain className="w-16 h-16 text-gray-400 mb-4" />
      <h2 className="text-xl font-semibold mb-2">
        Welcome to Dashboard Analysis Agent
      </h2>
      <p className="text-gray-600 mb-6 max-w-md">
        I can autonomously analyze your CSV files, perform statistical analysis, sentiment analysis, and generate comprehensive reports.
      </p>
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center space-x-2 text-blue-800">
          <Upload className="w-4 h-4" />
          <span className="text-sm font-medium">Upload a CSV file to get started</span>
        </div>
        <Button 
          onClick={() => setUploadDialogOpen(true)}
          className="gap-2 text-xs h-8 px-3 w-full mt-3"
          size="sm"
        >
          <Upload className="w-3 h-3" />
          Choose CSV File
        </Button>
        <p className="text-xs text-gray-500 break-words mt-2">
          Accepted formats: .csv
        </p>
      </div>
      <div className="space-y-2 max-w-md w-full">
        <p className="text-sm text-gray-600 mb-3">Try these prompts:</p>
        {suggestedPrompts.map((prompt, index) => (
          <Button
            key={index}
            variant="outline"
            onClick={() => setInput(prompt)}
            className="w-full justify-start text-left whitespace-pre-wrap break-words p-2"
          >
            <Sparkles className="w-3 h-3 mr-2" />
            {prompt}
          </Button>
        ))}
      </div>
    </div>
  );
} 