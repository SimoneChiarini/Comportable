import { Calculator, Home, Users, FileText, Calendar, Download, Settings, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, current: location === '/' },
    { name: 'Dipendenti', href: '/dipendenti', icon: Users, current: location === '/dipendenti' },
    { name: 'CCNL', href: '/ccnl', icon: FileText, current: location === '/ccnl' },
    { name: 'Assenze', href: '/assenze', icon: Calendar, current: location === '/assenze' },
    { name: 'Esportazioni', href: '/esportazioni', icon: Download, current: location === '/esportazioni' },
    { name: 'Impostazioni', href: '/impostazioni', icon: Settings, current: location === '/impostazioni' },
  ];

  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
      <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Calculator className="text-white text-sm" />
            </div>
            <span className="ml-3 text-xl font-semibold text-gray-900">Comportable</span>
          </div>
        </div>
        
        <nav className="mt-8 flex-1 px-2 space-y-1">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href}>
              <div
                className={`${
                  item.current
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer`}
              >
                <item.icon className="mr-3 flex-shrink-0 h-6 w-6" />
                {item.name}
              </div>
            </Link>
          ))}
        </nav>
        
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="text-gray-600 text-sm" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email || 'Utente'}
              </p>
              <button 
                onClick={() => window.location.href = '/api/logout'}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Disconnetti
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
