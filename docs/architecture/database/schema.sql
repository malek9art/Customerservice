# Database Schema Design - TravelOS AI

## 1. Core Structures
```sql
-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- 1. Companies (Tenants)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    settings JSONB DEFAULT '{}', -- Branding, timezone, etc.
    subscription_tier TEXT DEFAULT 'FREE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete
);

-- 2. Branches
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    name TEXT NOT NULL,
    address TEXT,
    contact_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. IAM (Roles & Permissions)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    name TEXT NOT NULL,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL, -- e.g., 'CREATE', 'READ'
    subject TEXT NOT NULL, -- e.g., 'BOOKING', 'CUSTOMER'
    description TEXT
);

CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id),
    permission_id UUID REFERENCES permissions(id),
    PRIMARY KEY (role_id, permission_id)
);

-- 4. Employees
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL, -- Linked to Supabase/Auth system
    company_id UUID NOT NULL REFERENCES companies(id),
    branch_id UUID REFERENCES branches(id),
    role_id UUID REFERENCES roles(id),
    full_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CRM (Customers)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL, -- WhatsApp number
    email TEXT,
    passport_number TEXT,
    nationality TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(company_id, phone)
);

-- 6. Business Rules Engine (BRE)
CREATE TABLE business_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    rule_name TEXT NOT NULL,
    rule_type TEXT NOT NULL, -- 'VISA_FEE', 'CANCELLATION', 'COMMISSION'
    conditions JSONB NOT NULL, -- Logic
    outcomes JSONB NOT NULL,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- 7. Audit Logging
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    actor_id UUID REFERENCES employees(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 2. Row Level Security (RLS)
```sql
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON customers
    USING (company_id = current_setting('app.current_company_id')::uuid);
```

## 3. Indexes
- `CREATE INDEX idx_customers_phone ON customers(phone);`
- `CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);`
- `CREATE INDEX idx_bookings_company_status ON bookings(company_id, status);`
