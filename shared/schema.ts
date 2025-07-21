import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  date,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// CCNL (Contratti Collettivi Nazionali di Lavoro)
export const ccnls = pgTable("ccnls", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  comportoDays: integer("comporto_days").notNull(), // giorni di comporto previsti
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Employees
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  employeeId: varchar("employee_id", { length: 50 }).notNull().unique(), // matricola
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  hireDate: date("hire_date").notNull(),
  ccnlId: integer("ccnl_id").references(() => ccnls.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(), // owner of the employee record
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Absences
export const absences = pgTable("absences", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  absenceType: varchar("absence_type", { length: 50 }).notNull(), // malattia, infortunio, etc.
  description: text("description"),
  daysCounted: integer("days_counted").notNull(), // giorni che contano per il comporto
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  employees: many(employees),
}));

export const ccnlsRelations = relations(ccnls, ({ many }) => ({
  employees: many(employees),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  user: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
  ccnl: one(ccnls, {
    fields: [employees.ccnlId],
    references: [ccnls.id],
  }),
  absences: many(absences),
}));

export const absencesRelations = relations(absences, ({ one }) => ({
  employee: one(employees, {
    fields: [absences.employeeId],
    references: [employees.id],
  }),
}));

// Insert schemas
export const insertCcnlSchema = createInsertSchema(ccnls).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAbsenceSchema = createInsertSchema(absences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type Ccnl = typeof ccnls.$inferSelect;
export type InsertCcnl = z.infer<typeof insertCcnlSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Absence = typeof absences.$inferSelect;
export type InsertAbsence = z.infer<typeof insertAbsenceSchema>;

// Extended types with relations
export type EmployeeWithRelations = Employee & {
  ccnl: Ccnl;
  absences: Absence[];
};
