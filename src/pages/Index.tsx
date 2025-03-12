
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatMessages } from "@/components/ChatMessages";
import { Auth } from "@/components/Auth";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Index = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If we're redirected back to the index page with a specific action
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    
    if (action === 'profile' && user) {
      navigate('/profile');
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
      <ChatSidebar />
      <ChatMessages />
    </div>
  );
};

export default Index;
