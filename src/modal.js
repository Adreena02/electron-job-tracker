// modal.js
// Job modal — open, close, save, delete, and all sub-panel render functions.
// Depends on: state.js, storage.js, utils.js, filters.js, render.js

import * as state from './state.js';
import { persistJobs } from './storage.js';
import { escHtml, formatDate, todayISO, uid, makeJob } from './utils.js';
import { populateIndustrySelect } from './filters.js';


// Tab switching inside the modal

const MODAL_TAB_RENDERERS = {
  qa:       () => renderQAList(),
  emails:   () => renderEmailList(),
  activity: () => renderActivityLog(),
  contacts: () => renderContactsList(),
};

export function switchModalTab(tab) {
  state.MODAL_TABS.forEach(t => {
    document.getElementById(`mtab-${t}`)?.classList.toggle('active', t === tab);
    document.getElementById(`mpanel-${t}`)?.classList.toggle('active', t === tab);
  });
  MODAL_TAB_RENDERERS[tab]?.();
}


// Open and close

export function openAdd() {
  state.setEditId(null);
  state.setCurrentResume(null);
  state.setCurrentCoverFile(null);
  state.setCurrentQA([]);
  state.setCurrentEmails([]);
  state.setCurrentContacts([]);

  document.getElementById('modalTitle').textContent = 'New application ✨';
  setEditButtonsVisible(false);
  state.TEXT_FIELDS.forEach(f => document.getElementById(`f-${f}`).value = '');
  Object.keys(state.DATE_FIELDS).forEach(id => { document.getElementById(`f-${id}`).value = ''; });
  document.getElementById('f-worktype').value = 'Remote';
  document.getElementById('f-status').value   = 'Applied';
  document.getElementById('f-date').value     = todayISO();
  populateIndustrySelect('');
  resetModalPanels();
}

export function openEdit(id) {
  const job = state.jobs.find(j => j.id === id);
  if (!job) return;

  state.setEditId(id);
  state.setCurrentResume(job.resume     ? { ...job.resume }    : null);
  state.setCurrentCoverFile(job.coverFile ? { ...job.coverFile } : null);
  state.setCurrentQA(JSON.parse(JSON.stringify(job.qa       || [])));
  state.setCurrentEmails(JSON.parse(JSON.stringify(job.emails   || [])));
  state.setCurrentContacts(JSON.parse(JSON.stringify(job.contacts || [])));

  document.getElementById('modalTitle').textContent = 'Edit application';
  setEditButtonsVisible(true);
  state.TEXT_FIELDS.forEach(f => document.getElementById(`f-${f}`).value = job[f] || '');
  Object.entries(state.DATE_FIELDS).forEach(([id, key]) => {
    document.getElementById(`f-${id}`).value = job[key] || '';
  });
  document.getElementById('f-worktype').value = job.worktype || 'Remote';
  document.getElementById('f-status').value   = job.status   || 'Applied';
  populateIndustrySelect(job.industry || '');
  resetModalPanels();
}

export function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

function setEditButtonsVisible(visible) {
  const display = visible ? 'block' : 'none';
  ['btnDelete', 'btnDuplicate', 'btnExportPDF', 'btnPrepMode'].forEach(id => {
    document.getElementById(id).style.display = display;
  });
}

function resetModalPanels() {
  renderResumePreview();
  renderCoverFilePreview();
  renderContactsList();
  renderQAList();
  renderEmailList();
  renderActivityLog();
  switchModalTab('details');
  document.getElementById('modalOverlay').classList.add('open');
}


// Save and delete

