const { Pool } = require('pg');

/* Render / cloud Postgres requires TLS; local postgres usually does not */
function sslForDatabaseUrl(url) {
  if (!url) return false;
  return /localhost|127\.0\.0\.1/i.test(url)
    ? false
    : { rejectUnauthorized: false };
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslForDatabaseUrl(process.env.DATABASE_URL),
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

async function postScreening(type, candidateName, inputData, result) {
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

async function getScreenings(limit = 20) {
  const query = `
    SELECT * FROM screenings
    ORDER BY created_at DESC
    LIMIT $1
  `;
  const { rows } = await pool.query(query, [limit]);
  return rows;
}

async function putScreening(id, fields) {
  const { risk_level, summary, flags, scores, recommendations } = fields;
  const { rows } = await pool.query(
    `UPDATE screenings SET
      risk_level = COALESCE($1, risk_level),
      summary = COALESCE($2, summary),
      flags = COALESCE($3, flags),
      scores = COALESCE($4, scores),
      recommendations = COALESCE($5, recommendations)
    WHERE id = $6 RETURNING *`,
    [risk_level, summary, flags, scores, recommendations, id]
  );
  return rows[0] || null;
}

async function deleteScreening(id) {
  const { rows } = await pool.query(
    `DELETE FROM screenings WHERE id = $1 RETURNING *`, [id]
  );
  return rows[0] || null;
}

module.exports = {
  postScreening,
  getScreenings,
  putScreening,
  deleteScreening,
  saveScreening: postScreening,
  getHistory: getScreenings,
  updateScreening: putScreening,
};