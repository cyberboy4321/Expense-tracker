// ---------- DOM references ----------
const form = document.getElementById("transaction-form");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const cancelEditBtn = document.getElementById("cancel-edit");

const balanceEl = document.getElementById("balance");
const incomeEl = document.getElementById("income");
const expensesEl = document.getElementById("expenses");

const transactionList = document.getElementById("transaction-list");

const filterType = document.getElementById("filter-type");
const filterCategory = document.getElementById("filter-category");
const filterMonth = document.getElementById("filter-month");

// ---------- State ----------
const STORAGE_KEY = "expense-tracker-transactions";
let transactions = [];
let editingId = null;

// ---------- Helpers ----------
function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

function formatCurrency(value) {
    return "$" + Math.abs(value).toFixed(2);
}

function formatDate(isoDate) {
    const d = new Date(isoDate + "T00:00:00");
    return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function saveTransactions() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function loadTransactions() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) transactions = parsed;
    } catch (err) {
        console.warn("Could not parse saved transactions:", err);
    }
}

function resetEditState() {
    editingId = null;
    form.reset();
    form.querySelector('button[type="submit"]').textContent = "Add Transaction";
    cancelEditBtn.classList.add("hidden");
}

// ---------- Render ----------
function render() {
    transactionList.innerHTML = "";

    const filtered = getFilteredTransactions();

    if (filtered.length === 0) {
        transactionList.innerHTML = `<li class="empty">No transactions found.</li>`;
    } else {
        filtered.forEach(function (tx) {
            const li = document.createElement("li");
            if (tx.id === editingId) li.classList.add("editing");

            li.innerHTML = `
                <div class="tx-info">
                    <span class="tx-desc">${tx.description}</span>
                    <span class="tx-meta">${tx.category} • ${formatDate(tx.date)}</span>
                </div>
                <span class="tx-amount ${tx.type}">
                    ${tx.type === "income" ? "+" : "-"}${formatCurrency(tx.amount)}
                </span>
                <div class="tx-actions">
                    <button data-action="edit" data-id="${tx.id}" title="Edit">✏️</button>
                    <button data-action="delete" data-id="${tx.id}" title="Delete">🗑️</button>
                </div>
            `;
            transactionList.appendChild(li);
        });
    }

    updateBalance();
}

function updateBalance() {
    let income = 0;
    let expenses = 0;

    transactions.forEach(function (tx) {
        if (tx.type === "income") income += Number(tx.amount);
        else expenses += Number(tx.amount);
    });

    const balance = income - expenses;

    balanceEl.textContent = "$" + balance.toFixed(2);
    incomeEl.textContent = "$" + income.toFixed(2);
    expensesEl.textContent = "$" + expenses.toFixed(2);
}

function getFilteredTransactions() {
    const typeValue = filterType.value;
    const categoryValue = filterCategory.value;
    const monthValue = filterMonth.value;

    return transactions.filter(function (tx) {
        if (typeValue !== "all" && tx.type !== typeValue) return false;
        if (categoryValue !== "all" && tx.category !== categoryValue) return false;
        if (monthValue && !tx.date.startsWith(monthValue)) return false;
        return true;
    });
}

// ---------- Delete ----------
function deleteTransaction(id) {
    if (!confirm("Delete this transaction?")) return;

    transactions = transactions.filter(function (tx) {
        return tx.id !== id;
    });

    saveTransactions();
    render();
}

// ---------- Start Edit ----------
function startEdit(id) {
    const tx = transactions.find(function (t) {
        return t.id === id;
    });
    if (!tx) return;

    descriptionInput.value = tx.description;
    amountInput.value = tx.amount;
    typeInput.value = tx.type;
    categoryInput.value = tx.category;
    dateInput.value = tx.date;

    editingId = id;
    form.querySelector('button[type="submit"]').textContent = "Update Transaction";
    cancelEditBtn.classList.remove("hidden");
    descriptionInput.focus();
    render();
}

// ---------- Form Submit ----------
form.addEventListener("submit", function (e) {
    e.preventDefault();

    const description = descriptionInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const type = typeInput.value;
    const category = categoryInput.value;
    const date = dateInput.value;

    if (!description || !amount || amount <= 0 || !date) {
        alert("Please fill in all fields with valid values.");
        return;
    }

    if (editingId !== null) {
        transactions = transactions.map(function (tx) {
            if (tx.id === editingId) {
                return {
                    id: tx.id,
                    description: description,
                    amount: amount,
                    type: type,
                    category: category,
                    date: date,
                };
            }
            return tx;
        });
    } else {
        transactions.push({
            id: generateId(),
            description: description,
            amount: amount,
            type: type,
            category: category,
            date: date,
        });
    }

    saveTransactions();
    resetEditState();
    render();
});

// ---------- List Actions (event delegation) ----------
transactionList.addEventListener("click", function (e) {
    const button = e.target.closest("button");
    if (!button) return;

    const action = button.dataset.action;
    const id = Number(button.dataset.id);

    if (action === "delete") deleteTransaction(id);
    else if (action === "edit") startEdit(id);
});

// ---------- Filters ----------
filterType.addEventListener("change", render);
filterCategory.addEventListener("change", render);
filterMonth.addEventListener("change", render);

// ---------- Cancel Edit ----------
cancelEditBtn.addEventListener("click", function () {
    resetEditState();
    render();
});

// ---------- Init ----------
loadTransactions();
render();