// ========================================
// BisnisKu — Core Application
// ========================================

// Data Store
const DB = {
    get(key) { try { return JSON.parse(localStorage.getItem('bk_' + key)) || []; } catch { return []; } },
    set(key, val) { localStorage.setItem('bk_' + key, JSON.stringify(val)); },
    getObj(key) { try { return JSON.parse(localStorage.getItem('bk_' + key)) || {}; } catch { return {}; } },
    setObj(key, val) { localStorage.setItem('bk_' + key, JSON.stringify(val)); }
};

let cart = [];
let charts = {};

// ========================================
// Utility Functions
// ========================================
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const fmt = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtDateTime = (d) => new Date(d).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const today = () => new Date().toISOString().split('T')[0];
const categoryEmojis = { 'makanan': '🍔', 'minuman': '🥤', 'snack': '🍿', 'obat': '💊', 'elektronik': '📱', 'pakaian': '👕', 'alat tulis': '✏️', 'rumah tangga': '🏠' };
const getEmoji = (cat) => categoryEmojis[(cat || '').toLowerCase()] || '📦';

// ========================================
// Navigation
// ========================================
const pageTitles = { dashboard: 'Dashboard', kasir: 'Kasir', produk: 'Produk', barangMasuk: 'Barang Masuk', laporan: 'Laporan', settings: 'Pengaturan' };

function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('page-' + page)?.classList.add('active');
    document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
    document.getElementById('pageTitle').textContent = pageTitles[page] || page;
    document.getElementById('sidebar')?.classList.remove('open');
    if (page === 'dashboard') refreshDashboard();
    if (page === 'kasir') refreshPOS();
    if (page === 'produk') refreshProductTable();
    if (page === 'barangMasuk') refreshStockInTable();
    if (page === 'laporan') refreshReports();
    if (page === 'settings') loadSettings();
}

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => { e.preventDefault(); navigateTo(item.dataset.page); });
});

// Mobile menu
document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
});

// ========================================
// Toast Notifications
// ========================================
function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'toastOut 0.3s ease forwards'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// ========================================
// Modal Management
// ========================================
function openModal(id) { document.getElementById(id)?.classList.add('show'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('show'); }

document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('show'); });
});

// ========================================
// PRODUCTS CRUD
// ========================================
function getProducts() { return DB.get('products'); }
function saveProducts(p) { DB.set('products', p); }

document.getElementById('addProductBtn')?.addEventListener('click', () => {
    document.getElementById('productModalTitle').textContent = 'Tambah Produk';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productStock').removeAttribute('readonly');
    openModal('productModal');
});

document.getElementById('productForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const products = getProducts();
    const id = document.getElementById('productId').value;
    const data = {
        name: document.getElementById('productName').value.trim(),
        category: document.getElementById('productCategory').value.trim(),
        sku: document.getElementById('productSku').value.trim(),
        buyPrice: Number(document.getElementById('productBuyPrice').value),
        sellPrice: Number(document.getElementById('productSellPrice').value),
        stock: Number(document.getElementById('productStock').value),
    };
    if (id) {
        const idx = products.findIndex(p => p.id === id);
        if (idx > -1) { products[idx] = { ...products[idx], ...data, stock: products[idx].stock }; }
        showToast('Produk diperbarui', 'success');
    } else {
        products.push({ id: uid(), ...data, createdAt: new Date().toISOString() });
        showToast('Produk ditambahkan', 'success');
    }
    saveProducts(products);
    closeModal('productModal');
    refreshProductTable();
    updateStockAlerts();
});

function editProduct(id) {
    const p = getProducts().find(x => x.id === id);
    if (!p) return;
    document.getElementById('productModalTitle').textContent = 'Edit Produk';
    document.getElementById('productId').value = p.id;
    document.getElementById('productName').value = p.name;
    document.getElementById('productCategory').value = p.category;
    document.getElementById('productSku').value = p.sku || '';
    document.getElementById('productBuyPrice').value = p.buyPrice;
    document.getElementById('productSellPrice').value = p.sellPrice;
    document.getElementById('productStock').value = p.stock;
    document.getElementById('productStock').setAttribute('readonly', true);
    openModal('productModal');
}

function deleteProduct(id) {
    if (!confirm('Hapus produk ini?')) return;
    const products = getProducts().filter(p => p.id !== id);
    saveProducts(products);
    refreshProductTable();
    showToast('Produk dihapus', 'success');
    updateStockAlerts();
}

