// app.js
// Entry point. Loads all data, applies saved preferences, and wires up
// every event listener in the app. No business logic lives here —
// this file is purely about connecting the UI to the right modules.

import { loadAll }                                     from './storage.js';
import { applyTheme, toggleMode, THEMES }              from './themes.js';
import { render, switchTab, setSort, thSort,
         applyDensity, setDensity,
         handleCardClick, flipCard,
         cardDragStart, cardDragEnd,
         kanbanDragOver, kanbanDragLeave, kanbanDrop }  from './render.js';
import { buildFilterPills, updateHideInactiveBtn,
         applyFilters, clearFilters, expandFilters,
         toggleStatusFilter, toggleWorktypeFilter,
         toggleIndustryFilter, toggleHideInactive,
         updateFilterCount, handleIndustryChange }       from './filters.js';
import { openAdd, openEdit, closeModal, saveJob,
         deleteJob, switchModalTab,
         loadCoverFile, loadResumeFile,
         handleCoverDrop, handleResumeDrop,
         clearResume, clearCoverFile,
         downloadResume, downloadCoverFile,
         addQA, removeQA, addContact, removeContact,
         removeEmail, openEmailPicker, openTemplatePicker,
         closeTemplatePicker, applyTemplateToCover,
         applyTemplateToEmail, applyPrepTemplate,
         dismissPrepToast, renderActivityLog }            from './modal.js';
import { startTour, endTour, tourNext }                 from './tour.js';
import { startParticles }                               from './particles.js';
import { exportAllPDF, exportJobPDF }                   from './pdf.js';
import { renderGoals, updateGoalTarget, logMood }       from './goals.js';
import { switchTimelineView, toggleCalDay,
         calNav, calToday }                              from './timeline.js';
import { openTemplateEditor, closeTemplateEditor,
         saveTemplate, deleteTemplate }                  from './templates.js';
import { persistUserName, persistHideInactive }         from './storage.js';
import * as state                                       from './state.js';

import { makeJob, formatDate, escHtml }                from './utils.js';


// Seed data factory (referenced by loadAll)
function seedData() {
  const daysAgo = n => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  };
  return [
    makeJob({ company: 'Stripe',  role: 'Product Engineer',    location: 'San Francisco, CA', worktype: 'Hybrid',  status: 'Interviewing', salary: '$160k–$200k', date: daysAgo(12), notes: '3rd round — system design next week', industry: 'Technology' }),
    makeJob({ company: 'Linear',  role: 'Frontend Engineer',   location: 'Remote',            worktype: 'Remote',  status: 'Phone Screen', salary: '$140k–$170k', date: daysAgo(8),  notes: 'Chat with hiring manager scheduled',  industry: 'Technology' }),
    makeJob({ company: 'Vercel',  role: 'DX Engineer',         location: 'New York, NY',      worktype: 'Hybrid',  status: 'Applied',      salary: '$130k–$160k', date: daysAgo(3),  notes: '',                                    industry: 'Technology' }),
    makeJob({ company: 'Figma',   role: 'Software Engineer',   location: 'San Francisco, CA', worktype: 'On-site', status: 'Offer',        salary: '$180k–$210k', date: daysAgo(20), notes: 'Deadline to respond: Friday',          industry: 'Design'     }),
    makeJob({ company: 'Notion',  role: 'Full Stack Engineer', location: 'Remote',            worktype: 'Remote',  status: 'Rejected',     salary: '$120k–$150k', date: daysAgo(30), notes: 'No feedback given',                   industry: 'Technology' }),
    makeJob({ company: 'Loom',    role: 'React Developer',     location: 'Austin, TX',        worktype: 'Hybrid',  status: 'Ghosted',      salary: '$110k–$140k', date: daysAgo(45), notes: 'Applied via LinkedIn',                industry: 'Technology' }),
  ];
}


// Startup

