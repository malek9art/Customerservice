# Final Engineering Review - TravelOS AI (SaaS Transformation)

## 1. Software Architect Review
- **Issue:** Service Coupling. A "Modular Monolith" is fine for MVP, but the "AI Agent Mesh" needs a distinct execution environment to avoid blocking the main event loop.
- **Solution:** Implement the **Outbox Pattern** for AI tasks and long-running workflows. The API accepts the request, writes to the DB, and a background worker (BullMQ) processes the AI logic.
- **Plugin Framework:** Need a "Service Provider" pattern similar to NestJS modules but dynamic, allowing registration of external API adapters (Amadeus, Sabre, Stripe) at runtime based on tenant config.

## 2. AI Architect Review
- **Issue:** Prompt Drift & Token Bloat. Large system prompts for 12+ agents will consume tokens and increase latency.
- **Solution:** **Dynamic Prompt Injection.** Only load the relevant "Agent Tool Definitions" based on the Supervisor's first-pass routing. Use **Semantic Caching** for RAG to prevent redundant vector searches for common Hajj/Umrah FAQs.
- **RAG Issue:** Simple Top-K retrieval often fails for complex travel rules (e.g., "What is the visa fee for a 5-year-old Yemeni child?").
- **Solution:** **Agentic RAG.** Instead of just searching, the Knowledge Agent will query the **Business Rules Engine (BRE)** first, then fallback to vector search if no structured rule exists.

## 3. Database Expert Review
- **Issue:** Tenant Noisy Neighbor. A single heavy tenant running massive reports or AI operations could slow down others.
- **Solution:** **PostgreSQL Resource Groups** or **Schema-per-Tenant** for high-tier customers. For standard tiers, implement **Rate Limiting at the DB connection level** and optimized Materialized Views for dashboards.
- **Audit Logging:** Instead of a single flat table, use **JSONB Diffing** to store only changed fields, reducing storage by 60%.

## 4. CyberSecurity Expert Review
- **Issue:** WhatsApp Media Security. Sensitive passport photos received via WhatsApp webhooks are temporarily stored.
- **Solution:** **Encrypted Storage.** Files must be encrypted at the application layer before being sent to S3/Supabase. Use **Signed URLs** with 5-minute expirations for all admin/employee viewing.
- **Prompt Injection:** Standard guardrails aren't enough. Implement **PII Masking** before sending data to LLMs.

## 5. DevOps & Performance Expert Review
- **Issue:** Cold starts and Latency. NestJS + Next.js + AI + WhatsApp Webhooks = Potential bottleneck.
- **Solution:** Use **Edge Functions** (Supabase/Vercel) for the initial WhatsApp webhook handshake to ensure < 200ms response to Meta. Offload the processing to the backend.
- **Redis Strategy:** Use Redis for Session State, Rate Limiting, and **Pub/Sub** for real-time dashboard updates.

## 6. QA & Edge Case Review
- **Edge Case:** Customer sends a voice message in a thick Yemeni dialect while the system is under heavy load.
- **Solution:** Async ASR (Speech-to-Text) -> Dialect Normalization Agent -> Supervisor. If ASR confidence is low, escalate to human immediately without guessing.
- **Conflict:** Booking Agent and Finance Agent might both try to update a booking status. 
- **Solution:** **Distributed Locking (Redlock)** to ensure only one process modifies a booking at a time.
