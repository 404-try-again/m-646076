
import { Avatar } from "@/components/ui/avatar";
import { User } from "@/types/user";

interface ContactListProps {
  filteredContacts: User[];
  isLoading: boolean;
  searchTerm: string;
  onContactClick?: () => void;
}

export const ContactList = ({ 
  filteredContacts, 
  isLoading, 
  searchTerm,
  onContactClick 
}: ContactListProps) => {
  if (isLoading) {
    return <div className="text-center py-4 text-muted-foreground">Loading contacts...</div>;
  }

  if (filteredContacts.length === 0) {
    return searchTerm ? (
      <div className="text-center py-4 text-muted-foreground">No contacts found</div>
    ) : (
      <div className="text-center py-4 text-muted-foreground">No contacts yet. Add some!</div>
    );
  }

  return (
    <div className="space-y-2">
      {filteredContacts.map((contact) => (
        <div
          key={contact.id}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
          onClick={onContactClick}
        >
          <Avatar className="w-10 h-10">
            <img src={contact.avatar} alt={contact.name} className="object-cover" />
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-medium">{contact.name}</div>
            <div className="text-sm text-muted truncate">{contact.status}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
