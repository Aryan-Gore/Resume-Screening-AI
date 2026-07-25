/* =============================================================================
   Resume Screening AI — frontend logic
   =============================================================================
   No framework/build step by design — plain fetch() calls against the Flask
   API in app.py, and direct DOM updates. Organized into:

     1. App state
     2. Small DOM / formatting utilities
     3. Toasts + button loading state
     4. API helper (fetch wrapper with consistent error handling)
     5. The gauge — the one signature visual element, reused for every score
     6. Wizard step navigation
     7. Step 1 — job description
     8. Step 2 — resumes (queue -> pool)
     9. Step 3 — weight calibration
    10. Step 4 — results (table, charts, candidate modal, CSV export)
    11. Sample data (lets someone try the whole flow with one click)
    12. Init
   ========================================================================== */

/* ---------- 1. App state ---------- */
const state = {
  currentStep: 1,
  maxReached: 1,          // furthest step (1-3) the user has unlocked by completing the one before it
  analyzed: false,         // true only while results match the current JD + resumes + weights

  jd: { loaded: false, pendingFile: null },

  resumeQueue: [],         // items added locally, not yet POSTed to the server
  resumePool: [],          // server-confirmed candidates (mirrors ResumeScreeningAI.resumes_data)

  results: [],             // last calculate_final_scores() response
  sort: { key: 'Rank', dir: 'asc' },
  searchQuery: '',
};

let chartsLoaded = { rankings: false, skills: false, distribution: false, summary: false };
let queueIdCounter = 0;

const NUMERIC_SORT_KEYS = new Set([
  'Rank', 'Final_Score', 'Text_Similarity', 'Skill_Match',
  'Experience_Score', 'Education_Score', 'Years_Experience',
]);
const DEFAULT_DESC_SORT_KEYS = new Set([
  'Final_Score', 'Text_Similarity', 'Skill_Match', 'Experience_Score', 'Education_Score', 'Years_Experience',
]);
const WEIGHT_KEYS = ['text_similarity', 'skill_match', 'experience', 'education'];
const DEFAULT_WEIGHTS_PCT = { text_similarity: 40, skill_match: 30, experience: 20, education: 10 };


/* ---------- 2. DOM / formatting utilities ---------- */
function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value);
  return div.innerHTML;
}
function escapeAttr(value) {
  return String(value).replace(/"/g, '&quot;');
}
function pct(n) {
  const num = Number(n);
  return `${num.toFixed(1)}%`;
}


/* ---------- 3. Toasts + button loading state ---------- */
function toast(message, kind = 'default') {
  const container = qs('#toast-container');
  const el = document.createElement('div');
  el.className = `toast${kind === 'error' ? ' toast-error' : kind === 'success' ? ' toast-success' : ''}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add('toast-out');
    setTimeout(() => el.remove(), 220);
  }, 4200);
}

function setBtnLoading(btn, isLoading, loadingText) {
  if (isLoading) {
    btn.dataset.originalHtml = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span><span>${escapeHtml(loadingText || 'Working…')}</span>`;
    btn.disabled = true;
  } else {
    if (btn.dataset.originalHtml) {
      btn.innerHTML = btn.dataset.originalHtml;
      delete btn.dataset.originalHtml;
    }
    btn.disabled = false;
    lucide.createIcons();
  }
}


/* ---------- 4. API helper ---------- */
/**
 * Thin wrapper around fetch() that talks to the Flask API. On failure it
 * shows a toast with the server's error message (see ApiError in app.py)
 * and returns null, so callers can just do `if (!res) return;`.
 */
async function api(method, url, { json, formData } = {}) {
  try {
    const opts = { method };
    if (json !== undefined) {
      opts.headers = { 'Content-Type': 'application/json' };
      opts.body = JSON.stringify(json);
    } else if (formData !== undefined) {
      opts.body = formData; // browser sets the multipart boundary header itself
    }
    const resp = await fetch(url, opts);
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      toast(data.error || `Request failed (HTTP ${resp.status})`, 'error');
      return null;
    }
    return data;
  } catch (err) {
    toast('Could not reach the server. Is app.py still running?', 'error');
    return null;
  }
}


/* ---------- 5. Gauge — signature scoring element ---------- */
/**
 * Builds a radial "instrument" gauge as an SVG string: a ring showing
 * `percent` filled, optional quarter tick marks, optional centered value
 * label. Used small (no label) inline in table rows, and large (with
 * ticks + label + animate) in the candidate modal.
 */
