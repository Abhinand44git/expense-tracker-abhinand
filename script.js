// ---------------------------------------------------------
// Ledger — Expense Tracker
// All data lives in localStorage under the key 'ledger.transactions'
// ---------------------------------------------------------

const STORAGE_KEY = 'ledger.transactions';

const CATEGORIES = {
  income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other income'],
  expense: ['Food', 'Transport', 'Housing', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Other expense'],
};

/** @typedef {{id:string, type:'income'|'expense', amount:number, category:string, date:string, description:string}} Transaction */

// ---------- State ----------
let transactions = loadTransactions();
let activeTypeFilter = 'all';
let activeCategoryFilter = 'all';

// ---------- Elements ----------
const form = document.getElementById('transactionForm');
const editIdInput = document.getElementById('editId');
const amountInput = document.getElementById('amount');
const categorySelect = document.getElementById('category');
const dateInput = document.getElementById('date');
const descriptionInput = document.getElementById('description');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const amountError = document.getElementById('amountError');
const categoryError = document.getElementById('categoryError');
const dateError = document.getElementById('dateError');

const ledgerBody = document.getElementById('ledgerBody');
const emptyState = document.getElementById('emptyState');
const categoryFilterSelect = document.getElementById('categoryFilter');

// ---------- Storage ----------
function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(data)) return [];
    return data.filter(isValidTransaction);
  } catch (e) {
    console.error('Could not read saved transactions, starting fresh.', e);
    return [];
  }
}

function isValidTransaction(t) {
  return (
    t &&
    typeof t.id === 'string' &&
    (t.type === 'income' || t.type === 'expense') &&
    typeof t.amount === 'number' &&
    typeof t.category === 'string' &&
    typeof t.date === 'string'
  );
}

function saveTransactions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (e) {
    console.error('Could not save transactions.', e);
    alert('Your entry was recorded on screen but could not be saved to this browser. Storage may be full or disabled.');
  }
}

// ---------- Helpers ----------
function formatCurrency(value) {
  const sign = value < 0 ? '-' : '';
  return `${sign}₹${Math.abs(value).toFixed(2)}`;
}

