
import { LogOut, Settings } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Profile } from "@/types/profile";

interface UserProfileHeaderProps {
  userProfile: Profile | null;
  handleLogout: () => Promise<void>;
  navigateToProfile: () => void;
}

export const UserProfileHeader = ({ userProfile, handleLogout, navigateToProfile }: UserProfileHeaderProps) => {
  const { user } = useAuth();
  
  return (
    <div className="flex items-center justify-between">
      <div 
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={navigateToProfile}
      >
        <Avatar className="w-8 h-8">
          <img 
            src={userProfile?.avatar_url || `https://api.dicebear.com/7.x/micah/svg?seed=${user?.id}`} 
            alt={userProfile?.username || "Me"} 
            className="object-cover"
          />
        </Avatar>
        <div className="flex flex-col">
          <span className="font-medium">{userProfile?.full_name || userProfile?.username || "Me"}</span>
          <span className="text-xs text-muted-foreground">{userProfile?.status || "Available"}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={navigateToProfile}
        >
          <Settings className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
