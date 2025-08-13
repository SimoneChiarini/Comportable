import {
  users,
  employees,
  ccnls,
  absences,
  type User,
  type UpsertUser,
  type Employee,
  type InsertEmployee,
  type EmployeeWithRelations,
  type Ccnl,
  type InsertCcnl,
  type Absence,
  type InsertAbsence,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // CCNL operations
  getCcnls(): Promise<Ccnl[]>;
  createCcnl(ccnl: InsertCcnl): Promise<Ccnl>;
  updateCcnl(id: number, ccnl: Partial<InsertCcnl>): Promise<Ccnl>;
  
  // Employee operations
  getEmployees(userId: string): Promise<EmployeeWithRelations[]>;
  getEmployee(id: number, userId: string): Promise<EmployeeWithRelations | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>, userId: string): Promise<Employee>;
  deleteEmployee(id: number, userId: string): Promise<void>;
  
  // Absence operations
  getEmployeeAbsences(employeeId: number): Promise<Absence[]>;
  createAbsence(absence: InsertAbsence): Promise<Absence>;
  updateAbsence(id: number, absence: Partial<InsertAbsence>): Promise<Absence>;
  deleteAbsence(id: number): Promise<void>;
  
  // Statistics
  getEmployeeStats(userId: string): Promise<{
    total: number;
    expiringSoon: number;
    expired: number;
    compliant: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // CCNL operations
  async getCcnls(): Promise<Ccnl[]> {
    return await db.select().from(ccnls).where(eq(ccnls.isActive, true)).orderBy(ccnls.name);
  }

  async createCcnl(ccnlData: InsertCcnl): Promise<Ccnl> {
    const [ccnl] = await db.insert(ccnls).values(ccnlData).returning();
    return ccnl;
  }

  async updateCcnl(id: number, ccnlData: Partial<InsertCcnl>): Promise<Ccnl> {
    const [ccnl] = await db
      .update(ccnls)
      .set({ ...ccnlData, updatedAt: new Date() })
      .where(eq(ccnls.id, id))
      .returning();
    return ccnl;
  }

  // Employee operations
  async getEmployees(userId: string): Promise<EmployeeWithRelations[]> {
    return await db.query.employees.findMany({
      where: and(eq(employees.userId, userId), eq(employees.isActive, true)),
      with: {
        ccnl: true,
        absences: {
          orderBy: [desc(absences.startDate)],
        },
      },
      orderBy: [employees.lastName, employees.firstName],
    });
  }

  async getEmployee(id: number, userId: string): Promise<EmployeeWithRelations | undefined> {
    return await db.query.employees.findFirst({
      where: and(eq(employees.id, id), eq(employees.userId, userId), eq(employees.isActive, true)),
      with: {
        ccnl: true,
        absences: {
          orderBy: [desc(absences.startDate)],
        },
      },
    });
  }

  async createEmployee(employeeData: InsertEmployee): Promise<Employee> {
    const [employee] = await db.insert(employees).values(employeeData).returning();
    return employee;
  }

  async updateEmployee(id: number, employeeData: Partial<InsertEmployee>, userId: string): Promise<Employee> {
    const [employee] = await db
      .update(employees)
      .set({ ...employeeData, updatedAt: new Date() })
      .where(and(eq(employees.id, id), eq(employees.userId, userId)))
      .returning();
    return employee;
  }

  async deleteEmployee(id: number, userId: string): Promise<void> {
    await db
      .update(employees)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(employees.id, id), eq(employees.userId, userId)));
  }

  // Absence operations
  async getEmployeeAbsences(employeeId: number): Promise<Absence[]> {
    return await db
      .select()
      .from(absences)
      .where(eq(absences.employeeId, employeeId))
      .orderBy(desc(absences.startDate));
  }

  async createAbsence(absenceData: InsertAbsence): Promise<Absence> {
    const [absence] = await db.insert(absences).values(absenceData).returning();
    return absence;
  }

  async updateAbsence(id: number, absenceData: Partial<InsertAbsence>): Promise<Absence> {
    const [absence] = await db
      .update(absences)
      .set({ ...absenceData, updatedAt: new Date() })
      .where(eq(absences.id, id))
      .returning();
    return absence;
  }

  async deleteAbsence(id: number): Promise<void> {
    await db.delete(absences).where(eq(absences.id, id));
  }

  // Statistics
  async getEmployeeStats(userId: string): Promise<{
    total: number;
    expiringSoon: number;
    expired: number;
    compliant: number;
  }> {
    const employeesWithStats = await this.getEmployees(userId);
    
    let expiringSoon = 0;
    let expired = 0;
    let compliant = 0;

    employeesWithStats.forEach(employee => {
      const totalAbsenceDays = employee.absences.reduce((sum, absence) => sum + absence.daysCounted, 0);
      const remainingDays = employee.ccnl.comportoDays - totalAbsenceDays;
      
      if (remainingDays < 0) {
        expired++;
      } else if (remainingDays <= 10) {
        expiringSoon++;
      } else {
        compliant++;
      }
    });

    return {
      total: employeesWithStats.length,
      expiringSoon,
      expired,
      compliant,
    };
  }
}