function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function uid() {
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function populateCategoryOptions(type) {
  categorySelect.innerHTML = '<option value="" disabled selected>Choose one</option>';
  CATEGORIES[type].forEach((cat) => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
}

function populateCategoryFilterOptions() {
  const allCats = [...CATEGORIES.income, ...CATEGORIES.expense];
  categoryFilterSelect.innerHTML = '<option value="all">All categories</option>';
  allCats.forEach((cat) => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categoryFilterSelect.appendChild(opt);
  });
}

// ---------- Validation ----------
function validateForm() {
  let valid = true;
  amountError.textContent = '';
  categoryError.textContent = '';
  dateError.textContent = '';

  const amount = parseFloat(amountInput.value);
  if (isNaN(amount) || amount <= 0) {
    amountError.textContent = 'Enter an amount greater than 0.';
    valid = false;
  }

  if (!categorySelect.value) {
    categoryError.textContent = 'Please choose a category.';
    valid = false;
  }

  if (!dateInput.value) {
    dateError.textContent = 'Pick a date.';
    valid = false;
  }

  return valid;
}

// ---------- CRUD ----------
function addOrUpdateTransaction(entry) {
  const editing = editIdInput.value;
  if (editing) {
    transactions = transactions.map((t) => (t.id === editing ? { ...t, ...entry } : t));
  } else {
    transactions.push({ id: uid(), ...entry });
  }
  saveTransactions();
  resetForm();
  render();
}

function deleteTransaction(id) {
  const t = transactions.find((x) => x.id === id);
  if (!t) return;
  const label = t.description || t.category;
  if (!confirm(`Delete "${label}" (${formatCurrency(t.amount)})? This can't be undone.`)) return;
  transactions = transactions.filter((x) => x.id !== id);
  if (editIdInput.value === id) resetForm();
  saveTransactions();
  render();
}

function startEdit(id) {
  const t = transactions.find((x) => x.id === id);
  if (!t) return;
  editIdInput.value = t.id;
  form.querySelector(`input[name="type"][value="${t.type}"]`).checked = true;
  populateCategoryOptions(t.type);
  amountInput.value = t.amount;
  categorySelect.value = t.category;
  dateInput.value = t.date;
  descriptionInput.value = t.description || '';
  submitBtn.textContent = 'Save changes';
  cancelEditBtn.hidden = false;
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetForm() {
  editIdInput.value = '';
  form.reset();
  form.querySelector('input[name="type"][value="income"]').checked = true;
  populateCategoryOptions('income');
  dateInput.value = todayISO();
  submitBtn.textContent = 'Add entry';
  cancelEditBtn.hidden = true;
  amountError.textContent = '';
  categoryError.textContent = '';
  dateError.textContent = '';
}

// ---------- Rendering ----------
function getFilteredTransactions() {
  return transactions
    .filter((t) => activeTypeFilter === 'all' || t.type === activeTypeFilter)
    .filter((t) => activeCategoryFilter === 'all' || t.category === activeCategoryFilter)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

function renderLedger() {
  const list = getFilteredTransactions();
  ledgerBody.innerHTML = '';
  emptyState.hidden = list.length !== 0;
  emptyState.textContent = transactions.length === 0
  ? "No entries yet. Add your first transaction above — it'll show up here."
  : 'No entries match these filters.';

  list.forEach((t) => {
    const row = document.createElement('div');
    row.className = 'ledger-row';
    row.setAttribute('role', 'row');

    const sign = t.type === 'income' ? '+' : '−';

    row.innerHTML = `
      <span role="cell">${formatDateDisplay(t.date)}</span>
      <span role="cell" class="desc">${escapeHtml(t.description || '—')}</span>
      <span role="cell" class="cat-tag">${escapeHtml(t.category)}</span>
      <span role="cell" class="amount ${t.type}">${sign} ${formatCurrency(t.amount)}</span>
      <span role="cell" class="row-actions">
        <button class="icon-btn edit" title="Edit" aria-label="Edit entry">✎</button>
        <button class="icon-btn delete" title="Delete" aria-label="Delete entry">✕</button>
      </span>
    `;

    row.querySelector('.edit').addEventListener('click', () => startEdit(t.id));
    row.querySelector('.delete').addEventListener('click', () => deleteTransaction(t.id));

    ledgerBody.appendChild(row);
  });
}

function formatDateDisplay(iso) {
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderBalance() {
  const income = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expense;

  document.getElementById('balanceAmount').textContent = formatCurrency(balance);
  document.getElementById('totalIncome').textContent = formatCurrency(income);
  document.getElementById('totalExpense').textContent = formatCurrency(expense);

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthTx = transactions.filter((t) => t.date.startsWith(monthKey));
  const monthIncome = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  document.getElementById('monthNet').textContent = formatCurrency(monthIncome - monthExpense);
}

function renderMonthlySummary() {
  const container = document.getElementById('monthlySummary');
  container.innerHTML = '';

  const byMonth = {};
  transactions.forEach((t) => {
    const key = t.date.slice(0, 7); // YYYY-MM
    if (!byMonth[key]) byMonth[key] = { income: 0, expense: 0 };
    byMonth[key][t.type] += t.amount;
  });

  const months = Object.keys(byMonth).sort().reverse().slice(0, 6);

  if (months.length === 0) {
    container.innerHTML = '<p class="chart-empty">Nothing recorded yet.</p>';
    return;
  }

  months.forEach((key) => {
    const { income = 0, expense = 0 } = byMonth[key];
    const net = income - expense;
    const label = new Date(`${key}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    const row = document.createElement('div');
    row.className = 'monthly-row';
    row.innerHTML = `<span class="m-label">${label}</span><span class="m-value">${formatCurrency(net)}</span>`;
    container.appendChild(row);
  });
}

function renderCategoryChart() {
  const container = document.getElementById('categoryChart');
  container.innerHTML = '';

  const totals = {};
  transactions.filter((t) => t.type === 'expense').forEach((t) => {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  });

  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    container.innerHTML = '<p class="chart-empty">No expenses recorded yet.</p>';
    return;
  }

  const max = entries[0][1];

  entries.forEach(([cat, amount]) => {
    const pct = Math.max((amount / max) * 100, 4);
    const row = document.createElement('div');
    row.className = 'chart-row';
    row.innerHTML = `
      <span>${escapeHtml(cat)}</span>
      <span class="chart-track"><span class="chart-fill" style="width:${pct}%"></span></span>
      <span class="chart-amount">${formatCurrency(amount)}</span>
    `;
    container.appendChild(row);
  });
}

function render() {
  renderBalance();
  renderLedger();
  renderMonthlySummary();
  renderCategoryChart();
}

// ---------- Events ----------
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const type = form.querySelector('input[name="type"]:checked').value;
  addOrUpdateTransaction({
    type,
    amount: parseFloat(amountInput.value),
    category: categorySelect.value,
    date: dateInput.value,
    description: descriptionInput.value.trim(),
  });
});

form.querySelectorAll('input[name="type"]').forEach((radio) => {
  radio.addEventListener('change', () => populateCategoryOptions(radio.value));
});

cancelEditBtn.addEventListener('click', resetForm);

document.querySelectorAll('.filter-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach((b) => {
      b.classList.remove('is-active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('is-active');
    btn.setAttribute('aria-selected', 'true');
    activeTypeFilter = btn.dataset.filter;
    renderLedger();
  });
});

categoryFilterSelect.addEventListener('change', () => {
  activeCategoryFilter = categoryFilterSelect.value;
  renderLedger();
});

// ---------- Init ----------
populateCategoryOptions('income');
populateCategoryFilterOptions();
dateInput.value = todayISO();
render();
