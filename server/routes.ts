import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertEmployeeSchema, insertCcnlSchema, insertAbsenceSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize default CCNLs if none exist
  app.get('/api/init', async (req, res) => {
    try {
      const existingCcnls = await storage.getCcnls();
      if (existingCcnls.length === 0) {
        // Create default CCNLs
        await storage.createCcnl({
          name: "Cooperative Sociali",
          code: "COOP_SOCIALI",
          comportoDays: 180,
          isActive: true,
        });
        await storage.createCcnl({
          name: "Commercio",
          code: "COMMERCIO",
          comportoDays: 180,
          isActive: true,
        });
        await storage.createCcnl({
          name: "Metalmeccanica",
          code: "METALMECCANICA", 
          comportoDays: 180,
          isActive: true,
        });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error initializing CCNLs:", error);
      res.status(500).json({ message: "Errore durante l'inizializzazione" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log('Fetching user for ID:', userId);
      const user = await storage.getUser(userId);
      console.log('Found user:', user);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Errore nel recupero dell'utente" });
    }
  });

  // CCNL routes
  app.get('/api/ccnls', isAuthenticated, async (req, res) => {
    try {
      const ccnls = await storage.getCcnls();
      res.json(ccnls);
    } catch (error) {
      console.error("Error fetching CCNLs:", error);
      res.status(500).json({ message: "Errore nel recupero dei CCNL" });
    }
  });

  app.post('/api/ccnls', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCcnlSchema.parse(req.body);
      const ccnl = await storage.createCcnl(validatedData);
      res.status(201).json(ccnl);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dati non validi", errors: error.errors });
      }
      console.error("Error creating CCNL:", error);
      res.status(500).json({ message: "Errore nella creazione del CCNL" });
    }
  });

  // Employee routes
  app.get('/api/employees', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employees = await storage.getEmployees(userId);
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Errore nel recupero dei dipendenti" });
    }
  });

  app.get('/api/employees/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const employee = await storage.getEmployee(id, userId);
      if (!employee) {
        return res.status(404).json({ message: "Dipendente non trovato" });
      }
      res.json(employee);
    } catch (error) {
      console.error("Error fetching employee:", error);
      res.status(500).json({ message: "Errore nel recupero del dipendente" });
    }
  });

  app.post('/api/employees', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertEmployeeSchema.parse({
        ...req.body,
        userId,
      });
      const employee = await storage.createEmployee(validatedData);
      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dati non validi", errors: error.errors });
      }
      console.error("Error creating employee:", error);
      res.status(500).json({ message: "Errore nella creazione del dipendente" });
    }
  });

  app.put('/api/employees/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const validatedData = insertEmployeeSchema.partial().parse(req.body);
      const employee = await storage.updateEmployee(id, validatedData, userId);
      res.json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dati non validi", errors: error.errors });
      }
      console.error("Error updating employee:", error);
      res.status(500).json({ message: "Errore nell'aggiornamento del dipendente" });
    }
  });

  app.delete('/api/employees/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      await storage.deleteEmployee(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ message: "Errore nell'eliminazione del dipendente" });
    }
  });

  // Absence routes
  app.get('/api/employees/:employeeId/absences', isAuthenticated, async (req: any, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const userId = req.user.claims.sub;
      
      // Verify employee belongs to user
      const employee = await storage.getEmployee(employeeId, userId);
      if (!employee) {
        return res.status(404).json({ message: "Dipendente non trovato" });
      }
      
      const absences = await storage.getEmployeeAbsences(employeeId);
      res.json(absences);
    } catch (error) {
      console.error("Error fetching absences:", error);
      res.status(500).json({ message: "Errore nel recupero delle assenze" });
    }
  });

  app.post('/api/employees/:employeeId/absences', isAuthenticated, async (req: any, res) => {
    try {
      const employeeId = parseInt(req.params.employeeId);
      const userId = req.user.claims.sub;
      
      // Verify employee belongs to user
      const employee = await storage.getEmployee(employeeId, userId);
      if (!employee) {
        return res.status(404).json({ message: "Dipendente non trovato" });
      }
      
      const validatedData = insertAbsenceSchema.parse({
        ...req.body,
        employeeId,
      });
      const absence = await storage.createAbsence(validatedData);
      res.status(201).json(absence);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dati non validi", errors: error.errors });
      }
      console.error("Error creating absence:", error);
      res.status(500).json({ message: "Errore nella creazione dell'assenza" });
    }
  });

  app.put('/api/absences/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertAbsenceSchema.partial().parse(req.body);
      const absence = await storage.updateAbsence(id, validatedData);
      res.json(absence);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dati non validi", errors: error.errors });
      }
      console.error("Error updating absence:", error);
      res.status(500).json({ message: "Errore nell'aggiornamento dell'assenza" });
    }
  });

  app.delete('/api/absences/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAbsence(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting absence:", error);
      res.status(500).json({ message: "Errore nell'eliminazione dell'assenza" });
    }
  });

  // Statistics route
  app.get('/api/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getEmployeeStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Errore nel recupero delle statistiche" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
