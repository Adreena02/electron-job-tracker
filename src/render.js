// render.js
// All view rendering — kanban, table, stats, charts, salary widget,
// motivational message, tab switching, drag-and-drop, card flip.
// Depends on: state.js, filters.js, utils.js, particles.js

import * as state from './state.js';
import { filteredJobs, buildFilterPills, updateHideInactiveBtn } from './filters.js';
import { formatDate, formatSalary, parseSalary, escHtml, weekRange } from './utils.js';


// Top-level render — called after any state change that affects the UI

export function render() {
  renderStats();
  renderKanban();
  applyDensity();
  renderTable();
  renderCharts();
  renderSalaryWidget();
  renderGoalsWidget();
  renderStatsMessage();
  renderMoodWidget();
  renderTemplates();
}


// Tab switching

export function switchTab(tab) {
  const tabs = ['kanban', 'table', 'stats', 'goals', 'timeline', 'templates'];
  document.querySelectorAll('.tab').forEach((btn, i) =>
    btn.classList.toggle('active', tabs[i] === tab)
  );
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${tab}`).classList.add('active');

  const showFilter = tab === 'kanban' || tab === 'table';
  document.getElementById('searchBar').classList.toggle('visible', showFilter);
  document.getElementById('filterBar').classList.toggle('visible', showFilter);
  if (!showFilter) document.getElementById('filterBar').classList.remove('expanded');

  if (tab === 'timeline') import('./timeline.js').then(({ renderTimeline }) => renderTimeline());
  if (tab === 'goals')    import('./goals.js').then(({ renderGoals }) => renderGoals());

  if (tab === 'kanban') {
    import('./particles.js').then(({ startParticles }) => startParticles());
  } else {
    import('./particles.js').then(({ stopParticles }) => stopParticles());
  }
}


// Stat strip (top summary cards)

export function renderStats() {
  const total  = state.jobs.length;
  const active = state.jobs.filter(j => !['Rejected', 'Ghosted'].includes(j.status)).length;
  const offers = state.jobs.filter(j => j.status === 'Offer').length;
  const rate   = total ? Math.round(state.jobs.filter(j => j.status !== 'Applied').length / total * 100) : 0;

  document.getElementById('statStrip').innerHTML = `
    <div class="stat-card"><div class="stat-card-icon">📋</div><div class="stat-label">Total</div><div class="stat-num">${total}</div><div class="stat-sub">applications</div></div>
    <div class="stat-card"><div class="stat-card-icon">🔥</div><div class="stat-label">Active</div><div class="stat-num">${active}</div><div class="stat-sub">in progress</div></div>
    <div class="stat-card"><div class="stat-card-icon">🎉</div><div class="stat-label">Offers</div><div class="stat-num">${offers}</div><div class="stat-sub">received</div></div>
    <div class="stat-card"><div class="stat-card-icon">⚡</div><div class="stat-label">Progress</div><div class="stat-num">${rate}%</div><div class="stat-sub">past applied</div></div>
  `;
}


// Kanban board

export function renderKanban() {
  document.getElementById('kanbanBoard').innerHTML = state.STATUSES.map(status => {
    const cfg   = state.STATUS_CFG[status];
    const cards = filteredJobs().filter(j => j.status === status);
    const colId = status.replace(/ /g, '-');
    const ghostAttr = status === 'Ghosted'
      ? 'data-ghost-col="true" style="cursor:pointer;user-select:none" title="👀"'
      : '';

    return `
      <div class="kanban-col" data-col="${status}" style="background:${cfg.col}">
        <div class="col-header">
          <span style="font-size:14px" ${ghostAttr}>${cfg.emoji}</span>
          <span class="col-title">${status}</span>
          <span class="col-count">${cards.length}</span>
        </div>
        <div class="drop-indicator" id="di-${colId}"></div>
        ${cards.length
          ? cards.map((j, i) => renderCard(j, i)).join('')
          : '<div class="empty-col">Drop cards here</div>'}
      </div>
    `;
  }).join('');
}

function renderCard(job, idx = 0) {
  const worktypeBadge = { Remote: 'badge-remote', Hybrid: 'badge-hybrid', 'On-site': 'badge-onsite' };
  const dl = deadlineInfo(job);

  return `
    <div class="job-card" id="card-${job.id}" draggable="true"
      data-card-id="${job.id}"
      style="${deadlineCardBorder(dl)};animation-delay:${idx * 40}ms">
      <div class="job-card-inner">
        <div class="job-card-front" style="padding:11px 12px">
          <div class="job-card-company">${job.company}</div>
          <div class="job-card-role">${job.role || '—'}</div>
          <div class="job-card-meta">
            <span class="badge ${worktypeBadge[job.worktype]}">${job.worktype}</span>
            ${job.location ? `<span class="badge badge-muted">${job.location}</span>` : ''}
            ${job.resume   ? `<span class="badge badge-green">📄 resume</span>` : ''}
            ${job.qa?.length ? `<span class="badge badge-purple">💬 ${job.qa.length}Q</span>` : ''}
            ${job.industry  ? `<span class="badge badge-sky">${job.industry}</span>` : ''}
            ${deadlineBadgeHtml(dl)}
          </div>
          ${job.salary ? `<div class="job-card-salary">${job.salary}</div>` : ''}
          ${job.date   ? `<div class="job-card-date">${formatDate(job.date)}</div>` : ''}
        </div>
        <div class="job-card-back">
          <div class="job-card-back-title">📝 Notes</div>
          ${job.notes
            ? `<div class="job-card-back-notes">${escHtml(job.notes)}</div>`
            : `<div class="job-card-back-empty">No notes yet</div>`}
          <button class="job-card-back-open" data-open-id="${job.id}">Open →</button>
        </div>
      </div>
    </div>
  `;
}

export function handleCardClick(event, id) {
  const card = document.getElementById(`card-${id}`);
  if (card?.classList.contains('flipped')) {
    flipCard(event, id);
    return;
  }
  import('./modal.js').then(({ openEdit }) => openEdit(id));
}

export function flipCard(event, id) {
  event.stopPropagation();
  const card = document.getElementById(`card-${id}`);
  if (!card) return;
  card.classList.toggle('flipped');
  card.style.minHeight = card.classList.contains('flipped') ? '140px' : '';
}


// Drag and drop

export function cardDragStart(event, id) {
  state.setDragId(id);
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', id);
  setTimeout(() => document.getElementById(`card-${id}`)?.classList.add('dragging'), 0);
}

export function cardDragEnd() {
  const card = document.getElementById(`card-${state.dragId}`);
  if (card) {
    card.classList.remove('dragging');
    card.classList.remove('flipped');
  }
  clearDragState();
}

export function kanbanDragOver(event, status) {
  event.preventDefault();
  if (state.dragOverCol === status) return;
  clearDragState();
  state.setDragOverCol(status);
  document.querySelector(`.kanban-col[data-col="${status}"]`)?.classList.add('drag-over');
  document.getElementById(`di-${status.replace(/ /g, '-')}`)?.classList.add('visible');
}

export function kanbanDragLeave(event) {
  if (event.currentTarget.contains(event.relatedTarget)) return;
  event.currentTarget.classList.remove('drag-over');
  const status = event.currentTarget.dataset.col;
  document.getElementById(`di-${status.replace(/ /g, '-')}`)?.classList.remove('visible');
  if (state.dragOverCol === status) state.setDragOverCol(null);
}

export function kanbanDrop(event, newStatus) {
  event.preventDefault();
  const id  = event.dataTransfer.getData('text/plain') || state.dragId;
  const job = state.jobs.find(j => j.id === id);
  if (job && job.status !== newStatus) {
    job.status = newStatus;
    import('./storage.js').then(({ persistJobs }) => persistJobs(state.jobs));
    render();
  }
  clearDragState();
  state.setDragId(null);
}

function clearDragState() {
  document.querySelectorAll('.kanban-col.drag-over').forEach(c => c.classList.remove('drag-over'));
  document.querySelectorAll('.drop-indicator.visible').forEach(i => i.classList.remove('visible'));
  state.setDragOverCol(null);
}


// Card density

export function applyDensity() {
  const board = document.getElementById('kanbanBoard');
  if (!board) return;
  board.className = board.className.replace(/density-\w+/g, '').trim();
  board.classList.add(`density-${state.cardDensity}`);

  ['comfortable', 'cozy', 'compact'].forEach(m => {
    const btn = document.getElementById(`density-${m}`);
    if (!btn) return;
    const label = { comfortable: 'Comfortable', cozy: 'Cozy', compact: 'Compact' }[m];
    btn.innerHTML = btn.innerHTML.replace(/✓\s*/, '');
    if (m === state.cardDensity) btn.innerHTML = btn.innerHTML.replace(label, `✓ ${label}`);
  });
}

export function setDensity(mode) {
  state.setCardDensity(mode);
  import('./storage.js').then(({ persistDensity }) => persistDensity(mode));
  applyDensity();
  document.getElementById('settingsDropdown').classList.remove('open');
}


// List view (table)

export function renderTable() {
  const rows = sortedJobs().map(job => {
    const cfg    = state.STATUS_CFG[job.status];
    const wBadge = { Remote: 'badge-remote', Hybrid: 'badge-hybrid', 'On-site': 'badge-onsite' };
    return `
      <tr data-row-id="${job.id}" style="cursor:pointer">
        <td><strong>${job.company}</strong></td>
        <td>${job.role || '—'}</td>
        <td style="color:var(--text2)">${job.location || '—'}</td>
        <td><span class="badge ${wBadge[job.worktype]}">${job.worktype}</span></td>
        <td><span class="status-pill" style="background:${cfg.bg};color:${cfg.text}">${cfg.emoji} ${job.status}</span></td>
        <td style="color:var(--text2)">${job.salary || '—'}</td>
        <td>${job.industry ? `<span class="badge badge-sky">${job.industry}</span>` : '—'}</td>
        <td>${job.resume ? `<span class="badge badge-green">📄 ${job.resume.name.slice(0, 14)}${job.resume.name.length > 14 ? '…' : ''}</span>` : '—'}</td>
        <td style="color:var(--text3)">${formatDate(job.date)}</td>
        <td>${deadlineBadgeHtml(deadlineInfo(job)) || '—'}</td>
      </tr>
    `;
  });

  document.getElementById('tableBody').innerHTML = rows.length
    ? rows.join('')
    : `<tr><td colspan="10" style="text-align:center;padding:32px;color:var(--text3);font-size:13px;font-weight:700">No applications yet — add one!</td></tr>`;

  updateSortArrows();
}

function sortedJobs() {
  return [...filteredJobs()].sort((a, b) => {
    let cmp = 0;
    if      (state.sortKey === 'date')     cmp = (a.date || '').localeCompare(b.date || '');
    else if (state.sortKey === 'alpha')    cmp = a.company.localeCompare(b.company);
    else if (state.sortKey === 'worktype') cmp = (state.WORKTYPE_ORDER[a.worktype] ?? 3) - (state.WORKTYPE_ORDER[b.worktype] ?? 3);
    else if (state.sortKey === 'salary')   cmp = parseSalary(a.salary) - parseSalary(b.salary);
    return state.sortDir === 'asc' ? cmp : -cmp;
  });
}

export function setSort(key, dir) {
  state.setSortKey(key);
  state.setSortDir(dir);
  document.querySelectorAll('.sort-pill').forEach(p => p.classList.remove('active'));
  document.getElementById(`sp-${key}-${dir}`)?.classList.add('active');
  renderTable();
}

export function thSort(key) {
  const newDir = state.sortKey === key && state.sortDir === 'asc' ? 'desc' : 'asc';
  state.setSortKey(key);
  state.setSortDir(newDir);
  document.querySelectorAll('.sort-pill').forEach(p => p.classList.remove('active'));
  document.getElementById(`sp-${state.sortKey}-${state.sortDir}`)?.classList.add('active');
  renderTable();
}

function updateSortArrows() {
  const colMap = { date: 'date', alpha: 'company', worktype: 'worktype', salary: 'salary' };
  Object.entries(colMap).forEach(([key, col]) => {
    const th  = document.getElementById(`th-${col}`);
    const arr = document.getElementById(`tharr-${col}`);
    const active = key === state.sortKey;
    th?.classList.toggle('sorted', active);
    if (arr) arr.textContent = active ? (state.sortDir === 'asc' ? '↑' : '↓') : '↕';
  });
}


// Deadline helpers

export function deadlineInfo(job) {
  if (state.RESOLVED_STATUSES.includes(job.status)) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const candidates = [
    job.applyBy    ? { date: job.applyBy,    label: 'Apply by' }     : null,
    job.hearBackBy ? { date: job.hearBackBy, label: 'Hear back by' } : null,
  ].filter(Boolean);

  if (!candidates.length) return null;

  candidates.sort((a, b) => a.date.localeCompare(b.date));
  const { date, label } = candidates[0];

  const dl   = new Date(date + 'T00:00:00');
  const diff = Math.round((dl - today) / (1000 * 60 * 60 * 24));

  let text, dlState;
  if      (diff < 0)              { text = 'Overdue';   dlState = 'overdue'; }
  else if (diff === 0)            { text = 'Today!';    dlState = 'urgent';  }
  else if (diff === 1)            { text = 'Tomorrow';  dlState = 'urgent';  }
  else if (diff <= state.WARN_DAYS) { text = `${diff}d left`; dlState = 'warn'; }
  else                            { text = `${diff}d left`; dlState = 'ok';   }

  return { text, state: dlState, label, date, diff };
}

export function deadlineBadgeHtml(info) {
  if (!info) return '';
  const colors = {
    overdue: { bg: 'rgba(251,113,133,0.2)', text: '#FB7185' },
    urgent:  { bg: 'rgba(251,146,60,0.25)', text: '#FB923C' },
    warn:    { bg: 'rgba(251,191,36,0.2)',  text: '#FBBF24' },
    ok:      { bg: 'var(--surface2)',        text: 'var(--text3)' },
  };
  const c = colors[info.state];
  return `<span class="badge" style="background:${c.bg};color:${c.text}">⏰ ${info.text}</span>`;
}

export function deadlineCardBorder(info) {
  if (!info) return '';
  if (info.state === 'overdue') return 'border-color:#FB7185;box-shadow:0 0 0 1px rgba(251,113,133,0.3)';
  if (info.state === 'urgent')  return 'border-color:#FB923C;box-shadow:0 0 0 1px rgba(251,146,60,0.3)';
  if (info.state === 'warn')    return 'border-color:#FBBF24;box-shadow:0 0 0 1px rgba(251,191,36,0.2)';
  return '';
}


// Stats tab

export function renderCharts() {
  const total  = state.jobs.length || 1;
  const counts = Object.fromEntries(state.STATUSES.map(s => [s, state.jobs.filter(j => j.status === s).length]));
  const wc     = ['Remote', 'Hybrid', 'On-site'].map(w => [w, state.jobs.filter(j => j.worktype === w).length]);

  const statusBars = state.STATUSES.map(s => {
    const cfg = state.STATUS_CFG[s];
    const pct = Math.round(counts[s] / total * 100);
    return `<div class="bar-row"><div class="bar-label">${cfg.emoji} ${s}</div><div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${cfg.color}"></div></div><div class="bar-val" style="color:${cfg.color}">${counts[s]}</div></div>`;
  }).join('');

  const worktypeColors = { Remote: '#34D399', Hybrid: '#FB923C', 'On-site': '#A78BFA' };
  const worktypeBars = wc.map(([w, n]) => {
    const pct = Math.round(n / total * 100);
    return `<div class="bar-row"><div class="bar-label">${w}</div><div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${worktypeColors[w]}"></div></div><div class="bar-val" style="color:${worktypeColors[w]}">${n}</div></div>`;
  }).join('');

  const funnelStages = ['Applied', 'Phone Screen', 'Interviewing', 'Offer'];
  const funnelRows = funnelStages.map((s, i) => {
    const cfg  = state.STATUS_CFG[s];
    const prev = i === 0 ? total : counts[funnelStages[i - 1]] || 1;
    const pct  = i === 0 ? 100 : Math.round(counts[s] / prev * 100);
    return `<div class="funnel-row"><span style="color:var(--text2);font-weight:700">${cfg.emoji} ${s}</span><span style="display:flex;align-items:center;gap:8px"><span style="color:var(--text2);font-weight:700;font-size:11px">${counts[s]}</span><span style="font-weight:800;color:${cfg.color}">${pct}%</span></span></div>`;
  }).join('');

  document.getElementById('statsGrid').innerHTML = `
    <div class="chart-card">
      <div class="chart-title">Applications by status</div>
      ${statusBars}
    </div>
    <div class="chart-card">
      <div class="chart-title">Work type mix</div>
      ${worktypeBars}
      <div style="margin-top:18px">
        <div class="chart-title" style="font-size:12px;margin-bottom:10px">Response funnel</div>
        ${funnelRows}
      </div>
    </div>
  `;
}

