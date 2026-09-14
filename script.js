let transactions = JSON.parse(localStorage.getItem('money_track_tx')) || [];
let chartInstance = null;

const form = document.getElementById('transaction-form');
const txType = document.getElementById('tx-type');
const txDate = document.getElementById('tx-date');
const txName = document.getElementById('tx-name');
const txAmount = document.getElementById('tx-amount');
const txCategory = document.getElementById('tx-category');

const filterPeriod = document.getElementById('filter-period');
const filterCategory = document.getElementById('filter-category');
const sortBy = document.getElementById('sort-by');

const categoryData = {
    expense: [
        { id: 'Food', label: '🍽️ Food & Drink', color: '#34d399', class: 'badge-food' },
        { id: 'Delivery', label: '🛵 Delivery', color: '#fb923c', class: 'badge-delivery' },
        { id: 'Cafe', label: '☕ Cafe & Resto', color: '#f97316', class: 'badge-cafe' },
        { id: 'Transport', label: '🚖 Transport', color: '#fde047', class: 'badge-transport' },
        { id: 'Travel', label: '✈️ Travel', color: '#818cf8', class: 'badge-travel' },
        { id: 'Gaming', label: '🎮 Gaming', color: '#a78bfa', class: 'badge-gaming' },
        { id: 'Pets', label: '🐕 Pets', color: '#f59e0b', class: 'badge-pets' },
        { id: 'Shopping', label: '🛍️ Shopping', color: '#c084fc', class: 'badge-shopping' },
        { id: 'Books', label: '📚 Books', color: '#f97316', class: 'badge-books' },
        { id: 'Courses', label: '🎓 Courses', color: '#facc15', class: 'badge-courses' },
        { id: 'Subscriptions', label: '💳 Subscriptions', color: '#cbd5e1', class: 'badge-subscriptions' },
        { id: 'Home', label: '🏠 Home & Utilities', color: '#fbbf24', class: 'badge-home' },
        { id: 'Beauty', label: '✨ Beauty & Fashion', color: '#fb7185', class: 'badge-beauty' },
        { id: 'Other_Exp', label: '📝 Lainnya', color: '#94a3b8', class: 'badge-maintenance' }
    ],
    income: [
        { id: 'Salary', label: '💼 Gaji / Upah', color: '#10b981', class: 'badge-income' },
        { id: 'Bonus', label: '🎁 Bonus / THR', color: '#34d399', class: 'badge-income' },
        { id: 'Investment', label: '📈 Hasil Investasi', color: '#38bdf8', class: 'badge-investment' },
        { id: 'Other_Inc', label: '💵 Pemasukan Lainnya', color: '#6ee7b7', class: 'badge-income' }
    ]
};

txDate.valueAsDate = new Date();

function parseLocalDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
}

const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
const formatDate = (dateStr) => parseLocalDate(dateStr).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });

function saveToLocalStorage() {
    localStorage.setItem('money_track_tx', JSON.stringify(transactions));
}

function populateCategories() {
    const type = txType.value;
    txCategory.innerHTML = categoryData[type].map(cat => `<option value="${cat.id}">${cat.label}</option>`).join('');
}
txType.addEventListener('change', populateCategories);
populateCategories(); 

function populateFilterCategories() {
    const allCats = [...categoryData.income, ...categoryData.expense];
    let options = '<option value="all">Semua Kategori</option>';
    allCats.forEach(c => options += `<option value="${c.id}">${c.label}</option>`);
    filterCategory.innerHTML = options;
}
populateFilterCategories();

let editingId = null;
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
        id: editingId || Date.now(),
        type: txType.value,
        date: txDate.value,
        name: txName.value.trim(),
        amount: parseFloat(txAmount.value),
        categoryId: txCategory.value
    };

    if (editingId) {
        transactions = transactions.map(t => t.id === editingId ? data : t);
        editingId = null;
        document.getElementById('btn-submit').textContent = 'Simpan Transaksi';
    } else {
        transactions.push(data);
    }
    
    saveToLocalStorage();
    form.reset();
    txDate.valueAsDate = new Date();
    populateCategories();
    renderApp();
});

window.toggleMenu = function(id, event) {
    if (event) event.stopPropagation();
    document.querySelectorAll('.dropdown-content').forEach(el => {
        if (el.id !== `menu-${id}`) el.classList.remove('show');
    });
    const targetMenu = document.getElementById(`menu-${id}`);
    if (targetMenu) targetMenu.classList.toggle("show");
};

window.onclick = function(event) {
    if (!event.target.matches('.dropbtn')) {
        document.querySelectorAll('.dropdown-content').forEach(el => el.classList.remove('show'));
    }
};

window.deleteTx = function(id) {
    if (confirm("Hapus transaksi ini?")) {
        transactions = transactions.filter(t => t.id !== id);
        saveToLocalStorage();
        renderApp();
    }
};

