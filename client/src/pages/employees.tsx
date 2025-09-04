import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/sidebar";
import MobileHeader from "@/components/mobile-header";
import EmployeesTable from "@/components/employees-table";
import EmployeeForm from "@/components/employee-form";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Employees() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const response = await apiRequest('/api/employees/export');
      const data = await response.json();
      
      // Create PDF
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
      doc.save(`dipendenti_${new Date().toISOString().slice(0, 10)}.pdf`);
      
      toast({
        title: "Esportazione completata",
        description: "Il file PDF è stato scaricato",
      });
    } catch (error) {
      toast({
        title: "Errore nell'esportazione",
        description: "Impossibile generare il PDF",
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
              <div className="flex items-center space-x-3">
                {/* Import Button */}
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importMutation.isPending}
                  data-testid="button-import-excel"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {importMutation.isPending ? 'Importando...' : 'Importa Excel'}
                </Button>
                
                {/* Export Button */}
                <Button 
                  variant="outline" 
                  onClick={handleExport}
                  data-testid="button-export-pdf"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Esporta PDF
                </Button>
                
                {/* Add Employee Button */}
                <Button 
                  onClick={() => setIsAddEmployeeOpen(true)}
                  data-testid="button-add-employee"
                >
                  Aggiungi Dipendente
                </Button>
                
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
