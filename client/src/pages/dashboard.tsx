import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import MobileHeader from "@/components/mobile-header";
import StatsCards from "@/components/stats-cards";
import EmployeesTable from "@/components/employees-table";
import RecentActivity from "@/components/recent-activity";
import EmployeeForm from "@/components/employee-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/employees/import', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Errore durante l\'importazione');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      
      toast({
        title: "Importazione completata",
        description: `${data.imported} dipendenti importati${data.errors > 0 ? `, ${data.errors} errori` : ''}`,
        variant: data.errors > 0 ? "destructive" : "default",
      });
      
      if (data.errorDetails && data.errorDetails.length > 0) {
        console.log("Errori di importazione:", data.errorDetails);
      }
    },
    onError: (error) => {
      toast({
        title: "Errore nell'importazione",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Export function
  const handleExport = async () => {
    try {
      console.log("Starting export...");
      
      // Check if jsPDF is available
      if (typeof jsPDF === 'undefined') {
        throw new Error("jsPDF non disponibile");
      }
      if (typeof autoTable === 'undefined') {
        throw new Error("jsPDF-autoTable non disponibile");
      }
      
      console.log("Calling API...");
      const response = await apiRequest('GET', '/api/employees/export');
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      console.log("Parsing response...");
      const data = await response.json();
      console.log("Export data received:", data);
      
      // Create PDF
      console.log("Creating PDF...");
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.text(data.title, 14, 22);
      
      // Date
      doc.setFontSize(12);
      doc.text(`Data: ${data.date}`, 14, 32);
      
      // Stats
      doc.setFontSize(10);
      doc.text(`Totale: ${data.stats.total} | Conformi: ${data.stats.compliant} | In Attenzione: ${data.stats.expiringSoon} | Scaduti: ${data.stats.expired}`, 14, 42);
      
      // Table
      console.log("Adding table to PDF...");
      autoTable(doc, {
        head: [data.headers],
        body: data.data,
        startY: 50,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] },
        columnStyles: {
          6: { halign: 'center' }, // Giorni Rimanenti
          7: { halign: 'center' }, // Stato
        },
      });
      
      // Save PDF
      console.log("Saving PDF...");
      doc.save(`dipendenti_${new Date().toISOString().slice(0, 10)}.pdf`);
      
      toast({
        title: "Esportazione completata",
        description: "Il file PDF è stato scaricato",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Errore nell'esportazione",
        description: error.message || "Impossibile generare il PDF",
        variant: "destructive",
      });
    }
  };

  // Handle file import
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: "File non valido",
        description: "Seleziona un file Excel (.xlsx o .xls)",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    importMutation.mutate(formData);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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

  const criticalEmployees = employees?.filter((emp: any) => {
    const totalAbsenceDays = emp.absences?.reduce((sum: number, absence: any) => sum + absence.daysCounted, 0) || 0;
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
              data-testid="button-add-employee"
            >
              <span className="mr-2">+</span>
              Aggiungi Dipendente
            </button>
            <button 
              className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium border border-gray-300 flex items-center"
              onClick={() => fileInputRef.current?.click()}
              disabled={importMutation.isPending}
              data-testid="button-import-data"
            >
              <span className="mr-2">↑</span>
              {importMutation.isPending ? 'Importando...' : 'Importa Dati'}
            </button>
            <button 
              className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium border border-gray-300 flex items-center"
              onClick={handleExport}
              data-testid="button-export-all"
            >
              <span className="mr-2">↓</span>
              Esporta Tutto
            </button>
            
            {/* Hidden file input for Excel import */}
            <Input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileImport}
              className="hidden"
              data-testid="input-file-import"
            />
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
