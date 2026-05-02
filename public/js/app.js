/* ── app.js — Fetch + Toast + Shared UI ── */

const API = '';

/* ── Toast ── */
function showToast(type, title, desc = '') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✓', error: '✗', info: 'i' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || 'i'}</div>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      ${desc ? `<div class="toast-desc">${desc}</div>` : ''}
    </div>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ── Risk helpers ── */
function getRiskClass(level) {
  const l = (level || '').toLowerCase();
  if (l === 'low') return 'risk-low';
  if (l === 'medium') return 'risk-medium';
  return 'risk-high';
}

function getBarColor(val) {
  if (val >= 7) return '#22c55e';
  if (val >= 4) return '#eab308';
  return '#ef4444';
}

function getInitials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

/* ── Render result card ── */
function renderResult(containerId, data) {
  const riskClass = getRiskClass(data.risk_level);
  const scores = data.scores || {};
  const ref = 'REF: #' + Math.random().toString(36).slice(2,8).toUpperCase() + '-AI';

  const scoresHtml = Object.entries(scores).map(([key, val]) => {
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const pct = val * 10;
    return `
      <div class="score-row">
        <span class="score-label-text">${label}</span>
        <div class="score-bar-bg">
          <div class="score-bar-fill" style="width:0%;background:${getBarColor(val)}" data-target="${pct}"></div>
        </div>
        <span class="score-pct">${pct}%</span>
      </div>`;
  }).join('');

  const flagsHtml = (data.flags || []).map(f => `<span class="flag-tag">${f}</span>`).join('');

  const recsHtml = (data.recommendations || []).map((r, i) => `
    <li class="rec-item">
      <span class="rec-icon">${i + 1}</span>
      <span>${r}</span>
    </li>`).join('');

  document.getElementById(containerId).innerHTML = `
    <div class="result-header">
      <div>
        <div class="result-title">Analysis Result</div>
        <div class="result-ref">${ref}</div>
      </div>
      <span class="risk-badge ${riskClass}">${data.risk_level} Risk</span>
    </div>
    <div class="score-section">
      ${scoresHtml}
    </div>
    <hr class="divider-light">
    <div class="section-label" style="margin-bottom:8px">Summary</div>
    <div class="summary-box">${data.summary}</div>
    ${flagsHtml ? `
      <div class="section-label" style="margin-bottom:8px">Flags Detected</div>
      <div class="flags-wrap" style="margin-bottom:20px">${flagsHtml}</div>` : ''}
    <div class="section-label" style="margin-bottom:10px">Recommendations</div>
    <ul class="rec-list">${recsHtml}</ul>`;

  /* Animate bars */
  setTimeout(() => {
    document.querySelectorAll(`#${containerId} .score-bar-fill`).forEach(bar => {
      bar.style.width = bar.dataset.target + '%';
    });
  }, 100);
}

/* ── POST /api/analyze-candidate ── */
async function runAnalyze() {
  const name = document.getElementById('name').value.trim();
  const role = document.getElementById('role').value.trim();
  if (!name || !role) {
    showToast('error', 'Required fields missing', 'Please enter candidate name and role.');
    return;
  }

  const btn = document.getElementById('analyze-btn');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-color:rgba(255,255,255,0.3);border-top-color:#fff"></div> Analyzing...';

  document.getElementById('result-panel').innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      Running deep-AI analysis...
    </div>`;

  try {
    const res = await fetch(`${API}/api/analyze-candidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, role,
        experience: document.getElementById('experience').value,
        education: document.getElementById('education').value,
        employment_history: document.getElementById('employment').value,
        notes: document.getElementById('notes').value
      })
    });
    const json = await res.json();
    if (json.success) {
      renderResult('result-panel', json.data);
      showToast('success', 'Analysis complete', `Risk level: ${json.data.risk_level}`);
    } else {
      document.getElementById('result-panel').innerHTML = `<div class="loading-state" style="color:#ef4444">Error: ${json.error}</div>`;
      showToast('error', 'Analysis failed', json.error);
    }
  } catch (err) {
    document.getElementById('result-panel').innerHTML = `<div class="loading-state" style="color:#ef4444">Connection error</div>`;
    showToast('error', 'Connection error', err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Run Deep-AI Analysis';
  }
}

