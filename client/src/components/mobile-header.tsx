import { useState } from "react";
import { Menu, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function MobileHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="lg:hidden">
      <div className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center">
          <button 
            className="text-gray-500 hover:text-gray-600"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="text-xl" />
          </button>
          <span className="ml-3 text-lg font-semibold text-gray-900">Comportable</span>
        </div>
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
          <User className="text-gray-600 text-sm" />
        </div>
      </div>
      
      {/* Mobile menu overlay - would need full implementation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)} />
          {/* Mobile sidebar would go here */}
        </div>
      )}
    </div>
  );
}