export function saveJob() {
  const val = id => document.getElementById(id).value;
  const prevJob = state.editId ? state.jobs.find(j => j.id === state.editId) : null;

  const job = makeJob({
    id:            state.editId || uid(),
    company:       val('f-company').trim(),
    role:          val('f-role').trim(),
    location:      val('f-location').trim(),
    worktype:      val('f-worktype'),
    industry:      val('f-industry') === '__custom__' ? '' : (val('f-industry') || ''),
    status:        val('f-status'),
    salary:        val('f-salary').trim(),
    date:          val('f-date'),
    interviewDate: val('f-interview-date') || '',
    applyBy:       val('f-apply-by')       || '',
    hearBackBy:    val('f-hear-back-by')   || '',
    link:          val('f-link').trim(),
    cover:         val('f-cover').trim(),
    notes:         val('f-notes').trim(),
    resume:        state.currentResume,
    coverFile:     state.currentCoverFile,
    qa:            state.currentQA.filter(q => q.q || q.a),
    emails:        state.currentEmails,
    contacts:      state.currentContacts.filter(c => c.name),
    activity:      prevJob?.activity ? [...prevJob.activity] : [],
  });

  if (!job.company) { alert('Please enter a company name.'); return; }

  const today = todayISO();
  const movedToInterviewing = prevJob && prevJob.status !== 'Interviewing' && job.status === 'Interviewing';

  if (prevJob && prevJob.status !== job.status) {
    job.activity.push({ date: today, type: 'status', from: prevJob.status, to: job.status });
  }
  if (prevJob && !prevJob.resume && job.resume) {
    job.activity.push({ date: today, type: 'resume', detail: job.resume.name });
  }
  if (prevJob && prevJob.interviewDate !== job.interviewDate && job.interviewDate) {
    job.activity.push({ date: today, type: 'interviewDate', detail: job.interviewDate });
  }
  if (prevJob && prevJob.applyBy !== job.applyBy && job.applyBy) {
    job.activity.push({ date: today, type: 'applyBy', detail: job.applyBy });
  }
  if (prevJob && prevJob.hearBackBy !== job.hearBackBy && job.hearBackBy) {
    job.activity.push({ date: today, type: 'hearBackBy', detail: job.hearBackBy });
  }

  const isNew = !state.editId;
  if (state.editId) {
    state.updateJob(state.editId, job);
  } else {
    state.addJob(job);
  }

  persistJobs(state.jobs);
  import('./render.js').then(({ render }) => render());
  closeModal();

  if (isNew && job.status === 'Applied') {
    setTimeout(() => {
      import('./confetti.js').then(({ launchConfetti }) =>
        launchConfetti(document.getElementById('btnSave'))
      );
    }, 80);
  }

  if (movedToInterviewing) {
    setTimeout(showPrepToast, 300);
  }
}

export function deleteJob() {
  state.removeJob(state.editId);
  persistJobs(state.jobs);
  import('./render.js').then(({ render }) => render());
  closeModal();
}


// File handling (resume + cover letter)

function loadFile(file, onLoaded) {
  if (file.size > 5 * 1024 * 1024) { alert('File too large — max 5 MB.'); return; }
  const reader = new FileReader();
  reader.onload = e => onLoaded({ name: file.name, size: file.size, type: file.type, data: e.target.result });
  reader.readAsDataURL(file);
}

export function loadCoverFile(file)  { loadFile(file, f => { state.setCurrentCoverFile(f); renderCoverFilePreview(); }); }
export function loadResumeFile(file) { loadFile(file, f => { state.setCurrentResume(f);    renderResumePreview();    }); }

export function handleCoverDrop(event) {
  event.preventDefault();
  document.getElementById('coverDrop').classList.remove('dragover');
  const file = event.dataTransfer.files[0];
  if (file) loadCoverFile(file);
}

export function handleResumeDrop(event) {
  event.preventDefault();
  document.getElementById('resumeDrop').classList.remove('dragover');
  const file = event.dataTransfer.files[0];
  if (file) loadResumeFile(file);
}

function renderFilePreview(file, dropId, previewId, emoji, downloadLabel, clearFn, downloadFn) {
  const drop    = document.getElementById(dropId);
  const preview = document.getElementById(previewId);
  if (!drop || !preview) return;
  if (file) {
    drop.style.display = 'none';
    preview.innerHTML  = `
      <div class="resume-file">
        <span style="font-size:22px;flex-shrink:0">${emoji}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text)">${file.name}</div>
          <div style="font-size:10px;color:var(--text3);font-weight:600">${Math.round(file.size / 1024)} KB</div>
        </div>
        <button data-clear-file="${clearFn}" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:16px">×</button>
      </div>
      <button data-download-file="${downloadFn}" style="margin-top:10px;width:100%;padding:8px;background:none;border:0.5px solid var(--border2);border-radius:12px;font-family:var(--fn);font-size:12px;font-weight:700;color:var(--text2);cursor:pointer">${downloadLabel}</button>
    `;
  } else {
    drop.style.display = 'block';
    preview.innerHTML  = '';
  }
}

export function renderResumePreview()    { renderFilePreview(state.currentResume,    'resumeDrop', 'resumePreview',    '📄', 'Download resume',       'resume',    'resume');    }
export function renderCoverFilePreview() { renderFilePreview(state.currentCoverFile, 'coverDrop',  'coverFilePreview', '📝', 'Download cover letter', 'coverFile', 'coverFile'); }

export function clearResume()    { state.setCurrentResume(null);    renderResumePreview();    }
export function clearCoverFile() { state.setCurrentCoverFile(null); renderCoverFilePreview(); }

function downloadFile(file) {
  const a = document.createElement('a');
  a.href     = file.data;
  a.download = file.name;
  a.click();
}
export function downloadResume()    { downloadFile(state.currentResume);    }
export function downloadCoverFile() { downloadFile(state.currentCoverFile); }


// Q&A panel