window.editTx = function(id) {
    const tx = transactions.find(t => t.id === id);
    if (tx) {
        editingId = tx.id;
        txType.value = tx.type;
        populateCategories();
        txDate.value = tx.date;
        txName.value = tx.name;
        txAmount.value = tx.amount;
        txCategory.value = tx.categoryId;
        
        document.getElementById('btn-submit').textContent = 'Update Transaksi';
        window.scrollTo({ top: document.querySelector('.form-card').offsetTop - 20, behavior: 'smooth' });
    }
};

function getFilteredData() {
    let filtered = [...transactions];
    const period = filterPeriod.value;
    const cat = filterCategory.value;
    const sort = sortBy.value;

    const today = new Date();
    filtered = filtered.filter(t => {
        const tDate = parseLocalDate(t.date);
        let matchPeriod = true;
        
        if (period === 'daily') {
            matchPeriod = tDate.toDateString() === today.toDateString();
        } else if (period === 'monthly') {
            matchPeriod = tDate.getMonth() === today.getMonth() && tDate.getFullYear() === today.getFullYear();
        } else if (period === 'yearly') {
            matchPeriod = tDate.getFullYear() === today.getFullYear();
        }
        
        let matchCat = cat === 'all' ? true : t.categoryId === cat;
        return matchPeriod && matchCat;
    });

    filtered.sort((a, b) => {
        if (sort === 'date-desc') return parseLocalDate(b.date) - parseLocalDate(a.date);
        if (sort === 'date-asc') return parseLocalDate(a.date) - parseLocalDate(b.date);
        if (sort === 'amount-desc') return b.amount - a.amount;
        if (sort === 'amount-asc') return a.amount - b.amount;
    });

    return filtered;
}

function renderApp() {
    const data = getFilteredData();
    
    const tbody = document.getElementById('transaction-list');
    tbody.innerHTML = data.length ? '' : `<tr><td colspan="5" class="empty-text">Tidak ada data transaksi untuk periode ini.</td></tr>`;
    
    data.forEach(t => {
        const catInfo = [...categoryData.income, ...categoryData.expense].find(c => c.id === t.categoryId) || {
            label: 'Lainnya', class: 'badge-maintenance'
        };
        const isInc = t.type === 'income';
        const amountClass = isInc ? 'text-income' : 'text-expense';
        const amountSign = isInc ? '+' : '-';
        
        tbody.innerHTML += `
            <tr>
                <td>${formatDate(t.date)}</td>
                <td><strong>${t.name}</strong></td>
                <td><span class="category-badge ${catInfo.class}">${catInfo.label}</span></td>
                <td class="col-amount ${amountClass}">${amountSign} ${formatRp(t.amount)}</td>
                <td class="col-action">
                    <div class="dropdown">
                        <button type="button" class="dropbtn" onclick="toggleMenu(${t.id}, event)">⋮</button>
                        <div id="menu-${t.id}" class="dropdown-content">
                            <button type="button" onclick="editTx(${t.id})">Edit</button>
                            <button type="button" class="text-delete" onclick="deleteTx(${t.id})">Hapus</button>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    });

    const totalInc = data.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExp = data.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const net = totalInc - totalExp;

    const balanceEl = document.getElementById('total-balance');
    balanceEl.textContent = formatRp(net);
    balanceEl.style.color = net < 0 ? '#ef4444' : (net > 0 ? '#10b981' : '#ffffff');
    
    document.getElementById('total-income-top').textContent = `+ ${formatRp(totalInc)}`;
    document.getElementById('total-expense-top').textContent = `- ${formatRp(totalExp)}`;

    document.getElementById('footer-total-income').textContent = `+ ${formatRp(totalInc)}`;
    document.getElementById('footer-total-expense').textContent = `- ${formatRp(totalExp)}`;
    document.getElementById('footer-net-balance').textContent = formatRp(net);

    renderChart(data.filter(t => t.type === 'expense'));
}

function renderChart(expenseData) {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    
    const grouped = {};
    expenseData.forEach(t => grouped[t.categoryId] = (grouped[t.categoryId] || 0) + t.amount);
    
    const labels = [];
    const chartValues = [];
    const bgColors = [];

    Object.keys(grouped).forEach(key => {
        const catInfo = categoryData.expense.find(c => c.id === key);
        labels.push(catInfo ? catInfo.label : key);
        chartValues.push(grouped[key]);
        bgColors.push(catInfo ? catInfo.color : '#94a3b8');
    });

    if (chartInstance) chartInstance.destroy();

    if (chartValues.length === 0) {
        chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: ['Belum ada pengeluaran'], datasets: [{ data: [1], backgroundColor: ['#272a31'] }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
        return;
    }

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: chartValues,
                backgroundColor: bgColors,
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: { position: 'right', labels: { color: '#e5e7eb', font: { size: 11, family: 'Inter' } } }
            }
        }
    });
}

filterPeriod.addEventListener('change', renderApp);
filterCategory.addEventListener('change', renderApp);
sortBy.addEventListener('change', renderApp);

renderApp();