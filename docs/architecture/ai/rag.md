# Knowledge & RAG Architecture - TravelOS AI

## 1. Data Ingestion Pipeline
- **Sources:** PDF, Docx, TXT, Website URLs, Manual FAQ entry.
- **Workflow:** 
    1. Upload to `Knowledge Source`.
    2. **Approval Workflow:** Admin must "Approve for AI" before indexing.
    3. **Chunking:** Semantic chunking (by paragraph/header) with overlap.
    4. **Embedding:** `text-embedding-3-small` (OpenAI) or `multilingual-e5-large`.

## 2. Storage & Retrieval
- **Vector DB:** pgvector (PostgreSQL) for unified storage.
- **Indexing:** HNSW index for high-speed approximate nearest neighbor search.
- **Metadata:** Store `company_id`, `source_id`, `category`, `language`, and `version`.

## 3. Hybrid Search Strategy
- **BM25 (Keyword Search):** For exact matches (e.g., flight numbers, specific dates).
- **Vector Search:** For semantic meaning (e.g., "What are the rules for Hajj?").
- **Re-ranking:** Use a Cross-Encoder (e.g., Cohere ReRank) to score top 10 results.

## 4. Knowledge Lifecycle
- **Versioning:** Archive old chunks when a document is updated.
- **Caching:** Semantic cache (Redis) for identical queries within the same company.
- **Feedback Loop:** AI responses flagged as "Incorrect" by humans trigger a knowledge base review.
