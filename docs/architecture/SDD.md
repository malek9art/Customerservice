# System Design Document (SDD) - TravelOS AI

## 1. Architectural Overview
TravelOS AI follows **Clean Architecture** and **Domain-Driven Design (DDD)** principles.

### 1.1 High-Level Architecture
- **Frontend:** Next.js (App Router), TailwindCSS, Shadcn UI.
- **Backend:** NestJS (Modular Monolith / Microservices ready).
- **Database:** PostgreSQL (Supabase) + Prisma ORM.
- **Cache/Queue:** Redis + BullMQ.
- **AI Orchestration:** LangGraph / Custom Agent Orchestrator.
- **Communications:** Meta WhatsApp Cloud API.

## 2. Layered Architecture (Backend)
1.  **API Layer:** Controllers, DTOs, Versioning.
2.  **Application Layer:** Service classes, Use cases, Command/Query handlers (CQRS).
3.  **Domain Layer:** Entities, Aggregates, Domain Events, Repository Interfaces.
4.  **Infrastructure Layer:** Database implementation, External API clients (WhatsApp, AI), File storage.

## 3. Data Design
### 3.1 Tenancy Model
- Shared database with `company_id` column-level isolation (RLS - Row Level Security).
- Optional: Database per tenant for enterprise-tier.

### 3.2 Key Entities
- `Company`, `Branch`, `User`, `Role`, `Permission`.
- `Customer`, `Lead`, `Document`.
- `Package` (Travel, Hajj, Umrah), `Booking`, `Reservation`.
- `Invoice`, `Payment`, `Transaction`, `Installment`.
- `ChatSession`, `Message`, `AILog`.

## 4. AI Agent Orchestration
The system uses a **Supervisor-Worker pattern**.
- **Supervisor:** Analyzes intent and routes to the correct agent.
- **Workers:** Specialized tools and knowledge base access (RAG).
- **State Management:** LangGraph or custom state machine to maintain conversation context.

## 5. Security Architecture
- **Authentication:** Supabase Auth (OIDC/JWT).
- **Authorization:** Custom RBAC middleware in NestJS.
- **Audit:** Interceptors to log all state-changing operations.
- **Validation:** Zod for runtime schema validation.

## 6. Integration Patterns
- **Webhooks:** For WhatsApp and Payment providers.
- **Event Bus:** Internal events for decoupling (e.g., `BookingCreatedEvent` triggers `NotificationAgent`).
- **Background Jobs:** For PDF generation, OCR, and bulk notifications.
