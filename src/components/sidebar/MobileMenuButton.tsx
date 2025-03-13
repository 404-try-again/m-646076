
import { Menu, X } from "lucide-react";

interface MobileMenuButtonProps {
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
}

export const MobileMenuButton = ({ isMobileMenuOpen, toggleMobileMenu }: MobileMenuButtonProps) => {
  return (
    <button 
      className="fixed top-4 left-4 z-50 sm:hidden p-2 glass rounded-full"
      onClick={toggleMobileMenu}
    >
      {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
    </button>
  );
};
