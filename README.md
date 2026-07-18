# TravelOS AI - Enterprise Operating System for Travel & Pilgrimage Agencies

TravelOS AI is an Enterprise Operating System engineered using Clean Architecture, Domain-Driven Design (DDD), and Vertical Slice Architecture for Travel Agencies, Hajj & Umrah offices, and Tour Operators.

---

## Key Platform Capabilities

### 1. Hajj & Umrah Operations Engine
- **Intelligent Room Allocation:** Automatic grouping into Single, Double, Triple, Quad, or Quint rooms respecting family units, gender segregation rules, and special medical needs.
- **Bus & Group Logistics:** Bin-packing algorithm for bus filling (45-50 passenger capacity), preventing family splits across vehicles, and generating seating rosters.
- **Real-Time Package Capacity Sync:** Atomic inventory tracking preventing overbooking across multi-tier package offerings.
- **Official Digital Pilgrim Card (Nusuk Standard PDF):** Automated PDF card generation with embedded verification barcodes, hotel/room numbers, bus assignments, and Mina/Arafat camp details.

### 2. GDS & Flight Operations
- **Amadeus Adapter:** Live GDS integration supporting flight searches, offer pricing, PNR order creation, electronic ticket issuance (`157-XXXXXXX`), and order cancellation.
- **Fare Rules Evaluator:** Dynamic evaluation via Business Rules Engine (BRE) for checked baggage limits, cancellation penalties, date change fees, and dynamic agency markups.

### 3. Financial Ledger & Double-Entry Accounting
- **Auto-Reconciliation Engine:** Automated bank statement processing matching payment references, customer details, and amounts with open invoices, posting settlements automatically or flagging edge cases for manual review.
- **Posting Engine:** Double-entry journal postings for all domain events (`FLIGHT_BOOKING`, `HOTEL_BOOKING`, `PILGRIMAGE_BOOKING`, `VISA_APPLICATION`, `PAYMENT_RECEIVED`, `BANK_RECONCILIATION`, `REFUND_PROCESSED`).

### 4. AI Multi-Agent Execution Platform
- **Stateful Action Chains:** Multi-agent supervisor orchestration following a structured **Planning -> Execution -> Verification** pipeline across specialist agents (Pilgrimage, Flight, Finance, OCR, Verification).

---

## System Architecture

```text
backend/src
├── common                    # Decorators, global exception filters, company context
├── modules
│   ├── accounting            # Financial ledger, double-entry engine, auto-reconciliation
│   ├── admin                 # Command center & system monitoring
│   ├── ai                    # Multi-agent orchestrator, tool registry, memory
│   ├── analytics              # BI dashboards & analytics snapshots
│   ├── bre                    # Business Rules Engine (json-logic)
│   ├── customers              # CRM 360 view & activity timeline
│   ├── flight                 # GDS adapters (Amadeus) & fare rules evaluator
│   ├── hotel                  # Hotel booking adapters
│   ├── iam                    # Multi-tenant RBAC & tenant isolation
│   ├── ocr                    # Vision AI & document intelligence vaulting
│   ├── package-engine         # Dynamic packaging & dynamic pricing
│   ├── pilgrimage             # Hajj & Umrah engine (rooms, buses, cards, sync)
│   ├── saas                   # Provisioning, subscription tiers & SaaS billing
│   ├── storage                # Secure S3 vault storage
│   ├── visa                   # Visa application tracking & workflows
│   └── workflows              # DB-driven event state machines
└── prisma.service.ts         # Prisma DB context & memory state store
```

---

## Getting Started

### Prerequisites
- Node.js >= 20
- npm >= 10

### Installation & Build

```bash
cd backend
npm install
npm run build
```

### Running Test Suites

```bash
cd backend
npm test
```

### Swagger API Documentation
Once the server is running (`npm run start:dev`), Swagger API documentation is available at:
`http://localhost:3000/api/docs`

---

## API & OpenAPI Specifications
All API endpoints are documented directly in code using NestJS `@nestjs/swagger` decorators (`@ApiTags`, `@ApiOperation`, `@ApiHeader`, `@ApiParam`, `@ApiBody`).

---

## License
Proprietary - Commercial Enterprise Software.
