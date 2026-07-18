# AI Agent Design Document - TravelOS AI

## Agent Orchestration: Supervisor Pattern

### 1. Supervisor Agent
- **Role:** The Brain / Router.
- **Responsibilities:**
    - Parse user intent.
    - Maintain session state.
    - Delegate to specialized agents.
    - Consolidate final output.
- **Tools:** `delegate_to_agent(agent_name, task)`.

### 2. Specialized Agents
#### Customer Service Agent
- **Focus:** General FAQs, Company info, Etiquette.
- **Tools:** `get_company_faq()`, `get_office_location()`.

#### Booking Agent
- **Focus:** Availability, Pricing, Package details.
- **Tools:** `search_packages()`, `get_package_details(id)`, `check_availability(package_id)`.

#### Visa Agent
- **Focus:** Visa requirements, Status tracking, Application help.
- **Tools:** `get_visa_requirements(country)`, `track_visa_status(passport_no)`.

#### Hajj & Umrah Agent
- **Focus:** Ritual instructions, Specific package details, Group timings.
- **Tools:** `get_hajj_rituals()`, `get_umrah_package_details()`.

#### Finance Agent
- **Focus:** Quotations, Payments, Installments, Receipt validation.
- **Tools:** `generate_quote()`, `validate_payment_receipt(image_url)`, `get_balance(customer_id)`.

#### CRM/Status Agent
- **Focus:** Customer records, Application updates.
- **Tools:** `get_customer_profile()`, `get_application_status()`.

### 3. Agent Communication
- Agents use **Structured JSON Output** to communicate with the system.
- Shared Context: `session_id`, `customer_id`, `company_id`.

### 4. Logic & Dialects
- **Language Models:** GPT-4o / Claude 3.5 Sonnet / Gemini 1.5 Pro.
- **System Prompts:** Configured per agent with specific instructions for Yemeni/Saudi dialects and professional Arabic.
- **Confidence Scoring:** If an agent's confidence < 0.7, trigger human escalation.
