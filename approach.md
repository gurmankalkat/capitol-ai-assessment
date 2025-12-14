# Approach

- Focused on API + pipeline + shipped UI to keep deployment simple on Render with one container 
- Prioritized making the pipeline runnable in two ways: directly via Python CLI for power users, and via the API for the web UI
- Documented env-driven behavior and defaults so the same code works locally and in hosted environments 

## Key Decisions
- The document pipeline runs in Python, while the Node API handles requests and triggers the pipeline when needed
- The app automatically uses the correct Python environment in both local development and production
- Each pipeline run uses its own temporary files to avoid conflicts when multiple runs happen at the same time

### Technology/Tool Choices
- **Frontend: Vite + React + TypeScript + shadcn-ui + Tailwind**
    - Fast builds, type safety, and reusable UI components with minimal styling overhead
- **Backend: Node.js + Express + TypeScript** 
    - Lightweight API server with type safety that serves the SPA and triggers the Python pipeline
- **Pipeline: Python 3 + BeautifulSoup + SentenceTransformers/OpenAI + Qdrant client** 
    - Python-based document processing and embeddings with flexible providers and direct Qdrant uploads
- **Build/Deploy: Multi-stage Dockerfile (frontend + API + Python venv)**
    - Single production image that builds the frontend and backend and includes a Python virtual environment for reliable pipeline execution

### Trade-Offs
- Using one Docker image makes deployment easier, but results in a larger image and requires redeploying everything for any change
- In-memory cache is fast but resets on restart and is not synced back from Qdrant
- Simple HTML stripping yields clean text but loses rich formatting/structure
- Loading full input JSON in memory simplifies implementation but limits very large batches without chunking

## Architectural Decisions
- The Express server provides /health, /api/documents, and /api/pipeline endpoints
- `pipeline.py` is a standalone CLI; the API invokes it by shelling out and passing JSON paths
- Environment variables control embedding provider, whether to skip embeddings, and whether to push to Qdrant

### API Documentation
- **GET `/health`**  
  - Purpose: liveness check.  
  - Response: `200 OK` → `{ "status": "ok" }`

- **GET `/api/documents`**  
  - Purpose: fetch the last transformed documents held in memory.  
  - Response: `200 OK` → array of documents.

- **POST `/api/documents`**  
  - Purpose: replace the in-memory documents with your payload.  
  - Body: JSON array of documents `{ text, embedding?, metadata }`.  
  - Responses: `201 Created` → `{ stored: <count> }`; `400` if body is not an array.
  - Note: UI reads via `GET /api/documents`; it does not call this endpoint. 

- **POST `/api/pipeline`**  
  - Purpose: run `pipeline.py` on an array of CMS documents, optionally generating embeddings and uploading to Qdrant.  
  - Body: JSON array of raw CMS documents.  
  - Env-driven behavior:
    - `PIPELINE_SKIP_EMBEDDINGS=false` → generate embeddings; otherwise skip.
    - `PIPELINE_PROVIDER=openai|sentence-transformers` → choose embedding backend.
    - `QDRANT_URL`, `QDRANT_API_KEY` → if set, upload vectors to Qdrant; otherwise skip upload.  
  - Responses: `201 Created` → `{ stored, outputPath, message, documents }`; `400` if body is not an array; `500` on pipeline failure.

## Limitations 
- In-memory cache only: the `documents` array resets on restart (Qdrant vectors persist, but the API doesn’t reload them)
- HTML stripping is basic: nested/complex tags may lose structure
- No handling for very long documents (>10K tokens) beyond embedding provider limits
- Large batches (1000+ docs) may need memory/throughput tuning or chunking
- No authentication/authorization on API or UI
- No automated tests or CI included

### With More Time...
- Add auth and rate limiting to API endpoints
- Provide structured logging and better error reporting for pipeline runs
- Add unit/integration tests and CI workflow
- Add configurable retries/backoff for OpenAI/Qdrant calls
- Expose a background job/queue for large uploads and progress tracking

## Challenges and Interesting Problems
- Diagnosed “Cannot GET /” on Render: missing built frontend in the image and no static serving in Express.
- Bridging Node and Python: ensured the API finds the right Python binary/venv and passes paths cleanly.
-  HTML normalization: stripping tags without destroying content; settled on BeautifulSoup + newline separators knowing it loses layout but keeps readable text for embeddings
- Long/complex documents: needed to validate ISO timestamps, dedupe taxonomy fields, and guard against embedding dimension mismatches; added validators and skip-with-warning behavior
