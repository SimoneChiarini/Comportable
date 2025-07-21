import { Users, AlertTriangle, Calendar, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardsProps {
  stats?: {
    total: number;
    expiringSoon: number;
    expired: number;
    compliant: number;
  };
  isLoading: boolean;
}

export default function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-center">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="ml-5 w-0 flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      name: "Totale Dipendenti",
      value: stats?.total || 0,
      icon: Users,
      color: "text-primary",
    },
    {
      name: "In Scadenza (10gg)",
      value: stats?.expiringSoon || 0,
      icon: AlertTriangle,
      color: "text-warning",
    },
    {
      name: "Comporto Scaduto",
      value: stats?.expired || 0,
      icon: Calendar,
      color: "text-danger",
    },
    {
      name: "In Regola",
      value: stats?.compliant || 0,
      icon: CheckCircle,
      color: "text-success",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statItems.map((stat) => (
        <Card key={stat.name} className="overflow-hidden shadow">
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <stat.icon className={`${stat.color} text-xl`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                  <dd className="text-lg font-medium text-gray-900">{stat.value}</dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