function buildGaugeSVG(percent, opts = {}) {
  const size = opts.size || 64;
  const strokeWidth = opts.strokeWidth || 6;
  const showTicks = !!opts.showTicks;
  const showLabel = opts.showLabel !== false;
  const animate = !!opts.animate;
  const labelSize = opts.labelSize || size / 4.2;

  const cx = size / 2;
  const cy = size / 2;
  const r = Math.max((size - strokeWidth) / 2 - (showTicks ? 7 : 0), 1);
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const targetOffset = circumference * (1 - clamped / 100);
  const initialOffset = animate ? circumference : targetOffset;

  let ticks = '';
  if (showTicks) {
    [0, 0.25, 0.5, 0.75].forEach((f) => {
      const angle = -90 + f * 360;
      const rad = (angle * Math.PI) / 180;
      const x1 = cx + (r + strokeWidth / 2 + 2) * Math.cos(rad);
      const y1 = cy + (r + strokeWidth / 2 + 2) * Math.sin(rad);
      const x2 = cx + (r + strokeWidth / 2 + 7) * Math.cos(rad);
      const y2 = cy + (r + strokeWidth / 2 + 7) * Math.sin(rad);
      ticks += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" class="gauge-tick" stroke-width="2" stroke-linecap="round"></line>`;
    });
  }

  const label = showLabel
    ? `<text x="${cx}" y="${cy + labelSize * 0.34}" text-anchor="middle" class="gauge-value" font-size="${labelSize}">${Math.round(clamped)}</text>
       <text x="${cx}" y="${cy + labelSize * 0.34 + labelSize * 0.62}" text-anchor="middle" class="gauge-value-sub" font-size="${Math.max(8, labelSize * 0.26)}">${escapeHtml(opts.subLabel || '')}</text>`
    : '';

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${Math.round(clamped)} percent">
    ${ticks}
    <circle cx="${cx}" cy="${cy}" r="${r}" stroke-width="${strokeWidth}" class="gauge-track"></circle>
    <circle cx="${cx}" cy="${cy}" r="${r}" stroke-width="${strokeWidth}" class="gauge-fill"
      stroke-dasharray="${circumference.toFixed(2)}" stroke-dashoffset="${initialOffset.toFixed(2)}"
      data-target-offset="${targetOffset.toFixed(2)}" transform="rotate(-90 ${cx} ${cy})"></circle>
    ${label}
  </svg>`;
}

function mountGauge(container, percent, opts = {}) {
  container.innerHTML = buildGaugeSVG(percent, opts);
  if (opts.animate) {
    const fill = container.querySelector('.gauge-fill');
    if (fill) {
      const target = fill.getAttribute('data-target-offset');
      // two rAFs so the browser commits the "full circle" starting state
      // before the transition to the target is triggered
      requestAnimationFrame(() => requestAnimationFrame(() => {
        fill.style.strokeDashoffset = target;
      }));
    }
  }
}


/* ---------- 6. Wizard step navigation ---------- */
function goToStep(n) {
  state.currentStep = n;
  for (let i = 1; i <= 4; i++) {
    qs(`#panel-${i}`).classList.toggle('hidden', i !== n);
  }
  updateStepperStates();
  qs('#start-over-btn').classList.toggle('hidden', state.maxReached === 1 && !state.jd.loaded);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  lucide.createIcons();
}

function updateStepperStates() {
  for (let i = 1; i <= 4; i++) {
    const item = qs(`.step-nav-item[data-step="${i}"]`);
    const btn = item.querySelector('.step-nav-btn');
    const reachable = i === 4 ? state.analyzed : i <= state.maxReached;

    if (i === state.currentStep) {
      item.dataset.state = 'active';
      btn.disabled = false;
    } else if (reachable) {
      item.dataset.state = 'complete';
      btn.disabled = false;
    } else {
      item.dataset.state = 'locked';
      btn.disabled = true;
    }
  }
}

/** Any edit to the JD or the candidate pool invalidates whatever is on
 * Step 4, since it no longer reflects what calculate_final_scores() would
 * produce now. This just locks step 4 back up until analysis reruns. */
