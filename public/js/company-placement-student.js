(() => {
  const $ = id => document.getElementById(id);
  const token = localStorage.getItem('token');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  let toastTimer;
  function toast(message) { const node = $('toast'); node.textContent = message; node.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove('show'), 3500); }
  async function api(path, options = {}) {
    if (!token) { location.href = '/login'; throw new Error('Please sign in first.'); }
    const response = await fetch(`/api/placement-simulation${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`); return data;
  }
  async function loadCompanies() {
    const companies = await api('/student/companies');
    $('companyCards').innerHTML = companies.length ? companies.map(c => {
      const status = c.latest_simulation_status;
      let actions = '';
      if (status === 'passed' && c.latest_simulation_id) {
        actions = `<button class="btn primary" data-view-simulation="${esc(c.latest_simulation_id)}">View congratulations</button><p class="attempt-lock">✓ Completed — another attempt is not allowed.</p>`;
      } else if (status === 'in_progress' && c.latest_simulation_id) {
        actions = `<button class="btn primary" data-view-simulation="${esc(c.latest_simulation_id)}">Resume saved simulation</button><p class="attempt-lock">Your progress is saved. Refreshing will not reset it.</p>`;
      } else if ((status === 'failed' || status === 'abandoned') && c.latest_simulation_id) {
        actions = `<button class="btn secondary" data-view-simulation="${esc(c.latest_simulation_id)}">View saved results</button><p class="attempt-lock">Already attempted — another attempt is not allowed.</p>`;
      } else {
        actions = `<button class="btn primary" data-start-company="${esc(c.id)}">Start simulation</button>`;
      }
      return `<article class="student-company"><span class="badge published">${Number(c.round_count)} rounds</span><h3>${esc(c.name)}</h3><p>${esc(c.description || 'Company-specific placement practice.')}<br>Configuration v${Number(c.config_version)}${status ? `<br>Latest attempt: ${esc(status.replace('_',' '))}` : ''}</p><div class="company-card-actions">${actions}</div></article>`;
    }).join('') : '<div class="panel">No company simulations have been published yet.</div>';

    $('companyCards').querySelectorAll('[data-start-company]').forEach(button => button.addEventListener('click', async () => {
      button.disabled = true;
      try {
        const data = await api(`/student/companies/${encodeURIComponent(button.dataset.startCompany)}/start`, { method: 'POST', body: '{}' });
        await showSimulation(data.simulationId);
        await loadCompanies();
        await loadHistory();
      } catch (e) { toast(e.message); } finally { button.disabled = false; }
    }));
    $('companyCards').querySelectorAll('[data-view-simulation]').forEach(button => button.addEventListener('click', async () => {
      button.disabled = true;
      try { await showSimulation(button.dataset.viewSimulation); }
      catch (e) { toast(e.message); } finally { button.disabled = false; }
    }));
    const params = new URLSearchParams(location.search);
    const simId = params.get('simulation');
    if (simId) await showSimulation(simId);
  }
  async function loadHistory() {
    const host = $('studentHistory');
    if (!host) return;
    const rows = await api('/student/history');
    host.innerHTML = rows.length ? rows.map(row => `<article class="history-item">
      <div><strong>${esc(row.company_name)}</strong><p>Started ${esc(row.started_at || '—')} · ${row.completed_at ? `Completed ${esc(row.completed_at)}` : 'Not completed'}<br>${esc(row.round_summary || 'Round progress saved')}</p></div>
      <span class="status ${esc(row.status)}">${esc(row.status.replace('_',' '))}</span>
      <button class="btn secondary" data-history-view="${esc(row.simulation_id)}">View saved record</button>
    </article>`).join('') : '<p class="muted">No simulation attempts recorded yet.</p>';
    host.querySelectorAll('[data-history-view]').forEach(button => button.addEventListener('click', async () => {
      button.disabled = true;
      try { await showSimulation(button.dataset.historyView); }
      catch (e) { toast(e.message); }
      finally { button.disabled = false; }
    }));
  }

  function statusLabel(round) {
    const status = round.attempt?.status || (Number(round.round_order) === 1 ? 'available' : 'locked');
    if (status === 'failed') return 'failed'; if (status === 'passed') return 'passed'; if (status === 'started') return 'started'; if (status === 'available') return 'available'; return 'locked';
  }
  function renderCelebration(data, rounds) {
    const companyName = data.simulation.company_name || 'the company';
    const completed = rounds.filter(r => r.attempt?.status === 'passed');
    const confetti = Array.from({ length: 58 }, (_, i) => {
      const left = (i * 37 + 7) % 100;
      const delay = ((i * 13) % 42) / 10;
      const hue = (i * 47 + 24) % 360;
      const duration = 3.5 + ((i * 11) % 20) / 10;
      return `<i class="confetti-piece" style="left:${left}%;animation-delay:-${delay}s;animation-duration:${duration}s;background:hsl(${hue} 78% 57%)"></i>`;
    }).join('');
    $('progressPanel').innerHTML = `<section class="celebration" aria-live="polite">
      <div class="confetti-field" aria-hidden="true">${confetti}</div>
      <div class="celebration-badge">✦ Placement simulation completed</div>
      <h2>CONGRATULATIONS!<span>YOU ARE PLACED AT</span></h2>
      <div class="celebration-company">${esc(companyName)}</div>
      <p class="celebration-copy">Outstanding work! You have successfully passed every required round in your ${esc(companyName)} placement simulation. Keep this momentum going as you prepare for your career.</p>
      <div class="celebration-summary"><h3>🏆 Your achievement</h3><ul>
        <li><strong>${completed.length} of ${rounds.length}</strong> configured rounds passed</li>
        ${completed.map(r => `<li>${esc(r.title)}${r.attempt?.score == null ? '' : ` — score ${Number(r.attempt.score)}%`}</li>`).join('')}
      </ul></div>
      <div class="celebration-actions"><a class="btn primary" href="/dashboard" style="text-decoration:none">Return to Student Dashboard</a><button class="btn secondary" id="viewProgressBtn" type="button">View round progress</button></div>
      <p class="placement-disclaimer">This is a PlacementPro simulation achievement, not an official job offer or employment confirmation from ${esc(companyName)}.</p>
    </section>`;
    $('progressPanel').querySelector('#viewProgressBtn').addEventListener('click', () => renderProgress(data, rounds, true));
  }

  function renderProgress(data, rounds, showCelebrationButton = false) {
    const simulationId = data.simulation.id;
    $('progressPanel').innerHTML = `<h2>${esc(data.simulation.company_name)} · Your progress</h2><p class="muted">Simulation status: <strong>${esc(data.simulation.status)}</strong>. ${data.viewOnly ? 'This is a read-only historical record because a completed attempt already exists.' : 'Your progress is saved automatically. Complete each mandatory round to unlock the next.'}</p>${rounds.map(r => {
      const status = statusLabel(r); const score = r.attempt?.score == null ? '' : ` · Score ${Number(r.attempt.score)}%`;
      const canStart = data.simulation.status === 'in_progress' && !data.viewOnly && ['available','started','failed'].includes(status) && status !== 'passed';
      const attemptsUsed = Number(r.attempt?.attempt_number || 1);
      const button = canStart ? `<button class="btn primary" data-start-round="${esc(r.id)}" data-simulation="${esc(simulationId)}">${status === 'started' ? 'Continue round' : status === 'failed' ? 'Retry / open round' : 'Start round'}</button>` : '';
      return `<div class="progress-row"><div class="round-num">${Number(r.round_order)}</div><div><h4>${esc(r.title)}</h4><p>${esc(r.module_type)}${r.assessment_id ? ` · Assessment ${esc(r.assessment_id)}` : ''}${score}${r.attempt ? ` · Attempt ${attemptsUsed}` : ''}</p></div><span class="status ${status}">${status}</span>${button}</div>`;
    }).join('')}${showCelebrationButton ? '<button class="btn primary" id="backToCelebration" type="button" style="margin-top:18px">Back to congratulations page</button>' : ''}<div class="warning-text">Round progression is evaluated by the server from saved module results. Individual assessment attempts remain independent from this simulation.</div>`;
    $('progressPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('progressPanel').querySelectorAll('[data-start-round]').forEach(button => button.addEventListener('click', async () => {
      button.disabled = true;
      try { const launch = await api(`/student/simulations/${encodeURIComponent(button.dataset.simulation)}/rounds/${encodeURIComponent(button.dataset.startRound)}/start`, { method: 'POST', body: '{}' }); location.href = launch.launchUrl; }
      catch (e) { toast(e.message); button.disabled = false; }
    }));
    if (showCelebrationButton) $('backToCelebration').addEventListener('click', () => renderCelebration(data, rounds));
  }

  async function showSimulation(simulationId) {
    const data = await api(`/student/simulations/${encodeURIComponent(simulationId)}`);
    const rounds = data.rounds || [];
    $('progressPanel').hidden = false;
    if (data.simulation.status === 'passed') {
      renderCelebration(data, rounds);
    } else {
      renderProgress(data, rounds);
    }
    $('progressPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  Promise.all([loadCompanies(), loadHistory()]).catch(e => { $('companyCards').innerHTML = `<div class="panel">${esc(e.message)}</div>`; toast(e.message); });
})();