function load() {
  const DEFAULT_TEMPLATES = [
    { id: 'tpl-1', name: 'Follow-up after applying',
      subject: 'Following up on my application — {{role}} at {{company}}',
      body: `Hi,\n\nI recently applied for the {{role}} position at {{company}} and wanted to follow up to express my continued enthusiasm.\n\nBest,\n{{your_name}}` },
    { id: 'tpl-2', name: 'Thank you after interview',
      subject: 'Thank you — {{role}} interview at {{company}}',
      body: `Hi,\n\nThank you so much for taking the time to speak with me about the {{role}} role at {{company}}.\n\nBest,\n{{your_name}}` },
    { id: 'tpl-3', name: 'Request for feedback after rejection',
      subject: 'Thank you for the update — {{role}} at {{company}}',
      body: `Hi,\n\nThank you for letting me know about your decision regarding {{role}} at {{company}}. If you have any feedback I would welcome it.\n\nBest,\n{{your_name}}` },
    { id: 'tpl-4', name: 'Reaching out to a contact/recruiter',
      subject: 'Reaching out — {{role}} opportunities at {{company}}',
      body: `Hi,\n\nI came across your profile and noticed you work at {{company}} — I'm very interested in {{role}} opportunities there.\n\nBest,\n{{your_name}}` },
  ];

  const theme = loadAll(DEFAULT_TEMPLATES, seedData);
  applyTheme(THEMES[theme] ? theme : 'purple');

  if (!state.userName) {
    document.getElementById('welcomeBackdrop').classList.add('open');
  }

  buildFilterPills();
  updateHideInactiveBtn();
  document.getElementById('searchBar').classList.add('visible');
  document.getElementById('filterBar').classList.add('visible');
  render();
  applyDensity();
  startParticles();
}


// Welcome / name

function saveUserName() {
  const input = document.getElementById('welcome-name').value.trim();
  if (!input) { alert('Please enter your name.'); return; }
  state.setUserName(input);
  persistUserName(input);
  document.getElementById('welcomeBackdrop').classList.remove('open');
  setTimeout(startTour, 400);
}

function promptChangeName() {
  document.getElementById('settingsDropdown').classList.remove('open');
  const input = document.getElementById('change-name-input');
  if (input) input.value = state.userName || '';
  document.getElementById('changeNameBackdrop').classList.add('open');
  setTimeout(() => input?.focus(), 50);
}

function closeChangeName() {
  document.getElementById('changeNameBackdrop').classList.remove('open');
}

function saveChangedName() {
  const name = document.getElementById('change-name-input').value.trim();
  if (!name) { alert('Please enter your name.'); return; }
  state.setUserName(name);
  persistUserName(name);
  closeChangeName();
}


// Settings dropdown

function toggleSettings(event) {
  event.stopPropagation();
  document.getElementById('settingsDropdown').classList.toggle('open');
}


// CSV export

