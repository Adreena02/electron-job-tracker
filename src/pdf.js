// pdf.js
// PDF export — all applications summary and single job detail.
// Depends on: state.js, filters.js, themes.js

import * as state from './state.js';
import { filteredJobs } from './filters.js';
import { THEMES } from './themes.js';


// Helpers

function currentThemeKey() {
  return state.isDark ? state.currentThemeName : state.currentThemeName + '-light';
}

function pdfStyles(themeKey) {
  const t = THEMES[themeKey] || THEMES['purple'];
  return `
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Nunito', system-ui, sans-serif; background: ${t.bg}; color: ${t.text}; padding: 32px; font-size: 12px; }
    .pdf-header { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; padding-bottom: 16px; border-bottom: 1px solid ${t.border2}; }
    .pdf-logo { width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, ${t.gradA}, ${t.gradB}); display: flex; align-items: center; justify-content: center; }
    .pdf-logo svg { width: 16px; height: 16px; fill: #fff; }
    .pdf-title { font-size: 18px; font-weight: 800; color: ${t.text}; }
    .pdf-title span { color: ${t.accent}; }
    .pdf-subtitle { font-size: 11px; color: ${t.text3}; margin-top: 2px; }
    .job-card { background: ${t.surface}; border: 1px solid ${t.border2}; border-radius: 12px; padding: 14px 16px; margin-bottom: 10px; }
    .job-company { font-size: 14px; font-weight: 800; color: ${t.text}; }
    .job-role { font-size: 12px; color: ${t.text2}; font-weight: 600; margin-bottom: 8px; }
    .job-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 6px; }
    .badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; background: ${t.surface2}; color: ${t.text2}; }
    .status-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px; }
    .field { display: flex; flex-direction: column; gap: 2px; }
    .field-label { font-size: 9px; font-weight: 800; color: ${t.text3}; text-transform: uppercase; letter-spacing: .6px; }
    .field-val { font-size: 11px; font-weight: 600; color: ${t.text2}; }
    .section { margin-top: 12px; padding-top: 10px; border-top: 1px solid ${t.border}; }
    .section-label { font-size: 10px; font-weight: 800; color: ${t.text3}; text-transform: uppercase; letter-spacing: .6px; margin-bottom: 6px; }
    .section-body { font-size: 11px; font-weight: 400; color: ${t.text2}; line-height: 1.6; white-space: pre-wrap; }
    .contact-card { background: ${t.surface2}; border-radius: 8px; padding: 8px 10px; margin-bottom: 6px; }
    .activity-row { display: flex; gap: 10px; padding: 5px 0; border-bottom: 1px solid ${t.border}; align-items: flex-start; }
    .activity-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 3px; }
    .summary-table { width: 100%; border-collapse: collapse; }
    .summary-table th { font-size: 9px; font-weight: 800; color: ${t.text3}; text-transform: uppercase; letter-spacing: .6px; padding: 8px 10px; text-align: left; border-bottom: 1px solid ${t.border2}; }
    .summary-table td { padding: 8px 10px; border-bottom: 1px solid ${t.border}; font-size: 11px; font-weight: 600; color: ${t.text2}; vertical-align: middle; }
    .summary-table tr:last-child td { border-bottom: none; }
  `;
}

function pdfHeader(subtitle) {
  return `
    <div class="pdf-header">
      <div class="pdf-logo">
        <svg viewBox="0 0 16 16"><path d="M8 1l1.76 4.24L14 7l-4.24 1.76L8 13l-1.76-4.24L2 7l4.24-1.76L8 1z"/></svg>
      </div>
      <div>
        <div class="pdf-title">job<span>quest</span></div>
        <div class="pdf-subtitle">${subtitle}</div>
      </div>
    </div>`;
}

async function triggerPDF(html, filename) {
  if (window.pdfExport) {
    const result = await window.pdfExport.save(html, filename);
    if (!result.success) alert('PDF export cancelled.');
  } else {
    // Fallback for browser — open in new tab and print
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.print();
  }
}


// Export all applications (filter-aware)