export function renderQAList() {
  document.getElementById('qaList').innerHTML = state.currentQA.map((item, i) => `
    <div class="qa-item">
      <button class="qa-remove" data-remove-qa="${i}">×</button>
      <input value="${escHtml(item.q)}" placeholder="Question (e.g. Why do you want to work here?)"
        data-qa-q="${i}">
      <textarea placeholder="Your answer..." data-qa-a="${i}">${escHtml(item.a)}</textarea>
    </div>
  `).join('');
}

export function addQA()      { state.currentQA.push({ q: '', a: '' }); renderQAList(); }
export function removeQA(i)  { state.currentQA.splice(i, 1);           renderQAList(); }


// Contacts panel

export function renderContactsList() {
  const list = document.getElementById('contactsList');
  if (!list) return;

  if (!state.currentContacts.length) {
    list.innerHTML = `<div class="empty-state">No contacts yet — add the recruiter or hiring manager you've been speaking with.</div>`;
    return;
  }

  list.innerHTML = state.currentContacts.map((c, i) => `
    <div class="contact-card">
      <button class="contact-remove" data-remove-contact="${i}">×</button>
      <div class="contact-grid">
        <div class="contact-field">
          <label>Name</label>
          <input value="${escHtml(c.name)}"    placeholder="e.g. Sarah Chen"       data-contact-field="${i}" data-contact-key="name">
        </div>
        <div class="contact-field">
          <label>Title / Role</label>
          <input value="${escHtml(c.title)}"   placeholder="e.g. Recruiter"        data-contact-field="${i}" data-contact-key="title">
        </div>
        <div class="contact-field">
          <label>Email</label>
          <input type="email" value="${escHtml(c.email)}" placeholder="sarah@company.com" data-contact-field="${i}" data-contact-key="email">
        </div>
        <div class="contact-field">
          <label>Phone</label>
          <input type="tel" value="${escHtml(c.phone)}"  placeholder="+1 555 000 0000"   data-contact-field="${i}" data-contact-key="phone">
        </div>
        <div class="contact-field full">
          <label>LinkedIn</label>
          <input value="${escHtml(c.linkedin)}" placeholder="https://linkedin.com/in/..." data-contact-field="${i}" data-contact-key="linkedin">
        </div>
        <div class="contact-field full">
          <label>Notes</label>
          <input value="${escHtml(c.notes)}" placeholder="e.g. Very responsive, mentioned team is growing fast" data-contact-field="${i}" data-contact-key="notes">
        </div>
      </div>
      ${c.email || c.linkedin ? `
        <div style="display:flex;gap:12px;margin-top:10px;padding-top:8px;border-top:0.5px solid var(--border)">
          ${c.email    ? `<a href="mailto:${escHtml(c.email)}" class="contact-link">✉️ Email</a>` : ''}
          ${c.linkedin ? `<a href="${escHtml(c.linkedin)}" target="_blank" class="contact-link">🔗 LinkedIn</a>` : ''}
        </div>` : ''}
    </div>
  `).join('');
}

export function addContact() {
  state.currentContacts.push({ name: '', title: '', email: '', phone: '', linkedin: '', notes: '' });
  renderContactsList();
}

export function removeContact(i) {
  state.currentContacts.splice(i, 1);
  renderContactsList();
}


// Emails panel

export function renderEmailList() {
  const list = document.getElementById('emailList');
  if (!list) return;

  if (!state.currentEmails.length) {
    list.innerHTML = `<div class="empty-state">No emails yet — pick a template above to get started.</div>`;
    return;
  }

  list.innerHTML = state.currentEmails.map((email, i) => `
    <div class="qa-item" style="margin-bottom:12px">
      <button class="qa-remove" data-remove-email="${i}">×</button>
      <div style="font-size:10px;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">${escHtml(email.templateName)}</div>
      <input value="${escHtml(email.subject)}" placeholder="Subject line..."
        data-email-subject="${i}" style="width:100%;margin-bottom:7px;font-size:12px">
      <textarea placeholder="Email body..."
        data-email-body="${i}"
        style="width:100%;min-height:120px;font-size:12px;font-weight:400;line-height:1.5;margin-bottom:0">${escHtml(email.body)}</textarea>
    </div>
  `).join('');
}

export function removeEmail(i) { state.currentEmails.splice(i, 1); renderEmailList(); }


// Activity log panel

