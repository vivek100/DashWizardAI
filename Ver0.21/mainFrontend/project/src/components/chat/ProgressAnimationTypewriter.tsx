import React, { useState, useEffect } from 'react';

interface ProgressAnimationProps {
  steps: string[];
  duration?: number;
  onComplete?: () => void;
  title?: string;
}

export default function ProgressAnimationTypewriter({
  steps,
  duration = 2500,
  onComplete,
  title = 'Processing'
}: ProgressAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [matrixChars, setMatrixChars] = useState<string[]>([]);
  const [scanLine, setScanLine] = useState(0);
  const [glitchEffect, setGlitchEffect] = useState(false);

  // Matrix-style falling characters
  useEffect(() => {
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const matrixInterval = setInterval(() => {
      setMatrixChars(prev => {
        const newChars = [...prev];
        if (newChars.length < 25) {
          newChars.push(chars[Math.floor(Math.random() * chars.length)]);
        } else {
          newChars.shift();
          newChars.push(chars[Math.floor(Math.random() * chars.length)]);
        }
        return newChars;
      });
    }, 120);
    return () => clearInterval(matrixInterval);
  }, []);

  // Scanning line effect
  useEffect(() => {
    const scanInterval = setInterval(() => {
      setScanLine(prev => (prev + 1) % 100);
    }, 100);
    return () => clearInterval(scanInterval);
  }, []);

  // Random glitch effect
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      setGlitchEffect(true);
      setTimeout(() => setGlitchEffect(false), 150);
    }, 3000);
    return () => clearInterval(glitchInterval);
  }, []);

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
        setTimeout(() => {
          setCurrentStep(0);
          setCompletedSteps(new Set());
          setTypedText('');
          timeoutId = setTimeout(advanceStep, stepDuration);
        }, stepDuration);
      }
    };

    timeoutId = setTimeout(advanceStep, stepDuration);
    return () => clearTimeout(timeoutId);
  }, [currentStep, steps.length, duration]);

  // Typewriter effect for current step
  useEffect(() => {
    if (currentStep >= steps.length) return;
    
    const currentStepText = steps[currentStep];
    let charIndex = 0;
    setTypedText('');
    setIsTyping(true);

    // Add a small delay before starting to type
    const startDelay = setTimeout(() => {
      const typeInterval = setInterval(() => {
        if (charIndex < currentStepText.length) {
          setTypedText(currentStepText.slice(0, charIndex + 1));
          charIndex++;
        } else {
          setIsTyping(false);
          clearInterval(typeInterval);
        }
      }, 120); // Slower typing speed (was 50ms, now 120ms)
      return () => clearInterval(typeInterval);
    }, 300); // 300ms delay before starting to type

    return () => clearTimeout(startDelay);
  }, [currentStep, steps]);

  useEffect(() => {
    return () => onComplete?.();
  }, [onComplete]);

  if (steps.length === 0) return null;

  return (
    <div className={`border rounded-lg p-4 bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200 mt-3 max-w-md font-mono relative overflow-hidden ${glitchEffect ? 'animate-pulse' : ''}`}>
      {/* Matrix background */}
      <div className="absolute top-0 right-0 w-20 h-full opacity-10 overflow-hidden">
        <div className="flex flex-col text-xs text-green-500">
          {matrixChars.map((char, i) => (
            <span 
              key={i} 
              className="animate-pulse transition-opacity duration-300" 
              style={{ 
                animationDelay: `${i * 0.1}s`,
                opacity: Math.random() > 0.3 ? 1 : 0.3
              }}
            >
              {char}
            </span>
          ))}
        </div>
      </div>

      {/* Scanning line effect */}
      <div 
        className="absolute top-0 w-0.5 h-full bg-gradient-to-b from-transparent via-green-400 to-transparent opacity-40"
        style={{ left: `${scanLine}%` }}
      />

      {/* Floating code particles */}
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute text-xs text-indigo-300 opacity-20 animate-ping font-mono"
            style={{
              left: `${10 + i * 12}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: '2s'
            }}
          >
            {['{}', '[]', '()', '<>', '//', '&&', '||', '=='][i]}
          </div>
        ))}
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <h4 className="font-medium text-indigo-800 font-sans">{title}</h4>
          <div className="ml-auto flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1 h-3 bg-indigo-400 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-3 mb-4 text-sm relative overflow-hidden">
          {/* Scanning line effect inside terminal */}
          <div 
            className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/10 to-transparent h-1 animate-pulse" 
            style={{ 
              animationDuration: '2s',
              top: `${scanLine * 0.8}%`
            }} 
          />
          
          {/* Terminal header */}
          <div className="text-green-400 mb-2 flex items-center gap-2">
            $ {title.toLowerCase().replace(/\s+/g, '-')}
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1 h-1 bg-green-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.3}s` }}
                />
              ))}
            </div>
            <div className="ml-auto text-xs text-gray-500 animate-pulse">
              [{Math.round((completedSteps.size / steps.length) * 100)}%]
            </div>
          </div>
          
          {/* Completed steps */}
          {completedSteps.size > 0 && (
            <div className="space-y-1 mb-2">
              {Array.from(completedSteps).map((stepIndex) => (
                <div key={stepIndex} className="text-gray-300 flex items-center gap-2">
                  <span className="text-green-400 animate-pulse">✓</span> 
                  {steps[stepIndex]}
                  <div className="ml-auto text-green-500 text-xs animate-pulse">[OK]</div>
                </div>
              ))}
            </div>
          )}
          
          {/* Current step with typewriter effect */}
          {currentStep < steps.length && (
            <div className="text-yellow-400 flex items-center gap-2">
              <span className="text-blue-400 animate-pulse">▶</span> 
              <span className={glitchEffect ? 'animate-pulse' : ''}>{typedText}</span>
              {isTyping && <span className="animate-pulse">|</span>}
              <div className="ml-auto flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1 h-1 bg-yellow-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* System info line */}
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
            <span className="animate-pulse">SYS:</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-1 h-1 bg-gray-500 rounded-full animate-ping"
                  style={{ 
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '1.5s'
                  }}
                />
              ))}
            </div>
            <span className="animate-pulse">PROCESSING...</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center text-xs">
          <span className="text-indigo-600 flex items-center gap-1">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            Progress: {completedSteps.size}/{steps.length} steps
          </span>
          <span className="text-indigo-500 animate-pulse">
            {Math.round((completedSteps.size / steps.length) * 100)}% complete
          </span>
        </div>
      </div>
    </div>
  );
}