
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AddContact } from "./AddContact";
import { ContactRequests } from "./ContactRequests";
import { UserProfileHeader } from "./sidebar/UserProfileHeader";
import { ContactSearch } from "./sidebar/ContactSearch";
import { ContactList } from "./sidebar/ContactList";
import { MobileMenuButton } from "./sidebar/MobileMenuButton";
import { User } from "@/types/user";
import { Profile } from "@/types/profile";

export const ChatSidebar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [contacts, setContacts] = useState<User[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch the user's profile
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url, status")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching profile:", error);
        } else if (data) {
          setUserProfile(data);
        }
      } catch (err) {
        console.error("Unexpected error fetching profile:", err);
      }
    };

    // Fetch contacts - fixes the profile relationship
    const fetchContacts = async () => {
      setIsLoading(true);
      try {
        // Use a simplified query that doesn't rely on foreign key relationships
        const { data, error } = await supabase
          .from("contacts")
          .select("contact_id")
          .eq("user_id", user.id);

        if (error) {
          console.error("Error fetching contacts:", error);
          setIsLoading(false);
          return;
        }

        if (!data || data.length === 0) {
          setContacts([]);
          setIsLoading(false);
          return;
        }

        // Get the list of contact IDs
        const contactIds = data.map(contact => contact.contact_id);
        
        // Fetch the profile details for each contact ID
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url, status")
          .in("id", contactIds);
          
        if (profilesError) {
          console.error("Error fetching contact profiles:", profilesError);
          setIsLoading(false);
          return;
        }

        // Transform the profiles data to match the User interface
        const mappedContacts: User[] = profilesData
          ? profilesData.map(profile => ({
              id: profile.id,
              name: profile.full_name || profile.username || "Anonymous User",
              avatar: profile.avatar_url || `https://api.dicebear.com/7.x/micah/svg?seed=${profile.id}`,
              status: profile.status || "Available"
            }))
          : [];
        
        setContacts(mappedContacts);
      } catch (err) {
        console.error("Error in fetchContacts:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
    fetchContacts();

    // Set up realtime subscription for contacts changes
    const channel = supabase
      .channel('contacts_presence')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts'
        },
        () => {
          fetchContacts();
        }
      )
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
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mobile sidebar classes
  const sidebarClasses = `
    ${isMobileMenuOpen ? 'mobile-sidebar visible' : 'mobile-sidebar hidden'} 
    sm:block sm:relative sm:translate-x-0 sm:w-80 h-screen glass p-4 flex flex-col gap-4
  `;

  return (
    <>
      <MobileMenuButton 
        isMobileMenuOpen={isMobileMenuOpen} 
        toggleMobileMenu={toggleMobileMenu} 
      />
      
      <div className={sidebarClasses}>
        <UserProfileHeader 
          userProfile={userProfile} 
          handleLogout={handleLogout}
          navigateToProfile={navigateToProfile}
        />
        
        <AddContact />
        <ContactRequests />
        
        <ContactSearch 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
        />

        <div className="flex-1 space-y-2 overflow-y-auto scrollbar-hide">
          <ContactList 
            filteredContacts={filteredContacts} 
            isLoading={isLoading} 
            searchTerm={searchTerm}
            onContactClick={() => setIsMobileMenuOpen(false)}
          />
        </div>
      </div>
    </>
  );
};