function activityEntryHtml(entry, isLast) {
  const icons = {
    status:        { color: state.STATUS_CFG[entry.to]?.color || '#94A3B8' },
    resume:        { color: '#34D399' },
    interviewDate: { color: '#A78BFA' },
    applyBy:       { color: '#38BDF8' },
    hearBackBy:    { color: '#38BDF8' },
  };
  const cfg = icons[entry.type] || { color: '#94A3B8' };

  let label = '';
  if (entry.type === 'status')        label = `Status changed from <strong>${entry.from}</strong> to <strong>${entry.to}</strong>`;
  if (entry.type === 'resume')        label = `Resume attached — ${entry.detail}`;
  if (entry.type === 'interviewDate') label = `Interview date set to ${formatDate(entry.detail)}`;
  if (entry.type === 'applyBy')       label = `Apply by deadline set to ${formatDate(entry.detail)}`;
  if (entry.type === 'hearBackBy')    label = `Hear back by deadline set to ${formatDate(entry.detail)}`;

  return `
    <div class="feed-item" style="cursor:default">
      <div class="feed-dot-wrap">
        <div class="feed-dot" style="background:${cfg.color}"></div>
        ${!isLast ? '<div class="feed-line"></div>' : ''}
      </div>
      <div class="feed-content">
        <div class="feed-title" style="font-size:12px">${label}</div>
      </div>
      <div class="feed-date">${formatDate(entry.date)}</div>
    </div>
  `;
}

export function renderActivityLog() {
  const list = document.getElementById('activityList');
  if (!list) return;

  const job     = state.editId ? state.jobs.find(j => j.id === state.editId) : null;
  const entries = [...(job?.activity || [])].reverse();

  if (!entries.length) {
    list.innerHTML = `<div class="feed-empty">Nothing logged yet — activity will appear here as you update this application.</div>`;
    return;
  }

  list.innerHTML = '<div class="feed-list">' +
    entries.map((e, i) => activityEntryHtml(e, i === entries.length - 1)).join('') +
    '</div>';
}


// Template picker (for emails + cover letter)

export function openEmailPicker() {
  const list = document.getElementById('templatePickerList');
  if (!state.templates.length) {
    list.innerHTML = `<div class="empty-state">No templates yet — create some in the Templates tab first.</div>`;
  } else {
    list.innerHTML = state.templates.map(t => `
      <div class="template-picker-item" data-apply-email-template="${t.id}">
        <div class="template-picker-item-name">${t.name}</div>
        <div class="template-picker-item-preview">${t.body.replace(/\n/g, ' ')}</div>
      </div>
    `).join('');
  }
  document.getElementById('templatePickerBackdrop').classList.add('open');
}

export function openTemplatePicker() {
  const list = document.getElementById('templatePickerList');
  if (!state.templates.length) {
    list.innerHTML = `<div class="empty-state">No templates yet — create some in the Templates tab first.</div>`;
  } else {
    list.innerHTML = state.templates.map(t => `
      <div class="template-picker-item" data-apply-cover-template="${t.id}">
        <div class="template-picker-item-name">${t.name}</div>
        <div class="template-picker-item-preview">${t.body.replace(/\n/g, ' ')}</div>
      </div>
    `).join('');
  }
  document.getElementById('templatePickerBackdrop').classList.add('open');
}

export function closeTemplatePicker() {
  document.getElementById('templatePickerBackdrop').classList.remove('open');
}

function fillTemplate(str) {
  const company = document.getElementById('f-company').value.trim() || '{{company}}';
  const role    = document.getElementById('f-role').value.trim()    || '{{role}}';
  const name    = state.userName || '{{your_name}}';
  return str
    .replace(/\{\{company\}\}/g,   company)
    .replace(/\{\{role\}\}/g,      role)
    .replace(/\{\{your_name\}\}/g, name);
}

export function applyTemplateToCover(id) {
  const tpl = state.templates.find(t => t.id === id);
  if (!tpl) return;
  document.getElementById('f-cover').value = fillTemplate(tpl.body);
  closeTemplatePicker();
  switchModalTab('cover');
}

export function applyTemplateToEmail(id) {
  const tpl = state.templates.find(t => t.id === id);
  if (!tpl) return;
  state.currentEmails.push({
    templateName: tpl.name,
    subject:      fillTemplate(tpl.subject || ''),
    body:         fillTemplate(tpl.body    || ''),
  });
  closeTemplatePicker();
  switchModalTab('emails');
  renderEmailList();
}


// Interview prep toast

export function showPrepToast() {
  const toast = document.getElementById('prepToast');
  toast.style.display = 'flex';
  clearTimeout(state.prepToastTimer);
  state.setPrepToastTimer(setTimeout(dismissPrepToast, 8000));
}

export function dismissPrepToast() {
  document.getElementById('prepToast').style.display = 'none';
  clearTimeout(state.prepToastTimer);
}

export function applyPrepTemplate() {
  dismissPrepToast();
  const textarea = document.getElementById('f-notes');
  if (!textarea) return;
  const existing = textarea.value.trim();
  textarea.value = existing ? existing + '\n\n' + state.PREP_TEMPLATE : state.PREP_TEMPLATE;
  if (document.getElementById('modalOverlay').classList.contains('open')) {
    switchModalTab('notes');
  } else if (state.jobs.length) {
    openEdit(state.jobs[0].id);
    setTimeout(() => switchModalTab('notes'), 50);
  }
}