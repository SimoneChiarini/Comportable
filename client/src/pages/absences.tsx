import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/sidebar";
import MobileHeader from "@/components/mobile-header";

export default function Absences() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Non Autorizzato",
        description: "Devi effettuare l'accesso. Reindirizzamento...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <div className="lg:pl-64 flex flex-col flex-1">
        <MobileHeader />
        
        <main className="flex-1 p-4 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Gestione Assenze</h1>
            <p className="mt-1 text-sm text-gray-600">
              Registra e gestisci le assenze cronologicamente per il calcolo del comporto
            </p>
          </div>

          {/* Placeholder content */}
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Funzionalità in Sviluppo</h3>
            <p className="text-gray-600">
              La gestione delle assenze sarà disponibile nella prossima versione dell'applicazione.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