function invalidateResults() {
  state.analyzed = false;
  chartsLoaded = { rankings: false, skills: false, distribution: false, summary: false };
  updateStepperStates();
}

qsa('.step-nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.disabled) return;
    goToStep(parseInt(btn.dataset.target, 10));
  });
});

qs('#start-over-btn').addEventListener('click', async () => {
  const res = await api('POST', '/api/reset');
  if (!res) return;
  location.reload();
});


/* ---------- 7. Step 1 — job description ---------- */
const jdTextarea = qs('#jd-textarea');
const jdFileInput = qs('#jd-file-input');
const jdDropzone = qs('#jd-dropzone');

qsa('#panel-1 .jd-tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    qsa('#panel-1 .jd-tab-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    qs('#jd-paste-panel').classList.toggle('hidden', tab !== 'paste');
    qs('#jd-upload-panel').classList.toggle('hidden', tab !== 'upload');
    updateJdSubmitEnabled();
  });
});

jdTextarea.addEventListener('input', () => {
  const words = jdTextarea.value.trim().split(/\s+/).filter(Boolean);
  qs('#jd-word-count').textContent = `${words.length} word${words.length === 1 ? '' : 's'}`;
  markJdDirty();
  updateJdSubmitEnabled();
});

jdFileInput.addEventListener('change', () => {
  if (!jdFileInput.files.length) return;
  setJdPendingFile(jdFileInput.files[0]);
});

['dragover', 'dragleave', 'drop'].forEach((evt) => {
  jdDropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    jdDropzone.classList.toggle('drag-over', evt === 'dragover');
    if (evt === 'drop' && e.dataTransfer.files.length) {
      setJdPendingFile(e.dataTransfer.files[0]);
    }
  });
});

function setJdPendingFile(file) {
  state.jd.pendingFile = file;
  qs('#jd-file-name').textContent = file.name;
  qs('#jd-file-name').classList.remove('hidden');
  markJdDirty();
  updateJdSubmitEnabled();
}

function markJdDirty() {
  if (state.jd.loaded) {
    state.jd.loaded = false;
    qs('#jd-confirmation').classList.add('hidden');
    qs('#jd-submit-btn').querySelector('.btn-label').textContent = 'Analyze role';
    invalidateResults();
  }
}

function updateJdSubmitEnabled() {
  if (state.jd.loaded) { qs('#jd-submit-btn').disabled = false; return; }
  const activeTab = qs('#panel-1 .jd-tab-btn.active').dataset.tab;
  const hasPaste = jdTextarea.value.trim().length >= 30;
  const hasFile = !!state.jd.pendingFile;
  qs('#jd-submit-btn').disabled = !(activeTab === 'paste' ? hasPaste : hasFile);
}

qs('#load-sample-jd').addEventListener('click', (e) => {
  e.preventDefault();
  jdTextarea.value = SAMPLE_JD;
  jdTextarea.dispatchEvent(new Event('input'));
});

qs('#jd-submit-btn').addEventListener('click', async () => {
  if (state.jd.loaded) {
    state.maxReached = Math.max(state.maxReached, 2);
    goToStep(2);
    return;
  }

  const btn = qs('#jd-submit-btn');
  setBtnLoading(btn, true, 'Analyzing role…');

  const activeTab = qs('#panel-1 .jd-tab-btn.active').dataset.tab;
  let res;
  if (activeTab === 'upload' && state.jd.pendingFile) {
    const fd = new FormData();
    fd.append('file', state.jd.pendingFile);
    res = await api('POST', '/api/job-description', { formData: fd });
  } else {
    res = await api('POST', '/api/job-description', { json: { text: jdTextarea.value } });
  }

  setBtnLoading(btn, false);
  if (!res) { updateJdSubmitEnabled(); return; }

  state.jd.loaded = true;
  showJdConfirmation(res);
  btn.querySelector('.btn-label').textContent = 'Continue to candidates';
  btn.disabled = false;
  state.maxReached = Math.max(state.maxReached, 2);
  updateStepperStates();
  toast(res.message, 'success');
});

