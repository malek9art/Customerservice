# Changelog

All notable changes to the TravelOS AI Enterprise OS project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-pilot] - 2026-07-18

### Fixed & Optimized (Pilot Program Program Freeze & Production Hardening)
- **Auto-Reconciliation Robustness:**
  - Standardized reference trimming and case-insensitive matching (`paymentReference.trim().toUpperCase()`) preventing missed matches caused by extra spaces or lowercase user input.
  - Safe parsing and filtering for non-positive or missing bank transaction amounts.
- **Room Allocation Graceful Degradation:**
  - Fallback assignment logic assigning `SINGLE` room type when a single unattached pilgrim remains in a multi-capacity room specification.
- **Journal Posting Defensive Guards:**
  - Prevented zero-amount or invalid accounting posting execution from producing empty journal records.
- **Normalized Semantic AI Prompt Cache:**
  - Normalized prompt strings in `AiMemoryService` to maximize cache hits across minor whitespace variations.
- **Pilot Program Regression Test Suite:**
  - Added `src/pilot-program-hardening.spec.ts` bringing test suite coverage to 24 tests across 9 test suites passing at 100%.

---

## [1.0.0-beta] - 2026-07-18

### Fixed & Hardened
- **End-to-End Operational Lifecycle & Workflows:**
  - Expanded `WorkflowService` event dispatcher with handlers for booking cancellations, slot restorations, flight order cancellations, physical passport custody updates, and live human agent chat escalations.
  - Added cancellation, modification, and slot restoration endpoints in `PilgrimageController` (`POST /pilgrimage/bookings/:id/cancel`, `PATCH /pilgrimage/bookings/:id/modify`).
  - Added flight cancellation endpoints in `FlightController` (`POST /flights/bookings/:id/cancel`).
  - Integrated `refund.processed` accounting triggers producing balanced revenue adjustment journal postings (`4090 Revenue Adjustment` Debit, `1010 Cash/Bank` Credit).
- **Physical Passport Custody Lifecycle:**
  - Hardened location updates (`RECEIVED_BY_AGENCY` -> `IN_SAFE` -> `SUBMITTED_TO_EMBASSY` -> `DELIVERED_TO_CUSTOMER`) with audit trails recorded in `PassportLog`.
- **Production Validation & Test Coverage:**
  - Added `src/v10-beta-scenarios.spec.ts` testing 4 real-world operational scenarios (Umrah Booking Lifecycle, Flight GDS Order Cancellation, Passport Custody Chain, Human Escalation Queue).
  - Verified 100% pass rate across all 8 test suites (20 total tests).

---

## [0.97.0] - 2026-07-18

### Added
- **Frontend App Router Architecture:**
  - Strongly typed API Client layer (`src/lib/api-client.ts`) connecting Next.js frontend directly to NestJS backend REST endpoints with live/resilient fallback context.
  - Responsive layout shell (`AppShell`) with mobile navigation sidebar, RTL Arabic support, active operational badges, and multi-tenant header context.
- **Real Operational Dashboards & Portals:**
  - Executive BI Dashboard (`/`) rendering live KPI metrics for revenue, active pilgrims, confirmed GDS PNRs, cash-on-hand, and AI action logs timeline.
  - Pilgrimage Operations Hub (`/pilgrimage`) supporting interactive execution of Room Allocation, Bus Allocation, Package Capacity Sync, and Nusuk Pilgrim Card PDF generation.
  - Flight GDS Operations (`/flights`) supporting Amadeus live offers search, BRE fare rules evaluation (baggage/penalties/markups), live PNR creation, and e-ticket issuance.
  - Financial Ledger & Auto-Reconciliation Portal (`/accounting`) supporting bank transfer statement processing, automated matching, and chart of accounts balances.
  - Customer Self-Service Portal (`/customer`) providing 360° booking access, invoice history, document vault, and Nusuk digital card PDF downloads.
  - Employee Workspace & CRM Portal (`/employee`) providing Customer 360 timeline, Visa Kanban board, physical passport inventory, and human escalation review queue.
  - AI Multi-Agent Copilot Inspector (`/ai-copilot`) exposing stateful action chains with Planning -> Execution -> Verification step inspection.
- **AI Token Optimization & Semantic Caching:**
  - In-memory semantic prompt caching in `AiMemoryService` to eliminate redundant AI calls.
  - Token counting metrics (`calculateTokens`) and GPT-4o cost estimation logging ($/1M tokens) per action chain execution.

---

## [0.96.0] - 2026-07-18

### Added
- **Hajj & Umrah Engine Hardening:**
  - Real room allocation algorithm considering room capacities (`QUAD`, `TRIPLE`, `DOUBLE`, `SINGLE`), family/booking unit grouping, gender separation, and accessibility priority for special medical needs.
  - Real bus allocation algorithm grouping pilgrims into buses (45-50 seats) without splitting family booking units, with leader and supervisor assignments and seat roster generation.
  - Real-time package capacity synchronization and atomic remaining slot calculations.
  - Automated official PDF Digital Pilgrim Card generator (`PilgrimCardPdfGenerator`) with encoded Nusuk verification details, room/bus/camp metadata, and secure URL storage.
- **GDS & Flight Ops Hardening:**
  - `AmadeusProvider` adapter implementing OAuth2 authentication, Flight Search (`v2/shopping/flight-offers`), live PNR creation (`v1/booking/flight-orders`), e-ticket issuance, and order cancellation.
  - `FareRulesEvaluatorService` integrated with Business Rules Engine (`BreService`) for dynamic baggage allowance, cancellation penalties, date change fees, and dynamic agency markups.
- **Financial Ledger Completion:**
  - `AutoReconciliationService` for bank transfer statements with heuristic confidence scoring (exact invoice reference, amount + customer name matching, suspense account handling).
  - Expanded `AccountingPostingEngine` event triggers for all booking types (`FLIGHT_BOOKING`, `HOTEL_BOOKING`, `PILGRIMAGE_BOOKING`, `VISA_APPLICATION`, `PAYMENT_RECEIVED`, `BANK_RECONCILIATION`, `UNMATCHED_BANK_DEPOSIT`, `REFUND_PROCESSED`) producing balanced double-entry journals (`Debit == Credit`).
- **AI Multi-Agent Execution:**
  - Stateful Action Chains in `AiOrchestrator` supporting structured Planning -> Execution -> Verification phases with step execution logging in `aiActionLog`.
- **Commercial End-to-End Test Suite:**
  - `src/commercial-v096.spec.ts` verifying the end-to-end user scenario from WhatsApp inquiry to e-ticketing, room/bus allocation, financial posting, bank reconciliation, and pilgrim card PDF delivery.

### Changed
- Refactored `PrismaService` stateful in-memory store for model entities to support non-binary development and testing environments seamlessly.
- Updated Swagger/OpenAPI documentation decorators across all controllers (`PilgrimageController`, `FlightController`, `AccountingController`).

---

## [0.95.0] - 2026-07-17

### Added
- Real integrations for PostgreSQL (Prisma), Supabase Storage (S3), Redis Cache, WhatsApp Cloud API, and Google Vision AI OCR.
- DB-driven Workflow State Machine execution engine.