function refreshProductTable() {
    const products = getProducts();
    const tbody = document.getElementById('productTableBody');
    if (!products.length) { tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Belum ada produk</td></tr>'; return; }
    tbody.innerHTML = products.map(p => `
        <tr>
            <td><strong>${p.name}</strong>${p.sku ? `<br><small style="color:var(--text-muted)">${p.sku}</small>` : ''}</td>
            <td>${p.category || '-'}</td>
            <td>${fmt(p.buyPrice)}</td>
            <td>${fmt(p.sellPrice)}</td>
            <td><span style="color:${p.stock <= 5 ? 'var(--red)' : 'var(--green)'};font-weight:600">${p.stock}</span></td>
            <td>
                <button class="btn btn-secondary btn-table" onclick="editProduct('${p.id}')">Edit</button>
                <button class="btn btn-danger btn-table" onclick="deleteProduct('${p.id}')">Hapus</button>
            </td>
        </tr>
    `).join('');
}

// ========================================
// STOCK IN (Barang Masuk)
// ========================================
function getStockIn() { return DB.get('stockIn'); }
function saveStockIn(s) { DB.set('stockIn', s); }

document.getElementById('addStockInBtn')?.addEventListener('click', () => {
    document.getElementById('stockInForm').reset();
    const sel = document.getElementById('stockInProduct');
    sel.innerHTML = '<option value="">Pilih Produk</option>' + getProducts().map(p => `<option value="${p.id}" data-price="${p.buyPrice}">${p.name}</option>`).join('');
    openModal('stockInModal');
});

document.getElementById('stockInProduct')?.addEventListener('change', function () {
    const opt = this.options[this.selectedIndex];
    if (opt.dataset.price) document.getElementById('stockInPrice').value = opt.dataset.price;
});

document.getElementById('stockInForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const productId = document.getElementById('stockInProduct').value;
    const qty = Number(document.getElementById('stockInQty').value);
    const price = Number(document.getElementById('stockInPrice').value);
    const note = document.getElementById('stockInNote').value.trim();
    if (!productId || qty <= 0) return showToast('Data tidak valid', 'error');

    const products = getProducts();
    const pIdx = products.findIndex(p => p.id === productId);
    if (pIdx === -1) return;
    products[pIdx].stock += qty;
    saveProducts(products);

    const stockIns = getStockIn();
    stockIns.unshift({ id: uid(), productId, productName: products[pIdx].name, qty, price, total: qty * price, note, date: new Date().toISOString() });
    saveStockIn(stockIns);

    const transactions = DB.get('transactions');
    transactions.unshift({ id: uid(), type: 'purchase', detail: `Beli ${products[pIdx].name} x${qty}`, total: qty * price, date: new Date().toISOString() });
    DB.set('transactions', transactions);

    closeModal('stockInModal');
    refreshStockInTable();
    showToast(`${qty} unit ${products[pIdx].name} ditambahkan`, 'success');
    updateStockAlerts();
});

function refreshStockInTable() {
    const data = getStockIn();
    const tbody = document.getElementById('stockInTableBody');
    if (!data.length) { tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Belum ada data</td></tr>'; return; }
    tbody.innerHTML = data.slice(0, 100).map(s => `
        <tr>
            <td>${fmtDateTime(s.date)}</td>
            <td>${s.productName}</td>
            <td>${s.qty}</td>
            <td>${fmt(s.price)}</td>
            <td>${fmt(s.total)}</td>
            <td>${s.note || '-'}</td>
        </tr>
    `).join('');
}

// ========================================
// POS / KASIR
// ========================================
function refreshPOS() {
    const products = getProducts();
    const grid = document.getElementById('posProductGrid');
    const catFilter = document.getElementById('posCategoryFilter');
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
    catFilter.innerHTML = '<option value="">Semua Kategori</option>' + categories.map(c => `<option value="${c}">${c}</option>`).join('');

    if (!products.length) { grid.innerHTML = '<p class="empty-state">Belum ada produk. Tambahkan di menu Produk.</p>'; return; }
    renderPOSGrid(products);
}

function renderPOSGrid(products) {
    const search = (document.getElementById('posSearch')?.value || '').toLowerCase();
    const cat = document.getElementById('posCategoryFilter')?.value || '';
    let filtered = products.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(search) || (p.sku || '').toLowerCase().includes(search);
        const matchCat = !cat || p.category === cat;
        return matchSearch && matchCat;
    });
    const grid = document.getElementById('posProductGrid');
    grid.innerHTML = filtered.map(p => `
        <div class="pos-product-card ${p.stock <= 0 ? 'out-of-stock' : ''}" onclick="addToCart('${p.id}')">
            <div class="pos-product-emoji">${getEmoji(p.category)}</div>
            <div class="pos-product-name">${p.name}</div>
            <div class="pos-product-price">${fmt(p.sellPrice)}</div>
            <div class="pos-product-stock">Stok: ${p.stock}</div>
        </div>
    `).join('') || '<p class="empty-state">Produk tidak ditemukan</p>';
}

document.getElementById('posSearch')?.addEventListener('input', () => renderPOSGrid(getProducts()));
document.getElementById('posCategoryFilter')?.addEventListener('change', () => renderPOSGrid(getProducts()));

function addToCart(productId) {
    const product = getProducts().find(p => p.id === productId);
    if (!product || product.stock <= 0) return;
    const existing = cart.find(c => c.productId === productId);
    if (existing) {
        if (existing.qty >= product.stock) return showToast('Stok tidak cukup', 'warning');
        existing.qty++;
    } else {
        cart.push({ productId, name: product.name, price: product.sellPrice, buyPrice: product.buyPrice, qty: 1, maxStock: product.stock });
    }
    renderCart();
}

function updateCartQty(productId, delta) {
    const item = cart.find(c => c.productId === productId);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(c => c.productId !== productId);
    else if (item.qty > item.maxStock) { item.qty = item.maxStock; showToast('Stok tidak cukup', 'warning'); }
    renderCart();
}

