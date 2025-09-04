import { useState } from "react";
import { Eye, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { calculateRemainingDays, getStatusInfo } from "@/lib/comporto";
import type { EmployeeWithRelations } from "@shared/schema";

interface EmployeesTableProps {
  employees?: EmployeeWithRelations[];
  isLoading: boolean;
}

export default function EmployeesTable({ employees, isLoading }: EmployeesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [ccnlFilter, setCcnlFilter] = useState("");

  const filteredEmployees = employees?.filter(employee => {
    const matchesSearch = `${employee.firstName} ${employee.lastName} ${employee.employeeId}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCcnl = !ccnlFilter || ccnlFilter === "all" || employee.ccnl.code === ccnlFilter;
    return matchesSearch && matchesCcnl;
  }) || [];

  if (isLoading) {
    return (
      <Card className="shadow">
        <CardHeader className="border-b border-gray-200">
          <CardTitle>Dipendenti - Stato Comporto</CardTitle>
          <p className="text-sm text-gray-500">Caricamento dipendenti...</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dipendente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CCNL</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giorni Residui</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ultima Assenza</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Dipendenti - Stato Comporto</CardTitle>
            <p className="mt-1 text-sm text-gray-500">
              Elenco aggiornato con calcolo automatico del periodo di comporto residuo
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Cerca dipendente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48"
            />
            <Select value={ccnlFilter} onValueChange={setCcnlFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tutti i CCNL" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i CCNL</SelectItem>
                <SelectItem value="COOP_SOCIALI">Cooperative Sociali</SelectItem>
                <SelectItem value="METALMECCANICA_INDUSTRIA">Metalmeccanica industria</SelectItem>
                <SelectItem value="METALMECCANICA_ARTIGIANATO">Metalmeccanica artigianato</SelectItem>
                <SelectItem value="COMMERCIO">Commercio</SelectItem>
                <SelectItem value="TURISMO">Turismo</SelectItem>
                <SelectItem value="EDILIZIA_INDUSTRIA">Edilizia industria</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dipendente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CCNL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giorni Residui
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ultima Assenza
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stato
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Azioni</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {employees?.length === 0 ? "Nessun dipendente trovato" : "Nessun risultato per i filtri applicati"}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => {
                  const remainingDays = calculateRemainingDays(employee);
                  const statusInfo = getStatusInfo(remainingDays);
                  const lastAbsence = employee.absences?.[0];

                  return (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {employee.firstName[0]}{employee.lastName[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {employee.firstName} {employee.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{employee.employeeId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.ccnl.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${statusInfo.textColor}`}>
                          {remainingDays}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lastAbsence ? new Date(lastAbsence.startDate).toLocaleDateString('it-IT') : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={statusInfo.variant as any}>
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="ghost" size="sm" className="mr-2">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredEmployees.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button variant="outline">Precedente</Button>
              <Button variant="outline">Successivo</Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">1</span> a{" "}
                  <span className="font-medium">{filteredEmployees.length}</span> di{" "}
                  <span className="font-medium">{employees?.length || 0}</span> risultati
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