/* ── POST /api/check-risk ── */
async function runRisk() {
  const name = document.getElementById('risk-name').value.trim();
  const concern = document.getElementById('risk-concern').value.trim();
  if (!name || !concern) {
    showToast('error', 'Required fields missing', 'Please enter candidate name and concern.');
    return;
  }

  const btn = document.getElementById('risk-btn');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-color:rgba(255,255,255,0.3);border-top-color:#fff"></div> Checking...';

  document.getElementById('risk-result-panel').innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      Running precision risk analysis...
    </div>`;

  try {
    const res = await fetch(`${API}/api/check-risk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, concern,
        industry: document.getElementById('risk-industry').value,
        seniority: document.getElementById('risk-seniority').value
      })
    });
    const json = await res.json();
    if (json.success) {
      renderResult('risk-result-panel', json.data);
      showToast('success', 'Risk check complete', `Risk level: ${json.data.risk_level}`);
    } else {
      document.getElementById('risk-result-panel').innerHTML = `<div class="loading-state" style="color:#ef4444">Error: ${json.error}</div>`;
      showToast('error', 'Risk check failed', json.error);
    }
  } catch (err) {
    document.getElementById('risk-result-panel').innerHTML = `<div class="loading-state" style="color:#ef4444">Connection error</div>`;
    showToast('error', 'Connection error', err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Check Risk Profile';
  }
}

/* ── GET /api/history ── */
async function loadHistory() {
  const list = document.getElementById('history-table-body');
  if (!list) return;
  list.innerHTML = `<tr><td colspan="5"><div class="loading-state"><div class="spinner"></div>Loading history...</div></td></tr>`;

  try {
    const res = await fetch(`${API}/api/history`);
    const json = await res.json();
    if (!json.success || !json.data.length) {
      list.innerHTML = `<tr><td colspan="5">
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <h3>No screenings yet</h3>
          <p>Run your first analysis to see results here.</p>
        </div></td></tr>`;
      updateHistoryStats(0, 0, 0);
      return;
    }
    updateHistoryStats(json.data.length, json.data.filter(h => h.risk_level === 'Low').length, 0);
    list.innerHTML = json.data.map(h => {
      const initials = getInitials(h.candidate_name);
      const date = new Date(h.created_at).toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit' });
      const typeLabel = h.type === 'analyze' ? 'Full Professional Check' : 'Risk Profile Check';
      return `
        <tr>
          <td>
            <div class="candidate-cell">
              <div class="candidate-avatar">${initials}</div>
              <div>
                <div class="candidate-name">${h.candidate_name}</div>
                <div class="candidate-email">${h.type} screening</div>
              </div>
            </div>
          </td>
          <td>${typeLabel}</td>
          <td><span class="risk-badge ${getRiskClass(h.risk_level)}">${h.risk_level}</span></td>
          <td>${date}</td>
          <td>
            <button class="view-btn" title="View details">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </td>
        </tr>`;
    }).join('');
    showToast('success', 'History loaded', `${json.data.length} screening records`);
  } catch (err) {
    list.innerHTML = `<tr><td colspan="5"><div class="loading-state" style="color:#ef4444">Error loading history</div></td></tr>`;
    showToast('error', 'Failed to load history', err.message);
  }
}

function updateHistoryStats(total, completed, pending) {
  const t = document.getElementById('stat-total');
  const c = document.getElementById('stat-completed');
  const p = document.getElementById('stat-pending');
  if (t) t.textContent = total.toLocaleString();
  if (c) c.textContent = completed;
  if (p) p.textContent = pending;
}

/* ── Demo fillers ── */
function fillAnalyzeDemo() {
  document.getElementById('name').value = 'Kenny Chung';
  document.getElementById('role').value = 'Developer';
  document.getElementById('experience').value = '3';
  document.getElementById('education').value = "Computer Science Degree";
  document.getElementById('employment').value = '2023-2025 Engineer at Smartone';
  document.getElementById('notes').value = 'Cannot verify location. References unreachable.';
  showToast('info', 'Demo loaded', 'Click Run Analysis to see AI results.');
}

function fillRiskDemo() {
  document.getElementById('risk-name').value = 'Sam Reeves';
  document.getElementById('risk-concern').value = '14-month employment gap, unverifiable startup claim';
  document.getElementById('risk-industry').value = 'Finance / Banking';
  document.getElementById('risk-seniority').value = 'Senior (7+ yrs)';
  showToast('info', 'Demo loaded', 'Click Check Risk Profile to see results.');
}