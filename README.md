# Ledger — Expense Tracker

A simple expense tracker built with plain HTML, CSS, and JavaScript, submitted for the LTS Software Developer Intern task.

## Features

- Add income or expense transactions with amount, category, date, and description
- Edit and delete existing transactions
- Running balance, total income, total expenses, and current-month net at a glance
- Filter by type (income / expense) and by category
- Data persists in the browser via `localStorage` — refreshing the page keeps your entries
- Responsive layout for desktop and mobile
- Bonus: monthly summary (last 6 months), category-wise expense breakdown chart, and inline form validation

## How to run

No build step or dependencies are required.

1. Clone the repository:
   `git clone https://github.com/Abhinand44git/expense-tracker-abhinand.git`
2. Open `index.html` directly in any modern browser (double-click it, or right-click → "Open with" your browser).

That's it — the app runs entirely client-side.

**Optional (if double-clicking gives storage issues in your browser):**
Serve it locally instead:
```bash
# Python 3
python3 -m http.server 8000
# then visit http://localhost:8000 in your browser
```

## Project structure

```
expense-tracker-abhinand/
├── index.html      # Page structure
├── style.css       # Design system and layout
├── script.js       # App logic: storage, CRUD, filters, summaries, chart
└── README.md
```


## Notes on approach

- No external JS libraries or frameworks — vanilla JS as requested, using `localStorage` for persistence.
- Categories are split into income-specific and expense-specific lists that swap automatically based on the selected transaction type.
- The category-wise chart is a simple horizontal bar visualization built with CSS, so it needs no charting library.
- Basic validation prevents zero/negative amounts and missing dates, with inline error messages.
- Deleting a transaction asks for confirmation to avoid accidental data loss.
- Fonts load from Google Fonts. Offline, the app falls back to system fonts and works the same.


**Live demo:** https://abhinand44git.github.io/expense-tracker-abhinand/