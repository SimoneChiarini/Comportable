import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertEmployeeSchema, type EmployeeWithRelations } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = insertEmployeeSchema.omit({ userId: true });

interface EmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee?: EmployeeWithRelations; // Optional: if provided, we're editing
}

export default function EmployeeForm({ isOpen, onClose, onSuccess, employee }: EmployeeFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ccnls } = useQuery({
    queryKey: ['/api/ccnls'],
    retry: false,
  });

  const isEditing = !!employee;
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditing ? {
      employeeId: employee.employeeId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email || "",
      hireDate: employee.hireDate instanceof Date ? employee.hireDate.toISOString().split('T')[0] : new Date(employee.hireDate).toISOString().split('T')[0],
      ccnlId: employee.ccnlId,
      isActive: employee.isActive,
    } : {
      employeeId: "",
      firstName: "",
      lastName: "",
      email: "",
      hireDate: "",
      ccnlId: 0,
      isActive: true,
    },
  });

  // Reset form when employee changes or modal opens/closes
  useEffect(() => {
    if (isOpen && employee) {
      // Edit mode: populate with employee data
      form.reset({
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email || "",
        hireDate: employee.hireDate instanceof Date ? employee.hireDate.toISOString().split('T')[0] : new Date(employee.hireDate).toISOString().split('T')[0],
        ccnlId: employee.ccnlId,
        isActive: employee.isActive,
      });
    } else if (isOpen && !employee) {
      // Create mode: reset to defaults
      form.reset({
        employeeId: "",
        firstName: "",
        lastName: "",
        email: "",
        hireDate: "",
        ccnlId: 0,
        isActive: true,
      });
    }
  }, [employee, isOpen, form]);

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      return await apiRequest("POST", "/api/employees", data);
    },
    onSuccess: () => {
      toast({
        title: "Successo",
        description: "Dipendente aggiunto con successo",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      form.reset();
      onSuccess();
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
        description: "Errore nella creazione del dipendente",
        variant: "destructive",
      });
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      return await apiRequest("PUT", `/api/employees/${employee!.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Successo",
        description: "Dipendente aggiornato con successo",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      form.reset();
      onSuccess();
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
        description: "Errore nell'aggiornamento del dipendente",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (isEditing) {
      updateEmployeeMutation.mutate(data);
    } else {
      createEmployeeMutation.mutate(data);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Modifica Dipendente' : 'Aggiungi Nuovo Dipendente'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifica i dati del dipendente e seleziona il CCNL applicabile.'
              : 'Inserisci i dati del nuovo dipendente e seleziona il CCNL applicabile.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="es. Mario" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cognome</FormLabel>
                  <FormControl>
                    <Input placeholder="es. Rossi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Matricola</FormLabel>
                  <FormControl>
                    <Input placeholder="es. MAT001" {...field} disabled={isEditing} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="es. mario.rossi@azienda.it" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hireDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Assunzione</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ccnlId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CCNL Applicabile</FormLabel>
                  <Select 
                    value={String(field.value ?? '')} 
                    onValueChange={(value) => field.onChange(parseInt(value))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona CCNL" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ccnls?.map((ccnl) => (
                        <SelectItem key={ccnl.id} value={ccnl.id.toString()}>
                          {ccnl.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Annulla
              </Button>
              <Button type="submit" disabled={isEditing ? updateEmployeeMutation.isPending : createEmployeeMutation.isPending}>
                {(isEditing ? updateEmployeeMutation.isPending : createEmployeeMutation.isPending) ? "Salvataggio..." : (isEditing ? "Aggiorna" : "Salva")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
