import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, Clock } from 'lucide-react';

interface ProgressStepProps {
  step: string;
  isActive: boolean;
  isCompleted: boolean;
  index: number;
}

function ProgressStep({ step, isActive, isCompleted, index }: ProgressStepProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-shrink-0">
        {isCompleted ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : isActive ? (
          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
        ) : (
          <Clock className="w-4 h-4 text-gray-400" />
        )}
      </div>
      <div className={`text-sm transition-colors duration-300 ${
        isCompleted 
          ? 'text-green-700 font-medium' 
          : isActive 
            ? 'text-blue-700 font-medium' 
            : 'text-gray-500'
      }`}>
        {step}
      </div>
    </div>
  );
}

interface ProgressAnimationProps {
  steps: string[];
  duration?: number;
  onComplete?: () => void;
  title?: string;
}

export default function ProgressAnimation({ 
  steps, 
  duration = 2500, 
  onComplete,
  title = 'Processing'
}: ProgressAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (steps.length === 0) return;

    const stepDuration = duration / steps.length;
    let timeoutId: NodeJS.Timeout;

    const advanceStep = () => {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
        timeoutId = setTimeout(advanceStep, stepDuration);
      } else {
        // All steps completed, start over after a brief pause
        setTimeout(() => {
          setCurrentStep(0);
          setCompletedSteps(new Set());
          timeoutId = setTimeout(advanceStep, stepDuration);
        }, stepDuration);
      }
    };

    // Start the animation
    timeoutId = setTimeout(advanceStep, stepDuration);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [currentStep, steps.length, duration]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (onComplete) {
        onComplete();
      }
    };
  }, [onComplete]);

  if (steps.length === 0) {
    return null;
  }

  return (
    <div className="border rounded-lg p-4 bg-blue-50 border-blue-200 mt-3 max-w-md">
      <div className="flex items-center gap-2 mb-3">
        <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
        <h4 className="font-medium text-blue-800">{title}</h4>
      </div>
      <div className="space-y-1">
        {steps.map((step, index) => (
          <ProgressStep
            key={index}
            step={step}
            isActive={index === currentStep}
            isCompleted={completedSteps.has(index)}
            index={index}
          />
        ))}
      </div>
      <div className="mt-3 text-xs text-blue-600">
        This may take a few moments...
      </div>
    </div>
  );
}