# Database Migration Plan - TravelOS AI

## Phase 1: Core Infrastructure
- Initialize Prisma Schema.
- Create `companies` and `users` (Auth) tables.
- Implement RBAC tables (`roles`, `permissions`).

## Phase 2: CRM & Documents
- Create `customers` and `documents`.
- Setup Supabase Storage buckets for private document storage.
- Implement soft delete triggers and audit log tables.

## Phase 3: Packages & Bookings
- Create `packages`, `hotels`, `flights`.
- Create `bookings` and `status_history`.
- Define complex relations and indexes for search optimization.

## Phase 4: Finance & Transactions
- Create `invoices`, `payments`, `installments`.
- Add constraints to ensure financial integrity.

## Phase 5: AI Logs & Analytics
- Create `chat_sessions`, `messages`, `ai_logs`.
- Implement vector search support in PostgreSQL (pgvector) for RAG.

## Strategy:
- Use Prisma Migrations (`npx prisma migrate dev`).
- Seeding script for initial roles, permissions, and demo company data.
- Row Level Security (RLS) policies for multi-tenancy.
