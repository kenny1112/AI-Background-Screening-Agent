# AI Background Screening Agent

An automated background screening tool powered by Google Gemini. Submit candidate information and get back a structured risk assessment — including risk level, flags, scores, and recommendations — in seconds.

---

## What It Does

- Analyses candidate profiles (employment history, education, role fit)
- Returns a structured risk report: `Low` / `Medium` / `High`
- Scores candidates across four dimensions: employment continuity, credential credibility, reference reachability, and role seniority fit
- Supports a targeted risk check mode for specific concerns
- Persists every screening to PostgreSQL for audit history

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express |
| AI | Google Gemini API (`gemini-2.5-flash`) |
| Database | PostgreSQL (via `pg`) |
| Hosting | Render |

---

## How to Run

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
DATABASE_URL=postgresql://user:password@host/dbname
NODE_ENV=development
```

> For local development, use the **External Database URL** from Render.  
> For production on Render, use the **Internal Database URL**.

### 3. Run database migration

```bash
node migrate.js
```

### 4. Start the server

```bash
node index.js
```

Server runs on `http://localhost:3000`.

---

## API

### `POST /api/analyze-candidate`

Full candidate profile analysis.

**Request**

```json
{
  "name": "Jane Smith",
  "role": "Senior Engineer",
  "experience": 6,
  "education": "BSc Computer Science, HKU",
  "employment_history": "Google 3yr, Meta 3yr",
  "notes": "Left Meta voluntarily"
}
```

**Response**

```json
{
  "success": true,
  "result": {
    "risk_level": "Low",
    "summary": "Candidate demonstrates strong, continuous employment at reputable firms with no significant gaps or credential concerns. Role and seniority are well-aligned.",
    "flags": [],
    "scores": {
      "employment_continuity": 9,
      "credential_credibility": 8,
      "reference_reachability": 7,
      "role_seniority_fit": 9
    },
    "recommendations": [
      "Verify degree certificate with HKU",
      "Contact references at Google and Meta"
    ]
  }
}
```

---

### `POST /api/check-risk`

Targeted risk check for a specific concern.

**Request**

```json
{
  "name": "John Doe",
  "industry": "Finance",
  "seniority": "Director",
  "concern": "Unexplained 18-month employment gap in 2022"
}
```

**Response**

```json
{
  "success": true,
  "result": {
    "risk_level": "Medium",
    "summary": "The employment gap warrants clarification but is not uncommon at director level. No fraud or credential issues detected.",
    "flags": [
      "Employment gap 2022 (18 months) — unverified reason"
    ],
    "scores": {
      "employment_continuity": 5,
      "credential_credibility": 8,
      "reference_reachability": 6,
      "role_seniority_fit": 8
    },
    "recommendations": [
      "Request written explanation of the gap period",
      "Verify references from most recent employer"
    ]
  }
}
```

---

### `GET /api/history`

Returns the 20 most recent screenings.

**Response**

```json
{
  "success": true,
  "history": [
    {
      "id": 1,
      "type": "analyze",
      "candidate_name": "Jane Smith",
      "risk_level": "Low",
      "summary": "...",
      "flags": [],
      "scores": { ... },
      "recommendations": [...],
      "created_at": "2026-05-02T08:00:00.000Z"
    }
  ]
}
```

---

## Database Schema

```sql
CREATE TABLE screenings (
  id               SERIAL PRIMARY KEY,
  type             VARCHAR(50)  NOT NULL,
  candidate_name   VARCHAR(255) NOT NULL,
  input_data       JSONB        NOT NULL,
  risk_level       VARCHAR(20)  NOT NULL CHECK (risk_level IN ('Low', 'Medium', 'High')),
  summary          TEXT         NOT NULL,
  flags            JSONB        NOT NULL DEFAULT '[]',
  scores           JSONB        NOT NULL DEFAULT '{}',
  recommendations  JSONB        NOT NULL DEFAULT '[]',
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```