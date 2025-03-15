
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatMessages } from "@/components/ChatMessages";
import { GeminiChat } from "@/components/GeminiChat";
import { Auth } from "@/components/Auth";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Index = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeChat, setActiveChat] = useState<"general" | "gemini">("general");

  useEffect(() => {
    // If we're redirected back to the index page with a specific action
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    
    if (action === 'profile' && user) {
      navigate('/profile');
    }
    
    // Check if we should show Gemini chat
    if (params.get('chat') === 'gemini') {
      setActiveChat("gemini");
    }
  }, [user, location, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-purple-900 to-slate-900">
        <Auth />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <ChatSidebar onSelectChat={(chatType) => setActiveChat(chatType)} activeChat={activeChat} />
      {activeChat === "general" ? (
        <ChatMessages />
      ) : (
        <GeminiChat />
      )}
    </div>
  );
};

export default Index;
