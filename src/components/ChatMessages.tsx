import { Avatar } from "@/components/ui/avatar";
import { Check, Info, Send } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name?: string;
  sender_avatar?: string;
  timestamp: string;
  read: boolean;
}

export const ChatMessages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Setup basic storage for messages in localStorage until we create the messages table
  useEffect(() => {
    if (!user) return;

    // Load messages from localStorage
    const loadMessages = () => {
      try {
        const savedMessages = localStorage.getItem('chat_messages');
        if (savedMessages) {
          setMessages(JSON.parse(savedMessages));
        }
      } catch (error) {
        console.error("Error loading messages:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    // We'll use Supabase's realtime functionality to simulate a chat
    // Even though we're storing in localStorage for now
    const channel = supabase
      .channel('chat-updates')
      .on('broadcast', { event: 'message' }, (payload) => {
        const newMessage = payload.payload as Message;
        
        // Don't add our own messages as they're added optimistically
        if (newMessage.sender_id !== user.id) {
          setMessages(prevMessages => {
            const updatedMessages = [...prevMessages, newMessage];
            localStorage.setItem('chat_messages', JSON.stringify(updatedMessages));
            return updatedMessages;
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchUserInfo = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', userId)
        .single();
      
      return data;
    } catch (error) {
      console.error("Error fetching user info:", error);
      return null;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    // Generate a unique ID for the message
    const messageId = Date.now().toString();
    
    // Create the message object
    const newMsg: Message = {
      id: messageId,
      content: newMessage,
      sender_id: user.id,
      sender_name: user.user_metadata?.username || 'Me',
      sender_avatar: user.user_metadata?.avatar_url,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    // Add message to state immediately (optimistic update)
    setMessages(prev => {
      const updatedMessages = [...prev, newMsg];
      localStorage.setItem('chat_messages', JSON.stringify(updatedMessages));
      return updatedMessages;
    });
    
    setNewMessage("");

    try {
      // Broadcast the message to all users on the channel
      await supabase
        .channel('chat-updates')
        .send({
          type: 'broadcast',
          event: 'message',
          payload: newMsg
        });
    } catch (error) {
      console.error("Error sending message:", error);
      // If broadcasting fails, keep the message in the local chat
      // but notify the user that others might not see it
      toast({
        variant: "destructive",
        description: "Message may not be visible to others. Network issue detected.",
      });
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full">
        <p className="text-muted">Please sign in to view messages</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen">
      <div className="glass p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <img 
              src="https://api.dicebear.com/7.x/micah/svg?seed=general" 
              alt="Chat" 
              className="object-cover" 
            />
          </Avatar>
          <div>
            <div className="font-medium">General Chat</div>
            <div className="text-sm text-muted">
              {loading ? 'Loading...' : `${messages.length} messages`}
            </div>
          </div>
        </div>
        <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <Info className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {loading ? (
          <div className="flex justify-center p-4">
            <div className="animate-pulse">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center p-4 text-muted">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex items-end gap-2 ${message.sender_id === user.id ? "flex-row-reverse" : ""}`}
            >
              <Avatar className="w-8 h-8">
                <img 
                  src={message.sender_avatar || `https://api.dicebear.com/7.x/micah/svg?seed=${message.sender_id}`} 
                  alt={message.sender_name || "User"} 
                  className="object-cover"
                />
              </Avatar>
              <div className="flex flex-col gap-1">
                <div className={`message-bubble ${message.sender_id === user.id ? "sent" : "received"}`}>
                  {message.content}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted">
                  {message.sender_id !== user.id && (
                    <span className="text-xs">{message.sender_name}</span>
                  )}
                  <span>{message.timestamp}</span>
                  {message.sender_id === user.id && message.read && <Check className="w-3 h-3" />}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4">
        <div className="glass rounded-full p-2 flex items-center gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 bg-transparent outline-none px-2"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={loading}
          />
          <button 
            type="submit"
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
            disabled={loading || !newMessage.trim()}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};