function showJdConfirmation(res) {
  qs('#jd-word-count-confirmed').textContent = res.word_count;
  const chips = [
    ...res.detected_skills.technical.map((s) => `<span class="chip chip-technical">${escapeHtml(s)}</span>`),
    ...res.detected_skills.soft.map((s) => `<span class="chip chip-soft">${escapeHtml(s)}</span>`),
  ];
  qs('#jd-skill-chips').innerHTML = chips.length
    ? chips.join('')
    : '<span class="text-xs text-muted-2 italic">No specific skills detected — scoring will lean on overall text similarity.</span>';
  qs('#jd-confirmation').classList.remove('hidden');
  lucide.createIcons();
}


/* ---------- 8. Step 2 — resumes ---------- */
const resumeFileInput = qs('#resume-file-input');
const resumeDropzone = qs('#resume-dropzone');

resumeFileInput.addEventListener('change', () => {
  Array.from(resumeFileInput.files).forEach((file) => addToQueue({ type: 'file', file, name: file.name }));
  resumeFileInput.value = '';
});

['dragover', 'dragleave', 'drop'].forEach((evt) => {
  resumeDropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    resumeDropzone.classList.toggle('drag-over', evt === 'dragover');
    if (evt === 'drop' && e.dataTransfer.files.length) {
      Array.from(e.dataTransfer.files).forEach((file) => addToQueue({ type: 'file', file, name: file.name }));
    }
  });
});

qs('#paste-add-btn').addEventListener('click', () => {
  const name = qs('#paste-name-input').value.trim();
  const text = qs('#paste-text-input').value.trim();
  if (!name || text.length < 20) {
    toast('Add a candidate name and at least a few lines of resume text.', 'error');
    return;
  }
  addToQueue({ type: 'paste', name, text });
  qs('#paste-name-input').value = '';
  qs('#paste-text-input').value = '';
});

function addToQueue(item) {
  item.id = `q${queueIdCounter++}`;
  state.resumeQueue.push(item);
  renderQueue();
}

function removeFromQueue(id) {
  state.resumeQueue = state.resumeQueue.filter((i) => i.id !== id);
  renderQueue();
}

function renderQueue() {
  qs('#queued-section').classList.toggle('hidden', state.resumeQueue.length === 0);
  qs('#queued-list').innerHTML = state.resumeQueue.map((item) => `
    <li class="card px-3 py-2 flex items-center justify-between">
      <div class="flex items-center gap-2 min-w-0">
        <i data-lucide="${item.type === 'file' ? 'file-text' : 'clipboard'}" class="w-4 h-4 text-muted-2 shrink-0"></i>
        <span class="text-sm text-paper truncate">${escapeHtml(item.name)}</span>
      </div>
      <button class="btn-icon" data-remove-queue="${item.id}" aria-label="Remove from queue"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>
    </li>
  `).join('');
  qsa('[data-remove-queue]').forEach((b) => b.addEventListener('click', () => removeFromQueue(b.dataset.removeQueue)));
  const n = state.resumeQueue.length;
  qs('#add-queued-btn').querySelector('.btn-label').textContent = `Add ${n} candidate${n === 1 ? '' : 's'} to pool`;
  lucide.createIcons();
}

qs('#add-queued-btn').addEventListener('click', async () => {
  if (!state.resumeQueue.length) return;
  const btn = qs('#add-queued-btn');
  setBtnLoading(btn, true, 'Adding candidates…');

  const fd = new FormData();
  const pastedItems = [];
  state.resumeQueue.forEach((item) => {
    if (item.type === 'file') fd.append('files', item.file);
    else pastedItems.push({ name: item.name, text: item.text });
  });
  if (pastedItems.length) fd.append('pasted', JSON.stringify(pastedItems));

  const res = await api('POST', '/api/resumes', { formData: fd });
  setBtnLoading(btn, false);
  if (!res) return;

  state.resumeQueue = [];
  renderQueue();
  state.resumePool = res.resumes;
  renderPool();
  invalidateResults();
  (res.warnings || []).forEach((w) => toast(w, 'error'));
  toast(res.message, 'success');
});

