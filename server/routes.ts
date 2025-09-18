import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertEmployeeSchema, insertCcnlSchema, insertAbsenceSchema } from "@shared/schema";
import { z } from "zod";
import * as XLSX from 'xlsx';
import multer from 'multer';

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize default CCNLs if none exist
  app.get('/api/init', async (req, res) => {
    try {
      const existingCcnls = await storage.getCcnls();
      if (existingCcnls.length === 0) {
        // Create default CCNLs to match MemoryStorage
        await storage.createCcnl({
          name: "Cooperative Sociali",
          code: "COOP_SOCIALI",
          comportoDays: 180,
          isActive: true,
        });
        await storage.createCcnl({
          name: "Metalmeccanica industria",
          code: "METALMECCANICA_INDUSTRIA",
          comportoDays: 180,
          isActive: true,
        });
        await storage.createCcnl({
          name: "Metalmeccanica artigianato",
          code: "METALMECCANICA_ARTIGIANATO",
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
          name: "Turismo",
          code: "TURISMO",
          comportoDays: 180,
          isActive: true,
        });
        await storage.createCcnl({
          name: "Edilizia industria",
          code: "EDILIZIA_INDUSTRIA",
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

  // Export employees route (must be before the parametric :id route)
  app.get('/api/employees/export', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employees = await storage.getEmployees(userId);
      
      // Create Excel data for PDF generation
      const tableData = employees.map(employee => {
        const totalAbsenceDays = employee.absences.reduce((sum, absence) => sum + absence.daysCounted, 0);
        const remainingDays = employee.ccnl.comportoDays - totalAbsenceDays;
        
        let status = 'Conforme';
        if (remainingDays < 0) {
          status = 'Scaduto';
        } else if (remainingDays <= 10) {
          status = 'Attenzione';
        }

        return [
          employee.employeeId,
          `${employee.firstName} ${employee.lastName}`,
          employee.email || '-',
          employee.ccnl.name,
          employee.ccnl.comportoDays.toString(),
          totalAbsenceDays.toString(),
          remainingDays.toString(),
          status,
          new Date(employee.hireDate).toLocaleDateString('it-IT')
        ];
      });

      // Send JSON data that frontend will use to generate PDF
      const exportData = {
        title: 'Elenco Dipendenti - Comportable',
        date: new Date().toLocaleDateString('it-IT'),
        headers: [
          'Codice',
          'Nome Completo', 
          'Email',
          'CCNL',
          'Giorni Comporto',
          'Giorni Usati',
          'Giorni Rimanenti',
          'Stato',
          'Data Assunzione'
        ],
        data: tableData,
        stats: await storage.getEmployeeStats(userId)
      };

      res.json(exportData);
    } catch (error) {
      console.error("Error exporting employees:", error);
      res.status(500).json({ message: "Errore durante l'esportazione" });
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

  // Multer configuration for file uploads
  const upload = multer({ storage: multer.memoryStorage() });

  // Import employees from Excel
  app.post('/api/employees/import', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nessun file caricato" });
      }

      const userId = req.user.claims.sub;
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);

      // Get available CCNLs
      const ccnls = await storage.getCcnls();
      const ccnlMap = new Map(ccnls.map(ccnl => [ccnl.name.toLowerCase(), ccnl.id]));

      const importedEmployees = [];
      const errors = [];

      for (const [index, row] of data.entries()) {
        try {
          const rowData = row as any;
          
          // Map Excel columns to employee data
          const employeeData = {
            userId,
            employeeId: rowData['Codice Dipendente'] || rowData['Employee ID'] || `EMP${Date.now()}-${index}`,
            firstName: rowData['Nome'] || rowData['First Name'] || '',
            lastName: rowData['Cognome'] || rowData['Last Name'] || '',
            email: rowData['Email'] || '',
            hireDate: rowData['Data Assunzione'] || rowData['Hire Date'] ? new Date(rowData['Data Assunzione'] || rowData['Hire Date']) : new Date(),
            ccnlId: 1, // Default to first CCNL
            isActive: true,
          };

          // Try to match CCNL
          const ccnlName = rowData['CCNL'] || rowData['Contract'];
          if (ccnlName) {
            const matchedCcnlId = ccnlMap.get(ccnlName.toLowerCase());
            if (matchedCcnlId) {
              employeeData.ccnlId = matchedCcnlId;
            }
          }

          // Validate data
          const validatedData = insertEmployeeSchema.parse(employeeData);
          const employee = await storage.createEmployee(validatedData);
          importedEmployees.push(employee);
        } catch (error) {
          errors.push(`Riga ${index + 2}: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
        }
      }

      res.json({
        success: true,
        imported: importedEmployees.length,
        errors: errors.length,
        errorDetails: errors,
      });
    } catch (error) {
      console.error("Error importing employees:", error);
      res.status(500).json({ message: "Errore durante l'importazione" });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}
