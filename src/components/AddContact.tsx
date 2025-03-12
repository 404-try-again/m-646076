
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export const AddContact = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    try {
      setSearching(true);
      const { data: foundUser, error: searchError } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .or(`username.ilike.${searchTerm},email.eq.${searchTerm}`)
        .single();

      if (searchError || !foundUser) {
        toast({
          variant: "destructive",
          description: "User not found",
        });
        return;
      }

      // Check if request already exists
      const { data: existingRequest } = await supabase
        .from("contact_requests")
        .select("*")
        .match({ sender_id: (await supabase.auth.getUser()).data.user?.id, recipient_id: foundUser.id })
        .single();

      if (existingRequest) {
        toast({
          description: "Contact request already sent",
        });
        return;
      }

      // Send contact request
      const { error: requestError } = await supabase
        .from("contact_requests")
        .insert({
          sender_id: (await supabase.auth.getUser()).data.user?.id,
          recipient_id: foundUser.id,
        });

      if (requestError) throw requestError;

      toast({
        description: "Contact request sent successfully",
      });
      setSearchTerm("");
      setShowSearch(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        description: error.message || "Failed to send request",
      });
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="mb-4">
      {showSearch ? (
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Username or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button 
            type="button" 
            variant="ghost" 
            size="icon"
            onClick={() => setShowSearch(false)}
          >
            <X className="w-4 h-4" />
          </Button>
          <Button type="submit" size="icon" disabled={searching}>
            <Search className="w-4 h-4" />
          </Button>
        </form>
      ) : (
        <Button
          variant="outline"
          className="w-full flex items-center gap-2"
          onClick={() => setShowSearch(true)}
        >
          <UserPlus className="w-4 h-4" />
          Add Contact
        </Button>
      )}
    </div>
  );
};
