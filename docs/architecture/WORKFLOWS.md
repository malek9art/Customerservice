# Workflow Diagrams - TravelOS AI

## 1. Customer Inquiry & Booking Flow (WhatsApp)
1.  **Customer** sends WhatsApp message.
2.  **Webhook** triggers NestJS controller.
3.  **Supervisor Agent** analyzes intent.
4.  **IF (General Inquiry):** Knowledge Agent uses RAG to answer.
5.  **IF (Booking Inquiry):** Booking Agent checks available packages.
6.  **IF (Status Check):** CRM Agent queries Database for booking/visa status.
7.  **AI Response** sent back via WhatsApp.
8.  **IF (Complexity > Threshold):** Escalation to human employee via Notification Center.

## 2. Document Verification Flow
1.  **Customer** uploads Passport image.
2.  **AI (Document Agent)** runs OCR.
3.  **AI** validates data (Expiry date, Name match).
4.  **Database** updated with document metadata.
5.  **Employee** notified for final approval.

## 3. Financial Transaction Flow
1.  **AI Agent** provides quote.
2.  **Customer** agrees and pays (External or Uploads Receipt).
3.  **Finance Agent** validates receipt image.
4.  **Invoice** status updated to "Paid" or "Partial".
5.  **Booking** status moves to "Processing".
