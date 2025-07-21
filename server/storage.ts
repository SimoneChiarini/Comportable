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

export const storage = new DatabaseStorage();
