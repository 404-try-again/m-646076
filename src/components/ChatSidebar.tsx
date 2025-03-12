
import { Search, Plus, LogOut, Settings } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  name: string;
  avatar: string;
  status: string;
}

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  status: string | null;
}

export const ChatSidebar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!user) return;

    // Fetch the user's profile
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, status")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      } else if (data) {
        setUserProfile(data);
      }
    };

    // Fetch other users
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, status")
        .neq("id", user.id)
        .order("username", { ascending: true });

      if (error) {
        console.error("Error fetching users:", error);
      } else if (data) {
        const mappedUsers: User[] = data.map(profile => ({
          id: profile.id,
          name: profile.full_name || profile.username || "Anonymous User",
          avatar: profile.avatar_url || `https://api.dicebear.com/7.x/micah/svg?seed=${profile.id}`,
          status: profile.status || "Available"
        }));
        setOnlineUsers(mappedUsers);
      }
    };

    fetchProfile();
    fetchUsers();

    // Subscribe to presence updates
    const channel = supabase.channel('online-users');
    channel
      .on('presence', { event: 'sync' }, () => {
        // Future presence state handling
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const navigateToProfile = () => {
    navigate("/profile");
  };

  const filteredUsers = onlineUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-80 h-screen glass p-4 flex flex-col gap-4">
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
      
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 rounded-lg pl-10 pr-4 py-2 outline-none focus:ring-1 ring-white/20 transition-all"
        />
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto scrollbar-hide">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
            >
              <Avatar className="w-10 h-10">
                <img src={user.avatar} alt={user.name} className="object-cover" />
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-muted truncate">{user.status}</div>
              </div>
            </div>
          ))
        ) : searchTerm ? (
          <div className="text-center py-4 text-muted-foreground">No users found</div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">Loading users...</div>
        )}
      </div>
    </div>
  );
};
