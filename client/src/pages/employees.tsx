import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/sidebar";
import MobileHeader from "@/components/mobile-header";
import EmployeesTable from "@/components/employees-table";
import EmployeeForm from "@/components/employee-form";
import { Button } from "@/components/ui/button";

export default function Employees() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);

  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ['/api/employees'],
    retry: false,
  });

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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestione Dipendenti</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Gestisci i dati dei dipendenti e monitora il loro stato di comporto
                </p>
              </div>
              <Button onClick={() => setIsAddEmployeeOpen(true)}>
                Aggiungi Dipendente
              </Button>
            </div>
          </div>

          {/* Employees Table */}
          <EmployeesTable employees={employees} isLoading={employeesLoading} />
        </main>
      </div>

      {/* Add Employee Modal */}
      <EmployeeForm 
        isOpen={isAddEmployeeOpen}
        onClose={() => setIsAddEmployeeOpen(false)}
        onSuccess={() => {
          setIsAddEmployeeOpen(false);
          // Refresh data will happen automatically via react-query invalidation
        }}
      />
    </div>
  );
}
