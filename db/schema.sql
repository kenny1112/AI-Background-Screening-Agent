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

-- 常用查詢：getHistory 按時間倒序
CREATE INDEX idx_screenings_created_at ON screenings (created_at DESC);

-- 可選：若需要按候選人查歷史
CREATE INDEX idx_screenings_candidate_name ON screenings (candidate_name);