function removeFromCart(productId) {
    cart = cart.filter(c => c.productId !== productId);
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cartItems');
    const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
    if (!cart.length) {
        container.innerHTML = '<p class="empty-state cart-empty">Keranjang kosong</p>';
    } else {
        container.innerHTML = cart.map(c => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${c.name}</div>
                    <div class="cart-item-price">${fmt(c.price)}</div>
                </div>
                <div class="cart-item-qty">
                    <button onclick="updateCartQty('${c.productId}', -1)">−</button>
                    <span>${c.qty}</span>
                    <button onclick="updateCartQty('${c.productId}', 1)">+</button>
                </div>
                <div class="cart-item-total">${fmt(c.price * c.qty)}</div>
                <button class="cart-item-remove" onclick="removeFromCart('${c.productId}')"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
            </div>
        `).join('');
    }
    document.getElementById('cartSubtotal').textContent = fmt(subtotal);
    document.getElementById('cartTotal').textContent = fmt(subtotal);
    updateChange();
    document.getElementById('payBtn').disabled = cart.length === 0;
}

document.getElementById('paymentAmount')?.addEventListener('input', updateChange);

function updateChange() {
    const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
    const paid = Number(document.getElementById('paymentAmount')?.value || 0);
    const change = paid - total;
    document.getElementById('cartChange').textContent = fmt(Math.max(0, change));
    const payBtn = document.getElementById('payBtn');
    payBtn.disabled = cart.length === 0 || paid < total;
}

document.getElementById('clearCartBtn')?.addEventListener('click', () => { cart = []; renderCart(); });

// ========================================
// PAYMENT & RECEIPT
// ========================================
document.getElementById('payBtn')?.addEventListener('click', processPayment);

function processPayment() {
    if (!cart.length) return;
    const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
    const paid = Number(document.getElementById('paymentAmount').value || 0);
    if (paid < total) return showToast('Pembayaran kurang', 'error');
    const change = paid - total;

    // Update stock
    const products = getProducts();
    cart.forEach(c => {
        const p = products.find(x => x.id === c.productId);
        if (p) p.stock -= c.qty;
    });
    saveProducts(products);

    // Save transaction
    const txId = uid();
    const tx = {
        id: txId, type: 'sale', items: cart.map(c => ({ ...c })),
        total, paid, change, date: new Date().toISOString(),
        detail: cart.map(c => `${c.name} x${c.qty}`).join(', ')
    };
    const transactions = DB.get('transactions');
    transactions.unshift(tx);
    DB.set('transactions', transactions);

    // Generate receipt
    generateReceipt(tx);
    openModal('receiptModal');

    // Send Telegram notification
    sendTelegramSaleNotification(tx);

    cart = [];
    renderCart();
    document.getElementById('paymentAmount').value = '';
    refreshPOS();
    showToast('Transaksi berhasil!', 'success');
    updateStockAlerts();
}

function generateReceipt(tx) {
    const settings = DB.getObj('settings');
    const storeName = settings.storeName || 'BisnisKu Store';
    const storeAddr = settings.storeAddress || '';
    const storePhone = settings.storePhone || '';

    document.getElementById('receiptContent').innerHTML = `
        <div class="receipt-header">
            <div class="receipt-store-name">${storeName}</div>
            ${storeAddr ? `<div>${storeAddr}</div>` : ''}
            ${storePhone ? `<div>${storePhone}</div>` : ''}
        </div>
        <div class="receipt-divider"></div>
        <div class="receipt-info"><span>Tanggal</span><span>${fmtDateTime(tx.date)}</span></div>
        <div class="receipt-info"><span>No.</span><span>${tx.id.toUpperCase()}</span></div>
        <div class="receipt-divider"></div>
        <div class="receipt-items">
            ${tx.items.map(i => `
                <div class="receipt-item"><span>${i.name}</span><span>${fmt(i.price * i.qty)}</span></div>
                <div class="receipt-item-detail">${i.qty} x ${fmt(i.price)}</div>
            `).join('')}
        </div>
        <div class="receipt-divider"></div>
        <div class="receipt-totals">
            <div class="receipt-total-row grand-total"><span>TOTAL</span><span>${fmt(tx.total)}</span></div>
            <div class="receipt-total-row"><span>BAYAR</span><span>${fmt(tx.paid)}</span></div>
            <div class="receipt-total-row"><span>KEMBALI</span><span>${fmt(tx.change)}</span></div>
        </div>
        <div class="receipt-divider"></div>
        <div class="receipt-footer">Terima Kasih! 🙏<br>Barang yang sudah dibeli tidak dapat dikembalikan</div>
    `;
}

document.getElementById('printReceiptBtn')?.addEventListener('click', () => window.print());

// ========================================
// TELEGRAM
// ========================================
async function sendTelegram(message) {
    const settings = DB.getObj('settings');
    if (!settings.telegramEnabled || !settings.telegramToken || !settings.telegramChatId) return;
    try {
        const url = `https://api.telegram.org/bot${settings.telegramToken}/sendMessage`;
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: settings.telegramChatId, text: message, parse_mode: 'HTML' })
        });
    } catch (err) { console.warn('Telegram error:', err); }
}

function sendTelegramSaleNotification(tx) {
    const items = tx.items.map(i => `  • ${i.name} x${i.qty} = ${fmt(i.price * i.qty)}`).join('\n');
    const msg = `🛒 <b>Penjualan Baru!</b>\n\n${items}\n\n💰 Total: <b>${fmt(tx.total)}</b>\n💵 Bayar: ${fmt(tx.paid)}\n💸 Kembali: ${fmt(tx.change)}\n\n🕐 ${fmtDateTime(tx.date)}`;
    sendTelegram(msg);
}

