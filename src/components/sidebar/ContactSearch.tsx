
import { Search } from "lucide-react";
import { useState } from "react";

interface ContactSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const ContactSearch = ({ searchTerm, setSearchTerm }: ContactSearchProps) => {
  return (
    <div className="relative">
      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
      <input
        type="text"
        placeholder="Search contacts..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full bg-white/5 rounded-lg pl-10 pr-4 py-2 outline-none focus:ring-1 ring-white/20 transition-all"
      />
    </div>
  );
};
