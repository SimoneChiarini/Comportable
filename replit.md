# Comportable - Italian Labor Law Compliance Application

## Overview

Comportable is a web application designed for Italian labor consultants to calculate and manage "comporto" periods according to CCNL (Contratti Collettivi Nazionali di Lavoro) regulations. The application helps track employee absence periods and provides alerts when the comporto limit is approaching or exceeded.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for the user interface
- **Vite** as the build tool and development server
- **Wouter** for client-side routing
- **Tailwind CSS** with **shadcn/ui** components for styling
- **TanStack Query** for server state management and API caching
- **React Hook Form** with **Zod** for form validation

### Backend Architecture
- **Express.js** server with TypeScript
- **Replit Authentication** for user management with OpenID Connect
- RESTful API design with JSON responses
- Session-based authentication using PostgreSQL session storage

### Database Architecture
- **PostgreSQL** as the primary database
- **Drizzle ORM** for database operations with type safety
- **Neon Database** as the cloud PostgreSQL provider
- Schema includes users, employees, CCNLs, absences, and sessions

## Key Components

### Authentication System
- Integrated Replit Auth with OpenID Connect
- Session-based authentication with PostgreSQL storage
- Protected routes requiring authentication
- User profile management

### CCNL Management
- Pre-configured CCNLs (Cooperative Sociali, Commercio, Metalmeccanica)
- Support for custom CCNL creation
- Configurable comporto day limits per CCNL

### Employee Management
- Employee registration with CCNL assignment
- Employee profile with absence tracking
- Comporto calculation based on CCNL rules
- Status monitoring (OK, Attention, Critical, Expired)

### Absence Tracking
- Date-based absence recording
- Automatic day counting
- Integration with comporto calculations
- Historical absence data

### Dashboard and Reporting
- Statistics overview (total employees, expiring soon, expired, compliant)
- Employee table with filtering and search
- Status badges and alerts
- Recent activity tracking

## Data Flow

1. **User Authentication**: Users authenticate via Replit Auth, creating or retrieving user profiles
2. **CCNL Initialization**: Default CCNLs are created on first application load
3. **Employee Creation**: Users create employee records and assign CCNLs
4. **Absence Recording**: Absences are recorded against employees
5. **Comporto Calculation**: System calculates remaining comporto days based on CCNL limits and recorded absences
6. **Status Updates**: Employee status is updated based on remaining days (alerts for ≤10 days)
7. **Dashboard Display**: Statistics and employee data are aggregated and displayed

## External Dependencies

### Authentication
- **Replit Authentication** service for user management
- **OpenID Connect** protocol implementation

### Database
- **Neon Database** for PostgreSQL hosting
- Connection via `@neondatabase/serverless` with WebSocket support

### UI Components
- **Radix UI** primitives for accessible components
- **Lucide React** for icons
- **Tailwind CSS** for styling

### Development Tools
- **Vite** with React plugin
- **TypeScript** for type safety
- **ESBuild** for production builds
- **Replit** development environment integration

## Deployment Strategy

### Development
- Vite development server with HMR
- Express server with middleware for API routes
- File watching and auto-restart capabilities
- Replit environment integration

### Production Build
- Frontend: Vite builds to `dist/public` directory
- Backend: ESBuild bundles server to `dist/index.js`
- Static file serving from Express in production
- Environment variable configuration for database and auth

### Database Management
- Drizzle migrations in `migrations/` directory
- Schema defined in `shared/schema.ts`
- Push-based deployment with `db:push` command

### Session Management
- PostgreSQL-based session storage
- Session cleanup and TTL management
- GDPR-compliant session handling

### Error Handling
- Client-side error boundaries
- Server-side error middleware
- Unauthorized request handling
- Toast notifications for user feedback

The application follows a modern full-stack architecture with strong type safety, comprehensive authentication, and a focus on Italian labor law compliance requirements.