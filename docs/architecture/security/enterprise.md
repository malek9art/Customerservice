# Security & Observability - TravelOS AI

## 1. Enterprise Security
- **Authentication:** Supabase Auth (OIDC) + custom JWT claims for `company_id`.
- **Sessions:** Device-aware session management; auto-logout on suspicious activity.
- **Data Encryption:** 
    - At Rest: AES-256 (PostgreSQL/Supabase).
    - In Transit: TLS 1.3.
- **Prompt Injection Protection:** 
    - Input Sanitization.
    - LLM-based "Guardrail Agent" to check for malicious intents.
- **Audit Trail:** Every `Write` operation logged in `audit_logs` with before/after state.

## 2. Observability (The "Three Pillars")
- **Logs:** Pino for structured JSON logs. Sent to ELK or CloudWatch.
- **Metrics:** Prometheus/Grafana. Track:
    - AI Response Latency.
    - Token Usage per Tenant.
    - WhatsApp Webhook Success Rate.
    - Booking Conversion Rate.
- **Tracing:** OpenTelemetry for distributed tracing across services.

## 3. Disaster Recovery (DR)
- **RTO (Recovery Time Objective):** 4 hours.
- **RPO (Recovery Point Objective):** 1 hour.
- **Backups:** Automated daily DB backups stored in a different cloud region.
- **Health Checks:** `/health` endpoint for K8s Liveness/Readiness probes.
