import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, UserPlus, Download } from "lucide-react";

export default function RecentActivity() {
  const activities = [
    {
      id: 1,
      type: "absence",
      icon: Calendar,
      iconColor: "text-primary",
      title: "Nuova assenza registrata per dipendente",
      description: "Assenza per malattia registrata",
      time: "2 ore fa",
    },
    {
      id: 2,
      type: "employee",
      icon: UserPlus,
      iconColor: "text-success",
      title: "Nuovo dipendente aggiunto",
      description: "CCNL Commercio assegnato",
      time: "1 giorno fa",
    },
    {
      id: 3,
      type: "export",
      icon: Download,
      iconColor: "text-gray-500",
      title: "Esportazione dati completata",
      description: "Report mensile generato",
      time: "2 giorni fa",
    },
  ];

  return (
    <Card className="mt-8 shadow">
      <CardHeader>
        <CardTitle>Attività Recenti</CardTitle>
        <p className="text-sm text-gray-500">Ultime modifiche e calcoli effettuati</p>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-gray-200">
          {activities.map((activity) => (
            <li key={activity.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <activity.icon className={`h-5 w-5 ${activity.iconColor}`} />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500">{activity.description}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">{activity.time}</div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
