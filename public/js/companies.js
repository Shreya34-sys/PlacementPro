(function () {
  'use strict';

  const statusEl = document.getElementById('companyStatus');
  const gridEl = document.getElementById('companyGrid');
  const escapeHtml = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const selectedCompany = new URLSearchParams(window.location.search).get('company');
  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  if (!gridEl) return;

  fetch(selectedCompany ? `/api/companies/${encodeURIComponent(selectedCompany)}` : '/api/companies', { headers })
    .then(response => {
      if (!response.ok) throw new Error('Company information is unavailable.');
      return response.json();
    })
    .then(result => {
      const companies = selectedCompany ? [result.data].filter(Boolean) : result.data || [];
      if (selectedCompany) {
        const company = companies[0];
        if (statusEl) {
          statusEl.innerHTML = '<a href="/companies" style="color:var(--brand-blue);text-decoration:none;font-weight:600;">← Back to all companies</a>';
        }
        if (company) {
          gridEl.innerHTML = `
            <article class="company-card" style="grid-column: 1 / -1;">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:12px;">
                <div>
                  <h2 style="font-size:24px;margin-bottom:6px;">${escapeHtml(company.name)}</h2>
                  <p style="color:var(--text-secondary);max-width:700px;line-height:1.5;">${escapeHtml(company.overview || 'Company placement information')}</p>
                </div>
                <a href="/company-prep?company=${encodeURIComponent(company.short_name || company.name)}" style="background:var(--brand-blue);color:#fff;padding:10px 20px;border-radius:10px;font-size:14px;text-decoration:none;font-weight:700;display:inline-flex;align-items:center;gap:6px;">
                  <span>Start ${escapeHtml(company.name)} Prep Kit</span> →
                </a>
              </div>

              <div style="margin:20px 0;padding:16px;background:var(--bg-main);border-radius:12px;border:1px solid var(--border-color);">
                <h3 style="font-size:15px;margin-bottom:8px;">Preparation Topics</h3>
                <p style="color:var(--text-secondary);">${escapeHtml((company.resources || company.topics || []).join(', ') || 'Data Structures, Algorithms, Problem Solving')}</p>
              </div>

              <div style="margin:20px 0;padding:16px;background:var(--bg-main);border-radius:12px;border:1px solid var(--border-color);">
                <h3 style="font-size:15px;margin-bottom:8px;">Interview Selection Rounds</h3>
                <p style="color:var(--text-secondary);">${escapeHtml((company.rounds || []).map(round => typeof round === 'string' ? round : round.name || round.title || '').filter(Boolean).join(' · ') || 'Online Assessment · Technical Round · HR Round')}</p>
              </div>
            </article>
          `;
        }
        return;
      }
      if (statusEl) {
        statusEl.textContent = companies.length ? '' : 'No companies are available yet.';
      }
      gridEl.innerHTML = companies.map(company => `
        <article class="company-card">
          <h2>${escapeHtml(company.name)}</h2>
          <p>${escapeHtml(company.overview || 'Explore this company’s placement information and preparation resources.')}</p>
          <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;align-items:center;">
            <a href="/company-prep?company=${encodeURIComponent(company.short_name || company.name)}" style="background:var(--brand-blue);color:#ffffff;padding:8px 16px;border-radius:8px;font-size:13px;text-decoration:none;font-weight:600;display:inline-flex;align-items:center;gap:4px;">
              <span>Start Prep Kit</span> →
            </a>
            <a href="/companies?company=${encodeURIComponent(company.short_name || company.name)}" style="color:var(--text-secondary);font-size:13px;text-decoration:none;padding:6px 8px;">
              View Details
            </a>
          </div>
        </article>
      `).join('');
    })
    .catch(error => {
      if (statusEl) statusEl.textContent = error.message;
    });
})();
