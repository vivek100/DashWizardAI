import React from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"
import { cn } from "@/lib/utils"

type LoadingAnimationType = "pulse-glow" | "gradient-sweep" | "expanding-ring" | "dashed-flow"

interface InputAreaProps {
  input: string
  setInput: (value: string) => void
  handleSend: () => void
  isLoading: boolean
  error: any
  loadingAnimationType?: LoadingAnimationType
}

export default function InputArea({
  input,
  setInput,
  handleSend,
  isLoading,
  error,
  loadingAnimationType = "pulse-glow", // Default animation
}: InputAreaProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 128) + "px"
    }
  }, [input])

  const wrapperClasses = cn(
    "relative rounded-lg transition-all duration-300",
    // Always maintain consistent padding for all states
    "p-[2px]",
    isLoading
      ? {
          "pulse-glow": "animate-pulse-glow bg-transparent",
          "gradient-sweep":
            "bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-[length:200%_200%] overflow-hidden animate-gradient-sweep animate-pulse-shadow-glow",
          "expanding-ring": "animate-expanding-ring bg-transparent",
          "dashed-flow": "overflow-hidden animate-dashed-flow",
        }[loadingAnimationType]
      : "bg-transparent", // Consistent background when not loading
  )

  const textareaClasses = cn(
    "min-h-[40px] max-h-32 text-sm resize-none w-full custom-scrollbar transition-all duration-300 rounded-md",
    // Always maintain consistent border styling
    isLoading
      ? "border-2 border-transparent focus-visible:ring-0 focus-visible:ring-offset-0 bg-white dark:bg-background"
      : "border-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-background",
    // ensure wrapping:
    "whitespace-pre-wrap break-words",
  )

  return (
    <div className="border-t border-gray-200 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex space-x-2 items-end">
          <div className="flex-1 relative">
            <div className={wrapperClasses}>
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Ask me to create dashboards, analyze data, or upload CSV files... (Shift+Enter for new line)"
                className={textareaClasses}
                disabled={isLoading}
                rows={1}
                style={{ height: "auto", minHeight: "40px", maxHeight: "128px" }}
              />
            </div>
          </div>
          {/* Add matching padding to button container to align with input wrapper */}
          <div className="p-[2px]">
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              size="sm"
              className={cn(
                "px-4 h-10 flex-shrink-0",
                isLoading && loadingAnimationType === "gradient-sweep" && "animate-pulse-shadow-glow",
              )}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {error && <div className="text-sm text-red-600">{error.message || "An error occurred"}</div>}
      </div>
    </div>
  )
}