function renderPool() {
  qs('#loaded-count').textContent = state.resumePool.length;
  qs('#empty-pool-msg').classList.toggle('hidden', state.resumePool.length > 0);
  qs('#loaded-resumes-list').innerHTML = state.resumePool.map((r) => `
    <li class="card px-4 py-3 flex items-center justify-between gap-3">
      <div class="min-w-0">
        <p class="text-sm font-medium text-paper truncate">${escapeHtml(r.name)}</p>
        <p class="text-xs text-muted-2 mt-0.5 font-mono">
          ${r.word_count}w · ${r.years_of_experience}yrs · ${escapeHtml(r.education)} · ${r.technical_skills.length} tech / ${r.soft_skills.length} soft
        </p>
      </div>
      <button class="btn-icon shrink-0" data-remove-pool="${escapeAttr(r.name)}" aria-label="Remove candidate"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
    </li>
  `).join('');
  qsa('[data-remove-pool]').forEach((b) => b.addEventListener('click', () => removeFromPool(b.dataset.removePool)));
  qs('#resumes-continue-btn').disabled = state.resumePool.length === 0;
  lucide.createIcons();
}

async function removeFromPool(name) {
  const res = await api('DELETE', `/api/resumes?name=${encodeURIComponent(name)}`);
  if (!res) return;
  state.resumePool = res.resumes;
  renderPool();
  invalidateResults();
  toast(res.message, 'success');
}

qs('#resumes-continue-btn').addEventListener('click', () => {
  state.maxReached = Math.max(state.maxReached, 3);
  updateStepperStates();
  goToStep(3);
});

qs('#load-sample-resumes').addEventListener('click', (e) => {
  e.preventDefault();
  SAMPLE_RESUMES.forEach((r) => addToQueue({ type: 'paste', name: r.name, text: r.text }));
  qs('#add-queued-btn').click();
});


/* ---------- 9. Step 3 — weight calibration ---------- */
qsa('.weight-row').forEach((row) => {
  const slider = row.querySelector('.weight-slider');
  const valueEl = row.querySelector('.weight-value');
  slider.addEventListener('input', () => {
    valueEl.textContent = `${slider.value}%`;
    updateWeightTotal();
  });
});

function getWeightsPct() {
  const out = {};
  qsa('.weight-row').forEach((row) => { out[row.dataset.key] = parseInt(row.querySelector('.weight-slider').value, 10); });
  return out;
}

function updateWeightTotal() {
  const total = Object.values(getWeightsPct()).reduce((a, b) => a + b, 0);
  const el = qs('#weight-total-display');
  const label = qs('#weight-total-label');
  el.textContent = `${total}%`;
  const valid = total === 100;
  el.style.color = valid ? 'var(--signal-good)' : 'var(--signal-warn)';
  label.textContent = valid ? 'balanced' : (total > 100 ? `${total - 100}% over` : `${100 - total}% short`);
  qs('#analyze-btn').disabled = !valid;
}

qs('#weight-reset-btn').addEventListener('click', () => {
  qsa('.weight-row').forEach((row) => {
    const def = DEFAULT_WEIGHTS_PCT[row.dataset.key];
    row.querySelector('.weight-slider').value = def;
    row.querySelector('.weight-value').textContent = `${def}%`;
  });
  updateWeightTotal();
});

qs('#analyze-btn').addEventListener('click', async () => {
  const pctValues = getWeightsPct();
  if (Object.values(pctValues).reduce((a, b) => a + b, 0) !== 100) {
    toast('Weights must sum to 100% before running analysis.', 'error');
    return;
  }
  const weights = {};
  WEIGHT_KEYS.forEach((k) => { weights[k] = pctValues[k] / 100; });

  const btn = qs('#analyze-btn');
  setBtnLoading(btn, true, 'Running analysis…');
  const res = await api('POST', '/api/analyze', { json: { weights } });
  setBtnLoading(btn, false);
  if (!res) return;

  state.results = res.results;
  state.analyzed = true;
  chartsLoaded = { rankings: false, skills: false, distribution: false, summary: false };
  state.maxReached = Math.max(state.maxReached, 4);
  state.sort = { key: 'Rank', dir: 'asc' };

  renderStats();
  updateSortHeaderUI();
  renderTable();
  updateStepperStates();
  goToStep(4);
  toast('Analysis complete', 'success');
});


/* ---------- 10. Step 4 — results ---------- */

/* -- summary stat cards -- */
function renderStats() {
  const scores = state.results.map((r) => r.Final_Score);
  const total = scores.length;
  const avg = total ? scores.reduce((a, b) => a + b, 0) / total : 0;
  const top = total ? Math.max(...scores) : 0;
  const strong = scores.filter((s) => s >= 50).length;
  qs('#stat-total').textContent = total;
  qs('#stat-average').textContent = total ? pct(avg) : '—';
  qs('#stat-top').textContent = total ? pct(top) : '—';
  qs('#stat-strong').textContent = total ? strong : '—';
}

