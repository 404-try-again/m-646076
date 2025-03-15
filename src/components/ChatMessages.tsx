
import { Avatar } from "@/components/ui/avatar";
import { Check, Info, Phone, Video, Menu } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CallModal } from "@/components/CallModal";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "@/types/user";

export const ChatMessages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [activeCall, setActiveCall] = useState<{
    type: "audio" | "video";
    name: string;
    avatar: string;
    isIncoming: boolean;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);

        // Fetch messages from Supabase - fix the join issue by doing a separate query
        const { data, error } = await supabase
          .from('chat_messages')
          .select(`
            id, 
            content, 
            sender_id, 
            recipient_id,
            chat_room_id, 
            is_read,
            created_at
          `)
          .eq('chat_room_id', 'general')
          .order('created_at', { ascending: true });

        if (error) {
          throw error;
        }

        if (data) {
          // Get all unique sender IDs
          const senderIds = [...new Set(data.map(msg => msg.sender_id))];
          
          // Fetch profile information for all senders
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .in('id', senderIds);

          if (profilesError) {
            throw profilesError;
          }

          // Create a map of profiles for easy lookup
          const profilesMap = profilesData?.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {} as Record<string, any>) || {};

          // Map the messages with sender information
          const formattedMessages: ChatMessage[] = data.map(msg => {
            const senderProfile = profilesMap[msg.sender_id] || {};
            
            return {
              id: msg.id,
              content: msg.content,
              sender_id: msg.sender_id,
              recipient_id: msg.recipient_id,
              chat_room_id: msg.chat_room_id,
              is_read: msg.is_read,
              created_at: msg.created_at,
              sender_name: senderProfile.full_name || senderProfile.username || 'Unknown User',
              sender_avatar: senderProfile.avatar_url || `https://api.dicebear.com/7.x/micah/svg?seed=${msg.sender_id}`
            };
          });

          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast({
          variant: "destructive",
          description: "Failed to load messages",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to real-time updates for new messages
    const messagesChannel = supabase
      .channel('public:chat_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `chat_room_id=eq.general`
      }, async (payload) => {
        // Get sender info with a separate query
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('username, full_name, avatar_url')
          .eq('id', payload.new.sender_id)
          .maybeSingle();

        const newMessage: ChatMessage = {
          id: payload.new.id,
          content: payload.new.content,
          sender_id: payload.new.sender_id,
          recipient_id: payload.new.recipient_id,
          chat_room_id: payload.new.chat_room_id,
          is_read: payload.new.is_read,
          created_at: payload.new.created_at,
          sender_name: senderProfile?.full_name || senderProfile?.username || 'Unknown User',
          sender_avatar: senderProfile?.avatar_url || `https://api.dicebear.com/7.x/micah/svg?seed=${payload.new.sender_id}`
        };
        
        setMessages(prevMessages => [...prevMessages, newMessage]);
      })
      .subscribe();

    // Subscribe to call events
    const callChannel = supabase
      .channel('calls')
      .on('broadcast', { event: 'call' }, (payload) => {
        const { callType, callerName, callerAvatar } = payload.payload as any;
        if (payload.payload.recipient_id === user.id) {
          setActiveCall({
            type: callType,
            name: callerName,
            avatar: callerAvatar,
            isIncoming: true
          });
          setCallModalOpen(true);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(callChannel);
    };
  }, [user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      // Insert message to Supabase
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          sender_id: user.id,
          chat_room_id: 'general',
          content: newMessage,
          is_read: false
        });

      if (error) throw error;
      
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        variant: "destructive",
        description: "Failed to send message",
      });
    }
  };

  const initiateCall = async (callType: "audio" | "video") => {
    if (!user) return;
    
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('username, full_name, avatar_url')
        .eq('id', user.id)
        .maybeSingle();
    
      if (error) throw error;
    
      const callerName = profileData?.full_name || profileData?.username || 'User';
      const callerAvatar = profileData?.avatar_url || `https://api.dicebear.com/7.x/micah/svg?seed=${user.id}`;
      
      setActiveCall({
        type: callType,
        name: "General Chat",
        avatar: "https://api.dicebear.com/7.x/micah/svg?seed=general",
        isIncoming: false
      });
      
      setCallModalOpen(true);
      
      await supabase
        .channel('calls')
        .send({
          type: 'broadcast',
          event: 'call',
          payload: {
            callType,
            callerName,
            callerAvatar,
            caller_id: user.id,
            recipient_id: 'general'
          }
        });
        
      toast({
        description: `Initiating ${callType} call to General Chat`,
      });
    } catch (error) {
      console.error("Error initiating call:", error);
      toast({
        variant: "destructive",
        description: "Could not initiate call. Please try again.",
      });
    }
  };

  const handleAcceptCall = () => {
    toast({
      description: "Call accepted",
    });
  };

  const handleDeclineCall = () => {
    setCallModalOpen(false);
    setActiveCall(null);
    toast({
      description: "Call declined",
    });
  };

  const handleEndCall = () => {
    setCallModalOpen(false);
    setActiveCall(null);
    toast({
      description: "Call ended",
    });
  };

  const toggleSidebar = () => {
    const sidebarElement = document.querySelector('.mobile-sidebar');
    if (sidebarElement) {
      sidebarElement.classList.toggle('hidden');
      sidebarElement.classList.toggle('visible');
    }
    setShowSidebar(!showSidebar);
  };

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full">
        <p className="text-muted">Please sign in to view messages</p>
      </div>
    );
  }

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col h-screen">
      <div className="glass p-3 sm:p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            className="sm:hidden p-1 rounded-full hover:bg-white/5"
            onClick={toggleSidebar}
          >
            <Menu className="w-5 h-5" />
          </button>
          <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
            <img 
              src="https://api.dicebear.com/7.x/micah/svg?seed=general" 
              alt="Chat" 
              className="object-cover" 
            />
          </Avatar>
          <div>
            <div className="font-medium text-sm sm:text-base">General Chat</div>
            <div className="text-xs sm:text-sm text-muted">
              {loading ? 'Loading...' : `${messages.length} messages`}
            </div>
          </div>
        </div>
        <div className="flex gap-1 sm:gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => initiateCall("audio")}
            className="rounded-full w-8 h-8 sm:w-10 sm:h-10"
          >
            <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => initiateCall("video")}
            className="rounded-full w-8 h-8 sm:w-10 sm:h-10"
          >
            <Video className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="rounded-full w-8 h-8 sm:w-10 sm:h-10"
          >
            <Info className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 scrollbar-hide">
        {loading ? (
          <div className="flex justify-center p-4">
            <div className="animate-pulse">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center p-4 text-muted text-sm sm:text-base">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex items-end gap-1 sm:gap-2 ${message.sender_id === user.id ? "flex-row-reverse" : ""}`}
            >
              <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
                <img 
                  src={message.sender_avatar || `https://api.dicebear.com/7.x/micah/svg?seed=${message.sender_id}`} 
                  alt={message.sender_name || "User"} 
                  className="object-cover"
                />
              </Avatar>
              <div className="flex flex-col gap-1">
                <div className={`message-bubble ${message.sender_id === user.id ? "sent" : "received"} text-sm sm:text-base`}>
                  {message.content}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted">
                  {message.sender_id !== user.id && (
                    <span className="text-xs">{message.sender_name}</span>
                  )}
                  <span>{formatMessageTime(message.created_at)}</span>
                  {message.sender_id === user.id && message.is_read && <Check className="w-3 h-3" />}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-2 sm:p-4">
        <div className="glass rounded-full p-1 sm:p-2 flex items-center gap-1 sm:gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 bg-transparent outline-none px-2 text-sm sm:text-base"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={loading}
          />
          <button 
            type="submit"
            className="p-1 sm:p-2 hover:bg-white/5 rounded-full transition-colors"
            disabled={loading || !newMessage.trim()}
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </form>

      {activeCall && (
        <CallModal
          callType={activeCall.type}
          callerName={activeCall.name}
          callerAvatar={activeCall.avatar}
          isIncoming={activeCall.isIncoming}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
          onEnd={handleEndCall}
          isOpen={callModalOpen}
        />
      )}
    </div>
  );
};