function sendTelegramStockAlert(lowStockProducts) {
    if (!lowStockProducts.length) return;
    const items = lowStockProducts.map(p => `  ⚠️ ${p.name}: ${p.stock} unit`).join('\n');
    sendTelegram(`📦 <b>Stok Menipis!</b>\n\n${items}\n\nSegera lakukan restock.`);
}

// ========================================
// REPORTS
// ========================================
function refreshReports() {
    const transactions = DB.get('transactions');
    const from = document.getElementById('filterDateFrom')?.value;
    const to = document.getElementById('filterDateTo')?.value;

    let filtered = transactions;
    if (from) filtered = filtered.filter(t => t.date >= from);
    if (to) filtered = filtered.filter(t => t.date <= to + 'T23:59:59');

    const sales = filtered.filter(t => t.type === 'sale');
    const purchases = filtered.filter(t => t.type === 'purchase');
    const revenue = sales.reduce((s, t) => s + t.total, 0);
    const expense = purchases.reduce((s, t) => s + t.total, 0);

    document.getElementById('reportRevenue').textContent = fmt(revenue);
    document.getElementById('reportExpense').textContent = fmt(expense);
    document.getElementById('reportProfit').textContent = fmt(revenue - expense);
    document.getElementById('reportTxCount').textContent = filtered.length;

    const tbody = document.getElementById('transactionTableBody');
    if (!filtered.length) { tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Belum ada transaksi</td></tr>'; return; }
    tbody.innerHTML = filtered.slice(0, 100).map(t => `
        <tr>
            <td>${fmtDateTime(t.date)}</td>
            <td><span style="color:${t.type === 'sale' ? 'var(--green)' : 'var(--red)'};font-weight:600">${t.type === 'sale' ? '📤 Penjualan' : '📥 Pembelian'}</span></td>
            <td>${t.detail}</td>
            <td style="font-weight:600;color:${t.type === 'sale' ? 'var(--green)' : 'var(--red)'}">${t.type === 'sale' ? '+' : '-'}${fmt(t.total)}</td>
        </tr>
    `).join('');
}

document.getElementById('filterBtn')?.addEventListener('click', refreshReports);

// CSV Export
document.getElementById('exportCsvBtn')?.addEventListener('click', () => {
    const transactions = DB.get('transactions');
    if (!transactions.length) return showToast('Tidak ada data', 'warning');
    let csv = 'Tanggal,Tipe,Detail,Total\n';
    transactions.forEach(t => {
        csv += `"${fmtDateTime(t.date)}","${t.type === 'sale' ? 'Penjualan' : 'Pembelian'}","${t.detail}","${t.total}"\n`;
    });
    downloadFile(csv, `laporan_${today()}.csv`, 'text/csv');
    showToast('CSV berhasil didownload', 'success');
});

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

// ========================================
// DASHBOARD
// ========================================
function refreshDashboard() {
    const transactions = DB.get('transactions');
    const products = getProducts();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const todayStart = today() + 'T00:00:00';

    const monthTx = transactions.filter(t => t.date >= monthStart);
    const todayTx = transactions.filter(t => t.date >= todayStart);
    const monthSales = monthTx.filter(t => t.type === 'sale');
    const monthPurchases = monthTx.filter(t => t.type === 'purchase');
    const revenue = monthSales.reduce((s, t) => s + t.total, 0);
    const expense = monthPurchases.reduce((s, t) => s + t.total, 0);

    document.getElementById('statRevenue').textContent = fmt(revenue);
    document.getElementById('statExpense').textContent = fmt(expense);
    document.getElementById('statProfit').textContent = fmt(revenue - expense);
    document.getElementById('statTransactions').textContent = todayTx.filter(t => t.type === 'sale').length;

    // Low stock
    const lowStock = products.filter(p => p.stock <= 5);
    const lowStockEl = document.getElementById('lowStockList');
    if (!lowStock.length) {
        lowStockEl.innerHTML = '<p class="empty-state">Semua stok aman 👍</p>';
    } else {
        lowStockEl.innerHTML = lowStock.map(p => `
            <div class="low-stock-item"><span>${getEmoji(p.category)} ${p.name}</span><span class="stock-count">${p.stock} unit</span></div>
        `).join('');
    }

    // Recent transactions
    const recent = transactions.filter(t => t.type === 'sale').slice(0, 5);
    const recentEl = document.getElementById('recentTransactions');
    if (!recent.length) {
        recentEl.innerHTML = '<p class="empty-state">Belum ada transaksi</p>';
    } else {
        recentEl.innerHTML = recent.map(t => `
            <div class="recent-tx-item">
                <div><strong>${t.detail}</strong><div class="tx-date">${fmtDateTime(t.date)}</div></div>
                <div class="tx-amount">+${fmt(t.total)}</div>
            </div>
        `).join('');
    }

    renderDashboardCharts(transactions);
}

function renderDashboardCharts(transactions) {
    // Revenue chart - last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
    }
    const revenueData = days.map(d => transactions.filter(t => t.type === 'sale' && t.date.startsWith(d)).reduce((s, t) => s + t.total, 0));
    const expenseData = days.map(d => transactions.filter(t => t.type === 'purchase' && t.date.startsWith(d)).reduce((s, t) => s + t.total, 0));
    const labels = days.map(d => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }));

    if (charts.revenue) charts.revenue.destroy();
    const ctx1 = document.getElementById('revenueChart')?.getContext('2d');
    if (ctx1) {
        charts.revenue = new Chart(ctx1, {
            type: 'line', data: {
                labels, datasets: [
                    { label: 'Pendapatan', data: revenueData, borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.4 },
                    { label: 'Pengeluaran', data: expenseData, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: true, tension: 0.4 }
                ]
            },
            options: { responsive: true, plugins: { legend: { labels: { color: '#94a3b8' } } }, scales: { x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { ticks: { color: '#64748b', callback: v => 'Rp ' + (v / 1000) + 'k' }, grid: { color: 'rgba(255,255,255,0.05)' } } } }
        });
    }

    // Top products chart
    const saleTx = transactions.filter(t => t.type === 'sale' && t.items);
    const productSales = {};
    saleTx.forEach(t => t.items.forEach(i => { productSales[i.name] = (productSales[i.name] || 0) + i.qty; }));
    const sorted = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 5);

    if (charts.topProducts) charts.topProducts.destroy();
    const ctx2 = document.getElementById('topProductsChart')?.getContext('2d');
    if (ctx2 && sorted.length) {
        charts.topProducts = new Chart(ctx2, {
            type: 'doughnut', data: {
                labels: sorted.map(s => s[0]),
                datasets: [{ data: sorted.map(s => s[1]), backgroundColor: ['#6366f1', '#8b5cf6', '#a855f7', '#22c55e', '#f59e0b'], borderWidth: 0 }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 12 } } } }
        });
    }
}

