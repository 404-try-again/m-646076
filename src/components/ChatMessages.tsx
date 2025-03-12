
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
  const [currentChat, setCurrentChat] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch conversation data
  useEffect(() => {
    if (!user) return;

    const fetchCurrentChat = async () => {
      try {
        // For demo purposes, create or find a general chat room
        const { data: existingConversations, error: fetchError } = await supabase
          .from('conversations')
          .select('*')
          .eq('name', 'General Chat')
          .limit(1);

        if (fetchError) throw fetchError;

        let chatId;

        if (existingConversations && existingConversations.length > 0) {
          chatId = existingConversations[0].id;
          setCurrentChat(existingConversations[0]);
        } else {
          // Create general chat if it doesn't exist
          const { data: newChat, error: createError } = await supabase
            .from('conversations')
            .insert({
              name: 'General Chat',
              is_group: true,
              created_by: user.id
            })
            .select()
            .single();

          if (createError) throw createError;
          chatId = newChat.id;
          setCurrentChat(newChat);
        }

        // Ensure user is a participant
        const { error: participantError } = await supabase
          .from('conversation_participants')
          .upsert({
            conversation_id: chatId,
            profile_id: user.id,
            role: 'member'
          }, {
            onConflict: 'conversation_id,profile_id'
          });

        if (participantError) throw participantError;

        // Fetch messages
        fetchMessages(chatId);

        // Subscribe to new messages
        const channel = supabase
          .channel('public:messages')
          .on('postgres_changes', 
            { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'messages',
              filter: `conversation_id=eq.${chatId}`
            }, 
            (payload) => {
              const newMsg = payload.new as any;
              // Only add if not from current user to avoid duplication
              // (since we optimistically add sent messages)
              if (newMsg.sender_id !== user.id) {
                fetchUserInfo(newMsg.sender_id).then(userInfo => {
                  setMessages(prevMessages => [
                    ...prevMessages, 
                    {
                      ...newMsg,
                      sender_name: userInfo?.username || 'Unknown',
                      sender_avatar: userInfo?.avatar_url,
                      timestamp: new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      read: false
                    }
                  ]);
                });
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error("Error fetching conversation:", error);
        toast({
          variant: "destructive",
          description: "Failed to load chat. Please try again.",
        });
      }
    };

    fetchCurrentChat();
  }, [user]);

  const fetchUserInfo = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', userId)
      .single();
    
    return data;
  };

  const fetchMessages = async (chatId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id, 
          content, 
          sender_id,
          created_at,
          content_type,
          is_edited
        `)
        .eq('conversation_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Process messages with user info
      const enhancedMessages = await Promise.all(
        (data || []).map(async (msg) => {
          const userInfo = await fetchUserInfo(msg.sender_id);
          return {
            id: msg.id,
            content: msg.content,
            sender_id: msg.sender_id,
            sender_name: userInfo?.username || 'Unknown',
            sender_avatar: userInfo?.avatar_url,
            timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: true // Assume old messages are read
          };
        })
      );

      setMessages(enhancedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        variant: "destructive",
        description: "Failed to load messages. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !currentChat) return;

    // Create optimistic message
    const optimisticId = Date.now().toString();
    const optimisticMessage: Message = {
      id: optimisticId,
      content: newMessage,
      sender_id: user.id,
      sender_name: user.user_metadata?.username || 'Me',
      sender_avatar: user.user_metadata?.avatar_url,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    // Add to UI immediately
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage("");

    try {
      // Send to backend
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: currentChat.id,
          sender_id: user.id,
          content: newMessage,
          content_type: 'text'
        })
        .select()
        .single();

      if (error) throw error;

    } catch (error) {
      console.error("Error sending message:", error);
      // Remove optimistic message and show error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
      toast({
        variant: "destructive",
        description: "Failed to send message. Please try again.",
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
            <div className="font-medium">{currentChat?.name || 'Loading...'}</div>
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
            disabled={loading || !currentChat}
          />
          <button 
            type="submit"
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
            disabled={loading || !newMessage.trim() || !currentChat}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};
