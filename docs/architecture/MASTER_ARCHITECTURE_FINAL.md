# TravelOS AI - Master Architecture (v2.0) - Official Source of Truth

## 1. System Vision
A world-class, multi-tenant SaaS platform for travel agencies, providing AI-driven automation for 80-90% of business operations including CRM, Bookings (Travel/Hajj/Umrah), Visa Processing, and Finance.

## 2. Core Architectural Pillars
- **Hexagonal Architecture (Ports & Adapters):** Decouples business logic from external APIs (WhatsApp, Payment Gateways).
- **Multi-Agent Orchestration (LangGraph):** State-aware, specialized agents with a supervisor router.
- **Dynamic Business Rules Engine (BRE):** Non-code rule management for pricing, fees, and policies.
- **Workflow Designer:** Visual automation for internal and external processes.
- **Extensible Plugin Framework:** Runtime registration of 3rd-party service providers.
- **Tenant Isolation:** PostgreSQL RLS and isolated storage buckets per company.

## 3. Tech Stack & Infrastructure
- **Frontend:** Next.js (App Router), TanStack Query, Zustand, TailwindCSS, Shadcn UI.
- **Backend:** NestJS (Modular Monolith architecture, Microservices-ready).
- **Database:** PostgreSQL (Supabase) + pgvector + Prisma ORM.
- **Cache/Messaging:** Redis Cluster + BullMQ.
- **AI Models:** GPT-4o (Primary), Gemini 1.5 Pro (Fallback), Whisper (ASR).
- **DevOps:** Kubernetes, Docker, GitHub Actions CI/CD, Terraform.

## 4. Multi-Agent Mesh
1.  **Supervisor:** Router & Intent Classifier.
2.  **Specialists:** Booking, Visa, Flights, Hotels, Finance, CRM, OCR, Knowledge, Analytics, Notification, Human Escalation, and Plugin-Connector Agents.

## 5. Security & Observability
- **Security:** OIDC, RBAC, RLS, AES-256 File Encryption, PII Masking, Rate Limiting.
- **Observability:** OpenTelemetry (Tracing), Prometheus (Metrics), Pino (Structured Logging), LangSmith (AI Traces).

## 6. Business Automation Components
- **BRE Engine:** evaluates `json-logic-js` for dynamic pricing and rules.
- **Workflow Engine:** Event-driven (e.g., `on: "payment.received", do: ["update_status", "send_whatsapp"]`).
- **Plugin Registry:** Dynamic loading of adapters for Amadeus, Stripe, Meta API, etc.

## 7. Implementation Standards
- **Zero Placeholder Policy:** No TODOs or empty implementations.
- **TDD/BDD:** 100% logic coverage with Unit & Integration tests.
- **Type Safety:** Strict TypeScript throughout the stack.
- **API First:** All features exposed via versioned, documented REST APIs.