export function renderSalaryWidget() {
  const el = document.getElementById('salaryWidget');
  if (!el) return;

  const withSalary = state.jobs.filter(j => parseSalary(j.salary) > 0);
  if (withSalary.length < 2) {
    el.innerHTML = `
      <div class="chart-title">Salary insights</div>
      <div class="empty-state">Add salary info to a few applications to see insights here.</div>`;
    return;
  }

  const salaries = withSalary.map(j => parseSalary(j.salary)).sort((a, b) => a - b);
  const lowest   = salaries[0];
  const highest  = salaries[salaries.length - 1];
  const average  = salaries.reduce((a, b) => a + b, 0) / salaries.length;
  const avgPct   = highest > lowest ? ((average - lowest) / (highest - lowest)) * 100 : 50;

  const worktypeColors = { Remote: '#34D399', Hybrid: '#FB923C', 'On-site': '#A78BFA' };
  const worktypeRows = ['Remote', 'Hybrid', 'On-site'].map(w => {
    const wJobs = withSalary.filter(j => j.worktype === w);
    if (!wJobs.length) return '';
    const avg = wJobs.reduce((s, j) => s + parseSalary(j.salary), 0) / wJobs.length;
    const pct = highest > 0 ? Math.round(avg / highest * 100) : 0;
    return `
      <div class="bar-row">
        <div class="bar-label">${w}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${worktypeColors[w]}"></div></div>
        <div class="bar-val" style="color:${worktypeColors[w]}">${formatSalary(avg)}</div>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="chart-title">Salary insights <span style="font-size:10px;font-weight:600;color:var(--text3)">(${withSalary.length} of ${state.jobs.length} apps)</span></div>
    <div class="salary-stat-pills">
      <div class="salary-pill"><div class="salary-pill-label">📉 Lowest</div><div class="salary-pill-val">${formatSalary(lowest)}</div></div>
      <div class="salary-pill"><div class="salary-pill-label">📊 Average</div><div class="salary-pill-val">${formatSalary(average)}</div></div>
      <div class="salary-pill"><div class="salary-pill-label">📈 Highest</div><div class="salary-pill-val">${formatSalary(highest)}</div></div>
    </div>
    <div style="font-size:10px;font-weight:700;color:var(--text3);margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px">Range spread</div>
    <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text3);font-weight:700;margin-bottom:2px">
      <span>${formatSalary(lowest)}</span><span>${formatSalary(highest)}</span>
    </div>
    <div class="salary-range-track">
      <div class="salary-range-fill" style="left:0;width:100%"></div>
      <div class="salary-range-avg" style="left:${avgPct}%"></div>
    </div>
    <div style="font-size:10px;font-weight:600;color:var(--text3);margin-bottom:12px">▲ avg ${formatSalary(average)}</div>
    ${worktypeRows ? `<div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">By work type</div>${worktypeRows}` : ''}
  `;
}

export function renderStatsMessage() {
  const el = document.getElementById('statsMessage');
  if (!el) return;

  const total      = state.jobs.length;
  const active     = state.jobs.filter(j => !['Rejected', 'Ghosted'].includes(j.status)).length;
  const offers     = state.jobs.filter(j => j.status === 'Offer').length;
  const interviews = state.jobs.filter(j => j.status === 'Interviewing').length;
  const applied    = state.jobs.filter(j => j.status === 'Applied').length;

  const [wStart, wEnd] = weekRange();
  const weeklyApps = state.jobs.filter(j => j.status !== 'Rejected' && j.date >= wStart && j.date <= wEnd).length;

  let msg = '';
  if (total === 0) {
    msg = "✨ Your job quest begins here. Add your first application to get started!";
  } else if (offers > 0) {
    msg = `🎉 You have ${offers} offer${offers > 1 ? 's' : ''} on the table. That's the goal — you're doing it!`;
  } else if (interviews > 1) {
    msg = `🔥 ${interviews} interviews in progress — you're in demand. Keep that energy up!`;
  } else if (interviews === 1) {
    msg = `✨ One interview in the works. You got this — prep those notes!`;
  } else if (weeklyApps >= 5) {
    msg = `💪 ${weeklyApps} applications this week. That's serious momentum — the right one is coming.`;
  } else if (active > 10) {
    msg = `📬 ${active} active applications in play. Casting a wide net is smart — stay organised!`;
  } else if (applied > 0 && interviews === 0) {
    msg = `⏳ ${applied} application${applied > 1 ? 's' : ''} waiting to hear back. The waiting is the hardest part — hang in there.`;
  } else if (total >= 5) {
    const msgs = [
      `🌟 ${total} applications logged. Every one is a step forward.`,
      `📋 ${total} applications and counting. Consistency is everything.`,
      `💼 You've put yourself out there ${total} times. That takes courage.`,
    ];
    msg = msgs[Math.floor(Date.now() / 86400000) % msgs.length];
  } else {
    msg = `👋 Good to see you. Keep going — every application is progress.`;
  }

  el.textContent   = msg;
  el.style.display = 'block';
}


// Goals widget (rendered on Stats tab, full view is in goals.js)
// Imported lazily to avoid circular dependency

export function renderGoalsWidget() {
  import('./goals.js').then(({ renderGoalsWidget: rgw }) => rgw());
}

export function renderTemplates() {
  import('./templates.js').then(({ renderTemplates: rt }) => rt());
}

export function renderMoodWidget() {
  import('./goals.js').then(({ renderMoodWidget: rmw }) => rmw());
}