// ========================================
// STOCK ALERTS
// ========================================
function updateStockAlerts() {
    const products = getProducts();
    const lowStock = products.filter(p => p.stock <= 5);
    const badge = document.getElementById('stockAlertCount');
    badge.textContent = lowStock.length;
    badge.setAttribute('data-count', lowStock.length);

    // Send telegram alert for critical stock (0 or 1)
    const critical = products.filter(p => p.stock <= 1);
    if (critical.length) sendTelegramStockAlert(critical);
}

document.getElementById('stockAlertBadge')?.addEventListener('click', () => {
    const products = getProducts().filter(p => p.stock <= 5);
    const list = document.getElementById('stockAlertList');
    if (!products.length) { list.innerHTML = '<p class="empty-state">Semua stok aman 👍</p>'; }
    else { list.innerHTML = products.map(p => `<div class="stock-alert-item"><span>${p.name}</span><span class="alert-stock">${p.stock} unit</span></div>`).join(''); }
    openModal('stockAlertModal');
});

// ========================================
// SETTINGS (Advanced)
// ========================================

// Settings tab navigation
document.querySelectorAll('.settings-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.settings-tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('stab-' + tab.dataset.stab)?.classList.add('active');
        if (typeof lucide !== 'undefined') lucide.createIcons();
        if (tab.dataset.stab === 'data') updateStorageStats();
        if (tab.dataset.stab === 'users') refreshUserList();
        if (tab.dataset.stab === 'inventory') refreshCategoryList();
        if (tab.dataset.stab === 'telegram') updateTelegramStatus();
    });
});

function loadSettings() {
    const s = DB.getObj('settings');
    document.getElementById('storeName').value = s.storeName || '';
    document.getElementById('storeAddress').value = s.storeAddress || '';
    document.getElementById('storePhone').value = s.storePhone || '';
    document.getElementById('storeEmail').value = s.storeEmail || '';
    document.getElementById('storeTagline').value = s.storeTagline || '';
    document.getElementById('storeCurrency').value = s.currency || 'Rp';
    document.getElementById('storeTax').value = s.tax || 0;
    document.getElementById('opHoursOpen').value = s.opHoursOpen || '08:00';
    document.getElementById('opHoursClose').value = s.opHoursClose || '21:00';
    document.getElementById('telegramToken').value = s.telegramToken || '';
    document.getElementById('telegramChatId').value = s.telegramChatId || '';
    document.getElementById('telegramEnabled').checked = s.telegramEnabled || false;
    document.getElementById('lowStockThreshold').value = s.lowStockThreshold || 5;
    document.getElementById('criticalStockThreshold').value = s.criticalStockThreshold || 1;
    document.getElementById('receiptFooter').value = s.receiptFooter || '';
    document.getElementById('receiptHeader').value = s.receiptHeader || '';

    // Load day toggles
    const days = s.operatingDays || ['sen','sel','rab','kam','jum','sab'];
    document.querySelectorAll('.day-toggle').forEach(btn => {
        btn.classList.toggle('active', days.includes(btn.dataset.day));
    });

    // Load active user
    refreshUserList();
    refreshCategoryList();
    updateTelegramStatus();

    // Notification prefs
    const notifs = s.notifPrefs || {};
    document.getElementById('notifSale').checked = notifs.sale !== false;
    document.getElementById('notifLowStock').checked = notifs.lowStock !== false;
    document.getElementById('notifDailyReport').checked = notifs.dailyReport || false;
    document.getElementById('notifStockIn').checked = notifs.stockIn || false;
    document.getElementById('notifLargeTransaction').checked = notifs.largeTransaction || false;
    document.getElementById('largeTxThreshold').value = notifs.largeTxThreshold || 500000;
    toggleLargeTxField();

    // Theme
    const currentTheme = s.theme || 'default';
    document.querySelectorAll('.theme-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.theme === currentTheme);
    });

    // Font size
    const fontSize = s.fontSize || 15;
    document.getElementById('fontSizeRange').value = fontSize;
    document.getElementById('fontSizeValue').textContent = fontSize + 'px';
}

