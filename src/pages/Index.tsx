
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatMessages } from "@/components/ChatMessages";
import { Auth } from "@/components/Auth";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, isLoading } = useAuth();

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
