# Workflow Engine & Business Rules - TravelOS AI

## 1. Business Rules Engine (BRE)
The BRE allows admins to define travel-specific logic without coding.
- **Rule Structure:** 
  ```json
  {
    "id": "rule_1",
    "trigger": "VISA_PRICE_REQUEST",
    "conditions": { "country": "Saudi Arabia", "type": "Umrah" },
    "outcome": { "base_fee": 300, "currency": "SAR", "vat": 0.15 }
  }
  ```
- **Execution:** NestJS service evaluates rules using `json-logic-js` or similar.

## 2. Core Workflows
### Visa Processing
1. **Submission:** Customer uploads docs via WhatsApp.
2. **Validation:** OCR Agent validates passport validity.
3. **Task Creation:** Internal task created for "Visa Officer".
4. **Tracking:** Customer queries AI -> CRM Agent checks DB status.

### Payment & Installments
1. **Quotation:** Finance Agent generates quote based on BRE rules.
2. **Receipt Upload:** Customer sends photo of bank transfer.
3. **Verification:** OCR Agent + Finance Agent verify details.
4. **Approval:** Human admin confirms funds.
5. **Update:** Booking status -> "Confirmed".

### Approval Chain
- Multi-step approval for large refunds or special discounts.
- Triggered by BRE when discount > 20%.
- Notifications sent to Branch Manager.