// Day toggles
document.querySelectorAll('.day-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => { e.preventDefault(); btn.classList.toggle('active'); });
});

// Save Store
document.getElementById('saveStoreBtn')?.addEventListener('click', () => {
    const s = DB.getObj('settings');
    s.storeName = document.getElementById('storeName').value.trim();
    s.storeAddress = document.getElementById('storeAddress').value.trim();
    s.storePhone = document.getElementById('storePhone').value.trim();
    s.storeEmail = document.getElementById('storeEmail').value.trim();
    s.storeTagline = document.getElementById('storeTagline').value.trim();
    s.currency = document.getElementById('storeCurrency').value;
    s.tax = Number(document.getElementById('storeTax').value) || 0;
    DB.setObj('settings', s);
    showToast('Pengaturan toko disimpan', 'success');
});

// Save Hours
document.getElementById('saveHoursBtn')?.addEventListener('click', () => {
    const s = DB.getObj('settings');
    s.opHoursOpen = document.getElementById('opHoursOpen').value;
    s.opHoursClose = document.getElementById('opHoursClose').value;
    s.operatingDays = [...document.querySelectorAll('.day-toggle.active')].map(b => b.dataset.day);
    DB.setObj('settings', s);
    showToast('Jam operasional disimpan', 'success');
});

// Save Receipt
document.getElementById('saveReceiptBtn')?.addEventListener('click', () => {
    const s = DB.getObj('settings');
    s.receiptPaperSize = document.getElementById('receiptPaperSize').value;
    s.receiptHeader = document.getElementById('receiptHeader').value.trim();
    s.receiptFooter = document.getElementById('receiptFooter').value.trim();
    s.receiptShowDate = document.getElementById('receiptShowDate').checked;
    s.receiptShowCashier = document.getElementById('receiptShowCashier').checked;
    s.receiptShowTxId = document.getElementById('receiptShowTxId').checked;
    s.receiptAutoPrint = document.getElementById('receiptAutoPrint').checked;
    DB.setObj('settings', s);
    showToast('Pengaturan struk disimpan', 'success');
});

// Save Telegram
document.getElementById('saveTelegramBtn')?.addEventListener('click', () => {
    const s = DB.getObj('settings');
    s.telegramToken = document.getElementById('telegramToken').value.trim();
    s.telegramChatId = document.getElementById('telegramChatId').value.trim();
    s.telegramEnabled = document.getElementById('telegramEnabled').checked;
    DB.setObj('settings', s);
    showToast('Pengaturan Telegram disimpan', 'success');
    updateTelegramStatus();
});

document.getElementById('testTelegramBtn')?.addEventListener('click', async () => {
    const s = DB.getObj('settings');
    if (!s.telegramToken || !s.telegramChatId) return showToast('Isi token dan chat ID dulu', 'warning');
    try {
        const url = `https://api.telegram.org/bot${s.telegramToken}/sendMessage`;
        const res = await fetch(url, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: s.telegramChatId, text: '✅ BisnisKu terhubung! Notifikasi aktif.', parse_mode: 'HTML' })
        });
        if (res.ok) { showToast('Pesan test berhasil dikirim!', 'success'); updateTelegramStatus(true); }
        else showToast('Gagal kirim. Cek token & chat ID', 'error');
    } catch { showToast('Gagal kirim. Cek koneksi', 'error'); }
});

// Toggle token visibility
document.getElementById('toggleTokenVisibility')?.addEventListener('click', () => {
    const inp = document.getElementById('telegramToken');
    inp.type = inp.type === 'password' ? 'text' : 'password';
});

function updateTelegramStatus(forceConnected) {
    const s = DB.getObj('settings');
    const statusEl = document.getElementById('telegramStatus');
    if (!statusEl) return;
    const connected = forceConnected || (s.telegramEnabled && s.telegramToken && s.telegramChatId);
    statusEl.innerHTML = `<div class="status-dot ${connected ? 'connected' : 'disconnected'}"></div><span>${connected ? 'Terhubung' : 'Belum terhubung'}</span>`;
}

// Notification prefs
document.getElementById('notifLargeTransaction')?.addEventListener('change', toggleLargeTxField);
function toggleLargeTxField() {
    const show = document.getElementById('notifLargeTransaction')?.checked;
    const group = document.getElementById('largeTxThresholdGroup');
    if (group) group.style.display = show ? 'block' : 'none';
}

