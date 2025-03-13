
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface ContactRequest {
  id: string;
  sender: {
    id: string;
    username: string;
    avatar_url: string;
  };
  created_at: string;
}

export const ContactRequests = () => {
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user?.user?.id) return;

        const { data: requestsData, error } = await supabase
          .from("contact_requests")
          .select(`
            id,
            created_at,
            sender_id,
            profiles!contact_requests_sender_id_fkey(
              id, 
              username, 
              avatar_url
            )
          `)
          .eq("recipient_id", user.user.id)
          .eq("status", "pending");

        if (error) throw error;

        // Transform the data to match our interface
        const formattedRequests: ContactRequest[] = (requestsData || [])
          .filter(req => req.profiles) // Filter out any null sender profiles
          .map(req => ({
            id: req.id,
            created_at: req.created_at,
            sender: {
              id: req.sender_id,
              username: req.profiles.username || 'Unknown User',
              avatar_url: req.profiles.avatar_url || '',
            }
          }));

        setRequests(formattedRequests);
      } catch (error) {
        console.error("Error fetching requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('contact_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_requests'
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRequest = async (requestId: string, accept: boolean) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) {
        toast({
          variant: "destructive",
          description: "You must be logged in to handle requests",
        });
        return;
      }

      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      // Update request status
      const { error: updateError } = await supabase
        .from("contact_requests")
        .update({ status: accept ? "accepted" : "rejected" })
        .eq("id", requestId);

      if (updateError) throw updateError;

      if (accept) {
        // Add to contacts (create bidirectional relationship)
        // First, add the sender as your contact
        const { error: contactError1 } = await supabase
          .from("contacts")
          .insert({
            user_id: user.user.id,
            contact_id: request.sender.id
          });

        if (contactError1) throw contactError1;

        // Then add you as the sender's contact
        const { error: contactError2 } = await supabase
          .from("contacts")
          .insert({
            user_id: request.sender.id,
            contact_id: user.user.id
          });

        if (contactError2) throw contactError2;
      }

      setRequests(requests.filter(r => r.id !== requestId));
      toast({
        description: `Contact request ${accept ? "accepted" : "declined"}`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        description: error.message || "Failed to process request",
      });
    }
  };

  if (loading || requests.length === 0) return null;

  return (
    <div className="mb-4 space-y-2">
      <h3 className="text-sm font-medium mb-2">Contact Requests</h3>
      {requests.map((request) => (
        <div key={request.id} className="flex items-center justify-between bg-white/5 p-2 rounded-lg">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <img
                src={request.sender.avatar_url || `https://api.dicebear.com/7.x/micah/svg?seed=${request.sender.id}`}
                alt={request.sender.username}
              />
            </Avatar>
            <span className="text-sm">{request.sender.username}</span>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleRequest(request.id, true)}
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleRequest(request.id, false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
