# JobQuest

Yeah so I didn't plan on building an entire job application tracker from scratch. I was just tired of my spreadsheet. It was fine, it worked, but every time I opened it I felt like I was doing my taxes. So I closed it, opened VS Code, and here we are.

JobQuest is a desktop app built with Electron. Everything stays on your machine, nothing goes anywhere, and it actually looks nice — which matters more than people admit when you're going through the emotional rollercoaster of job hunting.

![JobQuest — deep purple theme](screenshot.png)

---

## What it does

There are six views: Board, List, Stats, Goals, Timeline, and Templates. Plus a whole lot living inside each job card.

**Board** is a kanban with six columns — Applied, Phone Screen, Interviewing, Offer, Rejected, and Ghosted. Drag cards between them as things progress. Right-click any card for a quick context menu to duplicate or edit. If a deadline is coming up, the card will tell you about it with a colour-coded badge. Within 2 days it goes amber, overdue goes red. Resolved jobs don't show warnings because honestly they don't need to stress you out any further.

**List** is a sortable table for when you want rows instead of cards. Sort by date, company, salary, or work type. There's a "Hide inactive" toggle that gets Rejected and Ghosted out of your eyeline when you just want to focus on what's still moving.

**Stats** breaks down where everything stands — active applications, response funnel, work type distribution, a salary insights widget, and a goals summary. The salary widget shows your lowest, average, and highest salary across applications, a visual range spread bar, and a breakdown by work type so you can see whether remote roles in your search are paying more or less than on-site ones. It only counts applications where you've actually filled in a salary, and it tells you how many that is.

**Goals** lets you set targets: applications per week, applications per month, interviews this month, and total offers. Progress counts automatically from your data. Weekly goals reset every Monday, monthly ones on the first. You don't have to do anything, it just knows.

**Timeline** has two modes. The feed is a reverse-chronological list of everything that's happened — when you applied, status changes, interviews, upcoming deadlines. The calendar shows the same events on a monthly grid you can click through. Status changes get logged automatically as you update things, so the history just builds up over time.

**Templates** is a library of reusable email templates. There are four starters — follow-up after applying, thank you after an interview, feedback request after rejection, recruiter outreach — and you can add as many of your own as you want. They support `{{company}}`, `{{role}}`, and `{{your_name}}` placeholders that auto-fill when you use them in a job.

---

Each job card has its own set of tabs:

- **Details** — the basics, plus interview date, apply-by deadline, and hear-back-by deadline
- **Contacts** — attach recruiters, hiring managers, interviewers, whoever you've spoken to. Name, title, email, phone, LinkedIn, and notes per person. Email and LinkedIn are clickable
- **Cover letter** — upload a PDF, DOCX, or TXT file, write/paste text, or both. They're independent
- **Emails** — pick from your template library and it auto-fills with that job's details. Save multiple emails per job to track what you've already sent
- **Resume** — upload the specific resume you submitted for that role. Because we all know we have seventeen versions
- **Bonus Q&A** — save answers to those long application form questions so you're not rewriting them from scratch every time
- **Notes** — anything else. Interview prep, contacts, follow-up reminders, "do not mention the thing about the thing"
- **Activity** — a log of changes. Status moves, when a resume was attached, when dates were set. Builds up quietly in the background

---

**Duplicate any job** from the edit modal or by right-clicking a card. A checklist lets you pick exactly what carries over — cover letter, resume, notes, contacts, Q&A, emails, deadlines. Company, location, work type, and salary always copy. Role and link always start blank so you can fill them in fresh.

**Search and filters** sit above the stat cards. The search bar filters by company and role as you type. Click into it and filter pills expand underneath for status, work type, and salary range. Everything — the board, the list, the CSV export — reflects whatever filters are active.

**Deadlines** show up as a badge on kanban cards and a column in the list view. Within 2 days the badge turns amber. Overdue goes red. Jobs that are already resolved don't show warnings.

**Themes** — six dark themes plus light variants of all six, so twelve total. Purple, pink, peach, mint, ocean, midnight. Toggle between dark and light with the sun/moon button in the topbar. The scrollbars match your theme because I noticed they didn't and it bothered me.

**Card density** — switch between Comfortable, Cozy, and Compact from the gear menu depending on how many applications you're juggling.

**Keyboard shortcuts** — press `?` to see the full list. Highlights include `N` for new job, `/` to focus search, and `1`–`6` to switch tabs.

**Export to CSV** lives in the gear menu and exports whatever's currently visible after filters.

---

## Getting started

You'll need [Node.js](https://nodejs.org) — the LTS version is fine.

```bash
git clone https://github.com/yourusername/jobquest.git
cd jobquest
npm install
npm start
```

First time it opens, it'll ask for your name (for the `{{your_name}}` placeholder in email templates) and then walk you through a quick tour of the main features. Both are skippable. You can re-run the tour any time from the gear menu.

---

## Your data

Everything stays local. Nothing goes anywhere.

- **Windows:** `%APPDATA%\jobquest`
- **macOS:** `~/Library/Application Support/jobquest`
- **Linux:** `~/.config/jobquest`

Resumes and cover letter files are stored as base64 in the same JSON as everything else, so there's no separate folder to manage. If you want to back things up manually, the localStorage keys are `jobquest_jobs`, `jobquest_templates`, `jobquest_theme`, `jobquest_goals`, and `jobquest_user_name`.

To update the app, replace `index.html`. If `main.js` or `preload.js` also changed, replace those too. Only run `npm install` again if `package.json` changed.

---

## Project structure

```
jobquest/
├── index.html    # the whole app — UI, logic, everything
├── main.js       # Electron wrapper — window setup, IPC
├── preload.js    # bridge between the renderer and Electron APIs
└── package.json
```

---

## Building

To get an installable instead of running from source:

```bash
npm run build:win    # .exe
npm run build:mac    # .dmg
npm run build:linux  # AppImage
```

Builds go to `dist/`. You need to be on the target platform.

---

## License

MIT