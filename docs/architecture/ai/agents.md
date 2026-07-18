# Multi-Agent AI Architecture - TravelOS AI

## 1. Supervisor Agent (The Brain)
- **Responsibility:** Intent classification, task delegation, and context management.
- **Input:** Raw customer message + Session history.
- **Output:** Delegation to specialized agent or direct response.
- **Tools:** `delegate_to(agent_name, task)`.
- **Confidence Logic:** If intent is ambiguous < 0.8, ask clarifying question.

## 2. Specialized Agents
### Customer Service Agent
- **Responsibility:** FAQs, general assistance, sentiment handling.
- **Tools:** `knowledge_base_search(query)`.
- **Memory:** Last 5 exchanges.

### Booking Agent
- **Responsibility:** Flight/Hotel/Hajj package lookup and reservation.
- **Tools:** `list_packages(filters)`, `check_availability(id)`, `create_draft_booking(data)`.

### Visa Agent
- **Responsibility:** Requirements, status checks, application assistance.
- **Tools:** `get_visa_rules(country)`, `track_application(passport_no)`.

### Finance Agent
- **Responsibility:** Payments, invoices, installments, refund policy.
- **Tools:** `calculate_quote(package_id)`, `get_payment_status(customer_id)`, `validate_receipt(url)`.

### OCR Agent
- **Responsibility:** Extract data from Passports, IDs, and Payment receipts.
- **Input:** Image URL.
- **Output:** Structured JSON with confidence scores.

### Knowledge Agent
- **Responsibility:** RAG operations over company-specific documents.
- **Tools:** `vector_search(query, namespace)`.

### Analytics Agent
- **Responsibility:** Internal reporting, performance tracking.
- **Tools:** `get_booking_stats()`, `get_revenue_report()`.

### Human Escalation Agent
- **Responsibility:** Transitioning from AI to human agent.
- **Logic:** Triggered when confidence < 0.6 or customer explicitly asks for a human.
- **Tools:** `notify_human_agent(session_id, summary)`.

## 3. Failure Handling & Confidence
- **Self-Correction:** Agents review their own output for JSON validity.
- **Circuit Breaker:** If an agent fails 3 times, escalate to Supervisor for rerouting or human intervention.
- **Confidence Score:** Each response must include a `confidence_score`. Threshold for auto-reply is 0.8.
