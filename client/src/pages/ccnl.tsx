import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertCcnlSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/sidebar";
import MobileHeader from "@/components/mobile-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Edit, Plus } from "lucide-react";

const formSchema = insertCcnlSchema;

export default function Ccnl() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isAddCcnlOpen, setIsAddCcnlOpen] = useState(false);

  const { data: ccnls, isLoading: ccnlsLoading } = useQuery({
    queryKey: ['/api/ccnls'],
    retry: false,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      comportoDays: 180,
      isActive: true,
    },
  });

  const createCcnlMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      return await apiRequest("POST", "/api/ccnls", data);
    },
    onSuccess: () => {
      toast({
        title: "Successo",
        description: "CCNL aggiunto con successo",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ccnls'] });
      form.reset();
      setIsAddCcnlOpen(false);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non Autorizzato",
          description: "Sessione scaduta. Effettuando nuovamente l'accesso...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Errore",
        description: "Errore nella creazione del CCNL",
        variant: "destructive",
      });
    },
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

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createCcnlMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    setIsAddCcnlOpen(false);
  };

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
                <h1 className="text-2xl font-bold text-gray-900">Gestione CCNL</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Configura i Contratti Collettivi Nazionali di Lavoro e i rispettivi periodi di comporto
                </p>
              </div>
              <Button onClick={() => setIsAddCcnlOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi CCNL
              </Button>
            </div>
          </div>

          {/* CCNL Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ccnlsLoading ? (
              // Loading skeletons
              [...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              ccnls?.map((ccnl) => (
                <Card key={ccnl.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{ccnl.name}</CardTitle>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{ccnl.code}</Badge>
                      {ccnl.isActive && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Attivo
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Periodo di comporto:</span>
                        <span className="text-sm font-medium">{ccnl.comportoDays} giorni</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Creato il {new Date(ccnl.createdAt!).toLocaleDateString('it-IT')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {ccnls?.length === 0 && !ccnlsLoading && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Nessun CCNL configurato</p>
              <Button onClick={() => setIsAddCcnlOpen(true)}>
                Aggiungi il primo CCNL
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* Add CCNL Modal */}
      <Dialog open={isAddCcnlOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Aggiungi Nuovo CCNL</DialogTitle>
            <DialogDescription>
              Configura un nuovo Contratto Collettivo Nazionale di Lavoro con il periodo di comporto.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome CCNL</FormLabel>
                    <FormControl>
                      <Input placeholder="es. Turismo e Pubblici Esercizi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Codice</FormLabel>
                    <FormControl>
                      <Input placeholder="es. TURISMO" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="comportoDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giorni di Comporto</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1"
                        placeholder="180"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Annulla
                </Button>
                <Button type="submit" disabled={createCcnlMutation.isPending}>
                  {createCcnlMutation.isPending ? "Salvataggio..." : "Salva"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
