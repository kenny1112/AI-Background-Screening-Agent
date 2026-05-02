const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

async function saveScreening(type, candidateName, inputData, result) {
  const query = `
    INSERT INTO screenings 
      (type, candidate_name, input_data, risk_level, summary, flags, scores, recommendations)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  const values = [
    type,
    candidateName,
    JSON.stringify(inputData),
    result.risk_level,
    result.summary,
    JSON.stringify(result.flags),
    JSON.stringify(result.scores),
    JSON.stringify(result.recommendations)
  ];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function getHistory(limit = 20) {
  const query = `
    SELECT * FROM screenings
    ORDER BY created_at DESC
    LIMIT $1
  `;
  const { rows } = await pool.query(query, [limit]);
  return rows;
}

module.exports = { saveScreening, getHistory };