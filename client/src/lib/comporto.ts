import type { EmployeeWithRelations } from "@shared/schema";

export function calculateRemainingDays(employee: EmployeeWithRelations): number {
  const totalAbsenceDays = employee.absences?.reduce(
    (sum, absence) => sum + absence.daysCounted,
    0
  ) || 0;
  
  return employee.ccnl.comportoDays - totalAbsenceDays;
}

export function getStatusInfo(remainingDays: number) {
  if (remainingDays < 0) {
    return {
      label: "Scaduto",
      variant: "destructive",
      textColor: "text-danger",
    };
  } else if (remainingDays <= 10) {
    return {
      label: "Critico",
      variant: "destructive",
      textColor: "text-danger",
    };
  } else if (remainingDays <= 30) {
    return {
      label: "Attenzione",
      variant: "secondary",
      textColor: "text-warning",
    };
  } else {
    return {
      label: "OK",
      variant: "outline",
      textColor: "text-success",
    };
  }
}

export function calculateDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Include both start and end dates
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

export function getWorkDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let workDays = 0;
  
  const currentDate = new Date(start);
  while (currentDate <= end) {
    if (!isWeekend(currentDate)) {
      workDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return workDays;
}