document.getElementById('saveNotifPrefsBtn')?.addEventListener('click', () => {
    const s = DB.getObj('settings');
    s.notifPrefs = {
        sale: document.getElementById('notifSale').checked,
        lowStock: document.getElementById('notifLowStock').checked,
        dailyReport: document.getElementById('notifDailyReport').checked,
        stockIn: document.getElementById('notifStockIn').checked,
        largeTransaction: document.getElementById('notifLargeTransaction').checked,
        largeTxThreshold: Number(document.getElementById('largeTxThreshold').value) || 500000,
        dailyReportTime: document.getElementById('dailyReportTime').value,
    };
    DB.setObj('settings', s);
    showToast('Preferensi notifikasi disimpan', 'success');
});

// Inventory settings
document.getElementById('saveInventoryBtn')?.addEventListener('click', () => {
    const s = DB.getObj('settings');
    s.lowStockThreshold = Number(document.getElementById('lowStockThreshold').value) || 5;
    s.criticalStockThreshold = Number(document.getElementById('criticalStockThreshold').value) || 1;
    s.allowNegativeStock = document.getElementById('allowNegativeStock').checked;
    s.trackBatchPrices = document.getElementById('trackBatchPrices').checked;
    DB.setObj('settings', s);
    showToast('Pengaturan inventaris disimpan', 'success');
    updateStockAlerts();
});

// Category management
function refreshCategoryList() {
    const categories = DB.get('categories');
    const products = getProducts();
    const autoCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
    const allCategories = [...new Set([...categories, ...autoCategories])];
    const list = document.getElementById('categoryList');
    if (!list) return;
    if (!allCategories.length) { list.innerHTML = '<p class="empty-state" style="padding:1rem;">Belum ada kategori</p>'; return; }
    list.innerHTML = allCategories.map(c => `
        <div class="category-item"><span>${getEmoji(c)} ${c}</span>
        <button class="btn-icon btn-danger-subtle" onclick="deleteCategory('${c}')"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg></button></div>
    `).join('');
}

document.getElementById('addCategoryBtn')?.addEventListener('click', () => {
    const name = document.getElementById('newCategoryName').value.trim();
    if (!name) return showToast('Nama kategori kosong', 'warning');
    const categories = DB.get('categories');
    if (categories.includes(name)) return showToast('Kategori sudah ada', 'warning');
    categories.push(name);
    DB.set('categories', categories);
    document.getElementById('newCategoryName').value = '';
    refreshCategoryList();
    showToast('Kategori ditambahkan', 'success');
});

function deleteCategory(name) {
    const categories = DB.get('categories').filter(c => c !== name);
    DB.set('categories', categories);
    refreshCategoryList();
    showToast('Kategori dihapus', 'success');
}

// POS settings
document.getElementById('savePosBtn')?.addEventListener('click', () => {
    const s = DB.getObj('settings');
    s.posGridSize = document.getElementById('posGridSize').value;
    s.posDefaultView = document.getElementById('posDefaultView').value;
    s.posSoundEnabled = document.getElementById('posSoundEnabled').checked;
    s.posQuickPay = document.getElementById('posQuickPay').checked;
    s.posConfirmClear = document.getElementById('posConfirmClear').checked;
    DB.setObj('settings', s);
    showToast('Pengaturan kasir disimpan', 'success');
});

// User management
function refreshUserList() {
    const users = DB.get('users');
    if (!users.length) { users.push('Admin'); DB.set('users', users); }
    const list = document.getElementById('userList');
    if (!list) return;
    list.innerHTML = users.map(u => `
        <div class="user-item"><span>👤 ${u}</span>
        ${u !== 'Admin' ? `<button class="btn-icon btn-danger-subtle" onclick="deleteUser('${u}')"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg></button>` : '<span style="color:var(--text-muted);font-size:0.75rem;">default</span>'}
        </div>
    `).join('');
    const activeSelect = document.getElementById('activeUser');
    if (activeSelect) {
        const s = DB.getObj('settings');
        activeSelect.innerHTML = users.map(u => `<option value="${u}" ${u === (s.activeUser || 'Admin') ? 'selected' : ''}>${u}</option>`).join('');
    }
}

document.getElementById('addUserBtn')?.addEventListener('click', () => {
    const name = document.getElementById('newUserName').value.trim();
    if (!name) return showToast('Nama kasir kosong', 'warning');
    const users = DB.get('users');
    if (users.includes(name)) return showToast('Kasir sudah ada', 'warning');
    users.push(name);
    DB.set('users', users);
    document.getElementById('newUserName').value = '';
    refreshUserList();
    showToast('Kasir ditambahkan', 'success');
});

function deleteUser(name) {
    const users = DB.get('users').filter(u => u !== name);
    DB.set('users', users);
    refreshUserList();
    showToast('Kasir dihapus', 'success');
}

document.getElementById('activeUser')?.addEventListener('change', function() {
    const s = DB.getObj('settings');
    s.activeUser = this.value;
    DB.setObj('settings', s);
    document.getElementById('activeUserName').textContent = this.value;
    showToast(`Kasir aktif: ${this.value}`, 'info');
});

// Theme switcher
document.querySelectorAll('.theme-option').forEach(opt => {
    opt.addEventListener('click', () => {
        document.querySelectorAll('.theme-option').forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        const theme = opt.dataset.theme;
        applyTheme(theme);
        const s = DB.getObj('settings');
        s.theme = theme;
        DB.setObj('settings', s);
        showToast(`Tema ${opt.querySelector('span').textContent} diterapkan`, 'success');
    });
});