function exportCSV() {
  document.getElementById('settingsDropdown').classList.remove('open');
  import('./filters.js').then(({ filteredJobs }) => {
  const list = filteredJobs();
  const headers = ['Company','Role','Location','Work type','Industry','Status','Salary','Date applied','Link','Notes'];
  const rows = list.map(job => [
    job.company, job.role, job.location, job.worktype, job.industry,
    job.status, job.salary, job.date, job.link, job.notes,
  ].map(v => `"${(v || '').replace(/"/g, '""')}"`));
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const a = document.createElement('a');
  a.href     = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = `jobquest-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  }); // end filteredJobs import
}


// Duplicate job

function openDupeModal() {
  state.setDupeSourceId(state.editId);
  document.getElementById('dupeModalBackdrop').classList.add('open');
}

function closeDupeModal() {
  document.getElementById('dupeModalBackdrop').classList.remove('open');
}

function confirmDuplicate() {
  const src = state.jobs.find(j => j.id === state.dupeSourceId);
  if (!src) return;
  const get = id => document.getElementById(id)?.checked;
  const newJob = makeJob({
    company:  src.company,
    location: src.location,
    worktype: src.worktype,
    salary:   src.salary,
    status:        get('dupe-status')   ? src.status        : 'Applied',
    cover:         get('dupe-cover')    ? src.cover         : '',
    coverFile:     get('dupe-cover')    ? src.coverFile     : null,
    resume:        get('dupe-resume')   ? src.resume        : null,
    notes:         get('dupe-notes')    ? src.notes         : '',
    contacts:      get('dupe-contacts') ? JSON.parse(JSON.stringify(src.contacts || [])) : [],
    qa:            get('dupe-qa')       ? JSON.parse(JSON.stringify(src.qa       || [])) : [],
    emails:        get('dupe-emails')   ? JSON.parse(JSON.stringify(src.emails   || [])) : [],
    interviewDate: get('dupe-dates')    ? src.interviewDate : '',
    applyBy:       get('dupe-dates')    ? src.applyBy       : '',
    hearBackBy:    get('dupe-dates')    ? src.hearBackBy    : '',
  });
  state.addJob(newJob);
  import('./storage.js').then(({ persistJobs }) => persistJobs(state.jobs));
  render();
  closeDupeModal();
  closeModal();
}


// Context menu

function showContextMenu(event, jobId) {
  event.preventDefault();
  state.setContextJobId(jobId);
  const menu = document.getElementById('contextMenu');
  menu.style.display = 'block';
  menu.style.left = `${Math.min(event.clientX, window.innerWidth  - 160)}px`;
  menu.style.top  = `${Math.min(event.clientY, window.innerHeight -  80)}px`;
}

function hideContextMenu() {
  document.getElementById('contextMenu').style.display = 'none';
}


// Ghost easter egg

function ghostClick(event) {
  event.stopPropagation();
  state.setGhostClickCount(state.ghostClickCount + 1);
  clearTimeout(state.ghostClickTimer);
  state.setGhostClickTimer(setTimeout(() => state.setGhostClickCount(0), 1200));
  if (state.ghostClickCount >= 5) {
    state.setGhostClickCount(0);
    triggerGhostEasterEgg(event);
  }
}

function triggerGhostEasterEgg(event) {
  const col = event.target.closest('.kanban-col');
  if (col) {
    col.style.animation = 'none';
    requestAnimationFrame(() => {
      col.style.animation = 'cardWobble .5s ease both';
      setTimeout(() => col.style.animation = '', 600);
    });
  }
  const count = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const ghost = document.createElement('div');
      ghost.className = 'ghost-floater';
      ghost.textContent = '👻';
      ghost.style.left = `${event.clientX + (Math.random() - 0.5) * 60}px`;
      ghost.style.top  = `${event.clientY}px`;
      ghost.style.animationDelay = `${i * 120}ms`;
      document.body.appendChild(ghost);
      setTimeout(() => ghost.remove(), 1600);
    }, i * 80);
  }
  const messages = [
    "They ghosted you... but you summoned actual ghosts. Power move. 👻",
    "The ghost has been exorcised. You're free. 🕊️",
    "Haunted by silence? Now they're haunted by YOU. 👻",
    "Oooooooh spooky. Their loss, seriously. 👻",
  ];
  const toast = document.createElement('div');
  toast.className   = 'ghost-toast-msg';
  toast.textContent = messages[Math.floor(Math.random() * messages.length)];
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}


// Shortcuts card

function toggleShortcutsCard() {
  document.getElementById('shortcutsCard').classList.toggle('open');
}


// Prep mode

function openPrepMode(jobId) {
  const job = state.jobs.find(j => j.id === jobId);
  if (!job) return;
  closeModal();

  const cfg = state.STATUS_CFG[job.status];
  // formatDate already imported at top of file
  const fd = formatDate;

  const contactsHtml = (job.contacts || []).filter(c => c.name).map(c => `
    <div class="prep-contact">
      <div class="prep-contact-name">${c.name}</div>
      ${c.title ? `<div class="prep-contact-title">${c.title}</div>` : ''}
      <div class="prep-contact-links">
        ${c.email    ? `<a href="mailto:${c.email}" class="contact-link">✉️ Email</a>` : ''}
        ${c.linkedin ? `<a href="${c.linkedin}" target="_blank" class="contact-link">🔗 LinkedIn</a>` : ''}
      </div>
    </div>`).join('');

  document.getElementById('prepLeft').innerHTML = `
    <div class="prep-company">${job.company}</div>
    <div class="prep-role">${job.role || 'Role not specified'}</div>
    <div class="prep-meta">
      <span class="status-pill" style="background:${cfg.bg};color:${cfg.text};width:fit-content">${cfg.emoji} ${job.status}</span>
      ${job.worktype ? `<span style="font-size:12px;font-weight:700;color:var(--text2)">${job.worktype}</span>` : ''}
      ${job.location ? `<span style="font-size:12px;font-weight:600;color:var(--text3)">${job.location}</span>` : ''}
      ${job.salary   ? `<span style="font-size:12px;font-weight:700;color:var(--text2)">${job.salary}</span>` : ''}
    </div>
    ${job.interviewDate ? `<div class="prep-interview-date">📅 Interview: ${fd(job.interviewDate)}</div>` : ''}
    ${contactsHtml ? `<div style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px">Contacts</div>${contactsHtml}` : ''}
  `;

  const tabs = [
    { id: 'prep-notes',    label: 'Notes' },
    { id: 'prep-qa',       label: 'Q&A' },
    { id: 'prep-cover',    label: 'Cover letter' },
    { id: 'prep-activity', label: 'Activity' },
  ];

  const notesHtml    = job.notes ? `<div class="prep-notes">${job.notes}</div>` : `<div class="prep-empty">No notes yet.</div>`;
  const qaHtml       = (job.qa || []).filter(q => q.q || q.a).map(q => `<div class="prep-qa-item"><div class="prep-qa-q">${q.q}</div><div class="prep-qa-a">${q.a || '—'}</div></div>`).join('') || `<div class="prep-empty">No Q&A saved yet.</div>`;
  const coverHtml    = job.cover ? `<div class="prep-cover">${job.cover}</div>` : `<div class="prep-empty">No cover letter text saved.</div>`;

  const activityItems = [...(job.activity || [])].reverse();
  const activityHtml  = activityItems.length
    ? activityItems.map(e => {
        let label = '';
        if (e.type === 'status')        label = `Status changed from ${e.from} to ${e.to}`;
        if (e.type === 'resume')        label = `Resume attached — ${e.detail}`;
        if (e.type === 'interviewDate') label = `Interview date set to ${e.detail}`;
        if (e.type === 'applyBy')       label = `Apply by set to ${e.detail}`;
        if (e.type === 'hearBackBy')    label = `Hear back by set to ${e.detail}`;
        const color = e.type === 'status' ? (state.STATUS_CFG[e.to]?.color || 'var(--accent)') : 'var(--accent)';
        return `<div class="feed-item" style="cursor:default"><div class="feed-dot-wrap"><div class="feed-dot" style="background:${color}"></div></div><div class="feed-content"><div class="feed-title" style="font-size:13px">${label}</div></div><div class="feed-date">${fd(e.date)}</div></div>`;
      }).join('')
    : `<div class="prep-empty">No activity logged yet.</div>`;

  document.getElementById('prepRight').innerHTML = `
    <div class="prep-section-tabs">
      ${tabs.map((t, i) => `<button class="prep-tab ${i === 0 ? 'active' : ''}" data-prep-tab="${t.id}">${t.label}</button>`).join('')}
    </div>
    <div class="prep-content active" id="prep-notes">${notesHtml}</div>
    <div class="prep-content"        id="prep-qa">${qaHtml}</div>
    <div class="prep-content"        id="prep-cover">${coverHtml}</div>
    <div class="prep-content"        id="prep-activity"><div class="feed-list">${activityHtml}</div></div>
  `;

  document.getElementById('prepMode').classList.add('open');
}

function closePrepMode() {
  document.getElementById('prepMode').classList.remove('open');
}

function switchPrepTab(id) {
  document.querySelectorAll('.prep-tab').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.prepTab === id)
  );
  document.querySelectorAll('.prep-content').forEach(el => el.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
}


// Keyboard shortcuts

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closePrepMode();
    closeModal();
    document.getElementById('templateEditorBackdrop').classList.remove('open');
    document.getElementById('templatePickerBackdrop').classList.remove('open');
    document.getElementById('settingsDropdown').classList.remove('open');
    document.getElementById('shortcutsCard').classList.remove('open');
    document.getElementById('filterBar').classList.remove('expanded');
    hideContextMenu();
    return;
  }
  const active = document.activeElement;
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) return;

  const tabMap = { '1': 'kanban', '2': 'table', '3': 'stats', '4': 'goals', '5': 'timeline', '6': 'templates' };
  if (e.key === 'n' || e.key === 'N')  { e.preventDefault(); openAdd(); }
  else if (e.key === '/')              { e.preventDefault(); document.getElementById('searchInput')?.focus(); expandFilters(); }
  else if (e.key === '?')              { e.preventDefault(); toggleShortcutsCard(); }
  else if (tabMap[e.key])              { e.preventDefault(); switchTab(tabMap[e.key]); }
});


// Delegated event listeners

function wire() {

  // Close dropdowns on outside click
  document.addEventListener('click', e => {
    document.getElementById('settingsDropdown')?.classList.remove('open');
    hideContextMenu();
    if (!e.target.closest('#searchBar') && !e.target.closest('#filterBar')) {
      import('./filters.js').then(({ collapseFilters }) => collapseFilters());
    }
  });

  // Topbar tabs
  document.querySelector('.tab-group').addEventListener('click', e => {
    const tab = e.target.closest('[data-tab]');
    if (tab) switchTab(tab.dataset.tab);
  });

  // Theme swatches
  document.querySelector('.theme-swatches').addEventListener('click', e => {
    const swatch = e.target.closest('.swatch');
    if (swatch) {
      const name = swatch.id.replace('sw-', '');
      applyTheme(name);
    }
  });

  // Mode toggle, settings, add job
  document.getElementById('modeBtn').addEventListener('click', toggleMode);
  document.querySelector('.settings-btn').addEventListener('click', toggleSettings);
  document.querySelector('.btn-add').addEventListener('click', openAdd);

  // Settings dropdown items — use text content to identify actions
  document.getElementById('settingsDropdown').addEventListener('click', e => {
    const item = e.target.closest('.dropdown-item');
    if (!item) return;
    const text = item.textContent.trim();
    if (text.includes('Export to CSV'))  exportCSV();
    if (text.includes('Export to PDF'))  exportAllPDF();
    if (text.includes('Change name'))    promptChangeName();
    if (text.includes('Take the tour'))  startTour();
    if (item.id === 'density-comfortable') setDensity('comfortable');
    if (item.id === 'density-cozy')        setDensity('cozy');
    if (item.id === 'density-compact')     setDensity('compact');
  });

  // Filter bar
  document.getElementById('searchInput').addEventListener('input', applyFilters);
  document.getElementById('searchInput').addEventListener('focus', expandFilters);
  document.querySelector('.filter-clear').addEventListener('click', clearFilters);
  document.getElementById('salaryMin').addEventListener('input', applyFilters);
  document.getElementById('salaryMax').addEventListener('input', applyFilters);
  document.getElementById('hideInactiveBtn').addEventListener('click', toggleHideInactive);

  document.getElementById('statusFilters').addEventListener('click', e => {
    const btn = e.target.closest('[data-filter-status]');
    if (btn) toggleStatusFilter(btn.dataset.filterStatus);
  });
  document.getElementById('worktypeFilters').addEventListener('click', e => {
    const btn = e.target.closest('[data-filter-worktype]');
    if (btn) toggleWorktypeFilter(btn.dataset.filterWorktype);
  });
  document.getElementById('industryFilters')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-filter-industry]');
    if (btn) toggleIndustryFilter(btn.dataset.filterIndustry);
  });

  // Sort pills and table headers
  document.querySelector('.sort-pills').addEventListener('click', e => {
    const pill = e.target.closest('[data-sort-key]');
    if (pill) setSort(pill.dataset.sortKey, pill.dataset.sortDir);
  });
  ['company', 'worktype', 'salary', 'date'].forEach(col => {
    const keyMap = { company: 'alpha', worktype: 'worktype', salary: 'salary', date: 'date' };
    document.getElementById(`th-${col}`)?.addEventListener('click', () => thSort(keyMap[col]));
  });

  // Kanban board — delegated drag, click, context menu, ghost
  const board = document.getElementById('kanbanBoard');
  board.addEventListener('dragstart', e => {
    const card = e.target.closest('[data-card-id]');
    if (card) cardDragStart(e, card.dataset.cardId);
  });
  board.addEventListener('dragend', cardDragEnd);
  board.addEventListener('dragover', e => {
    const col = e.target.closest('.kanban-col');
    if (col) kanbanDragOver(e, col.dataset.col);
  });
  board.addEventListener('dragleave', e => {
    const col = e.target.closest('.kanban-col');
    if (col) kanbanDragLeave(e);
  });
  board.addEventListener('drop', e => {
    const col = e.target.closest('.kanban-col');
    if (col) kanbanDrop(e, col.dataset.col);
  });
  board.addEventListener('click', e => {
    const card = e.target.closest('[data-card-id]');
    if (card) handleCardClick(e, card.dataset.cardId);
    const openBtn = e.target.closest('[data-open-id]');
    if (openBtn) { e.stopPropagation(); openEdit(openBtn.dataset.openId); }
    const ghostEl = e.target.closest('[data-ghost-col]');
    if (ghostEl) ghostClick(e);
  });
  board.addEventListener('dblclick', e => {
    const card = e.target.closest('[data-card-id]');
    if (card) flipCard(e, card.dataset.cardId);
  });
  board.addEventListener('contextmenu', e => {
    const card = e.target.closest('[data-card-id]');
    if (card) showContextMenu(e, card.dataset.cardId);
  });

  // Table rows
  document.getElementById('tableBody').addEventListener('click', e => {
    const row = e.target.closest('[data-row-id]');
    if (row) openEdit(row.dataset.rowId);
  });

  // Timeline
  document.getElementById('tl-feed-btn').addEventListener('click', () => switchTimelineView('feed'));
  document.getElementById('tl-cal-btn').addEventListener('click',  () => switchTimelineView('cal'));
  document.getElementById('tl-feed').addEventListener('click', e => {
    const item = e.target.closest('[data-open-job]');
    if (item) openEdit(item.dataset.openJob);
  });
  document.getElementById('tl-cal').addEventListener('click', e => {
    const day = e.target.closest('[data-toggle-cal-day]');
    if (day) toggleCalDay(day.dataset.toggleCalDay);
    const nav = e.target.closest('[data-cal-nav]');
    if (nav) calNav(parseInt(nav.dataset.calNav));
    if (e.target.closest('[data-cal-today]')) calToday();
    const item = e.target.closest('[data-open-job]');
    if (item) openEdit(item.dataset.openJob);
  });

  // Modal — open/close/save/delete
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });
  document.querySelector('.modal-close').addEventListener('click', closeModal);
  document.getElementById('btnSave').addEventListener('click', saveJob);
  document.getElementById('btnDelete').addEventListener('click', deleteJob);
  document.getElementById('btnDuplicate').addEventListener('click', openDupeModal);
  document.getElementById('btnExportPDF').addEventListener('click', exportJobPDF);
  document.getElementById('btnPrepMode').addEventListener('click', () => openPrepMode(state.editId));

  // Modal tabs
  document.querySelector('.modal-tabs').addEventListener('click', e => {
    const tab = e.target.closest('[data-modal-tab]');
    if (tab) switchModalTab(tab.dataset.modalTab);
  });

  // Industry select
  document.getElementById('f-industry').addEventListener('change', e => handleIndustryChange(e.target));

  // File drops and uploads
  document.getElementById('coverDrop').addEventListener('dragover',  e => { e.preventDefault(); e.currentTarget.classList.add('dragover'); });
  document.getElementById('coverDrop').addEventListener('dragleave', e => e.currentTarget.classList.remove('dragover'));
  document.getElementById('coverDrop').addEventListener('drop',      handleCoverDrop);
  document.getElementById('coverDrop').addEventListener('click',     () => document.getElementById('coverInput').click());
  document.getElementById('coverInput').addEventListener('change',   e => { loadCoverFile(e.target.files[0]); e.target.value = ''; });

  document.getElementById('resumeDrop').addEventListener('dragover',  e => { e.preventDefault(); e.currentTarget.classList.add('dragover'); });
  document.getElementById('resumeDrop').addEventListener('dragleave', e => e.currentTarget.classList.remove('dragover'));
  document.getElementById('resumeDrop').addEventListener('drop',      handleResumeDrop);
  document.getElementById('resumeDrop').addEventListener('click',     () => document.getElementById('resumeInput').click());
  document.getElementById('resumeInput').addEventListener('change',   e => { loadResumeFile(e.target.files[0]); e.target.value = ''; });

  // Q&A panel
  document.getElementById('qaList').addEventListener('click', e => {
    const btn = e.target.closest('[data-remove-qa]');
    if (btn) removeQA(parseInt(btn.dataset.removeQa));
  });
  document.getElementById('qaList').addEventListener('input', e => {
    const el = e.target;
    if (el.dataset.qaQ !== undefined) state.currentQA[parseInt(el.dataset.qaQ)].q = el.value;
    if (el.dataset.qaA !== undefined) state.currentQA[parseInt(el.dataset.qaA)].a = el.value;
  });
  document.querySelector('.btn-add-qa').addEventListener('click', addQA);

  // Contacts panel
  document.getElementById('contactsList').addEventListener('click', e => {
    const btn = e.target.closest('[data-remove-contact]');
    if (btn) removeContact(parseInt(btn.dataset.removeContact));
  });
  document.getElementById('contactsList').addEventListener('input', e => {
    const el = e.target;
    if (el.dataset.contactField !== undefined && el.dataset.contactKey) {
      state.currentContacts[parseInt(el.dataset.contactField)][el.dataset.contactKey] = el.value;
    }
  });
  document.querySelector('button[data-modal-tab]')?.closest('.modal-tabs'); // already wired above

  // Use template / email picker buttons
  document.querySelector('.btn-template[onclick*="openTemplatePicker"]')?.removeAttribute('onclick');
  document.querySelector('.btn-template[onclick*="openEmailPicker"]')?.removeAttribute('onclick');

  // Wire template picker and email picker open buttons by finding them in modal panels
  document.getElementById('mpanel-cover')?.addEventListener('click', e => {
    if (e.target.closest('.btn-template.primary')) openTemplatePicker();
  });
  document.getElementById('mpanel-emails')?.addEventListener('click', e => {
    if (e.target.closest('.btn-template.primary')) openEmailPicker();
  });
  document.querySelector('.btn-add-contact').addEventListener('click', () => {
    state.currentContacts.push({ name: '', title: '', email: '', phone: '', linkedin: '', notes: '' });
    import('./modal.js').then(({ renderContactsList }) => renderContactsList());
  });

  // Emails panel
  document.getElementById('emailList').addEventListener('click', e => {
    const btn = e.target.closest('[data-remove-email]');
    if (btn) removeEmail(parseInt(btn.dataset.removeEmail));
  });
  document.getElementById('emailList').addEventListener('input', e => {
    const el = e.target;
    if (el.dataset.emailSubject !== undefined) state.currentEmails[parseInt(el.dataset.emailSubject)].subject = el.value;
    if (el.dataset.emailBody    !== undefined) state.currentEmails[parseInt(el.dataset.emailBody)].body    = el.value;
  });

  // File preview clear/download buttons
  document.getElementById('coverFilePreview').addEventListener('click', e => {
    if (e.target.closest('[data-clear-file="coverFile"]'))    clearCoverFile();
    if (e.target.closest('[data-download-file="coverFile"]')) downloadCoverFile();
  });
  document.getElementById('resumePreview').addEventListener('click', e => {
    if (e.target.closest('[data-clear-file="resume"]'))    clearResume();
    if (e.target.closest('[data-download-file="resume"]')) downloadResume();
  });

  // Template editor
  document.getElementById('templateEditorBackdrop').addEventListener('click', e => {
    if (e.target === document.getElementById('templateEditorBackdrop')) closeTemplateEditor();
  });
  document.querySelector('#templateEditorBackdrop .modal-close').addEventListener('click', closeTemplateEditor);
  document.querySelector('#templateEditorBackdrop .btn-save').addEventListener('click', saveTemplate);
  document.getElementById('templatesGrid')?.addEventListener('click', e => {
    const editBtn   = e.target.closest('[data-edit-template]');
    const deleteBtn = e.target.closest('[data-delete-template]');
    if (editBtn)   openTemplateEditor(editBtn.dataset.editTemplate);
    if (deleteBtn) deleteTemplate(deleteBtn.dataset.deleteTemplate);
  });
  document.querySelector('.templates-header .btn-add')?.addEventListener('click', () => openTemplateEditor());

  // Template picker
  document.getElementById('templatePickerBackdrop').addEventListener('click', e => {
    const item = e.target.closest('[data-apply-email-template]');
    if (item) { applyTemplateToEmail(item.dataset.applyEmailTemplate); return; }
    const cover = e.target.closest('[data-apply-cover-template]');
    if (cover) { applyTemplateToCover(cover.dataset.applyCoverTemplate); return; }
    if (e.target === document.getElementById('templatePickerBackdrop')) closeTemplatePicker();
  });

  // Goals tab
  document.getElementById('goalsGrid').addEventListener('change', e => {
    const input = e.target.closest('[data-goal-key]');
    if (input) updateGoalTarget(input.dataset.goalKey, input.value);
  });

  // Mood widget
  document.getElementById('moodWidget').addEventListener('click', e => {
    const btn = e.target.closest('[data-log-mood]');
    if (btn) logMood(btn.dataset.logMood);
    const tabLink = e.target.closest('[data-switch-tab]');
    if (tabLink) switchTab(tabLink.dataset.switchTab);
  });

  // Context menu
  document.getElementById('contextMenu').addEventListener('click', e => {
    const item = e.target.closest('.context-item');
    if (!item) return;
    hideContextMenu();
    if (item.id === 'contextDupe') { state.setDupeSourceId(state.contextJobId); document.getElementById('dupeModalBackdrop').classList.add('open'); }
    if (item.id === 'contextEdit') openEdit(state.contextJobId);
    if (item.id === 'contextPrep') openPrepMode(state.contextJobId);
  });

  // Duplicate modal
  document.getElementById('dupeModalBackdrop').addEventListener('click', e => {
    if (e.target === document.getElementById('dupeModalBackdrop')) closeDupeModal();
  });
  document.getElementById('dupeModalBackdrop').querySelector('.btn-save').addEventListener('click', confirmDuplicate);
  document.getElementById('dupeModalBackdrop').querySelector('.btn-cancel').addEventListener('click', closeDupeModal);

  // Prep mode
  document.querySelector('.prep-mode-close').addEventListener('click', closePrepMode);
  document.getElementById('prepRight').addEventListener('click', e => {
    const tab = e.target.closest('[data-prep-tab]');
    if (tab) switchPrepTab(tab.dataset.prepTab);
    const openBtn = e.target.closest('[data-open-id]');
    if (openBtn) openEdit(openBtn.dataset.openId);
  });

  // Tour
  document.getElementById('tourNextBtn').addEventListener('click', tourNext);
  document.querySelector('.tour-btn.skip').addEventListener('click', endTour);

  // Prep toast
  document.querySelector('.prep-toast-yes').addEventListener('click', applyPrepTemplate);
  document.querySelector('.prep-toast-no').addEventListener('click', dismissPrepToast);

  // Shortcuts card
  document.querySelector('.shortcuts-card-title button').addEventListener('click', toggleShortcutsCard);

  // Welcome modal
  document.getElementById('welcome-name').addEventListener('keydown', e => {
    if (e.key === 'Enter') saveUserName();
  });
  document.querySelector('#welcomeBackdrop .btn-save').addEventListener('click', saveUserName);

  // Change name modal
  document.getElementById('changeNameBackdrop').addEventListener('click', e => {
    if (e.target === document.getElementById('changeNameBackdrop')) closeChangeName();
  });
  document.getElementById('change-name-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') saveChangedName();
  });
  document.getElementById('changeNameBackdrop').querySelector('.btn-save').addEventListener('click', saveChangedName);
  document.getElementById('changeNameBackdrop').querySelector('.btn-cancel').addEventListener('click', closeChangeName);
  document.getElementById('changeNameBackdrop').querySelector('.modal-close').addEventListener('click', closeChangeName);

  // Window controls (Electron only)
  if (window.windowControls) {
    document.getElementById('winMinimize').addEventListener('click', () => window.windowControls.minimize());
    document.getElementById('winMaximize').addEventListener('click', () => window.windowControls.maximize());
    document.getElementById('winClose').addEventListener('click',    () => window.windowControls.close());
    window.windowControls.onMaximized(isMax => {
      const icon = document.querySelector('#winMaximize svg');
      icon.innerHTML = isMax
        ? '<path d="M1 4h6v6H1zM4 1h6v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'
        : '<rect x="1" y="1" width="9" height="9" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/>';
    });
  } else {
    const ctrl = document.querySelector('.win-controls');
    if (ctrl) ctrl.style.display = 'none';
  }
}


// Init

wire();
load();