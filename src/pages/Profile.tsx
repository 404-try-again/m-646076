
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Save, ArrowLeft, Mic, Video, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState({
    username: "",
    full_name: "",
    bio: "",
    status: "",
    avatar_url: "",
    preferred_voice_input: "microphone",
    call_status: "offline",
    email: ""
  });

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        
        // Set email from auth data
        setProfile(prev => ({
          ...prev,
          email: user.email || ""
        }));
        
        // Check if the profile exists
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching profile:", error);
          throw error;
        }

        if (data) {
          // Profile exists, update state
          setProfile(prev => ({
            ...prev,
            username: data.username || "",
            full_name: data.full_name || "",
            bio: data.bio || "",
            status: data.status || "Available",
            avatar_url: data.avatar_url || `https://api.dicebear.com/7.x/micah/svg?seed=${user.id}`,
            preferred_voice_input: data.preferred_voice_input || "microphone",
            call_status: data.call_status || "offline"
          }));
        } else {
          // Profile doesn't exist, create one
          const defaultUsername = user.email?.split('@')[0] || '';
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              username: defaultUsername,
              full_name: '',
              avatar_url: `https://api.dicebear.com/7.x/micah/svg?seed=${user.id}`,
              status: 'Available',
              preferred_voice_input: 'microphone',
              call_status: 'offline'
            });

          if (insertError) {
            console.error("Error creating profile:", insertError);
            throw insertError;
          }

          // Set default profile data
          setProfile(prev => ({
            ...prev,
            username: defaultUsername,
            full_name: "",
            bio: "",
            status: "Available",
            avatar_url: `https://api.dicebear.com/7.x/micah/svg?seed=${user.id}`,
            preferred_voice_input: "microphone",
            call_status: "offline"
          }));
        }
      } catch (error) {
        toast({
          variant: "destructive",
          description: "Error loading profile",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, navigate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setUpdating(true);
      
      // Validate username
      if (!profile.username.trim()) {
        toast({
          variant: "destructive",
          description: "Username cannot be empty",
        });
        return;
      }
      
      // Prepare the data to update
      const updates = {
        id: user.id,
        username: profile.username,
        full_name: profile.full_name,
        bio: profile.bio,
        status: profile.status,
        avatar_url: profile.avatar_url || `https://api.dicebear.com/7.x/micah/svg?seed=${user.id}`,
        preferred_voice_input: profile.preferred_voice_input,
        updated_at: new Date().toISOString()
      };

      // Update the profile in Supabase
      const { error } = await supabase
        .from("profiles")
        .upsert(updates);

      if (error) throw error;

      toast({
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        description: error.message || "Error updating profile",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const initiateCall = (type: 'audio' | 'video') => {
    toast({
      description: `${type === 'audio' ? 'Voice' : 'Video'} call feature coming soon!`,
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-6 md:py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Chat
        </button>
        <Button variant="destructive" size="sm" onClick={handleLogout}>
          Log Out
        </Button>
      </div>

      <div className="glass p-4 sm:p-6 rounded-xl">
        <div className="flex flex-col items-center mb-4 sm:mb-6">
          <div className="relative mb-3 sm:mb-4">
            <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-background">
              <img
                src={profile.avatar_url || `https://api.dicebear.com/7.x/micah/svg?seed=${user?.id}`}
                alt={profile.username || "User"}
                className="object-cover"
              />
            </Avatar>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">{profile.full_name || profile.username || "Your Profile"}</h1>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
        </div>

        <div className="flex justify-center space-x-3 sm:space-x-4 mb-6 sm:mb-8">
          <Button 
            variant="outline" 
            className="flex items-center gap-1 sm:gap-2 text-sm px-2 sm:px-3 py-1 sm:py-2"
            onClick={() => initiateCall('audio')}
          >
            <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Voice Call</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-1 sm:gap-2 text-sm px-2 sm:px-3 py-1 sm:py-2"
            onClick={() => initiateCall('video')}
          >
            <Video className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Video Call</span>
          </Button>
        </div>

        <form onSubmit={handleUpdate} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="username">
              Username
            </label>
            <Input
              id="username"
              value={profile.username}
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              placeholder="Username"
              className="text-sm sm:text-base"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="fullName">
              Full Name
            </label>
            <Input
              id="fullName"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              placeholder="Full Name"
              className="text-sm sm:text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="status">
              Status
            </label>
            <Input
              id="status"
              value={profile.status}
              onChange={(e) => setProfile({ ...profile, status: e.target.value })}
              placeholder="Your current status"
              className="text-sm sm:text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="bio">
              Bio
            </label>
            <Textarea
              id="bio"
              value={profile.bio || ""}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Tell us about yourself"
              rows={3}
              className="text-sm sm:text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="avatarUrl">
              Avatar URL
            </label>
            <Input
              id="avatarUrl"
              value={profile.avatar_url}
              onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
              placeholder="https://example.com/avatar.jpg"
              className="text-sm sm:text-base"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave blank to use a generated avatar
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="voiceInput">
              Preferred Voice Input
            </label>
            <div className="flex items-center space-x-2">
              <select
                id="voiceInput"
                className="flex h-9 sm:h-10 w-full rounded-md border border-input bg-background px-2 sm:px-3 py-1 sm:py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={profile.preferred_voice_input}
                onChange={(e) => setProfile({ ...profile, preferred_voice_input: e.target.value })}
              >
                <option value="microphone">Microphone</option>
                <option value="headset">Headset</option>
                <option value="speaker">Speaker</option>
              </select>
              <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full mt-4"
            disabled={updating}
          >
            {updating ? (
              <>
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-2" /> Save Profile
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
