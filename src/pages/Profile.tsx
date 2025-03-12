
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
    call_status: "offline"
  });

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          throw error;
        }

        if (data) {
          setProfile({
            username: data.username || "",
            full_name: data.full_name || "",
            bio: data.bio || "",
            status: data.status || "Available",
            avatar_url: data.avatar_url || `https://api.dicebear.com/7.x/micah/svg?seed=${user.id}`,
            preferred_voice_input: data.preferred_voice_input || "microphone",
            call_status: data.call_status || "offline"
          });
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
      const { error } = await supabase
        .from("profiles")
        .update({
          username: profile.username,
          full_name: profile.full_name,
          bio: profile.bio,
          status: profile.status,
          avatar_url: profile.avatar_url,
          preferred_voice_input: profile.preferred_voice_input,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

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
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
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

      <div className="glass p-6 rounded-xl">
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-4">
            <Avatar className="w-24 h-24 border-4 border-background">
              <img
                src={profile.avatar_url || `https://api.dicebear.com/7.x/micah/svg?seed=${user?.id}`}
                alt={profile.username || "User"}
                className="object-cover"
              />
            </Avatar>
          </div>
          <h1 className="text-2xl font-bold">{profile.full_name || profile.username || "Your Profile"}</h1>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>

        <div className="flex justify-center space-x-4 mb-8">
          <Button 
            variant="outline" 
            className="flex items-center gap-2" 
            onClick={() => initiateCall('audio')}
          >
            <Phone className="w-4 h-4" />
            Voice Call
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => initiateCall('video')}
          >
            <Video className="w-4 h-4" />
            Video Call
          </Button>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="username">
              Username
            </label>
            <Input
              id="username"
              value={profile.username}
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
              placeholder="Username"
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
              rows={4}
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
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={profile.preferred_voice_input}
                onChange={(e) => setProfile({ ...profile, preferred_voice_input: e.target.value })}
              >
                <option value="microphone">Microphone</option>
                <option value="headset">Headset</option>
                <option value="speaker">Speaker</option>
              </select>
              <Mic className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={updating}
          >
            {updating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" /> Save Profile
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
