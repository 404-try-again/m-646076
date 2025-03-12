import { Avatar } from "@/components/ui/avatar";
import { Check, Info, Send, Phone, Video, Menu } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CallModal } from "@/components/CallModal";
import { Button } from "@/components/ui/button";

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

    const channel = supabase
      .channel('chat-updates')
      .on('broadcast', { event: 'message' }, (payload) => {
        const newMessage = payload.payload as Message;
        
        if (newMessage.sender_id !== user.id) {
          setMessages(prevMessages => {
            const updatedMessages = [...prevMessages, newMessage];
            localStorage.setItem('chat_messages', JSON.stringify(updatedMessages));
            return updatedMessages;
          });
        }
      })
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

    const messageId = Date.now().toString();
    
    const newMsg: Message = {
      id: messageId,
      content: newMessage,
      sender_id: user.id,
      sender_name: user.user_metadata?.username || 'Me',
      sender_avatar: user.user_metadata?.avatar_url,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    setMessages(prev => {
      const updatedMessages = [...prev, newMsg];
      localStorage.setItem('chat_messages', JSON.stringify(updatedMessages));
      return updatedMessages;
    });
    
    setNewMessage("");

    try {
      await supabase
        .channel('chat-updates')
        .send({
          type: 'broadcast',
          event: 'message',
          payload: newMsg
        });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        variant: "destructive",
        description: "Message may not be visible to others. Network issue detected.",
      });
    }
  };

  const initiateCall = async (callType: "audio" | "video") => {
    if (!user) return;
    
    const { data: profileData } = await supabase
      .from('profiles')
      .select('username, full_name, avatar_url')
      .eq('id', user.id)
      .single();
    
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
      .channel('chat-updates')
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
                  <span>{message.timestamp}</span>
                  {message.sender_id === user.id && message.read && <Check className="w-3 h-3" />}
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