// Temporary in-memory storage while database connection issues are resolved
class MemoryStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private ccnls: Map<number, Ccnl> = new Map();
  private employees: Map<number, Employee> = new Map();
  private absences: Map<number, Absence> = new Map();
  private nextEmployeeId = 1;
  private nextCcnlId = 1;
  private nextAbsenceId = 1;

  constructor() {
    // Initialize default CCNLs
    this.ccnls.set(1, {
      id: 1,
      name: "Cooperative Sociali",
      code: "COOP_SOCIALI",
      comportoDays: 180,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.ccnls.set(2, {
      id: 2,
      name: "Commercio", 
      code: "COMMERCIO",
      comportoDays: 180,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.ccnls.set(3, {
      id: 3,
      name: "Metalmeccanica",
      code: "METALMECCANICA", 
      comportoDays: 180,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.nextCcnlId = 4;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const user: User = {
      ...userData,
      createdAt: this.users.get(userData.id)?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(userData.id, user);
    return user;
  }

  async getCcnls(): Promise<Ccnl[]> {
    return Array.from(this.ccnls.values()).filter(ccnl => ccnl.isActive);
  }

  async createCcnl(ccnlData: InsertCcnl): Promise<Ccnl> {
    const ccnl: Ccnl = {
      id: this.nextCcnlId++,
      ...ccnlData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.ccnls.set(ccnl.id, ccnl);
    return ccnl;
  }

  async updateCcnl(id: number, ccnlData: Partial<InsertCcnl>): Promise<Ccnl> {
    const existing = this.ccnls.get(id);
    if (!existing) throw new Error("CCNL not found");
    
    const updated: Ccnl = {
      ...existing,
      ...ccnlData,
      updatedAt: new Date(),
    };
    this.ccnls.set(id, updated);
    return updated;
  }

  async getEmployees(userId: string): Promise<EmployeeWithRelations[]> {
    const userEmployees = Array.from(this.employees.values())
      .filter(emp => emp.userId === userId && emp.isActive);
    
    return userEmployees.map(employee => ({
      ...employee,
      ccnl: this.ccnls.get(employee.ccnlId)!,
      absences: Array.from(this.absences.values())
        .filter(abs => abs.employeeId === employee.id)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
    }));
  }

  async getEmployee(id: number, userId: string): Promise<EmployeeWithRelations | undefined> {
    const employee = this.employees.get(id);
    if (!employee || employee.userId !== userId || !employee.isActive) {
      return undefined;
    }

    return {
      ...employee,
      ccnl: this.ccnls.get(employee.ccnlId)!,
      absences: Array.from(this.absences.values())
        .filter(abs => abs.employeeId === employee.id)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
    };
  }

  async createEmployee(employeeData: InsertEmployee): Promise<Employee> {
    const employee: Employee = {
      id: this.nextEmployeeId++,
      ...employeeData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.employees.set(employee.id, employee);
    return employee;
  }

  async updateEmployee(id: number, employeeData: Partial<InsertEmployee>, userId: string): Promise<Employee> {
    const existing = this.employees.get(id);
    if (!existing || existing.userId !== userId) {
      throw new Error("Employee not found");
    }

    const updated: Employee = {
      ...existing,
      ...employeeData,
      updatedAt: new Date(),
    };
    this.employees.set(id, updated);
    return updated;
  }

  async deleteEmployee(id: number, userId: string): Promise<void> {
    const existing = this.employees.get(id);
    if (existing && existing.userId === userId) {
      this.employees.set(id, { ...existing, isActive: false, updatedAt: new Date() });
    }
  }

  async getEmployeeAbsences(employeeId: number): Promise<Absence[]> {
    return Array.from(this.absences.values())
      .filter(abs => abs.employeeId === employeeId)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }

  async createAbsence(absenceData: InsertAbsence): Promise<Absence> {
    const absence: Absence = {
      id: this.nextAbsenceId++,
      ...absenceData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.absences.set(absence.id, absence);
    return absence;
  }

  async updateAbsence(id: number, absenceData: Partial<InsertAbsence>): Promise<Absence> {
    const existing = this.absences.get(id);
    if (!existing) throw new Error("Absence not found");

    const updated: Absence = {
      ...existing,
      ...absenceData,
      updatedAt: new Date(),
    };
    this.absences.set(id, updated);
    return updated;
  }

  async deleteAbsence(id: number): Promise<void> {
    this.absences.delete(id);
  }

  async getEmployeeStats(userId: string): Promise<{
    total: number;
    expiringSoon: number;
    expired: number;
    compliant: number;
  }> {
    const employeesWithStats = await this.getEmployees(userId);
    
    let expiringSoon = 0;
    let expired = 0;
    let compliant = 0;

    employeesWithStats.forEach(employee => {
      const totalAbsenceDays = employee.absences.reduce((sum, absence) => sum + absence.daysCounted, 0);
      const remainingDays = employee.ccnl.comportoDays - totalAbsenceDays;
      
      if (remainingDays < 0) {
        expired++;
      } else if (remainingDays <= 10) {
        expiringSoon++;
      } else {
        compliant++;
      }
    });

    return {
      total: employeesWithStats.length,
      expiringSoon,
      expired,
      compliant,
    };
  }
}

export const storage = new MemoryStorage();
