
import { useState, useRef, useEffect } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export const GeminiChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Welcome message - only run once when component mounts
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: "Hello! I'm your Gemini AI assistant (using the free version). How can I help you today?",
          timestamp: new Date(),
        },
      ]);
    }
  }, []); // Empty dependency array ensures it only runs once

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      const userMessage = {
        role: "user" as const,
        content: newMessage,
        timestamp: new Date(),
      };

      // Use functional update to avoid dependencies on messages state
      setMessages((prev) => [...prev, userMessage]);
      setNewMessage("");
      setIsLoading(true);

      // Convert messages to format expected by the function
      const history = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call Gemini Chat edge function
      const { data, error } = await supabase.functions.invoke("gemini-chat", {
        body: {
          prompt: newMessage,
          history: history,
        },
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(error.message || "Failed to connect to AI service");
      }

      // Handle potential missing response
      const assistantMessage = {
        role: "assistant" as const,
        content: data?.response || "I'm sorry, I couldn't process that request.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Error sending message:", error);
      // Show a toast with the specific error if available
      toast({
        variant: "destructive",
        description: `Error: ${error.message || "Failed to get a response from Gemini"}`,
      });
      
      // Add an error message to the chat if needed
      setMessages((prev) => [
        ...prev, 
        {
          role: "assistant",
          content: "I encountered an error processing your request. Please try again later.",
          timestamp: new Date(),
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessageTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full">
        <p className="text-muted">Please sign in to use the Gemini chat assistant</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen">
      <div className="glass p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
        <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
          <img 
            src="https://api.dicebear.com/7.x/bottts/svg?seed=gemini" 
            alt="Gemini" 
            className="object-cover" 
          />
        </Avatar>
        <div>
          <div className="font-medium text-sm sm:text-base">Gemini AI Assistant</div>
          <div className="text-xs sm:text-sm text-muted">
            Powered by Google's Gemini 1.0 Pro
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 scrollbar-hide">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`flex items-end gap-1 sm:gap-2 ${message.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
              <img 
                src={message.role === "user" 
                  ? `https://api.dicebear.com/7.x/micah/svg?seed=${user.id}` 
                  : "https://api.dicebear.com/7.x/bottts/svg?seed=gemini"
                } 
                alt={message.role === "user" ? "You" : "Gemini"} 
                className="object-cover"
              />
            </Avatar>
            <div className="flex flex-col gap-1">
              <div className={`message-bubble ${message.role === "user" ? "sent" : "received"} text-sm sm:text-base`}>
                {message.content}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted">
                <span>{formatMessageTime(message.timestamp)}</span>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-end gap-1 sm:gap-2">
            <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
              <img 
                src="https://api.dicebear.com/7.x/bottts/svg?seed=gemini" 
                alt="Gemini" 
                className="object-cover"
              />
            </Avatar>
            <div className="message-bubble received text-sm sm:text-base">
              <div className="flex gap-1">
                <div className="animate-bounce">●</div>
                <div className="animate-bounce delay-100">●</div>
                <div className="animate-bounce delay-200">●</div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-2 sm:p-4">
        <div className="glass rounded-full p-1 sm:p-2 flex items-center gap-1 sm:gap-2">
          <Textarea
            placeholder="Ask Gemini anything..."
            className="flex-1 bg-transparent outline-none resize-none px-2 text-sm sm:text-base max-h-32 min-h-10"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            rows={1}
          />
          <button 
            type="submit"
            className="p-1 sm:p-2 hover:bg-white/5 rounded-full transition-colors"
            disabled={isLoading || !newMessage.trim()}
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};
