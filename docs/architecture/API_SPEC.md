# API Specification - TravelOS AI

## Base URL: `/api/v1`

### 1. Auth & IAM
- `POST /auth/login` - Authenticate user.
- `POST /auth/refresh` - Refresh JWT.
- `GET /iam/me` - Get current user profile and permissions.

### 2. Companies & Tenants
- `GET /companies/my-company` - Get company details.
- `PATCH /companies/my-company` - Update company settings.

### 3. Customers CRM
- `GET /customers` - List customers.
- `POST /customers` - Create customer.
- `GET /customers/:id` - Get customer profile, history, and docs.
- `POST /customers/:id/documents` - Upload document.

### 4. Packages & Bookings
- `GET /packages` - List travel/Hajj/Umrah packages.
- `POST /packages` - Create package.
- `GET /bookings` - List all bookings.
- `POST /bookings` - Create new booking.
- `PATCH /bookings/:id/status` - Update booking/visa status.

### 5. Finance
- `GET /invoices` - List invoices.
- `POST /payments` - Record a payment.

### 6. AI & WhatsApp
- `POST /webhooks/whatsapp` - Meta WhatsApp Cloud API endpoint.
- `GET /chat/sessions` - List active chat sessions.
- `GET /chat/sessions/:id/messages` - Get chat history.
- `POST /chat/sessions/:id/escalate` - Manually escalate to human.

### 7. Knowledge Base
- `GET /kb/documents` - List internal KB documents.
- `POST /kb/sync` - Trigger RAG indexing.

## Headers
- `Authorization: Bearer <JWT>`
- `X-Company-ID: <UUID>` (For context/validation)
