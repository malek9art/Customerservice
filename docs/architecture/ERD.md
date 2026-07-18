# Entity Relationship Diagram (ERD) - TravelOS AI

```mermaid
erDiagram
    COMPANY ||--o{ BRANCH : owns
    COMPANY ||--o{ EMPLOYEE : employs
    COMPANY ||--o{ CUSTOMER : has
    COMPANY ||--o{ PACKAGE : offers
    
    BRANCH ||--o{ EMPLOYEE : contains
    
    ROLE ||--o{ PERMISSION : has
    EMPLOYEE ||--o{ ROLE : assigned
    
    CUSTOMER ||--o{ BOOKING : makes
    CUSTOMER ||--o{ DOCUMENT : provides
    
    PACKAGE ||--o{ BOOKING : included_in
    PACKAGE ||--o{ HOTEL_ASSIGNMENT : has
    PACKAGE ||--o{ FLIGHT_ASSIGNMENT : has
    
    BOOKING ||--o{ INVOICE : generates
    BOOKING ||--o{ STATUS_HISTORY : tracks
    
    INVOICE ||--o{ PAYMENT : has
    PAYMENT ||--o{ INSTALLMENT : can_be
    
    CUSTOMER ||--o{ CHAT_SESSION : participates
    CHAT_SESSION ||--o{ MESSAGE : contains
    
    PACKAGE {
        uuid id
        string name
        enum type "HAJJ, UMRAH, TRAVEL"
        decimal price
    }
    
    BOOKING {
        uuid id
        uuid customer_id
        uuid package_id
        enum status
    }
    
    DOCUMENT {
        uuid id
        uuid customer_id
        string type "PASSPORT, VISA, PHOTO"
        string url
        boolean verified
    }
```

## Detailed Database Schema (Planned)

### Core
- `companies`: id, name, settings, subscription_tier.
- `branches`: id, company_id, name, address.
- `users`: id, email, password_hash, company_id, branch_id.
- `roles`: id, name, company_id.
- `permissions`: id, action, subject.

### CRM
- `customers`: id, company_id, name, phone (whatsapp), email, passport_no.
- `documents`: id, customer_id, type, file_path, ocr_data, is_verified.

### Bookings & Travel
- `packages`: id, company_id, title, description, price, total_slots, type.
- `bookings`: id, company_id, customer_id, package_id, status, total_amount, balance_due.
- `visa_applications`: id, booking_id, country, status, expiry_date.

### Finance
- `invoices`: id, booking_id, amount, status.
- `payments`: id, invoice_id, amount, method, status, receipt_url.

### AI & Chat
- `chat_sessions`: id, customer_id, company_id, last_message_at.
- `messages`: id, session_id, sender_type (AI, CUSTOMER, AGENT), content, metadata.
- `ai_logs`: id, session_id, agent_name, prompt, response, tokens, confidence_score.
