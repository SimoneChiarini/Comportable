import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Users, FileText, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <Calculator className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Comportable</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            La soluzione professionale per la gestione del periodo di comporto secondo le disposizioni CCNL
          </p>
          <Button 
            size="lg" 
            onClick={() => window.location.href = "/api/login"}
            className="text-lg px-8 py-3"
          >
            Accedi alla Piattaforma
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Users className="h-10 w-10 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Gestione Dipendenti</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Inserisci e gestisci i dati di ciascun lavoratore con facilità
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <FileText className="h-10 w-10 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">CCNL Supportati</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Cooperative Sociali, Commercio, Metalmeccanica e CCNL personalizzati
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Calculator className="h-10 w-10 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Calcolo Automatico</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Calcolo automatico del periodo di comporto residuo per ogni dipendente
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Conformità GDPR</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Gestione sicura e conforme dei dati sensibili dei lavoratori
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
            Caratteristiche Principali
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Per Consulenti del Lavoro</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Calcolo preciso secondo normative CCNL
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Notifiche automatiche per scadenze imminenti
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Esportazione dati in PDF ed Excel
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Interfaccia responsive per mobile e desktop
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Funzionalità Avanzate</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Cronologia completa delle assenze
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Dashboard di controllo intuitiva
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Backup automatico e sicurezza dati
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  Supporto per CCNL personalizzati
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center mt-16">
          <p className="text-gray-600 mb-4">
            Sviluppato per soddisfare le esigenze dei consulenti del lavoro italiani
          </p>
          <p className="text-sm text-gray-500">
            Studio Palma Mariano e Renato - Via A. De Gasperi, 14 – 66021 Casalbordino
          </p>
        </div>
      </div>
    </div>
  );
}