export async function exportAllPDF() {
  document.getElementById('settingsDropdown').classList.remove('open');

  const themeKey = currentThemeKey();
  const t        = THEMES[themeKey] || THEMES['purple'];
  const date     = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const list     = filteredJobs();

  const rows = list.map(job => {
    const cfg = state.STATUS_CFG[job.status];
    return `<tr>
      <td><strong style="color:${t.text}">${job.company}</strong></td>
      <td>${job.role || '—'}</td>
      <td><span class="status-badge" style="background:${cfg.bg};color:${cfg.text}">${cfg.emoji} ${job.status}</span></td>
      <td>${job.worktype}</td>
      <td>${job.industry || '—'}</td>
      <td>${job.salary || '—'}</td>
      <td>${job.date ? new Date(job.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>${pdfStyles(themeKey)}</style></head>
    <body>
      ${pdfHeader(`All applications · Exported ${date} · ${list.length} jobs`)}
      <table class="summary-table">
        <thead><tr><th>Company</th><th>Role</th><th>Status</th><th>Work type</th><th>Industry</th><th>Salary</th><th>Applied</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>`;

  await triggerPDF(html, `jobquest-all-${new Date().toISOString().slice(0, 10)}.pdf`);
}


// Export single job detail

export async function exportJobPDF() {
  const job = state.editId ? state.jobs.find(j => j.id === state.editId) : null;
  if (!job) return;

  const themeKey = currentThemeKey();
  const t        = THEMES[themeKey] || THEMES['purple'];
  const cfg      = state.STATUS_CFG[job.status];
  const date     = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const contactsHtml = (job.contacts || []).map(c => `
    <div class="contact-card">
      <strong style="color:${t.text}">${c.name}</strong>${c.title ? ` · ${c.title}` : ''}
      ${c.email    ? `<div>${c.email}</div>`    : ''}
      ${c.phone    ? `<div>${c.phone}</div>`    : ''}
      ${c.linkedin ? `<div>${c.linkedin}</div>` : ''}
      ${c.notes    ? `<div style="margin-top:4px;color:${t.text3}">${c.notes}</div>` : ''}
    </div>`).join('');

  const qaHtml = (job.qa || []).filter(q => q.q || q.a).map(q => `
    <div style="margin-bottom:10px">
      <div style="font-weight:700;color:${t.text};margin-bottom:3px">${q.q}</div>
      <div class="section-body">${q.a}</div>
    </div>`).join('');

  const activityHtml = [...(job.activity || [])].reverse().map(e => {
    let label = '';
    if (e.type === 'status')        label = `Status changed from ${e.from} to ${e.to}`;
    if (e.type === 'resume')        label = `Resume attached — ${e.detail}`;
    if (e.type === 'interviewDate') label = `Interview date set to ${e.detail}`;
    if (e.type === 'applyBy')       label = `Apply by set to ${e.detail}`;
    if (e.type === 'hearBackBy')    label = `Hear back by set to ${e.detail}`;
    const color = e.type === 'status' ? (state.STATUS_CFG[e.to]?.color || t.accent) : t.accent;
    return `<div class="activity-row">
      <div class="activity-dot" style="background:${color}"></div>
      <div style="flex:1;font-size:11px;color:${t.text2}">${label}</div>
      <div style="font-size:10px;color:${t.text3}">${e.date}</div>
    </div>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>${pdfStyles(themeKey)}</style></head>
    <body>
      ${pdfHeader(`Exported ${date}`)}
      <div class="job-card">
        <div class="job-company">${job.company}</div>
        <div class="job-role">${job.role || 'Role not specified'}</div>
        <div class="job-meta">
          <span class="status-badge" style="background:${cfg.bg};color:${cfg.text}">${cfg.emoji} ${job.status}</span>
          <span class="badge">${job.worktype}</span>
          ${job.industry  ? `<span class="badge">${job.industry}</span>`  : ''}
          ${job.location  ? `<span class="badge">${job.location}</span>`  : ''}
          ${job.salary    ? `<span class="badge">${job.salary}</span>`    : ''}
        </div>
        <div class="field-row">
          ${job.date          ? `<div class="field"><div class="field-label">Applied</div><div class="field-val">${job.date}</div></div>` : ''}
          ${job.interviewDate ? `<div class="field"><div class="field-label">Interview</div><div class="field-val">${job.interviewDate}</div></div>` : ''}
          ${job.applyBy       ? `<div class="field"><div class="field-label">Apply by</div><div class="field-val">${job.applyBy}</div></div>` : ''}
          ${job.hearBackBy    ? `<div class="field"><div class="field-label">Hear back by</div><div class="field-val">${job.hearBackBy}</div></div>` : ''}
          ${job.link          ? `<div class="field" style="grid-column:span 2"><div class="field-label">Link</div><div class="field-val">${job.link}</div></div>` : ''}
        </div>
      </div>
      ${job.notes    ? `<div class="section"><div class="section-label">Notes</div><div class="section-body">${job.notes}</div></div>` : ''}
      ${job.cover    ? `<div class="section"><div class="section-label">Cover letter</div><div class="section-body">${job.cover}</div></div>` : ''}
      ${contactsHtml ? `<div class="section"><div class="section-label">Contacts</div>${contactsHtml}</div>` : ''}
      ${qaHtml       ? `<div class="section"><div class="section-label">Bonus Q&A</div>${qaHtml}</div>` : ''}
      ${activityHtml ? `<div class="section"><div class="section-label">Activity</div>${activityHtml}</div>` : ''}
    </body></html>`;

  const filename = `jobquest-${job.company.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`;
  await triggerPDF(html, filename);
}