/* -- ranked table: sort + search + row -> modal -- */
function sortResults(list, key, dir) {
  return [...list].sort((a, b) => {
    let av = a[key];
    let bv = b[key];
    if (NUMERIC_SORT_KEYS.has(key)) {
      av = Number(av); bv = Number(bv);
      return dir === 'asc' ? av - bv : bv - av;
    }
    av = String(av).toLowerCase(); bv = String(bv).toLowerCase();
    if (av < bv) return dir === 'asc' ? -1 : 1;
    if (av > bv) return dir === 'asc' ? 1 : -1;
    return 0;
  });
}

function updateSortHeaderUI() {
  qsa('.results-table thead th').forEach((th) => {
    th.classList.toggle('sorted', th.dataset.sort === state.sort.key);
    const existing = th.querySelector('.sort-arrow');
    if (existing) existing.remove();
    if (th.dataset.sort === state.sort.key) {
      const arrow = document.createElement('span');
      arrow.className = 'sort-arrow';
      arrow.textContent = state.sort.dir === 'asc' ? '\u2191' : '\u2193';
      th.appendChild(arrow);
    }
  });
}

qsa('.results-table thead th').forEach((th) => {
  th.addEventListener('click', () => {
    const key = th.dataset.sort;
    if (state.sort.key === key) {
      state.sort.dir = state.sort.dir === 'asc' ? 'desc' : 'asc';
    } else {
      state.sort.key = key;
      state.sort.dir = DEFAULT_DESC_SORT_KEYS.has(key) ? 'desc' : 'asc';
    }
    updateSortHeaderUI();
    renderTable();
  });
});

qs('#search-input').addEventListener('input', (e) => {
  state.searchQuery = e.target.value;
  renderTable();
});

function renderTable() {
  const tbody = qs('#results-tbody');
  let list = state.results;
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.trim().toLowerCase();
    list = list.filter((r) => r.Candidate.toLowerCase().includes(q));
  }
  list = sortResults(list, state.sort.key, state.sort.dir);

  if (!list.length) {
    const msg = state.results.length ? `No candidates match "${escapeHtml(state.searchQuery)}"` : 'No results yet.';
    tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted-2 py-10 italic">${msg}</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((r) => `
    <tr data-name="${escapeAttr(r.Candidate)}" class="${r.Rank === 1 ? 'rank-first' : ''}">
      <td class="rank-cell num">#${r.Rank}</td>
      <td class="candidate-name-cell">
        <div class="flex items-center gap-2.5">
          <span class="gauge-mini" data-percent="${r.Final_Score}"></span>
          <span>${escapeHtml(r.Candidate)}</span>
        </div>
      </td>
      <td class="num font-semibold text-paper">${pct(r.Final_Score)}</td>
      <td class="num">${pct(r.Text_Similarity)}</td>
      <td class="num">${pct(r.Skill_Match)}</td>
      <td class="num">${pct(r.Experience_Score)}</td>
      <td class="num">${pct(r.Education_Score)}</td>
      <td class="num">${r.Years_Experience}</td>
      <td><span class="pill-education">${escapeHtml(r.Education_Level)}</span></td>
    </tr>
  `).join('');

  qsa('.gauge-mini', tbody).forEach((el) => {
    mountGauge(el, parseFloat(el.dataset.percent), { size: 34, strokeWidth: 4, showLabel: false });
  });
  qsa('tr[data-name]', tbody).forEach((tr) => {
    tr.addEventListener('click', () => openCandidateModal(tr.dataset.name));
  });
}

/* -- chart sub-views (each is a real ResumeScreeningVisualizer PNG) -- */
qsa('.result-tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    qsa('.result-tab-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const view = btn.dataset.view;
    qsa('.result-view').forEach((v) => v.classList.add('hidden'));
    const target = qs(`#view-${view}`);
    target.classList.remove('hidden');
    target.classList.add('fade-in');

    if (view === 'rankings' && !chartsLoaded.rankings) loadRankingsChart();
    if (view === 'skills' && !chartsLoaded.skills) loadSkillsChart();
    if (view === 'distribution' && !chartsLoaded.distribution) loadDistributionChart();
    if (view === 'summary' && !chartsLoaded.summary) loadSummaryChart();
  });
});

