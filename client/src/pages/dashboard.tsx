import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import MobileHeader from "@/components/mobile-header";
import StatsCards from "@/components/stats-cards";
import EmployeesTable from "@/components/employees-table";
import RecentActivity from "@/components/recent-activity";
import EmployeeForm from "@/components/employee-form";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);

  // Initialize CCNLs on first load
  useQuery({
    queryKey: ['/api/init'],
    retry: false,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/stats'],
    retry: false,
  });

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

  const criticalEmployees = employees?.filter(emp => {
    const totalAbsenceDays = emp.absences?.reduce((sum, absence) => sum + absence.daysCounted, 0) || 0;
    const remainingDays = emp.ccnl.comportoDays - totalAbsenceDays;
    return remainingDays <= 10 && remainingDays >= 0;
  }) || [];

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <div className="lg:pl-64 flex flex-col flex-1">
        <MobileHeader />
        
        <main className="flex-1 p-4 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Panoramica generale del periodo di comporto dei dipendenti
            </p>
          </div>

          {/* Notification Bar */}
          {criticalEmployees.length > 0 && (
            <Alert className="mb-6 border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Attenzione: {criticalEmployees.length} dipendenti in scadenza comporto</strong>
                <br />
                {criticalEmployees.slice(0, 3).map(emp => emp.firstName + ' ' + emp.lastName).join(', ')}
                {criticalEmployees.length > 3 && ' e altri'} raggiungeranno il limite del comporto entro 10 giorni.
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Cards */}
          <StatsCards stats={stats} isLoading={statsLoading} />

          {/* Action Buttons */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <button
              className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
              onClick={() => setIsAddEmployeeOpen(true)}
            >
              <span className="mr-2">+</span>
              Aggiungi Dipendente
            </button>
            <button className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium border border-gray-300 flex items-center">
              <span className="mr-2">↑</span>
              Importa Dati
            </button>
            <button className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium border border-gray-300 flex items-center">
              <span className="mr-2">↓</span>
              Esporta Tutto
            </button>
          </div>

          {/* Employees Table */}
          <EmployeesTable employees={employees} isLoading={employeesLoading} />

          {/* Recent Activity */}
          <RecentActivity />
        </main>
      </div>

      {/* Add Employee Modal */}
      <EmployeeForm 
        isOpen={isAddEmployeeOpen}
        onClose={() => setIsAddEmployeeOpen(false)}
        onSuccess={() => {
          setIsAddEmployeeOpen(false);
          // Refresh data
          window.location.reload();
        }}
      />
    </div>
  );
}