function applyTheme(theme) {
    const themes = {
        default: { primary: '#6366f1', light: '#818cf8', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)' },
        emerald: { primary: '#10b981', light: '#34d399', gradient: 'linear-gradient(135deg, #10b981, #059669, #047857)' },
        rose: { primary: '#f43f5e', light: '#fb7185', gradient: 'linear-gradient(135deg, #f43f5e, #e11d48, #be123c)' },
        amber: { primary: '#f59e0b', light: '#fbbf24', gradient: 'linear-gradient(135deg, #f59e0b, #d97706, #b45309)' },
        cyan: { primary: '#06b6d4', light: '#22d3ee', gradient: 'linear-gradient(135deg, #06b6d4, #0891b2, #0e7490)' },
    };
    const t = themes[theme] || themes.default;
    document.documentElement.style.setProperty('--accent-primary', t.primary);
    document.documentElement.style.setProperty('--accent-primary-light', t.light);
    document.documentElement.style.setProperty('--accent-gradient', t.gradient);
    document.documentElement.style.setProperty('--accent-gradient-soft', t.gradient.replace(/,\s*#[a-f0-9]{6}\)/g, (m) => m.replace(')', ', 0.15)')).replace('linear-gradient', 'linear-gradient'));
    document.documentElement.style.setProperty('--border-focus', `${t.primary}80`);
    document.documentElement.style.setProperty('--shadow-glow', `0 0 30px ${t.primary}25`);
}

// Font size
document.getElementById('fontSizeRange')?.addEventListener('input', function() {
    document.getElementById('fontSizeValue').textContent = this.value + 'px';
    document.documentElement.style.fontSize = this.value + 'px';
    const s = DB.getObj('settings');
    s.fontSize = Number(this.value);
    DB.setObj('settings', s);
});

// Storage stats
function updateStorageStats() {
    let totalSize = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key) && key.startsWith('bk_')) {
            totalSize += (localStorage.getItem(key) || '').length * 2;
        }
    }
    const usedKB = (totalSize / 1024).toFixed(1);
    const maxKB = 5120;
    const pct = Math.min(100, (totalSize / 1024 / maxKB) * 100).toFixed(1);
    document.getElementById('storageUsed').textContent = usedKB + ' KB';
    document.getElementById('storageFill').style.width = pct + '%';
    document.getElementById('storageProducts').textContent = getProducts().length + ' item';
    document.getElementById('storageTransactions').textContent = DB.get('transactions').length + ' item';
    document.getElementById('storageStockIn').textContent = getStockIn().length + ' item';
}

// Data export/import
document.getElementById('exportDataBtn')?.addEventListener('click', () => {
    const data = { products: getProducts(), stockIn: getStockIn(), transactions: DB.get('transactions'), settings: DB.getObj('settings'), users: DB.get('users'), categories: DB.get('categories') };
    downloadFile(JSON.stringify(data, null, 2), `bisnisKu_backup_${today()}.json`, 'application/json');
    showToast('Backup berhasil', 'success');
});

document.getElementById('importDataBtn')?.addEventListener('click', () => document.getElementById('importFileInput').click());
document.getElementById('importFileInput')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            if (data.products) saveProducts(data.products);
            if (data.stockIn) saveStockIn(data.stockIn);
            if (data.transactions) DB.set('transactions', data.transactions);
            if (data.settings) DB.setObj('settings', data.settings);
            if (data.users) DB.set('users', data.users);
            if (data.categories) DB.set('categories', data.categories);
            showToast('Data berhasil diimport', 'success');
            navigateTo('dashboard');
        } catch { showToast('File tidak valid', 'error'); }
    };
    reader.readAsText(file);
});

document.getElementById('clearTransactionsBtn')?.addEventListener('click', () => {
    if (!confirm('Hapus semua transaksi? Aksi ini tidak bisa dibatalkan!')) return;
    DB.set('transactions', []);
    DB.set('stockIn', []);
    showToast('Semua transaksi dihapus', 'info');
});

document.getElementById('resetDataBtn')?.addEventListener('click', () => {
    if (!confirm('PERINGATAN: Semua data akan dihapus! Lanjutkan?')) return;
    if (!confirm('Yakin? Aksi ini tidak bisa dibatalkan!')) return;
    ['products', 'stockIn', 'transactions', 'settings', 'users', 'categories'].forEach(k => localStorage.removeItem('bk_' + k));
    showToast('Semua data telah direset', 'info');
    navigateTo('dashboard');
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if (e.key === 'F2') { e.preventDefault(); navigateTo('kasir'); }
    if (e.key === 'F9') { e.preventDefault(); cart = []; renderCart(); showToast('Keranjang dikosongkan', 'info'); }
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
    }
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'F4') { e.preventDefault(); navigateTo('kasir'); setTimeout(() => document.getElementById('posSearch')?.focus(), 100); }
    if (e.key === 'F8') { e.preventDefault(); document.getElementById('payBtn')?.click(); }
});

// ========================================
// INIT
// ========================================
function init() {
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Apply saved theme
    const s = DB.getObj('settings');
    if (s.theme) applyTheme(s.theme);
    if (s.fontSize) { document.documentElement.style.fontSize = s.fontSize + 'px'; }

    navigateTo('dashboard');
    updateStockAlerts();
}

document.addEventListener('DOMContentLoaded', init);