async function loadRankingsChart() {
  const topN = qs('#rankings-topn').value || 10;
  const frame = qs('#rankings-img').closest('.chart-frame');
  frame.style.opacity = '0.5';
  const data = await api('GET', `/api/chart/rankings?top_n=${encodeURIComponent(topN)}`);
  frame.style.opacity = '1';
  if (!data) return;
  qs('#rankings-img').src = data.image_url;
  chartsLoaded.rankings = true;
}
async function loadSkillsChart() {
  const topN = qs('#skills-topn').value || 5;
  const frame = qs('#skills-img').closest('.chart-frame');
  frame.style.opacity = '0.5';
  const data = await api('GET', `/api/chart/skills?top_n=${encodeURIComponent(topN)}`);
  frame.style.opacity = '1';
  if (!data) return;
  qs('#skills-img').src = data.image_url;
  chartsLoaded.skills = true;
}
async function loadDistributionChart() {
  const frame = qs('#distribution-img').closest('.chart-frame');
  frame.style.opacity = '0.5';
  const data = await api('GET', '/api/chart/distribution');
  frame.style.opacity = '1';
  if (!data) return;
  qs('#distribution-img').src = data.image_url;
  chartsLoaded.distribution = true;
}
async function loadSummaryChart() {
  const frame = qs('#summary-img').closest('.chart-frame');
  frame.style.opacity = '0.5';
  const data = await api('GET', '/api/chart/summary');
  frame.style.opacity = '1';
  if (!data) return;
  qs('#summary-img').src = data.image_url;
  chartsLoaded.summary = true;
}
qs('#rankings-refresh').addEventListener('click', loadRankingsChart);
qs('#skills-refresh').addEventListener('click', loadSkillsChart);

/* -- candidate detail modal -- */
async function openCandidateModal(name) {
  const modal = qs('#candidate-modal');
  const content = qs('#modal-content');
  modal.classList.remove('hidden');
  content.innerHTML = '<div class="flex items-center justify-center py-16"><div class="spinner"></div></div>';

  const [report, chart] = await Promise.all([
    api('GET', `/api/candidate?name=${encodeURIComponent(name)}`),
    api('GET', `/api/chart/breakdown?name=${encodeURIComponent(name)}`),
  ]);

  if (!report) { closeModal(); return; }

  content.innerHTML = `
    <div class="flex items-start justify-between mb-6">
      <div>
        <p class="font-mono text-xs text-muted-2 uppercase tracking-widest mb-1">Rank #${report.rank}</p>
        <h3 class="font-display text-2xl font-semibold text-paper">${escapeHtml(report.name)}</h3>
      </div>
      <button id="modal-close-btn" class="btn-icon" aria-label="Close"><i data-lucide="x" class="w-4 h-4"></i></button>
    </div>

    <div class="flex flex-col sm:flex-row gap-6 items-center sm:items-start mb-6">
      <div id="modal-gauge" class="shrink-0"></div>
      <div class="grid grid-cols-2 gap-3 flex-1 w-full">
        <div class="card p-3"><p class="text-[10px] text-muted-2 uppercase tracking-widest mb-1">Text similarity</p><p class="num text-lg text-paper">${pct(report.scores.text_similarity)}</p></div>
        <div class="card p-3"><p class="text-[10px] text-muted-2 uppercase tracking-widest mb-1">Skill match</p><p class="num text-lg text-paper">${pct(report.scores.skill_match)}</p></div>
        <div class="card p-3"><p class="text-[10px] text-muted-2 uppercase tracking-widest mb-1">Experience</p><p class="num text-lg text-paper">${pct(report.scores.experience)}</p></div>
        <div class="card p-3"><p class="text-[10px] text-muted-2 uppercase tracking-widest mb-1">Education</p><p class="num text-lg text-paper">${pct(report.scores.education)}</p></div>
      </div>
    </div>

    <div class="flex flex-wrap gap-4 mb-6 text-sm">
      <div><span class="text-muted-2">Experience: </span><span class="text-paper num">${report.details.years_of_experience} yrs</span></div>
      <div><span class="text-muted-2">Education: </span><span class="pill-education">${escapeHtml(report.details.education_level)}</span></div>
    </div>

    <div class="mb-5">
      <p class="text-[11px] text-muted-2 uppercase tracking-widest mb-2">Technical skills detected</p>
      <div class="flex flex-wrap gap-1.5">${report.details.technical_skills.length ? report.details.technical_skills.map((s) => `<span class="chip chip-technical">${escapeHtml(s)}</span>`).join('') : '<span class="text-xs text-muted-2 italic">None detected</span>'}</div>
    </div>
    <div class="mb-6">
      <p class="text-[11px] text-muted-2 uppercase tracking-widest mb-2">Soft skills detected</p>
      <div class="flex flex-wrap gap-1.5">${report.details.soft_skills.length ? report.details.soft_skills.map((s) => `<span class="chip chip-soft">${escapeHtml(s)}</span>`).join('') : '<span class="text-xs text-muted-2 italic">None detected</span>'}</div>
    </div>

    ${chart ? `<div class="chart-frame"><img src="${chart.image_url}" alt="Score breakdown chart for ${escapeAttr(report.name)}" /></div>` : ''}
  `;

  mountGauge(qs('#modal-gauge'), report.final_score, {
    size: 140, strokeWidth: 10, showTicks: true, showLabel: true, subLabel: 'final score', animate: true,
  });
  lucide.createIcons();
  qs('#modal-close-btn').addEventListener('click', closeModal);
}

