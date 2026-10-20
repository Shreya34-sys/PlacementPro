(() => {
  const $ = id => document.getElementById(id);
  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
  const state = { companies: [], selected: null, rounds: [], suggestions: [] };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  let toastTimer;
  function toast(message) { const node = $('toast'); node.textContent = message; node.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove('show'), 3400); }
  async function api(path, options = {}) {
    if (!token) { location.href = '/admin-login'; throw new Error('Please sign in as an admin first.'); }
    const response = await fetch(`/api/placement-simulation${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
    return data;
  }
  async function loadHistory() {
    const host = $('simulationHistory');
    if (!host) return;
    try {
      const rows = await api('/admin/history');
      host.innerHTML = rows.length ? `<div class="history-table-wrap"><table class="history-table"><thead><tr><th>Student Name</th><th>Company</th><th>Status</th><th>Started</th><th>Completed</th><th>Round history / scores</th></tr></thead><tbody>${rows.map(row => `<tr><td>${esc(row.student_name || 'Name unavailable')}</td><td>${esc(row.company_name)}</td><td><span class="status ${esc(row.status)}">${esc(row.status.replace('_',' '))}</span></td><td>${esc(row.started_at || '—')}</td><td>${esc(row.completed_at || '—')}</td><td>${esc(row.round_summary || 'No round attempts recorded')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">No student simulation history has been recorded yet.</p>';
    } catch (e) { host.innerHTML = `<p class="muted">Could not load history: ${esc(e.message)}</p>`; }
  }
  if ($('refreshHistoryBtn')) $('refreshHistoryBtn').addEventListener('click', () => loadHistory());

  async function loadAssessments(moduleType, selectedId = '') {
    const picker = $('assessmentId');
    picker.innerHTML = '<option value="">Loading assessments…</option>';
    if (moduleType === 'resume') {
      picker.innerHTML = '<option value="">Not required for Resume ATS</option>';
      picker.disabled = true;
      return;
    }
    picker.disabled = false;
    if (!['aptitude','coding','versant'].includes(moduleType)) {
      picker.innerHTML = '<option value="">Module not implemented yet</option>';
      return;
    }
    const rows = await api(`/admin/assessments/${encodeURIComponent(moduleType)}`);
    picker.innerHTML = '<option value="">Select an existing assessment</option>' + rows.map(r => `<option value="${esc(r.id)}">${esc(r.title)} · ${esc(r.status)} · ID ${esc(r.id)}</option>`).join('');
    if (selectedId) picker.value = String(selectedId);
  }
  function selectedCompany() { return state.companies.find(c => c.id === state.selected); }
  async function loadCompanies(keepSelection = true) {
    state.companies = await api('/admin/companies');
    if (!keepSelection || !state.companies.some(c => c.id === state.selected)) state.selected = state.companies[0]?.id || null;
    renderCompanies();
    if (state.selected) await loadCompany(state.selected); else showEmpty();
  }
  function renderCompanies() {
    $('companyList').innerHTML = state.companies.length ? state.companies.map(c => `<div class="company-item ${c.id === state.selected ? 'active' : ''}"><div><h3>${esc(c.name)}</h3><p>${Number(c.round_count)} rounds · ${esc(c.status)}</p></div><div class="round-actions"><button class="btn secondary" data-select="${esc(c.id)}">Open</button><button class="btn danger" data-delete-company="${esc(c.id)}">Delete</button></div></div>`).join('') : '<p class="muted">No companies created yet.</p>';
    $('companyList').querySelectorAll('[data-select]').forEach(button => button.addEventListener('click', () => { state.selected = button.dataset.select; renderCompanies(); loadCompany(state.selected).catch(e => toast(e.message)); }));
    $('companyList').querySelectorAll('[data-delete-company]').forEach(button => button.addEventListener('click', async () => {
      const company = state.companies.find(c => c.id === button.dataset.deleteCompany);
      if (!company || !confirm(`Delete the ${company.name} placement simulation?\n\nIf student history exists, the configuration will be archived to protect results.`)) return;
      button.disabled = true;
      try {
        const result = await api(`/admin/companies/${encodeURIComponent(company.id)}`, { method: 'DELETE' });
        if (state.selected === company.id) state.selected = null;
        await loadCompanies(false);
        toast(result.message || (result.archived ? 'Simulation archived.' : 'Simulation deleted.'));
      } catch (e) { toast(e.message); button.disabled = false; }
    }));
  }
  function showEmpty() { $('editor').hidden = true; $('emptyEditor').hidden = false; $('selectedStatus').textContent = 'No company selected'; }
  async function loadCompany(id) {
    const data = await api(`/admin/companies/${encodeURIComponent(id)}`);
    state.selected = id; state.rounds = data.rounds || [];
    $('editor').hidden = false; $('emptyEditor').hidden = true;
    $('selectedCompanyName').textContent = data.company.name;
    $('selectedCompanyDescription').textContent = data.company.description || 'No description provided.';
    $('selectedStatus').textContent = data.company.status;
    $('selectedStatus').className = `badge ${data.company.status}`;
    const published = data.company.status === 'published';
    $('publishBtn').hidden = published; $('unpublishBtn').hidden = !published;
    $('roundForm').querySelectorAll('input,select,textarea,button').forEach(el => el.disabled = published);
    renderRounds(); renderCompanies();
  }
  function renderRounds() {
    $('roundList').innerHTML = state.rounds.length ? state.rounds.map(r => `<article class="round-item"><div class="round-num">${Number(r.round_order)}</div><div><h4>${esc(r.title)}</h4><p>${esc(r.module_type)} · ${esc(({company:'Company-Wise Only',individual:'Individual Only',both:'Both'})[r.round_scope] || 'Company-Wise Only')} · Pass ${Number(r.passing_percent)}% · ${Number(r.max_attempts)} attempt(s)${r.assessment_id ? ` · ID: ${esc(r.assessment_id)}` : ''}</p></div><div class="round-actions"><button class="btn secondary" data-fill="${esc(r.id)}">Load</button><button class="btn secondary" data-delete="${esc(r.id)}">Delete</button></div></article>`).join('') : '<div class="empty-state">No rounds yet. Add your first round above.</div>';
    $('roundList').querySelectorAll('[data-fill]').forEach(b => b.addEventListener('click', async () => {
      const r = state.rounds.find(x => x.id === b.dataset.fill); if (!r) return;
      $('roundTitle').value = r.title; $('moduleType').value = r.module_type; $('roundScope').value = r.round_scope || 'company'; await loadAssessments(r.module_type, r.assessment_id || ''); $('roundOrder').value = r.round_order; $('passingPercent').value = r.passing_percent; $('maxAttempts').value = r.max_attempts; $('roundInstructions').value = r.instructions || '';
      toast('Round loaded into the form. Delete the old round and add again to apply edits in this first version.');
    }));
    $('roundList').querySelectorAll('[data-delete]').forEach(b => b.addEventListener('click', async () => {
      if (!confirm('Delete this round?')) return;
      try { await api(`/admin/rounds/${encodeURIComponent(b.dataset.delete)}`, { method: 'DELETE' }); await loadCompany(state.selected); toast('Round deleted.'); } catch (e) { toast(e.message); }
    }));
  }
  $('moduleType').addEventListener('change', () => loadAssessments($('moduleType').value).catch(e => toast(e.message)));
  loadAssessments($('moduleType').value).catch(e => toast(e.message));
  $('companyForm').addEventListener('submit', async event => {
    event.preventDefault();
    try {
      const company = await api('/admin/companies', { method: 'POST', body: JSON.stringify({ name: $('companyName').value.trim(), description: $('companyDescription').value.trim() }) });
      $('companyForm').reset(); await loadCompanies(false); state.selected = company.id; await loadCompany(company.id); toast('Company created. Now add its rounds.');
    } catch (e) { toast(e.message); }
  });
  $('roundForm').addEventListener('submit', async event => {
    event.preventDefault(); if (!state.selected) return toast('Select a company first.');
    try {
      await api(`/admin/companies/${encodeURIComponent(state.selected)}/rounds`, { method: 'POST', body: JSON.stringify({ title: $('roundTitle').value.trim(), module_type: $('moduleType').value, round_scope: $('roundScope').value, round_order: Number($('roundOrder').value), passing_percent: Number($('passingPercent').value), assessment_id: $('assessmentId').value.trim(), max_attempts: Number($('maxAttempts').value), instructions: $('roundInstructions').value.trim(), is_mandatory: true }) });
      const next = Math.max(0, ...state.rounds.map(r => Number(r.round_order))) + 1; $('roundForm').reset(); $('roundOrder').value = next; $('passingPercent').value = 60; $('maxAttempts').value = 1; await loadAssessments($('moduleType').value); await loadCompany(state.selected); toast('Round added.');
    } catch (e) { toast(e.message); }
  });
  $('publishBtn').addEventListener('click', async () => {
    if (!confirm('Publish this company simulation? Students will be able to start it.')) return;
    try { await api(`/admin/companies/${encodeURIComponent(state.selected)}/publish`, { method: 'POST', body: JSON.stringify({ publish: true }) }); await loadCompanies(); toast('Simulation published.'); } catch (e) { toast(e.message); }
  });
  $('unpublishBtn').addEventListener('click', async () => {
    if (!confirm('Unpublish this simulation? New students will no longer be able to start it.')) return;
    try { await api(`/admin/companies/${encodeURIComponent(state.selected)}/publish`, { method: 'POST', body: JSON.stringify({ publish: false }) }); await loadCompanies(); toast('Simulation returned to draft.'); } catch (e) { toast(e.message); }
  });
  $('aiSuggestBtn').addEventListener('click', async () => {
    const company = selectedCompany(); if (!company) return toast('Create or select a company first.');
    $('aiSuggestBtn').disabled = true; $('aiSuggestBtn').textContent = 'Thinking…'; $('aiNote').textContent = '';
    try {
      const data = await api('/admin/ai/suggest-rounds', { method: 'POST', body: JSON.stringify({ companyName: company.name, role: $('roleInput').value.trim() }) });
      state.suggestions = data.rounds || []; $('aiNote').textContent = `${data.source}: ${data.note}`;
      $('suggestionBox').hidden = false;
      $('suggestionBox').innerHTML = state.suggestions.map((r, i) => `<div class="suggestion-row"><div><strong>${i + 1}. ${esc(r.title)}</strong><div class="muted">${esc(r.module_type)} · suggested pass score ${Number(r.passing_percent)}% ${r.reason ? `· ${esc(r.reason)}` : ''}${r.assessment_title ? ` · Mapped: ${esc(r.assessment_title)}` : ''}${r.mapping_note ? ` · ${esc(r.mapping_note)}` : ''}</div></div><button class="btn secondary" data-use-suggestion="${i}">Use</button></div>`).join('');
      $('suggestionBox').querySelectorAll('[data-use-suggestion]').forEach(b => b.addEventListener('click', async () => {
        const r = state.suggestions[Number(b.dataset.useSuggestion)]; $('roundTitle').value = r.title; $('moduleType').value = r.module_type; $('roundScope').value = r.round_scope || 'company'; await loadAssessments(r.module_type, r.assessment_id || ''); $('roundOrder').value = Math.max(0, ...state.rounds.map(x => Number(x.round_order))) + 1; $('passingPercent').value = r.passing_percent; $('maxAttempts').value = 1; $('assessmentId').value = r.assessment_id || ''; toast(r.assessment_id ? 'Suggested round and company-specific assessment loaded. Review before adding.' : 'Suggestion copied. Choose or create a dedicated assessment before adding this round.'); $('roundForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }));
    } catch (e) { toast(e.message); } finally { $('aiSuggestBtn').disabled = false; $('aiSuggestBtn').textContent = 'Suggest with AI'; }
  });
  loadCompanies().catch(e => { $('companyList').innerHTML = `<p class="muted">${esc(e.message)}</p>`; toast(e.message); });
  loadHistory();
})();