function closeModal() {
  qs('#candidate-modal').classList.add('hidden');
}
qs('#candidate-modal').addEventListener('click', (e) => {
  if (e.target.id === 'candidate-modal') closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !qs('#candidate-modal').classList.contains('hidden')) closeModal();
});

/* -- CSV export -- */
function exportCSV() {
  if (!state.results.length) { toast('Nothing to export yet.', 'error'); return; }
  const cols = ['Rank', 'Candidate', 'Final_Score', 'Text_Similarity', 'Skill_Match', 'Experience_Score', 'Education_Score', 'Technical_Skills', 'Soft_Skills', 'Years_Experience', 'Education_Level'];
  const escapeCsv = (v) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [cols.join(',')];
  sortResults(state.results, 'Rank', 'asc').forEach((r) => {
    lines.push(cols.map((c) => escapeCsv(r[c])).join(','));
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'resume_screening_results.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
qs('#export-csv-btn').addEventListener('click', exportCSV);


/* ---------- 11. Sample data ---------- */
const SAMPLE_JD = `We are hiring a Full Stack Python Developer to join our growing engineering team.

Responsibilities:
- Build and maintain REST APIs using Python, Flask, and Django
- Develop front-end features with React
- Design and optimize SQL database schemas
- Deploy and monitor services on AWS using Docker
- Collaborate closely with product and design teams

Requirements:
- 3+ years of professional software development experience
- Strong proficiency in Python, Flask or Django, React, SQL
- Experience with AWS, Docker, and Git version control
- Excellent problem solving, communication, and teamwork skills
- Bachelors degree in Computer Science or related field`;

const SAMPLE_RESUMES = [
  {
    name: 'Priya Sharma',
    text: `Priya Sharma - Software Engineer
4 years of professional experience building web applications with Python and Flask.
Skilled in React, AWS, Docker, Git, and SQL database design.
Led a small team and collaborated closely with product on API design.
Strong communication and teamwork skills, comfortable presenting to stakeholders.
B.Tech in Computer Science, 2020.`,
  },
  {
    name: 'Rahul Verma',
    text: `Rahul Verma - Backend Developer
2 years experience with Java and Python, primarily building internal tools.
Familiar with SQL and some exposure to cloud basics.
Good analytical and problem solving skills.
Masters in Computer Applications.`,
  },
  {
    name: 'Ananya Iyer',
    text: `Ananya Iyer - Junior Developer
1 year experience with HTML, CSS, JavaScript, and Python.
Built a few small personal projects using Flask.
Excellent teamwork and presentation skills, active in hackathons.
Bachelor of Science in Information Technology.`,
  },
  {
    name: 'Vikram Nair',
    text: `Vikram Nair - Senior Engineer
6 years experience, primarily Java, Angular, and Kubernetes.
Some exposure to Python and Docker for internal deployment tooling.
Strong leadership and negotiation skills, has mentored junior engineers.
PhD in Computer Science.`,
  },
];


/* ---------- 12. Init ---------- */
lucide.createIcons();
updateWeightTotal();
renderQueue();
renderPool();
goToStep(1);
