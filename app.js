// ===================================
// MOCK DATA
// ===================================


let mockData = {
  companies: [],
  transactions: [],
  manualBilling: [],
  batches: [],
  usage: [],
  pricing: [],
  pricedTransactions: [],
  leads: [],
  activities: [],
  supportTickets: [],
  campaigns: [],
  users: [],
  auditLogs: [],
  exceptions: [],
  notifications: [],
  waitingRoom: [],
  invoices: [],
  companyUsers: []
};
// Expose mockData globally
window.mockData = mockData;

async function loadData() {
  console.log('Loading app data...');

  // Offline/local mode: use pre-seeded data from offline-boot.js
  if (window.__offlineSeedData) {
    console.log('[Offline Boot] Using pre-seeded demo data (no backend needed).');
    Object.assign(mockData, window.__offlineSeedData);
    standardizeData();
    return;
  }

  try {
    const response = await fetch('api.php?action=loadAll');
    if (!response.ok) throw new Error('API fetch failed');
    const data = await response.json();

    // Check if database is empty (no companies) indicating an initial state
    if (!data.companies || data.companies.length === 0) {
      console.log('Database empty, attempting to seed from data.json or LocalStorage...');
      if (!loadFromLocalStorage()) {
        const fallbackRes = await fetch('data.json');
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          Object.assign(mockData, fallbackData);
        }
      }
      standardizeData();
      saveToDatabase(); // Seed the database with the fallback data
    } else {
      // Use database data
      Object.assign(mockData, data);
      standardizeData();
      console.log('Successfully loaded from MySQL database via API');
    }
  } catch (e) {
    console.warn('Failed to load from API. Attempting fallback.', e);
    if (!loadFromLocalStorage()) {
      try {
        const res = await fetch('data.json');
        if (res.ok) Object.assign(mockData, await res.json());
      } catch (err) {
        console.error('Final fallback failed', err);
      }
    }
    standardizeData();
  }
}

// ===================================
// STATE MANAGEMENT
// ===================================

let currentPage = 'dashboard';
let currentTab = 'unpaid';
let currentSettingsTab = 'authorized';
let sortColumn = null;
let sortDirection = 'asc';
let currentUser = null;

// ===================================
// DATABASE & PERSISTENCE
// ===================================

async function saveToDatabase() {
  try {
    const response = await fetch('api.php?action=saveAll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockData)
    });
    const result = await response.json();
    if (result.success) {
      console.log('Data seamlessly synced to InfinityFree MySQL database');
    } else {
      console.error('Database sync error:', result.error);
    }
  } catch (e) {
    console.error('API save failed:', e);
  }
}

function saveToLocalStorage() {
  try {
    // Preserve local backup
    localStorage.setItem('billingData', JSON.stringify(mockData));
    console.log('Data saved to localStorage backup');
  } catch (error) {
    console.error('Error saving to localStorage backup:', error);
  }

  // Asynchronously trigger database sync
  saveToDatabase();
}

function loadFromLocalStorage() {
  try {
    const savedData = localStorage.getItem('billingData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      Object.assign(mockData, parsedData);
      console.log('Data loaded from localStorage');
      return true;
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
  }
  return false;
}

// ===================================
// AUTHENTICATION & SESSION
// ===================================

function checkAuth() {
  // Auto-inject demo session for local/offline testing (file:// protocol or no backend)
  const isLocalFile = window.location.protocol === 'file:';
  const userSession = localStorage.getItem('billingUser') || sessionStorage.getItem('billingUser');

  if (!userSession) {
    if (isLocalFile) {
      // Create a demo admin session automatically for file:// testing
      const demoUser = {
        id: 'USR_DEMO',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@billing.com',
        role: 'Admin',
        userGroup: 'Admin',
        authorized: true
      };
      sessionStorage.setItem('billingUser', JSON.stringify(demoUser));
      currentUser = demoUser;
      updateUserProfile();
      setupSessionTimeout();
      return true;
    }
    window.location.href = 'login.html';
    return false;
  }

  try {
    currentUser = JSON.parse(userSession);
    updateUserProfile();
    setupSessionTimeout();
    return true;
  } catch (e) {
    window.location.href = 'login.html';
    return false;
  }
}

// ===================================
// SESSION TIMEOUT
// ===================================
let sessionTimeoutId;
const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

function resetSessionTimeout() {
  clearTimeout(sessionTimeoutId);
  sessionTimeoutId = setTimeout(handleSessionTimeout, TIMEOUT_MS);
}

function handleSessionTimeout() {
  localStorage.removeItem('billingUser');
  sessionStorage.removeItem('billingUser');
  localStorage.removeItem('billingUserToken');
  window.location.href = 'login.html?timeout=true';
}

function setupSessionTimeout() {
  document.addEventListener('mousemove', resetSessionTimeout);
  document.addEventListener('mousedown', resetSessionTimeout);
  document.addEventListener('keypress', resetSessionTimeout);
  document.addEventListener('touchmove', resetSessionTimeout);
  resetSessionTimeout();
}

function updateUserProfile() {
  if (!currentUser) return;

  const initials = (currentUser.firstName[0] + currentUser.lastName[0]).toUpperCase();
  document.getElementById('userInitials').textContent = initials;
  document.getElementById('userName').textContent = `${currentUser.firstName} ${currentUser.lastName}`;
  document.getElementById('userRole').textContent = currentUser.role;
}

function logout() {
  localStorage.removeItem('billingUser');
  sessionStorage.removeItem('billingUser');
  localStorage.removeItem('billingUserToken');
  showNotification('Logged out successfully', 'success');
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 500);
}

// ===================================
// TOAST NOTIFICATIONS
// ===================================

function showNotification(message, type = 'info') {
  const container = document.getElementById('toastContainer');

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
  };

  toast.innerHTML = `
    <div class="toast-icon ${type}">
      ${icons[type]}
    </div>
    <div class="toast-content">
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `;

  container.appendChild(toast);

  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ===================================
// USER PROFILE DROPDOWN
// ===================================

function initUserProfileDropdown() {
  const profileBtn = document.getElementById('userProfileBtn');
  const dropdownMenu = document.getElementById('userDropdownMenu');
  const logoutBtn = document.getElementById('logoutBtn');

  if (!profileBtn || !dropdownMenu) return;

  // Toggle dropdown
  profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle('show');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!profileBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
      dropdownMenu.classList.remove('show');
    }
  });

  // Handle dropdown item clicks
  dropdownMenu.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const page = item.getAttribute('data-page');
      if (page) {
        e.preventDefault();
        navigateToPage(page);
        dropdownMenu.classList.remove('show');
      }
    });
  });

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }
}


// ===================================
// NAVIGATION
// ===================================

function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');

  // RBAC: Filter navigation items based on user role
  if (currentUser) {
    const userGroup = currentUser.userGroup || 'User';

    // Define restricted pages for each role
    const restrictions = {
      'Sales': ['run-billing', 'settings', 'marketing', 'batch-logger', 'waiting-room', 'authorizations'],
      'Manager': ['run-billing'],
      'Administrator': []
    };

    const restrictedPages = restrictions[userGroup] || [];

    navItems.forEach(item => {
      const page = item.getAttribute('data-page');

      // Check if page is restricted
      if (restrictedPages.includes(page)) {
        item.style.display = 'none';
      } else {
        item.style.display = 'flex'; // Ensure visible if not restricted
      }

      item.addEventListener('click', (e) => {
        e.preventDefault();

        // Update active state
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        // Change page
        changePage(page);

        // On mobile, close sidebar if open (optional)
        if (window.innerWidth < 768) {
          document.querySelector('.sidebar').classList.remove('show');
        }
      });
    });
  }
}

function getFilteredCompanies() {
  let companies = mockData.companies;
  if (currentUser && currentUser.userGroup === 'Sales') {
    const assigned = currentUser.assignedClients || [];
    const fullName = currentUser.firstName + ' ' + currentUser.lastName;
    companies = companies.filter(c => assigned.includes(c.name) || c.salesPerson === fullName);
  }
  return companies;
}

function getFilteredLeads() {
  let leads = mockData.leads || [];
  if (currentUser && currentUser.userGroup === 'Sales') {
    const fullName = currentUser.firstName + ' ' + currentUser.lastName;
    leads = leads.filter(l => l.createdBy === fullName || l.assignedTo === fullName);
  }
  return leads;
}

function getFilteredActivities() {
  let activities = mockData.activities || [];
  if (currentUser && currentUser.userGroup === 'Sales') {
    const fullName = currentUser.firstName + ' ' + currentUser.lastName;
    activities = activities.filter(a => a.createdBy === fullName);
  }
  return activities;
}

function getFilteredInvoices() {
  let invoices = mockData.invoices || [];
  if (currentUser && currentUser.userGroup === 'Sales') {
    const visibleCompanies = getFilteredCompanies().map(c => c.name);
    invoices = invoices.filter(inv => visibleCompanies.includes(inv.company));
  }
  return invoices;
}

function getFilteredTransactions() {
  let transactions = mockData.transactions || [];
  if (currentUser && currentUser.userGroup === 'Sales') {
    const visibleCompanies = getFilteredCompanies().map(c => c.name);
    transactions = transactions.filter(t => visibleCompanies.includes(t.company));
  }
  return transactions;
}

function getFilteredPricing() {
  let pricing = mockData.pricing || [];
  if (currentUser && currentUser.userGroup === 'Sales') {
    const visibleCompanies = getFilteredCompanies().map(c => c.name);
    pricing = pricing.filter(p => visibleCompanies.includes(p.company) || visibleCompanies.includes(p.companyName));
  }
  return pricing;
}

function getFilteredSupport() {
  let tickets = mockData.supportTickets || [];
  if (currentUser && currentUser.userGroup === 'Sales') {
    const fullName = currentUser.firstName + ' ' + currentUser.lastName;
    tickets = tickets.filter(t => t.createdBy === fullName || t.assignedTo === fullName);
  }
  return tickets;
}

function navigateToPage(page) {
  // Update active nav item
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  const activeItem = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (activeItem) activeItem.classList.add('active');

  changePage(page);
}

function changePage(page) {

  // Hide all pages
  document.querySelectorAll('.page-container').forEach(el => {
    el.classList.add('hidden');
  });

  // Show selected page
  const pageElement = document.getElementById(`${page}-page`);


  if (pageElement) {
    showLoader();

    // Simulate loading delay for effect (optional, but good for UX feedback)
    setTimeout(() => {
      pageElement.classList.remove('hidden');
      currentPage = page;

      // Update Header Title
      const titleMap = {
        'dashboard': 'Dashboard',
        'companies': 'Companies',
        'transactions': 'Transactions',
        'reports': 'Reports',
        'batch-logger': 'Batch Logger',
        'manual-billing': 'Manual Billing',
        'exceptions': 'Exceptions',
        'waiting-room': 'Waiting Room',
        'settings': 'Settings',
        'usage': 'Usage',
        'pricing': 'Pricing',
        'priced-transactions': 'Priced Transactions',
        'leads': 'Lead Management',
        'activities': 'Activity Tracking',
        'support': 'Support Tickets',
        'marketing': 'Marketing Automation',
        'run-billing': 'Run Billing'
      };
      const titleEl = document.getElementById('currentPageTitle');
      if (titleEl) titleEl.textContent = titleMap[page] || 'Billing Management';

      // Load page-specific data
      loadPageData(page);

      hideLoader();
    }, 300); // 300ms delay
  }
}

function showLoader() {
  const loader = document.getElementById('globalLoader');
  if (loader) loader.classList.add('show');
}

function hideLoader() {
  const loader = document.getElementById('globalLoader');
  if (loader) loader.classList.remove('show');
}

function loadPageData(page) {
  switch (page) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'companies':
      renderCompanies();
      break;
    case 'transactions':
      renderTransactions();
      break;
    case 'reports':
      renderInvoices();
      break;
    case 'usage':
      renderUsage();
      break;
    case 'pricing':
      renderPricing();
      break;
    case 'priced-transactions':
      renderPricedTransactions();
      break;
    case 'settings':
      renderSettings();
      break;
    case 'manual-billing':
      renderManualBilling();
      break;
    case "batch-logger":
      renderBatchLogger();
      break;
    case "authorizations":
      renderAuthorizations();
      break;
    case "exceptions":
      renderExceptions();
      break;
    case "waiting-room":
      renderWaitingRoom();
      break;
    case "notifications":
      renderAllNotifications();
      break;
    case "leads":
      renderLeads();
      break;
    case "activities":
      renderAllActivities();
      break;
    case "support":
      // Preserve active tab if possible, or default to unresolved
      const activeTabObj = document.querySelector('[data-support-tab].active');
      const activeTab = activeTabObj ? activeTabObj.getAttribute('data-support-tab') : 'unresolved';
      renderTickets(mockData.supportTickets, activeTab);
      break;
    case "marketing":
      renderCampaigns();
      break;
    case "run-billing":
      // No specific render function needed for init, but maybe clear preview?
      // renderBillingPreview(); // Optional
      break;
  }
}
window.clearDashboardDateFilter = function () {
  const startDateInput = document.getElementById('dashboardStartDate');
  const endDateInput = document.getElementById('dashboardEndDate');
  if (startDateInput) startDateInput.value = '';
  if (endDateInput) endDateInput.value = '';
  renderDashboard();
};

// ===================================
// DASHBOARD
// ===================================

function renderDashboard() {
  console.log('renderDashboard called, currentPage:', currentPage);

  if (currentPage !== 'dashboard') return;
  if (typeof Chart === 'undefined') {
    console.error('Chart.js is not loaded');
    return;
  }

  // --- DATE FILTER LOGIC (NEW) ---
  const startDateInput = document.getElementById('dashboardStartDate');
  const endDateInput = document.getElementById('dashboardEndDate');

  let dateFilteredInvoices = mockData.invoices || [];

  // Apply date filter if dates are selected
  if (startDateInput && endDateInput && startDateInput.value && endDateInput.value) {
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);

    dateFilteredInvoices = dateFilteredInvoices.filter(inv => {
      // Parse the invoice date (handle DD/MM/YYYY format)
      const parts = inv.dueDate.split('/');
      const invDate = new Date(parts[2], parts[1] - 1, parts[0]);
      return invDate >= startDate && invDate <= endDate;
    });
  }

  // --- 1. Calculate Metrics ---
  // RBAC: Filter invoices based on visible companies
  const visibleCompanies = getFilteredCompanies().map(c => c.name);
  const filteredInvoices = dateFilteredInvoices.filter(inv => visibleCompanies.includes(inv.company));

  const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.totalPrice, 0);
  const paidInvoices = filteredInvoices.filter(i => i.status === 'Paid').length;
  const totalInvoices = filteredInvoices.length;
  const collectionRate = totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 0;
  const avgInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

  // Current Month Metrics
  const currentMonth = 'January 2025'; // For mock data consistency
  const thisMonthInvoices = filteredInvoices.filter(i => i.billingMonth === currentMonth);
  const thisMonthCount = thisMonthInvoices.length;
  const thisMonthPaid = thisMonthInvoices.filter(i => i.status === 'Paid').length;
  const thisMonthUnpaid = thisMonthInvoices.filter(i => i.status === 'Unpaid').length;
  const thisMonthRevenue = thisMonthInvoices.reduce((sum, i) => sum + i.totalPrice, 0);

  // Update Metric Displays
  const totalRevEl = document.getElementById('totalRevenueDisplay');
  const collRateEl = document.getElementById('collectionRateDisplay');
  const avgInvEl = document.getElementById('avgInvoiceDisplay');

  if (totalRevEl) totalRevEl.textContent = `R${totalRevenue.toFixed(2)}`;
  if (collRateEl) collRateEl.textContent = `${collectionRate}%`;
  if (avgInvEl) avgInvEl.textContent = `R${avgInvoiceValue.toFixed(2)}`;

  // Update This Month Metrics
  const tmInvEl = document.getElementById('thisMonthInvoicesDisplay');
  const tmPaidEl = document.getElementById('thisMonthPaidDisplay');
  const tmUnpaidEl = document.getElementById('thisMonthUnpaidDisplay');

  if (tmInvEl) tmInvEl.textContent = thisMonthCount;
  if (tmPaidEl) tmPaidEl.textContent = thisMonthPaid;
  if (tmUnpaidEl) tmUnpaidEl.textContent = thisMonthUnpaid;


  // --- 2. Chart Configurations ---
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#94a3b8' } },
      y: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#94a3b8' }, beginAtZero: true }
    }
  };

  // Chart 1: Revenue by Company (Horizontal Bar)
  const filteredCompanies = getFilteredCompanies();
  createChart('revenueByCompanyChart', 'bar', {
    labels: filteredCompanies.map(c => c.name),
    datasets: [{
      label: 'Revenue',
      data: filteredCompanies.map(c => {
        return filteredInvoices.filter(i => i.company === c.name).reduce((sum, i) => sum + i.totalPrice, 0);
      }),
      backgroundColor: '#60a5fa',
      borderRadius: 4,
      barThickness: 20
    }]
  }, { ...commonOptions, indexAxis: 'y' });

  // Chart 2: Transaction Volume by Product (Horizontal Bar)
  // Aggregate transactions by product
  const productVolume = {};
  const visibleCompanyNames = filteredCompanies.map(c => c.name);
  const filteredTransactions = mockData.transactions.filter(t => visibleCompanyNames.includes(t.company));

  filteredTransactions.forEach(t => {
    productVolume[t.product] = (productVolume[t.product] || 0) + t.count;
  });

  createChart('transactionVolumeChart', 'bar', {
    labels: Object.keys(productVolume),
    datasets: [{
      label: 'Volume',
      data: Object.values(productVolume),
      backgroundColor: '#34d399',
      borderRadius: 4,
      barThickness: 20
    }]
  }, { ...commonOptions, indexAxis: 'y' });

  // Chart 3: Monthly Revenue Trend (Line Chart)
  // Aggregate revenue by month
  const revenueByMonth = {};
  filteredInvoices.forEach(inv => {
    revenueByMonth[inv.billingMonth] = (revenueByMonth[inv.billingMonth] || 0) + inv.totalPrice;
  });

  const sortedMonths = Object.keys(revenueByMonth); // Assuming they come in order or need sorting logic

  createChart('revenueTrendChart', 'line', {
    labels: sortedMonths,
    datasets: [{
      label: 'Monthly Revenue',
      data: sortedMonths.map(m => revenueByMonth[m]),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true,
      pointRadius: 4,
      pointHoverRadius: 6
    }]
  }, {
    ...commonOptions,
    plugins: { legend: { display: false }, title: { display: true, text: 'Monthly Revenue' } }
  });

  // Chart 4: Outstanding vs Paid (Vertical Bar)
  createChart('outstandingPaidChart', 'bar', {
    labels: filteredCompanies.map(c => c.name),
    datasets: [
      {
        label: 'Paid',
        data: filteredCompanies.map(c => {
          return filteredInvoices.filter(i => i.company === c.name).reduce((sum, i) => sum + i.paidAmount, 0);
        }),
        backgroundColor: '#34d399',
        borderRadius: 4
      },
      {
        label: 'Outstanding',
        data: filteredCompanies.map(c => {
          return filteredInvoices.filter(i => i.company === c.name).reduce((sum, i) => sum + i.outstanding, 0);
        }),
        backgroundColor: '#f87171',
        borderRadius: 4
      }
    ]
  }, {
    ...commonOptions,
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { stacked: true, grid: { display: false } }
    }
  });

  // Chart 5: Revenue Share (Pie Chart)
  createChart('revenueShareChart', 'pie', {
    labels: mockData.companies.map(c => c.name),
    datasets: [{
      data: mockData.companies.map(c => {
        return mockData.invoices.filter(i => i.company === c.name).reduce((sum, i) => sum + i.totalPrice, 0);
      }),
      backgroundColor: ['#60a5fa', '#34d399', '#facc15'],
      borderWidth: 0
    }]
  }, {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } }
    }
  });

  // Chart 6: Batch Status (Doughnut Chart)
  const batchStatus = { Processed: 0, Processing: 0, Pending: 0 };
  mockData.batches.forEach(b => {
    batchStatus[b.status] = (batchStatus[b.status] || 0) + 1;
  });

  createChart('batchStatusChart', 'doughnut', {
    labels: Object.keys(batchStatus),
    datasets: [{
      data: Object.values(batchStatus),
      backgroundColor: ['#34d399', '#60a5fa', '#facc15'],
      borderWidth: 0
    }]
  }, {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } }
    }
  });

  renderRecentActivity();
}

function renderRecentActivity() {
  const list = document.getElementById('recentActivityList');
  if (!list) return;

  // Mock recent activity based on other data
  const activities = [
    { text: 'Invoice #INV-2024-001 paid by ABSA', time: '2 mins ago', icon: '💰' },
    { text: 'New lead "John Doe" added', time: '1 hour ago', icon: '👤' },
    { text: 'Batch #BATCH-2024-001 processed', time: '3 hours ago', icon: '⚙️' },
    { text: 'Support ticket #TKT-1002 resolved', time: '5 hours ago', icon: '✅' },
    { text: 'New campaign "Q1 Promo" created', time: '1 day ago', icon: '📢' }
  ];

  list.innerHTML = activities.map(a => `
    <li class="activity-item-compact">
      <div class="activity-icon">${a.icon}</div>
      <div style="flex: 1;">
        <div style="font-weight: 500; color: #334155;">${a.text}</div>
        <div style="color: #94a3b8; font-size: 11px;">${a.time}</div>
      </div>
    </li>
  `).join('');
}

// Helper to create charts safely
function createChart(canvasId, type, data, options) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  // Destroy existing chart instance if stored on the canvas element
  if (canvas.chartInstance) {
    canvas.chartInstance.destroy();
  }

  canvas.chartInstance = new Chart(canvas.getContext('2d'), {
    type: type,
    data: data,
    options: options
  });
}

function getTopCompany() {
  const revenueByCompany = {};

  mockData.invoices.forEach(inv => {
    if (!revenueByCompany[inv.company]) {
      revenueByCompany[inv.company] = 0;
    }
    revenueByCompany[inv.company] += inv.totalPrice;
  });

  let topCompany = '';
  let maxRevenue = 0;

  for (const [company, revenue] of Object.entries(revenueByCompany)) {
    if (revenue > maxRevenue) {
      maxRevenue = revenue;
      topCompany = company;
    }
  }

  return topCompany;
}

function renderRevenueChart() {
  const ctx = document.getElementById('revenueChart');

  // Calculate revenue by company
  const revenueByCompany = {};
  mockData.invoices.forEach(inv => {
    if (!revenueByCompany[inv.company]) {
      revenueByCompany[inv.company] = 0;
    }
    revenueByCompany[inv.company] += inv.totalPrice;
  });

  const companies = Object.keys(revenueByCompany);
  const revenues = Object.values(revenueByCompany);

  // Destroy existing chart if it exists
  if (window.revenueChartInstance) {
    window.revenueChartInstance.destroy();
  }

  window.revenueChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: companies,
      datasets: [{
        label: 'Revenue (R)',
        data: revenues,
        backgroundColor: '#7C3AED',
        borderRadius: 8,
        barThickness: 60
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            display: true,
            color: '#E5E7EB'
          },
          ticks: {
            callback: function (value) {
              return 'R' + value;
            }
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// ===================================
// COMPANIES
// ===================================

function renderCompanies() {
  const tbody = document.getElementById('companiesTableBody');
  const countDisplay = document.getElementById('companiesCount');
  const searchInput = document.getElementById('companiesSearch');

  // Use centralized filtering
  let companies = getFilteredCompanies();

  if (searchInput && searchInput.value) {
    const term = searchInput.value.toLowerCase();
    companies = companies.filter(c => c.name.toLowerCase().includes(term));
  }

  if (tbody) {
    tbody.innerHTML = companies.map(company => {
      const parentName = company.parentId ? mockData.companies.find(p => p.id == company.parentId)?.name || '-' : '-';
      const parentId = company.parentId ? `P - ${String(company.parentId).padStart(3, '0')} ` : '-'; // Mock Parent ID
      const companyId = `C - ${String(company.id).padStart(3, '0')} `;

      return `
      <tr>
          <td>${parentId}</td>
          <td>${parentName}</td>
          <td>${companyId}</td>
          <td><a href="#" class="table-link" onclick="viewCompanyDetails(${company.id}); return false;">${company.name}</a></td>
          <td><span class="badge ${company.type === 'Parent' ? 'badge-primary' : 'badge-secondary'}">${company.type}</span></td>
          <td>${company.contact}</td>
          <td><span class="truncate-text" title="${company.email}">${company.email}</span></td>
          <td><span class="truncate-text" title="${company.address}">${company.address}</span></td>
          <td><span class="badge ${company.active ? 'badge-success' : 'badge-danger'}">${company.active ? 'Active' : 'Inactive'}</span></td>
        </tr>
      `;
    }).join('');
  }

  // Update badge count based on filtered list
  document.getElementById('companiesBadge').textContent = getFilteredCompanies().length;
}

function initCompanyModal() {
  const modal = document.getElementById('createCompanyModal');
  const btn = document.getElementById('createCompanyBtn');
  const close = document.querySelector('.close-modal');
  const cancel = document.getElementById('cancelCreateCompany');
  const form = document.getElementById('createCompanyForm');
  const typeSelect = document.getElementById('companyTypeSelect');
  const parentGroup = document.getElementById('parentCompanyGroup');
  const parentSelect = document.getElementById('parentCompanySelect');
  const companyIdInput = document.getElementById('companyIdInput');
  const parentIdInput = document.getElementById('parentIdInput');
  const parentIdGroup = document.getElementById('parentIdGroup');

  // Return early if required elements don't exist
  if (!modal || !btn || !form) return;

  // Handle new company button -> Open Modal (Restored Functionality)
  btn.onclick = () => {
    modal.classList.add('show');
    form.reset();
    if (parentGroup) parentGroup.classList.add('hidden');
    if (parentIdGroup) parentIdGroup.classList.add('hidden');

    // Auto-generate Company ID
    const nextId = mockData.companies.length + 1;
    companyIdInput.value = `C${String(nextId).padStart(3, '0')}`;
  };

  // Populate sales person dropdown
  const salesPersonSelect = document.getElementById('companySalesPersonSelect');
  if (salesPersonSelect) {
    const salesUsers = mockData.users.filter(u => u.userGroup === 'Sales' || u.userGroup === 'Manager' || u.userGroup === 'Administrator');
    salesPersonSelect.innerHTML = '<option value="">Select Sales Person</option>' +
      salesUsers.map(u => `<option value="${u.firstName} ${u.lastName}">${u.firstName} ${u.lastName}</option>`).join('');
  }


  const closeModal = () => modal.classList.remove('show');
  if (close) close.onclick = closeModal;
  if (cancel) cancel.onclick = closeModal;

  window.onclick = (e) => {
    if (e.target === modal) closeModal();
  };

  typeSelect.onchange = () => {
    if (typeSelect.value === 'child') {
      if (parentGroup) parentGroup.classList.remove('hidden');
      if (parentIdGroup) parentIdGroup.classList.remove('hidden');
      // Populate parents
      const parents = mockData.companies.filter(c => c.type === 'Parent');
      parentSelect.innerHTML = parents.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

      // Auto-fill first parent ID
      if (parents.length > 0) {
        parentIdInput.value = `C${String(parents[0].id).padStart(3, '0')}`;
      }
    } else {
      if (parentGroup) parentGroup.classList.add('hidden');
      if (parentIdGroup) parentIdGroup.classList.add('hidden');
    }
  };

  // Update Parent ID when parent company changes
  parentSelect.onchange = () => {
    const selectedParentId = parentSelect.value;
    parentIdInput.value = `C${String(selectedParentId).padStart(3, '0')}`;
  };

  form.onsubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    const isParent = formData.get('companyType') === 'parent';
    const newId = `C-${String(mockData.companies.length + 1).padStart(3, '0')}`;

    const newCompany = {
      id: newId,
      name: formData.get('companyName'),
      type: isParent ? 'Parent' : 'Child',
      parentId: isParent ? newId : formData.get('parentCompany'),
      contact: formData.get('contactPerson'),
      email: formData.get('email'),
      address: formData.get('address'),
      salesPerson: formData.get('salesPerson') || '',
      active: true
    };

    mockData.companies.push(newCompany);

    // Save to localStorage
    saveToLocalStorage();

    renderCompanies();
    closeModal();

    // Show success notification
    showNotification(`Company "${newCompany.name
      }" created successfully!`, 'success');

    // Refresh other views that depend on companies
    renderDashboard();
  };
}

// ===================================
// TRANSACTIONS
// ===================================

// Pagination State for Transactions
let transactionsPage = 1;
const transactionsPerPage = 10;

function renderTransactions() {
  const tbody = document.getElementById('transactionsTableBody');
  const aggregatedTransactions = getAggregatedTransactions(); // Use aggregation here

  // Pagination Logic
  const totalItems = aggregatedTransactions.length;
  const totalPages = Math.ceil(totalItems / transactionsPerPage);

  if (transactionsPage > totalPages) transactionsPage = totalPages || 1;
  if (transactionsPage < 1) transactionsPage = 1;

  const start = (transactionsPage - 1) * transactionsPerPage;
  const end = start + transactionsPerPage;
  const pageItems = aggregatedTransactions.slice(start, end);

  if (pageItems.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">No transactions found</td></tr>';
  } else {
    tbody.innerHTML = pageItems.map(t => `
      <tr>
        <td><a href="#" class="table-link">${t.company}</a></td>
        <td>${t.product}</td>
        <td>${t.date.split('T')[0]}</td> <!-- Date Only -->
        <td>${t.count}</td>
      </tr>
      `).join('');
  }

  document.getElementById('transactionCount').textContent = `${start + 1}-${Math.min(end, totalItems)} of ${totalItems}`;

  renderTransactionPaginationControls(totalPages);
}

function getAggregatedTransactions() {
  const filtered = getFilteredTransactions(); // Base filter by product/date
  const aggregationMap = {};

  filtered.forEach(t => {
    // Group by Company + Product + Date (Day)
    const datePart = t.date.split('T')[0];
    const key = `${t.company}|${t.product}|${datePart}`;

    if (!aggregationMap[key]) {
      aggregationMap[key] = {
        company: t.company,
        product: t.product,
        date: datePart,
        count: 0
      };
    }
    aggregationMap[key].count += (t.count || 1);
  });

  return Object.values(aggregationMap);
}

function renderTransactionPaginationControls(totalPages) {
  const container = document.getElementById('transactionsPagination');
  if (!container) return;

  let html = '';

  // Prev
  html += `<button class="btn btn-secondary btn-sm" ${transactionsPage === 1 ? 'disabled' : ''} onclick="changeTransactionsPage(${transactionsPage - 1})">Prev</button>`;

  // Pages
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="btn btn-sm ${i === transactionsPage ? 'btn-primary' : 'btn-secondary'}" onclick="changeTransactionsPage(${i})">${i}</button>`;
  }

  // Next
  html += `<button class="btn btn-secondary btn-sm" ${transactionsPage === totalPages ? 'disabled' : ''} onclick="changeTransactionsPage(${transactionsPage + 1})">Next</button>`;

  container.innerHTML = html;
}

window.changeTransactionsPage = function (page) {
  transactionsPage = page;
  renderTransactions();
};

function getFilteredTransactions() {
  let filtered = [...mockData.transactions];

  // Filter by product
  const productFilter = document.getElementById('productFilter');
  if (productFilter && productFilter.value !== 'all') {
    filtered = filtered.filter(t => t.product.toLowerCase() === productFilter.value.toLowerCase());
  }

  return filtered;
}

function initTransactionFilters() {
  const productFilter = document.getElementById('productFilter');
  const startDate = document.getElementById('startDate');
  const endDate = document.getElementById('endDate');

  if (productFilter) {
    productFilter.addEventListener('change', renderTransactions);
  }

  if (startDate) {
    startDate.addEventListener('change', renderTransactions);
  }

  if (endDate) {
    endDate.addEventListener('change', renderTransactions);
  }
}

function initTableSorting() {
  const headers = document.querySelectorAll('th.sortable');

  headers.forEach(header => {
    header.addEventListener('click', () => {
      const column = header.getAttribute('data-column');

      if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        sortColumn = column;
        sortDirection = 'asc';
      }

      // Update header classes
      headers.forEach(h => {
        h.classList.remove('sort-asc', 'sort-desc');
      });

      header.classList.add(sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');

      // Re-render with sorting
      renderTransactions();
    });
  });
}

// ===================================
// REPORTS (INVOICES)
// ===================================


function getFilteredInvoices() {
  let filtered = [...mockData.invoices];

  // Filter by tab
  if (currentTab === 'paid') {
    filtered = filtered.filter(inv => inv.status === 'Paid');
  } else if (currentTab === 'unpaid') {
    filtered = filtered.filter(inv => inv.status === 'Unpaid');
  }

  return filtered;
}

function initReportTabs() {
  const tabs = document.querySelectorAll('#reports-page .tab');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');

      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      currentTab = tabName;
      renderInvoices();
    });
  });
}

// ===================================
// USAGE
// ===================================

function renderUsage() {
  const tbody = document.getElementById('usageTableBody');
  const usageData = getFilteredUsage(); // No aggregation, just filter

  if (usageData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">No usage data found</td></tr>';
    document.getElementById('usageCount').textContent = '0';
    return;
  }

  // Sort by date desc
  usageData.sort((a, b) => new Date(b.date) - new Date(a.date));

  tbody.innerHTML = usageData.map(row => `
    <tr>
      <td><a href="#" class="table-link">${row.company}</a></td>
      <td>${row.username || '-'}</td>
      <td>${row.firstName || '-'}</td>
      <td>${row.surname || '-'}</td>
      <td>${row.product}</td>
      <td>${row.input || '-'}</td>
      <td>${row.output || '-'}</td>
      <td>1</td> <!-- Transaction Unit Force 1 -->
      <td>${row.date.split('T')[0]}</td>
    </tr>
    `).join('');


  if (typeof renderPaginationControls === 'function') {
    renderPaginationControls('usageTable', 'usagePagination');
  }

  document.getElementById('usageCount').textContent = usageData.length;

}

function getFilteredUsage() {
  let data = [...mockData.transactions]; // Source from transactions
  const searchInput = document.getElementById('usageSearch');

  if (searchInput && searchInput.value) {
    const term = searchInput.value.toLowerCase();
    data = data.filter(u =>
      u.company.toLowerCase().includes(term) ||
      u.product.toLowerCase().includes(term) ||
      (u.username && u.username.toLowerCase().includes(term))
    );
  }
  return data;
}

window.openUsageModal = function () {
  // Simple check to ensure Companies exist
  if (mockData.companies.length === 0) {
    showNotification('Please add companies first', 'warning');
    return;
  }

  // Create a modal on the fly or reuse one? We'll reuse 'createPricingModal' HTML structure but repurposed
  // actually, let's create a dynamic modal for this as it's a new requirement "Generate Usage Transaction"
  let modal = document.getElementById('usageTransactionModal');

  if (!modal) {
    const modalHTML = `
      <div id="usageTransactionModal" class="modal">
        <div class="modal-content">
          <span class="close-modal">&times;</span>
          <h2>Generate Usage Transaction</h2>
          <form id="usageTransactionForm">
            <div class="form-group">
              <label class="form-label">Company</label>
              <select class="form-select" name="company" required id="usageCompanySelect">
                  ${mockData.companies.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Product</label>
              <select class="form-select" name="product" required>
                <option value="Product A">Product A</option>
                <option value="Product B">Product B</option>
                <option value="Product C">Product C</option>
                <option value="Product D">Product D</option>
                <option value="Product E">Product E</option>
                <option value="Product F">Product F</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Input / Quantity</label>
              <input type="number" class="form-input" name="quantity" min="1" value="1" required>
            </div>
            <div class="form-group">
               <label class="form-label">Input Details (Optional)</label>
               <input type="text" class="form-input" name="input_details" placeholder="e.g. User ID, Ref">
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary close-usage-modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Generate</button>
            </div>
          </form>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    modal = document.getElementById('usageTransactionModal');

    // Attach listeners
    modal.querySelector('.close-modal').onclick = () => modal.classList.remove('show');
    modal.querySelector('.close-usage-modal').onclick = () => modal.classList.remove('show');

    const form = document.getElementById('usageTransactionForm');
    form.onsubmit = (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const company = formData.get('company');
      const product = formData.get('product');
      const qty = parseInt(formData.get('quantity'));
      const input = formData.get('input_details') || 'Manual Input';

      // 1. Add to Transactions
      const newTx = {
        id: mockData.transactions.length + 1,
        company: company,
        product: product,
        date: new Date().toISOString().split('T')[0], // Date only
        count: qty,
        input: input,
        output: 'Processed',
        username: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'System',
        firstName: currentUser ? currentUser.firstName : 'Sys',
        surname: currentUser ? currentUser.lastName : 'Admin'
      };

      mockData.transactions.push(newTx);
      saveToLocalStorage();

      showNotification('Usage Transaction Generated', 'success');
      modal.classList.remove('show');
      renderUsage(); // Refresh Usage Table

      // Also refresh Transactions if visible
      if (currentPage === 'transactions') renderTransactions();
    };
  } else {
    // Update options
    const select = document.getElementById('usageCompanySelect');
    if (select) select.innerHTML = mockData.companies.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
  }

  modal.classList.add('show');
};

function initUsageFilters() {
  const searchInput = document.getElementById('usageSearch');
  const entriesSelect = document.getElementById('entriesPerPage');

  if (searchInput) {
    searchInput.addEventListener('input', renderUsage);
  }

  if (entriesSelect) {
    entriesSelect.addEventListener('change', renderUsage);
  }
}

// ===================================
// PRICING
// ===================================

function renderPricing() {
  const tbody = document.getElementById('pricingTableBody');
  const searchInput = document.getElementById('pricingSearch');
  let pricing = getFilteredPricing();

  if (searchInput && searchInput.value) {
    const term = searchInput.value.toLowerCase();
    pricing = pricing.filter(p =>
      p.companyName.toLowerCase().includes(term) ||
      p.productName.toLowerCase().includes(term)
    );
  }

  tbody.innerHTML = pricing.map(p => `
    <tr>
      <td>${p.parentId}</td>
      <td>${p.parentName}</td>
      <td>${p.companyId}</td>
      <td>${p.companyName}</td>
      <td>${p.productName}</td>
      <td>${p.rangeFrom}</td>
      <td>${p.rangeTo}</td>
      <td>${p.price}</td>
      <td>${p.validFor}</td>
      <td>${p.status}</td>
    </tr>
    `).join('');

  document.getElementById('pricingCount').textContent = pricing.length;
}

function initPricingFilters() {
  const searchInput = document.getElementById('pricingSearch');
  if (searchInput) {
    searchInput.addEventListener('input', renderPricing);
  }
}

// ===================================
// PRICED TRANSACTIONS
// ===================================

function renderPricedTransactions() {
  const tbody = document.getElementById('pricedTransactionsTableBody');
  const productFilter = document.getElementById('pricedTransactionsProductFilter');
  let pricingData = [];

  // 1. Get all transactions, group by Company + Product
  const txMap = {};
  mockData.transactions.forEach(t => {
    const key = `${t.company}|${t.product}`;
    if (!txMap[key]) txMap[key] = 0;
    txMap[key] += (t.count || 1); // Aggregate counts
  });

  // 2. Iterate Pricing configs to determine matches and costs
  mockData.pricing.forEach(p => {
    const key = `${p.companyName}|${p.productName}`;
    const txCount = txMap[key] || 0;

    // Calculate total price based on tiers? 
    // Simplified: Just Unit Price * Count for now, unless range is strictly enforced.
    // Requirements say "Priced Transactions Table... not showing number of transactions".
    // We will show the aggregation.

    const totalPrice = txCount * p.price;

    pricingData.push({
      id: p.id || `P-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      parent: p.parent || '-',
      companyId: p.companyId || `C-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      company: p.companyName,
      product: p.productName,
      transactions: txCount,
      rangeFrom: p.rangeFrom,
      rangeTo: p.rangeTo,
      unitPrice: p.price,
      totalPrice: totalPrice,
      validFor: p.validFor
    });
  });

  // Filter
  if (productFilter && productFilter.value !== 'all') {
    pricingData = pricingData.filter(t => t.product.toLowerCase() === productFilter.value.toLowerCase());
  }

  if (pricingData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">No priced transactions found</td></tr>';
  } else {
    tbody.innerHTML = pricingData.map(t => `
        <tr>
          <td>${t.id || '-'}</td>
          <td>${t.parent || '-'}</td>
          <td>${t.companyId || '-'}</td>
          <td>${t.company}</td>
          <td>${t.product}</td>
          <td>${t.rangeFrom}</td>
          <td>${t.rangeTo}</td>
          <td>R${t.unitPrice.toFixed(2)}</td>
          <td>${t.validFor || 'Active'}</td>
          <td><span class="status-indicator status-active">Active</span></td>
        </tr>
        `).join('');
  }


  if (typeof renderPaginationControls === 'function') {
    renderPaginationControls('pricingTable', 'pricingPagination');
  }

  document.getElementById('pricedTransactionsCount').textContent = pricingData.length;

}

function initPricedTransactionsFilters() {
  const filter = document.getElementById('pricedTransactionsProductFilter');
  if (filter) {
    filter.addEventListener('change', renderPricedTransactions);
  }
}

// ===================================
// SETTINGS
// ===================================

function renderSettings() {
  // Handle three tabs: authorized, unauthorized, audit-logs
  if (currentSettingsTab === 'authorized') {
    const tbody = document.getElementById('usersTableBody');
    const authorizedUsers = mockData.users.filter(u => u.authorized);

    tbody.innerHTML = authorizedUsers.map(u => `
      <tr>
        <td>${u.firstName} ${u.lastName}</td>
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td>${u.userGroup || 'N/A'}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="editUser('${u.email}')">Edit</button>
        </td>
        <td>
          <input type="password" value="${u.password || 'admin123'}" class="password-input" data-user="${u.email}" onchange="updateUserPassword('${u.email}', this.value)" style="width: 120px; padding: 4px; border: 1px solid #e2e8f0; border-radius: 4px;">
        </td>
      </tr>
    `).join('');
  } else if (currentSettingsTab === 'unauthorized') {
    const tbody = document.getElementById('unauthorizedUsersTableBody');
    const unauthorizedUsers = mockData.users.filter(u => !u.authorized);

    if (unauthorizedUsers.length > 0) {
      tbody.innerHTML = unauthorizedUsers.map(u => `
        <tr>
          <td>${u.firstName} ${u.lastName}</td>
          <td>${u.email}</td>
          <td>${u.role}</td>
          <td>${u.userGroup || 'N/A'}</td>
          <td>
            <button class="btn btn-primary btn-sm" onclick="authorizeUser('${u.email}')">Authorize</button>
          </td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">No unauthorized users found</td></tr>';
    }
  } else if (currentSettingsTab === 'audit-logs') {
    renderAuditLogs();
  }
}

function initSettingsTabs() {
  const tabs = document.querySelectorAll('#settings-page .tab');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');

      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update active content
      document.querySelectorAll('#settings-page .tab-content').forEach(content => {
        content.classList.remove('active');
      });

      if (tabName === 'authorized') {
        document.getElementById('settings-authorized-content').classList.add('active');
      } else if (tabName === 'unauthorized') {
        document.getElementById('settings-unauthorized-content').classList.add('active');
      } else if (tabName === 'audit-logs') {
        document.getElementById('settings-audit-content').classList.add('active');
      }

      currentSettingsTab = tabName;
      renderSettings();
    });
  });
}

function updateUserPassword(email, newPassword) {
  const user = mockData.users.find(u => u.email === email);
  if (user) {
    user.password = newPassword;
    showNotification('Password updated successfully', 'success');
    logAction('Update', `Updated password for ${email}`);
  }
}

function editUser(email) {
  showNotification('Edit user functionality - coming soon', 'info');
}

// ===================================
// CSV EXPORT
// ===================================

function initCSVExport() {
  const exportBtn = document.querySelector('.pagination-info .btn-primary');

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const transactions = getFilteredTransactions();
      const csv = convertToCSV(transactions);
      downloadCSV(csv, 'transactions.csv');
    });
  }
}

function convertToCSV(data) {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add headers
  csvRows.push(headers.join(','));

  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      return `"${value}"`;
    });
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ===================================
// MANUAL BILLING
// ===================================

function renderManualBilling() {
  const tbody = document.getElementById('manualBillingTableBody');
  let dataToRender = mockData.manualBilling;

  if (typeof getPaginatedData === 'function') {
    dataToRender = getPaginatedData(dataToRender, 'manualBillingTable');
  }

  tbody.innerHTML = dataToRender.map(item => `
    <tr>
      <td>${item.id}</td>
      <td>${item.company}</td>
      <td><span class="truncate-text" title="${item.description}">${item.description}</span></td>
      <td>R${item.amount.toFixed(2)}</td>
      <td>${item.date}</td>
      <td><span class="badge ${item.status === 'Approved' ? 'badge-success' : item.status === 'Pending' ? 'badge-warning' : 'badge-danger'}">${item.status}</span></td>
      <td>${item.createdBy || '-'}</td>
      <td>${item.authorizedBy || '-'}</td>
      <td>${item.authorizedDate || '-'}</td>
    </tr>
    `).join('');

  if (typeof renderPaginationControls === 'function') {
    renderPaginationControls('manualBillingTable', 'manualBillingPagination');
  }
}

// Expose renderManualBilling globally
window.renderManualBilling = renderManualBilling;

function initManualBilling() {
  const modal = document.getElementById('manualBillingModal');
  const createBtn = document.getElementById('createBillingBtn');
  const importBtn = document.getElementById('importBillingBtn');
  const close = modal.querySelector('.close-modal');
  const cancel = document.getElementById('cancelManualBilling');
  const form = document.getElementById('manualBillingForm');
  const companySelect = document.getElementById('manualBillingCompanySelect');

  createBtn.onclick = () => {
    modal.classList.add('show');
    form.reset();
    // Populate companies
    companySelect.innerHTML = mockData.companies.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
  };

  importBtn.onclick = () => {
    alert('Import functionality would open a file picker here.');
  };

  const closeModal = () => modal.classList.remove('show');
  close.onclick = closeModal;
  cancel.onclick = closeModal;

  window.onclick = (e) => {
    if (e.target === modal) closeModal();
  };

  form.onsubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    const newBilling = {
      id: `MB${String(mockData.manualBilling.length + 1).padStart(3, '0')} `,
      company: formData.get('company'),
      description: formData.get('description'),
      amount: parseFloat(formData.get('amount')),
      date: formData.get('date'),
      status: 'Pending',
      createdBy: currentUser.firstName + ' ' + currentUser.lastName,
    };

    mockData.manualBilling.push(newBilling);
    saveToLocalStorage();
    renderManualBilling();
    closeModal();

    showNotification('Manual billing entry created successfully!', 'success');
  };
}

// ===================================
// BATCH LOGGER
// ===================================

// Batch Logger with Company Select
function initBatchLogger() {
  const modal = document.getElementById('batchLoggerModal');
  const select = document.getElementById('batchCompanySelect');
  const createBtn = document.getElementById('createBatchBtn');
  const form = document.getElementById('batchLoggerForm');
  const cancelBtn = document.getElementById('cancelBatchLogger');
  const closeBtn = modal ? modal.querySelector('.close-modal') : null;

  // Populate Select
  if (select) {
    select.innerHTML = '<option value="">Select Company...</option>' +
      mockData.companies.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
  }

  // Open Modal
  if (createBtn && modal) {
    createBtn.onclick = () => {
      modal.classList.add('show');
      if (form) form.reset();
      // Set default date
      const dateInput = form.querySelector('[name="date"]');
      if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    };
  }

  // Handle Submit
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const formData = new FormData(form);

      const newBatch = {
        id: `B-${String(mockData.batches.length + 1).padStart(3, '0')}`,
        company: formData.get('company'),
        product: formData.get('product') || 'Product A', // Capture product
        description: formData.get('description'),
        records: parseInt(formData.get('records')),
        date: formData.get('date'),
        status: 'Processing',
        authorized: false, // Requires approval
        createdBy: currentUser.firstName + ' ' + currentUser.lastName
      };

      mockData.batches.push(newBatch);
      saveToLocalStorage();

      showNotification('Batch created. Waiting for authorization.', 'info');
      if (modal) modal.classList.remove('show');

      // Refresh lists? 
      if (window.renderAuthorizations) window.renderAuthorizations(); // Extension
    };
  }

  // Close Logic
  const closeModal = () => modal.classList.remove('show');
  if (cancelBtn) cancelBtn.onclick = closeModal;
  if (closeBtn) closeBtn.onclick = closeModal;

  window.onclick = (e) => {
    if (e.target === modal) closeModal();
  };

  // Form Submit
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const companyName = select.value;
      const description = formData.get('description');
      const date = formData.get('date');

      if (!companyName) {
        showNotification('Please select a company', 'warning');
        return;
      }

      const newBatch = {
        id: `B${String(mockData.batches.length + 1).padStart(3, '0')}`,
        date: date,
        description: description,
        company: companyName, // Added company field
        status: 'Pending',
        records: Math.floor(Math.random() * 50) + 1,
        createdBy: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'System'
      };

      mockData.batches.push(newBatch);
      saveToLocalStorage();
      renderBatchLogger();
      showNotification('Batch Logged Successfully', 'success');
      closeModal();
    };
  }

  // Search Button (Filter)
  window.filterBatchCompanies = function () {
    const searchInput = document.querySelector('.search-input'); // Assuming there's a search input near the button
    // Or if this refers to the search input on the page
    if (initBatchLogger.searchInput) {
      // logic
    }
    // For now, no-op or specific implementation
  };
}

function renderBatchLogger() {
  const tbody = document.getElementById('batchTableBody');
  let dataToRender = mockData.batches;

  if (typeof getPaginatedData === 'function') {
    dataToRender = getPaginatedData(dataToRender, 'batchTable');
  }

  tbody.innerHTML = dataToRender.map(batch => `
    <tr>
      <td>${batch.id}</td>
      <td>${batch.date}</td>
      <td><span class="truncate-text" title="${batch.description}">${batch.description}</span></td>
      <td><span class="badge ${batch.status === 'Processed' ? 'badge-success' : 'badge-warning'}">${batch.status}</span></td>
      <td>${batch.records}</td>
      <td>${batch.createdBy || '-'}</td>
      <td>${batch.authorizedBy || '-'}</td>
      <td>${batch.authorizedDate || '-'}</td>
    </tr>
    `).join('');

  if (typeof renderPaginationControls === 'function') {
    renderPaginationControls('batchTable', 'batchPagination');
  }
}

// ===================================
// LEADS MANAGEMENT
// ===================================

function initLeads() {
  const modal = document.getElementById('createLeadModal');
  const btn = document.getElementById('createLeadBtn');
  const close = modal ? modal.querySelector('.close-modal') : null;
  const cancel = document.getElementById('cancelCreateLead');
  const form = document.getElementById('createLeadForm');
  const searchInput = document.getElementById('leadsSearch');

  renderLeads();

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = mockData.leads.filter(l =>
        l.firstName.toLowerCase().includes(term) ||
        l.lastName.toLowerCase().includes(term) ||
        l.company.toLowerCase().includes(term)
      );
      renderLeads(filtered);
    });
  }

  const submitBtn = document.getElementById('submitLeadBtn');

  if (!modal || !btn || !form || !submitBtn) return;

  btn.onclick = () => {
    // Reset form
    form.reset();
    document.getElementById('modalTitle').textContent = 'Add New Lead';
    submitBtn.textContent = 'Add Lead';
    delete form.dataset.editingId;

    modal.classList.add('show');
  };

  const closeModal = () => {
    const m = document.getElementById('createLeadModal');
    if (m) m.classList.remove('show');
  };
  if (close) close.onclick = closeModal;
  if (cancel) cancel.onclick = closeModal;

  window.onclick = (e) => {
    if (e.target === modal) closeModal();
  };

  submitBtn.onclick = () => {
    // Basic validation
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    try {

      const formData = new FormData(form);
      const editingId = form.dataset.editingId;

      if (editingId) {
        // Update existing lead
        const lead = mockData.leads.find(l => l.id === parseInt(editingId));
        if (lead) {
          lead.firstName = formData.get('firstName');
          lead.lastName = formData.get('lastName');
          lead.email = formData.get('email');
          lead.phone = formData.get('phone');
          lead.company = formData.get('company');
          lead.source = formData.get('source');
          // Status remains or could be editable

          showNotification('Lead updated successfully!', 'success');
        }
      } else {
        // Create new lead
        const newLead = {
          id: mockData.leads.length + 1,
          firstName: formData.get('firstName'),
          lastName: formData.get('lastName'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          company: formData.get('company'),
          status: 'New',
          source: formData.get('source'),
          dateAdded: new Date().toISOString().split('T')[0]
        };
        mockData.leads.push(newLead);
        saveToLocalStorage();
        showNotification('Lead added successfully!', 'success');
      }

      renderLeads();
      closeModal();
    } catch (error) {
      console.error('Leads submit error:', error);
      alert('Error saving lead: ' + error.message);
    }
  };
}

function renderLeads(leads = getFilteredLeads()) {
  const tbody = document.getElementById('leadsTableBody');
  if (!tbody) return;

  if (leads.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center">No leads found</td></tr>';
    return;
  }

  tbody.innerHTML = leads.map(lead => `
    <tr>
      <td>${lead.firstName} ${lead.lastName}</td>
      <td>${lead.company}</td>
      <td>${lead.email}</td>
      <td>${lead.phone || '-'}</td>
      <td><span class="badge badge-${getLeadStatusColor(lead.status)}">${lead.status}</span></td>
      <td>${lead.source}</td>
      <td>${lead.dateAdded}</td>
      <td>
        <select class="form-select form-select-sm" onchange="handleLeadAction(this, ${lead.id})" style="width: auto; padding: 2px 5px;">
          <option value="" disabled selected>Actions</option>
          <option value="convert">Convert to Company</option>
          <option value="edit">Edit Lead</option>
          <option value="delete">Delete Lead</option>
        </select>
      </td>
    </tr>
  `).join('');
}

window.handleLeadAction = function (select, leadId) {
  const action = select.value;
  select.value = ""; // Reset selection

  if (action === 'convert') {
    openConversionModal(leadId);
  } else if (action === 'edit') {
    const lead = mockData.leads.find(l => l.id === leadId);
    if (lead) {
      const modal = document.getElementById('createLeadModal');
      const form = document.getElementById('createLeadForm');

      // Populate form
      form.elements['firstName'].value = lead.firstName;
      form.elements['lastName'].value = lead.lastName;
      form.elements['email'].value = lead.email;
      form.elements['phone'].value = lead.phone;
      form.elements['company'].value = lead.company;
      form.elements['source'].value = lead.source;

      // Set editing mode
      form.dataset.editingId = leadId;
      document.getElementById('modalTitle').textContent = 'Edit Lead';
      document.getElementById('submitLeadBtn').textContent = 'Update Lead';

      modal.classList.add('show');
    }
  } else if (action === 'delete') {
    if (window.showConfirmModal) {
      window.showConfirmModal('Delete Lead', 'Are you sure you want to delete this lead?', () => {
        const idx = mockData.leads.findIndex(l => l.id === leadId);
        if (idx !== -1) {
          mockData.leads.splice(idx, 1);
          renderLeads();
          showNotification('Lead deleted', 'success');
        }
      });
    } else {
      if (confirm('Are you sure you want to delete this lead?')) {
        const idx = mockData.leads.findIndex(l => l.id === leadId);
        if (idx !== -1) {
          mockData.leads.splice(idx, 1);
          renderLeads();
          showNotification('Lead deleted', 'success');
        }
      }
    }
  }
};

function getLeadStatusColor(status) {
  switch (status) {
    case 'New': return 'primary';
    case 'Contacted': return 'warning';
    case 'Qualified': return 'success';
    case 'Proposal': return 'info';
    case 'Negotiation': return 'secondary';
    default: return 'gray';
  }
}


window.openConversionModal = function (leadId) {
  const modal = document.getElementById('conversionModal');
  if (modal) {
    modal.classList.add('show');
    const confirmBtn = document.getElementById('confirmConversionBtn');
    // Clone to remove old listeners
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);

    newBtn.onclick = () => {
      convertLeadToCompany(leadId);
      closeConversionModal();
    };
  }
};

window.closeConversionModal = function () {
  const modal = document.getElementById('conversionModal');
  if (modal) modal.classList.remove('show');
};

window.convertLeadToCompany = function (leadId) {
  // if (!confirm('Are you sure...')) return; // Removed native confirm


  try {
    const leadIndex = mockData.leads.findIndex(l => l.id === leadId);
    if (leadIndex === -1) {
      console.error('Lead not found');
      return;
    }

    const lead = mockData.leads[leadIndex];

    // Check for duplicates
    const exists = mockData.companies.some(c => c.name.toLowerCase() === lead.company.toLowerCase());
    if (exists) {
      showNotification('Company already exists!', 'error');
      return;
    }

    // Create new company
    const newCompany = {
      id: mockData.companies.length + 1,
      name: lead.company,
      type: 'Child', // Default
      parentId: null,
      contact: `${lead.firstName} ${lead.lastName}`,
      email: lead.email,
      phone: lead.phone,
      address: 'Address Pending',
      active: true,
      registrationNumber: '',
      taxId: '',
      industry: 'Unknown',
      foundedDate: new Date().toISOString().split('T')[0]
    };

    mockData.companies.push(newCompany);

    // Update lead status (do NOT remove)
    lead.status = 'Converted';

    // Persist changes
    saveToLocalStorage();

    renderLeads();
    renderCompanies();

    showNotification(`Lead converted to company: ${lead.company}`, 'success');

    // Optional: Auto-navigate or stay? User Plan says "Confirm... Appears under Companies tab".
    // I will stay on leads to let user verify status, or navigate?
    // User Step 4 says "Confirm the converted Company... Appears under the Companies tab".
    // I'll leave navigation in.
    navigateToPage('companies');

  } catch (error) {
    console.error('Conversion error:', error);
    alert('Error converting lead: ' + error.message);
  }
};

// Duplicate initBatchLogger removed. The active one is defined earlier with company selection.

// ===================================
// INVOICES & STATEMENTS
// ===================================

function initPricingModal() {
  const modal = document.getElementById('createPricingModal');
  const btn = document.getElementById('addPricingBtn');
  const close = modal ? modal.querySelector('.close-modal') : null;
  const cancel = document.getElementById('cancelCreatePricing');
  const form = document.getElementById('createPricingForm');
  const companySelect = document.getElementById('pricingCompanySelect');

  // Req 6: Fix Add Pricing Button
  window.openPricingModal = function () {
    if (modal) {
      modal.classList.add('show');
      if (form) form.reset();
      if (companySelect) {
        companySelect.innerHTML = mockData.companies
          .map(c => `<option value="${c.id}">${c.name}</option>`)
          .join('');
      }
    } else {
      console.error("Pricing Modal not found");
    }
  };

  if (btn) {
    btn.onclick = (e) => {
      e.preventDefault();
      window.openPricingModal();
    };
    // Removing any previous listeners by cloning (optional but safer)
    // const newBtn = btn.cloneNode(true);
    // btn.parentNode.replaceChild(newBtn, btn);
    // newBtn.onclick = ... 
    // But simple onclick assignment overrides previous onclick assignments.
  }

  if (close) close.onclick = () => modal.classList.remove('show');
  if (cancel) cancel.onclick = () => modal.classList.remove('show');

  window.onclick = (e) => {
    if (e.target === modal) modal.classList.remove('show');
  };

  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const companyId = parseInt(formData.get('companyId'));
      const company = mockData.companies.find(c => c.id === companyId);

      if (company) {
        const newPricing = {
          id: mockData.pricing.length + 1,
          parentId: company.parentId || '-',
          companyId: `C-${String(company.id).padStart(3, '0')}`,
          companyName: company.name,
          productName: formData.get('product'),
          rangeFrom: 1, // Default
          rangeTo: 9999, // Default
          price: parseFloat(formData.get('price')),
          validFrom: formData.get('validFrom') || new Date().toISOString().split('T')[0],
          status: 'Active'
        };

        mockData.pricing.push(newPricing);
        saveToLocalStorage();
        renderPricing();
        modal.classList.remove('show');
        showNotification('Pricing added successfully!', 'success');
      }
    };
  }
}

// Standardization Helper
function standardizeData() {
  const products = ['Product A', 'Product B', 'Product C', 'Product D', 'Product E', 'Product F'];
  let changed = false;

  mockData.transactions.forEach(t => {
    if (!products.includes(t.product)) {
      // Map random old products to new ones deterministically or random
      const random = products[Math.floor(Math.random() * products.length)];
      t.product = random;
      changed = true;
    }
  });

  if (changed) saveToLocalStorage();
}

function initInvoiceModal() {
  const modal = document.getElementById('invoiceModal');
  const close = document.getElementById('closeInvoiceModal');
  const closeX = modal.querySelector('.close-modal');

  const closeModal = () => modal.classList.remove('show');
  close.onclick = closeModal;
  closeX.onclick = closeModal;

  window.onclick = (e) => {
    if (e.target === modal) closeModal();
  };

  // Delegate click for "View" buttons in invoices table
  document.getElementById('invoicesTableBody').addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-primary') && e.target.textContent === 'View') {
      const row = e.target.closest('tr');
      const company = row.cells[0].textContent;
      document.getElementById('invoiceModalTitle').textContent = `Invoice Details - ${company} `;
      modal.classList.add('show');
    }
  });
}

function initStatementModal() {
  const modal = document.getElementById('statementModal');
  const close = document.getElementById('closeStatementModal');
  const closeX = modal.querySelector('.close-modal');
  const generateBtn = document.getElementById('generateStatementBtn');

  // Add "View Statement" button logic to Reports page
  // Note: The original design didn't have a specific "View Statement" button,
  // but the requirement implies one. We'll assume the "Statements" tab might have one,
  // or we can add a button to the header if needed.
  // For now, let's assume clicking the "Statements" tab *might* trigger this or show a list where we can view.
  // However, the requirement says "When i click on view statement".
  // Let's add a listener to the tabs, if "Statements" is clicked, maybe we show a list with "View" buttons?
  // Or let's just add a global "View Statement" button for demonstration if needed,
  // but better yet, let's update the `renderInvoices` to show "View Statement" when on Statements tab.

  const closeModal = () => modal.classList.remove('show');
  close.onclick = closeModal;
  closeX.onclick = closeModal;

  generateBtn.onclick = () => {
    const period = document.querySelector('input[name="statementPeriod"]:checked').value;
    alert(`Generating statement for period: ${period} `);
    closeModal();
  };

  window.onclick = (e) => {
    if (e.target === modal) closeModal();
  };
}

// Update renderInvoices to handle Statements tab view
const originalRenderInvoices = renderInvoices;
renderInvoices = function () {
  if (currentTab === 'statements') {
    const tbody = document.getElementById('invoicesTableBody');
    // Show statements view (simplified for now, reusing invoice data structure but with "View Statement" button)
    // In a real app, statements might be different entities.
    const companies = mockData.companies;

    tbody.innerHTML = companies.map(c => `
    <tr>
        <td><a href="#" class="table-link">${c.name}</a></td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td><span class="badge badge-success">Active</span></td>
        <td><button class="btn btn-primary view-statement-btn" data-company="${c.name}">View Statement</button></td>
        <td>-</td>
      </tr>
    `).join('');

    // Add listeners for new buttons
    document.querySelectorAll('.view-statement-btn').forEach(btn => {
      btn.onclick = () => {
        document.getElementById('statementModal').classList.add('show');
      };
    });
  } else {
    originalRenderInvoices();
  }
};

// ===================================
// EDIT USER
// ===================================

function initEditUserModal() {
  const modal = document.getElementById('editUserModal');
  const close = modal.querySelector('.close-modal');
  const cancel = document.getElementById('cancelEditUser');
  const form = document.getElementById('editUserForm');
  const passwordInput = document.getElementById('editUserPassword');
  const passwordHelp = document.getElementById('passwordHelpText');

  // Mock current logged in user (Admin)
  const currentUser = mockData.users.find(u => u.role === 'Admin');

  const closeModal = () => modal.classList.remove('show');
  close.onclick = closeModal;
  cancel.onclick = closeModal;

  window.onclick = (e) => {
    if (e.target === modal) closeModal();
  };

  // Delegate click for "Edit" buttons in users table
  document.getElementById('usersTableBody').addEventListener('click', (e) => {
    if (e.target.textContent === 'Edit') {
      const row = e.target.closest('tr');
      const email = row.cells[2].textContent;
      const user = mockData.users.find(u => u.email === email);

      if (user) {
        form.elements['originalEmail'].value = user.email;
        form.elements['firstName'].value = user.firstName;
        form.elements['lastName'].value = user.lastName;
        form.elements['email'].value = user.email;
        form.elements['role'].value = user.role;

        // Check admin role for password field
        if (currentUser.role === 'Admin') {
          passwordInput.disabled = false;
          passwordInput.placeholder = "Leave blank to keep unchanged";
          passwordHelp.style.display = 'none';
        } else {
          passwordInput.disabled = true;
          passwordInput.placeholder = "Only admins can change passwords";
          passwordHelp.style.display = 'block';
        }

        modal.classList.add('show');
      }
    }
  });

  form.onsubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const originalEmail = formData.get('originalEmail');
    const userIndex = mockData.users.findIndex(u => u.email === originalEmail);

    if (userIndex !== -1) {
      mockData.users[userIndex].firstName = formData.get('firstName');
      mockData.users[userIndex].lastName = formData.get('lastName');
      mockData.users[userIndex].email = formData.get('email');
      mockData.users[userIndex].role = formData.get('role');

      const newPass = formData.get('password');
      if (newPass && currentUser.role === 'Admin') {
        mockData.users[userIndex].password = '••••••••'; // In real app, hash it
      }

      renderSettings();
      closeModal();

      showNotification('User updated successfully!', 'success');
    }
  };
}

function togglePasswordVisibility(id) {
  const input = document.getElementById(id);
  input.type = input.type === 'password' ? 'text' : 'password';
}

// ===================================
// COMPANY DETAILS
// ===================================

function initCompanyDetails() {
  const companiesList = document.getElementById('companies-list-view');
  const detailsView = document.getElementById('company-details-view');
  const backBtn = document.getElementById('backToCompaniesBtn');
  const title = document.getElementById('companyDetailsTitle');
  const usersTab = document.getElementById('company-users-tab');
  const infoTab = document.getElementById('company-info-tab');
  const usersTableBody = document.getElementById('companyUsersTableBody');
  const companyInfoDisplay = document.getElementById('companyInfoDisplay');
  const editCompanyBtn = document.getElementById('editCompanyBtn');
  const companyEditForm = document.getElementById('companyEditForm');
  const cancelEditBtn = document.getElementById('cancelEditCompany');

  let currentCompany = null;

  // Tab switching - fixed to handle 'details' tab
  detailsView.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');

      // Update tab buttons
      detailsView.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update tab content
      if (tabName === 'users') {
        usersTab.classList.add('active');
        infoTab.classList.remove('active');
        document.getElementById('company-activities-tab').classList.remove('active');
      } else if (tabName === 'details') {
        usersTab.classList.remove('active');
        infoTab.classList.add('active');
        document.getElementById('company-activities-tab').classList.remove('active');
      } else if (tabName === 'activities') {
        usersTab.classList.remove('active');
        infoTab.classList.remove('active');
        document.getElementById('company-activities-tab').classList.add('active');
        renderCompanyActivities(currentCompany.id);
      }
    });
  });

  // Delegate click for company names in list
  document.getElementById('companiesTableBody').addEventListener('click', (e) => {
    if (e.target.classList.contains('table-link')) {
      e.preventDefault();
      const companyName = e.target.textContent;
      const company = mockData.companies.find(c => c.name === companyName);

      if (company) {
        showDetails(company);
      }
    }
  });

  // Back button - fixed to properly return to companies list
  if (backBtn) {
    backBtn.onclick = (e) => {
      e.preventDefault();
      detailsView.classList.add('hidden');
      companiesList.classList.remove('hidden');
      // Reset to users tab
      const firstTab = detailsView.querySelector('.tab[data-tab="users"]');
      if (firstTab) {
        firstTab.click();
      }
    };
  }
  // Fix for saveCompanyDetails() error - add this to app.js
  function saveCompanyDetails() {
    console.log('saveCompanyDetails function called');

    // Get the form data
    const form = document.getElementById('company-edit-form') ||
      document.querySelector('form[name="companyForm"]') ||
      document.querySelector('form');

    if (!form) {
      console.error('No form found for company details');
      alert('Cannot find company form');
      return false;
    }

    // Collect form data
    const formData = new FormData(form);
    const companyData = {};

    for (let [key, value] of formData.entries()) {
      companyData[key] = value;
    }

    // Basic validation
    if (!companyData.companyName && !companyData.name) {
      alert('Company name is required');
      return false;
    }

    // Save to localStorage
    try {
      localStorage.setItem('currentCompany', JSON.stringify(companyData));
      console.log('Company data saved:', companyData);

      // Show success message
      showNotification('Company details saved successfully!', 'success');

      // Close modal if exists
      const modal = document.querySelector('.modal');
      if (modal) modal.style.display = 'none';

      return true;
    } catch (error) {
      console.error('Error saving company:', error);
      alert('Failed to save company details');
      return false;
    }
  }

  // Helper function for notifications
  function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4CAF50' : '#2196F3'};
        color: white;
        border-radius: 4px;
        z-index: 1000;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => notification.remove(), 3000);
  }
  // Edit company button
  editCompanyBtn.addEventListener('click', () => {
    if (currentCompany) {
      enableEditMode(currentCompany);
    }
  });

  // Cancel edit
  cancelEditBtn.addEventListener('click', () => {
    disableEditMode();
  });

  // Save company changes
  companyEditForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveCompanyChanges();
  });
  // Add this to app.js if the C function was handling company edits
  function saveCompanyDetails() {
    const companyData = {
      name: document.getElementById('company-name')?.value || '',
      address: document.getElementById('company-address')?.value || '',
      phone: document.getElementById('company-phone')?.value || '',
      email: document.getElementById('company-email')?.value || ''
    };
    // Add this function to your app.js file
    function saveCompanyDetails() {
      console.log('Save Company Details function called');

      // Get form values
      const companyData = {
        name: document.getElementById('company-name')?.value || '',
        address: document.getElementById('company-address')?.value || '',
        phone: document.getElementById('company-phone')?.value || '',
        email: document.getElementById('company-email')?.value || '',
        taxId: document.getElementById('company-tax-id')?.value || ''
      };

      // Validate
      if (!companyData.name.trim()) {
        alert('Company name is required!');
        return false;
      }

      // Save to localStorage (or send to server)
      try {
        localStorage.setItem('companyDetails', JSON.stringify(companyData));
        alert('Company details saved successfully!');

        // Update the display if needed
        updateCompanyDisplay(companyData);

        return true;
      } catch (error) {
        console.error('Error saving company details:', error);
        alert('Failed to save company details. Please try again.');
        return false;
      }
    }

    // Optional: Helper function to update the display
    function updateCompanyDisplay(data) {
      // Update any displayed company info on the page
      const elements = {
        'display-company-name': data.name,
        'display-company-address': data.address,
        'display-company-phone': data.phone
      };

      for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
      }
    }

    // Save to localStorage or send to server
    localStorage.setItem('companyDetails', JSON.stringify(companyData));
    alert('Company details saved successfully!');
    return false; // Prevent default form submission if needed
  }
  function showDetails(company) {
    currentCompany = company;
    title.textContent = company.name;

    // Get assigned users
    const assignedUsers = mockData.companyUsers.filter(u => u.companyId === company.id);

    // Get users from transactions for this company (NEW: Consistency fix)
    const transactionUsers = [];
    if (mockData.transactions) {
      const companyTransactions = mockData.transactions.filter(t =>
        t.company === company.name || t.companyId === company.id
      );

      companyTransactions.forEach(t => {
        // Create consistent user object
        const username = t.username || `${t.firstName || 'user'}.${t.surname || 'user'}`.toLowerCase();
        const firstName = t.firstName || t.user?.split(' ')[0] || 'Unknown';
        const surname = t.surname || t.lastName || t.user?.split(' ')[1] || '';

        // Check if not already in list
        if (!assignedUsers.find(u => u.username === username) &&
          !transactionUsers.find(u => u.username === username)) {
          transactionUsers.push({
            username: username,
            firstName: firstName,
            surname: surname,
            position: 'Transaction User',
            lastLogin: t.date || 'N/A',
            password: '***',
            companyId: company.id
          });
        }
      });
    }

    const allUsers = [...assignedUsers, ...transactionUsers];

    if (allUsers.length > 0) {
      usersTableBody.innerHTML = allUsers.map(u => `
        <tr>
          <td>${u.username}</td>
          <td>${u.firstName}</td>
          <td>${u.surname}</td>
          <td>${u.position || 'User'}</td>
          <td>${u.lastLogin}</td>
          <td>${u.password}</td>
        </tr>
      `).join('');
    } else {
      usersTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No users found</td></tr>';
    }

    // Show company info
    renderCompanyInfo(company);

    // Show details view
    companiesList.classList.add('hidden');
    detailsView.classList.remove('hidden');
  }

  function renderCompanyInfo(company) {
    companyInfoDisplay.innerHTML = `
    <div class="info-item">
        <span class="info-label">Company Name</span>
        <span class="info-value">${company.name}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Type</span>
        <span class="info-value">${company.type}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Contact Person</span>
        <span class="info-value">${company.contact}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Email</span>
        <span class="info-value">${company.email}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Phone</span>
        <span class="info-value">${company.phone || 'N/A'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Registration Number</span>
        <span class="info-value">${company.registrationNumber || 'N/A'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Tax ID</span>
        <span class="info-value">${company.taxId || 'N/A'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Industry</span>
        <span class="info-value">${company.industry || 'N/A'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Address</span>
        <span class="info-value">${company.address}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Founded Date</span>
        <span class="info-value">${company.foundedDate || 'N/A'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Status</span>
        <span class="info-value">
          <span class="badge ${company.active ? 'badge-success' : 'badge-danger'}">
            ${company.active ? 'Active' : 'Inactive'}
          </span>
        </span>
      </div>
  `;
  }

  function enableEditMode(company) {
    // Populate form
    document.getElementById('editCompanyId').value = company.id;
    document.getElementById('editCompanyName').value = company.name;
    document.getElementById('editCompanyContact').value = company.contact;
    document.getElementById('editCompanyEmail').value = company.email;
    document.getElementById('editCompanyPhone').value = company.phone || '';
    document.getElementById('editCompanyRegNumber').value = company.registrationNumber || '';
    document.getElementById('editCompanyTaxId').value = company.taxId || '';
    document.getElementById('editCompanyIndustry').value = company.industry || '';
    document.getElementById('editCompanyFounded').value = company.foundedDate || '';
    document.getElementById('editCompanyAddress').value = company.address;
    document.getElementById('editCompanyStatus').value = (company.active !== undefined ? company.active : true).toString();

    // Show form, hide display
    companyInfoDisplay.classList.add('hidden');
    companyEditForm.classList.remove('hidden');
    editCompanyBtn.classList.add('hidden');
  }

  function disableEditMode() {
    companyInfoDisplay.classList.remove('hidden');
    companyEditForm.classList.add('hidden');
    editCompanyBtn.classList.remove('hidden');
  }
  // Add this code to fix the company edit save button
  document.addEventListener('DOMContentLoaded', function () {
    const saveCompanyBtn = document.getElementById('save-company-btn');

    if (saveCompanyBtn) {
      // Remove any existing event listeners first
      const newSaveBtn = saveCompanyBtn.cloneNode(true);
      saveCompanyBtn.parentNode.replaceChild(newSaveBtn, saveCompanyBtn);

      // Add fresh event listener
      document.getElementById('save-company-btn').addEventListener('click', function (e) {
        e.preventDefault();

        // Get form data
        const companyData = {
          name: document.getElementById('company-name')?.value || '',
          address: document.getElementById('company-address')?.value || '',
          phone: document.getElementById('company-phone')?.value || '',
          email: document.getElementById('company-email')?.value || '',
          taxId: document.getElementById('company-tax-id')?.value || ''
        };

        // Validate data
        if (!companyData.name.trim()) {
          alert('Company name is required');
          return;
        }

        // Save to localStorage or send to server
        try {
          localStorage.setItem('companyDetails', JSON.stringify(companyData));

          // Show success message
          alert('Company details saved successfully!');

          // Optionally update UI
          updateCompanyDisplay(companyData);

        } catch (error) {
          console.error('Save failed:', error);
          alert('Failed to save company details');
        }
      });
    }
  });

  function updateCompanyDisplay(data) {
    // Update any displayed company info on the page
    const displayElements = {
      'company-name-display': data.name,
      'company-address-display': data.address,
      'company-phone-display': data.phone
    };

    for (const [id, value] of Object.entries(displayElements)) {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    }
  }
  function saveCompanyChanges() {
    const companyId = parseInt(document.getElementById('editCompanyId').value);
    const company = mockData.companies.find(c => c.id === companyId);

    if (company) {
      company.name = document.getElementById('editCompanyName').value;
      company.contact = document.getElementById('editCompanyContact').value;
      company.email = document.getElementById('editCompanyEmail').value;
      company.phone = document.getElementById('editCompanyPhone').value;
      company.registrationNumber = document.getElementById('editCompanyRegNumber').value;
      company.taxId = document.getElementById('editCompanyTaxId').value;
      company.industry = document.getElementById('editCompanyIndustry').value;
      company.foundedDate = document.getElementById('editCompanyFounded').value;
      company.address = document.getElementById('editCompanyAddress').value;
      company.active = document.getElementById('editCompanyStatus').value === 'true';

      currentCompany = company;
      title.textContent = company.name;
      renderCompanyInfo(company);
      disableEditMode();
      renderCompanies(); // Update companies list

      showNotification(`Company "${company.name}" updated successfully!`, 'success');
    }
  }
}


// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', async () => {
  // Load application data (Simulated File Store)
  if (typeof showLoader === 'function') showLoader();
  await loadData();
  if (typeof hideLoader === 'function') hideLoader();

  // Refresh badges after load
  if (typeof updateAuthBadge === 'function') updateAuthBadge();
  if (typeof updateWaitingRoomBadge === 'function') updateWaitingRoomBadge();

  // Check authentication first
  if (!checkAuth()) {
    return; // Will redirect to login
  }

  // Initialize navigation
  initNavigation();

  // Initialize filters
  initTransactionFilters();
  initUsageFilters();
  initPricingFilters();
  initPricedTransactionsFilters();

  // Initialize tabs
  initReportTabs();
  initSettingsTabs();

  // Initialize table sorting
  initTableSorting();

  // Initialize CSV export
  initCSVExport();

  // Initialize Modals & New Features
  initCompanyModal();
  initLeads();
  initActivitiesPage();
  initLogActivity();
  initSupport();
  initMarketing();
  initRunBilling();
  initManualBilling();
  initBatchLogger();
  initPricingModal();
  initInvoiceModal();
  initStatementModal();
  initEditUserModal();
  initCompanyDetails();

  // Initialize Professional Features (Phase 4)
  initUserProfileDropdown();

  // Load initial page
  changePage('dashboard');

  // Show welcome notification
  if (currentUser) {
    showNotification(`Welcome back, ${currentUser.firstName}!`, 'success');
  }
}); // Close DOMContentLoaded

// ===================================
// EXTENSIONS & NEW FEATURES
// ===================================

// ===================================
// AUTHORIZATIONS
// ===================================

function renderAuthorizations() {
  const manualTab = document.getElementById('auth-manual-billing-tab');
  const batchesTab = document.getElementById('auth-batches-tab');
  const rejectedTab = document.getElementById('auth-rejected-tab');

  // Determine active tab
  let activeTab = 'manual-billing';
  if (batchesTab && batchesTab.classList.contains('active')) activeTab = 'batches';
  if (rejectedTab && rejectedTab.classList.contains('active')) activeTab = 'rejected';

  // Render Manual Billing Authorization - FIXED filter logic
  const mbTbody = document.getElementById('authManualBillingTableBody');
  const pendingBilling = mockData.manualBilling.filter(mb =>
    !mb.authorized && mb.status === 'Pending'
  );

  // Render Batches Authorization - FIXED filter logic  
  const batchesTbody = document.getElementById('authBatchesTableBody');
  const pendingBatches = mockData.batches.filter(b =>
    !b.authorized &&
    b.status !== 'Processed' &&
    b.status !== 'Rejected'
  );

  // Render Rejected Items
  const rejectedTbody = document.getElementById('authRejectedTableBody');
  const rejectedBilling = mockData.manualBilling.filter(mb => mb.status === 'Rejected');
  const rejectedBatches = mockData.batches.filter(b => b.status === 'Rejected');

  const allRejected = [
    ...rejectedBilling.map(i => ({ ...i, type: 'Manual Billing', reason: 'Admin Rejected' })),
    ...rejectedBatches.map(i => ({ ...i, type: 'Batch', reason: 'Admin Rejected' }))
  ];

  rejectedTbody.innerHTML = allRejected.length === 0
    ? '<tr><td colspan="6" class="text-center">No rejected items</td></tr>'
    : allRejected.map(item => `
      <tr>
        <td>${item.type}</td>
        <td>${item.id}</td>
        <td><span class="truncate-text" title="${item.description}">${item.description}</span></td>
        <td>${formatDate(item.rejectedDate || new Date().toISOString())}</td>
        <td><span class="badge badge-danger" title="${item.reason}">${item.reason}</span></td>
        <td>
          ${isWithin30Days(item.rejectedDate) ?
        `<button class="btn btn-primary btn-sm" onclick="reconsiderItem('${item.id}', '${item.type}')">Reconsider</button>` :
        `<span class="text-muted" style="font-size: 0.75rem;">Expired</span>`
      }
        </td>
      </tr>
      `).join('');

  updateAuthBadge();
}

function isWithin30Days(dateString) {
  if (!dateString) return true;
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 30;
}

function reconsiderItem(id, type) {
  if (type === 'Manual Billing') {
    const item = mockData.manualBilling.find(i => i.id === id);
    if (item) {
      item.status = 'Pending';
      showNotification(`Manual Billing ${id} moved back to Pending`, 'success');
    }
  } else {
    const item = mockData.batches.find(i => i.id === id);
    if (item) {
      item.status = 'Processing';
      showNotification(`Batch ${id} moved back to Pending`, 'success');
    }
  }
  renderAuthorizations();
}

function approveManualBilling(id) {
  const billing = mockData.manualBilling.find(mb => mb.id === id);
  if (billing) {
    billing.authorized = true;
    billing.status = 'Approved';
    billing.authorizedBy = currentUser.firstName + ' ' + currentUser.lastName;
    billing.authorizedDate = new Date().toISOString().split('T')[0];

    showNotification(`Manual billing ${id} approved`, 'success');
    renderAuthorizations();
    logActivity(`Approved manual billing ${id} `, currentUser);
  }
}

function rejectManualBilling(id) {
  const billing = mockData.manualBilling.find(mb => mb.id === id);
  if (billing) {
    billing.status = 'Rejected';
    billing.authorized = false;
    billing.rejectedDate = new Date().toISOString(); // Record rejection date
    showNotification(`Manual Billing ${id} rejected`, 'error');
    renderAuthorizations();
    logActivity(`Rejected manual billing ${id} `, currentUser);
  }
}

function approveBatch(id) {
  const batch = mockData.batches.find(b => b.id === id);
  if (batch) {
    batch.authorized = true;
    batch.status = 'Processed';
    batch.authorizedBy = currentUser.firstName + ' ' + currentUser.lastName;
    batch.authorizedDate = new Date().toISOString().split('T')[0];

    showNotification(`Batch ${id} approved and processing started`, 'success');
    renderAuthorizations();
    logActivity(`Approved batch ${id} `, currentUser);
  }
}

function rejectBatch(id) {
  const batch = mockData.batches.find(b => b.id === id);
  if (batch) {
    batch.status = 'Rejected';
    batch.authorized = false;
    batch.rejectedDate = new Date().toISOString(); // Record rejection date
    showNotification(`Batch ${id} rejected`, 'error');
    renderAuthorizations();
    logActivity(`Rejected batch ${id} `, currentUser);
  }
}

function updateAuthBadge() {
  const pendingBilling = mockData.manualBilling.filter(mb => !mb.authorized && mb.status === 'Pending').length;
  const pendingBatches = mockData.batches.filter(b => !b.authorized && b.status !== 'Processed').length;
  const total = pendingBilling + pendingBatches;

  const badge = document.getElementById('authBadge');
  if (badge) {
    badge.textContent = total;
    badge.style.display = total > 0 ? 'inline-flex' : 'none';
  }

  const navItem = document.getElementById('authorizationsNav');
  if (navItem) {
    if (currentUser && currentUser.role === 'Admin') {
      navItem.classList.remove('hidden');
    } else {
      navItem.classList.add('hidden');
    }
  }
}

function initAuthTabs() {
  const tabs = document.querySelectorAll('#authorizations-page .tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      document.querySelectorAll('#authorizations-page .tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById(`auth - ${tabName} -tab`).classList.add('active');
    });
  });
}

// ===================================
// EXCEPTIONS
// ===================================

function renderExceptions() {
  const tbody = document.getElementById('exceptionsTableBody');
  let exceptions = detectExceptions();

  if (typeof getPaginatedData === 'function') {
    exceptions = getPaginatedData(exceptions, 'exceptionsTable');
  }

  if (exceptions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">No exceptions found</td></tr>';
  } else {
    tbody.innerHTML = exceptions.map(ex => `
    <tr>
      <td>${ex.id || '-'}</td>
      <td>${ex.company}</td>
      <td>${ex.product}</td>
      <td><span class="truncate-text" title="${ex.description || '-'}">${ex.description || '-'}</span></td>
      <td>${ex.date || '-'}</td>
      <td><span class="badge badge-danger">${ex.status || ex.reason}</span></td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="resolveException('${ex.company}', '${ex.product}')">Resolve</button>
      </td>
    </tr>
    `).join('');
  }

  if (typeof renderPaginationControls === 'function') {
    renderPaginationControls('exceptionsTable', 'exceptionsPagination');
  }
}

function detectExceptions() {
  const exceptions = [];
  mockData.transactions.forEach(t => {
    const pricing = mockData.pricing.find(p =>
      p.company === t.company &&
      p.product === t.product &&
      p.status === 'Active'
    );

    if (!pricing) {
      const exists = exceptions.find(e => e.company === t.company && e.product === t.product);
      if (!exists) {
        exceptions.push({
          id: `EX${String(exceptions.length + 1).padStart(3, '0')} `,
          company: t.company,
          product: t.product,
          transactions: t.count,
          reason: 'Missing Pricing',
          description: `No active pricing found for ${t.company} and product ${t.product} `,
          date: new Date().toISOString().split('T')[0],
          status: 'Pending'
        });
      }
    }
  });
  return exceptions;
}

function resolveException(company, product) {
  showNotification(`Please add pricing for ${company} - ${product} in the Pricing page`, 'info');
  navigateToPage('pricing');
}

// ===================================
// WAITING ROOM
// ===================================

function renderWaitingRoom() {
  const tbody = document.getElementById('waitingRoomTableBody');
  let unauthorizedUsers = mockData.users.filter(u => !u.authorized);

  if (typeof getPaginatedData === 'function') {
    unauthorizedUsers = getPaginatedData(unauthorizedUsers, 'waitingRoomTable');
  }

  if (unauthorizedUsers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">No users in waiting room</td></tr>';
  } else {
    tbody.innerHTML = unauthorizedUsers.map(user => `
    <tr>
      <td>${user.firstName} ${user.lastName}</td>
      <td><span class="truncate-text" title="${user.email}">${user.email}</span></td>
      <td>${user.role}</td>
      <td>${user.createdDate || 'N/A'}</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="approveUser('${user.email}')">Approve</button>
        <button class="btn btn-sm btn-secondary" onclick="rejectUser('${user.email}')">Reject</button>
      </td>
    </tr>
    `).join('');
  }
  updateWaitingRoomBadge();

  if (typeof renderPaginationControls === 'function') {
    renderPaginationControls('waitingRoomTable', 'waitingRoomPagination');
  }
}

function approveUser(email) {
  const user = mockData.users.find(u => u.email === email);
  if (user) {
    user.authorized = true;
    showNotification(`User ${user.firstName} approved`, 'success');
    renderWaitingRoom();
    updateWaitingRoomBadge();
    logActivity(`Approved user ${user.firstName} ${user.lastName} `, currentUser);
  }
}

function rejectUser(email) {
  const index = mockData.users.findIndex(u => u.email === email);
  if (index !== -1) {
    const user = mockData.users[index];
    mockData.users.splice(index, 1);
    showNotification(`User ${user.firstName} rejected and removed`, 'warning');
    renderWaitingRoom();
    updateWaitingRoomBadge();
    logActivity(`Rejected user ${user.firstName} ${user.lastName} `, currentUser);
  }
}

function updateWaitingRoomBadge() {
  const count = mockData.users.filter(u => !u.authorized).length;
  const badge = document.getElementById('waitingRoomBadge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
  }
}

// ===================================
// ACTIVITY FEED
// ===================================

const activityLog = [
  { user: 'Thabo Mahlafunya', action: 'logged in', time: 'Just now', type: 'success' }
];

function logActivity(action, userObj) {
  const user = userObj ? `${userObj.firstName} ${userObj.lastName} ` : 'System';
  activityLog.unshift({
    user: user,
    action: action,
    time: 'Just now',
    type: 'info'
  });
  if (activityLog.length > 10) activityLog.pop();
  renderActivityFeed();
}

function renderActivityFeed() {
  const feed = document.getElementById('activityFeed');
  if (!feed) return;

  feed.innerHTML = activityLog.map(item => `
    < div class="activity-item" >
      <div class="activity-icon ${item.type || 'info'}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      </div>
      <div class="activity-content">
        <p class="activity-text"><strong>${item.user}</strong> ${item.action}</p>
        <span class="activity-time">${item.time}</span>
      </div>
    </div >
    `).join('');
}

function initActivityFeed() {
  const clearBtn = document.getElementById('clearActivityBtn');
  if (clearBtn) {
    clearBtn.onclick = () => {
      activityLog.length = 0;
      renderActivityFeed();
    };
  }
  renderActivityFeed();
}

// ===================================
// OVERRIDES & UPDATES
// ===================================

// Updated initInvoiceModal
function initInvoiceModal() {
  const modal = document.getElementById('invoiceModal');
  const close = document.getElementById('closeInvoiceModal');
  const closeX = modal.querySelector('.close-modal');
  const closeBtn = document.getElementById('closeInvoiceBtn');

  const closeModal = () => modal.classList.remove('show');
  if (close) close.onclick = closeModal;
  if (closeX) closeX.onclick = closeModal;
  if (closeBtn) closeBtn.onclick = closeModal;

  window.onclick = (e) => {
    if (e.target === modal) closeModal();
  };

  // Delegate click for "View" buttons in invoices table
  document.getElementById('invoicesTableBody').addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-primary') && e.target.textContent === 'View') {
      const row = e.target.closest('tr');
      const companyName = row.cells[0].textContent;
      const invoice = mockData.invoices.find(inv => inv.company === companyName);

      if (invoice) {
        // Populate modal
        document.getElementById('invoiceNumber').textContent = `INV - ${String(invoice.id).padStart(3, '0')} `;
        document.getElementById('invoiceDate').textContent = '2025-01-31';
        document.getElementById('invoiceDueDate').textContent = invoice.dueDate;
        document.getElementById('invoiceClientName').textContent = invoice.company;

        const company = mockData.companies.find(c => c.name === invoice.company);
        document.getElementById('invoiceClientAddress').textContent = company ? company.address : 'Address not found';
        document.getElementById('invoiceClientTaxId').textContent = company ? `Tax ID: ${company.taxId} ` : 'Tax ID: -';

        const tbody = document.getElementById('invoiceLineItems');
        const transactions = mockData.transactions.filter(t => t.company === invoice.company);

        if (transactions.length > 0) {
          tbody.innerHTML = transactions.map(t => `
    <tr>
              <td style="text-align: left; padding: 12px; border-bottom: 1px solid #eee;">${t.product}</td>
              <td style="text-align: center; padding: 12px; border-bottom: 1px solid #eee;">${t.count}</td>
              <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee;">R${(invoice.unitPrice).toFixed(2)}</td>
              <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee;">R${(t.count * invoice.unitPrice).toFixed(2)}</td>
            </tr>
    `).join('');
        } else {
          tbody.innerHTML = `
    <tr>
              <td style="text-align: left; padding: 12px; border-bottom: 1px solid #eee;">Consolidated Services</td>
              <td style="text-align: center; padding: 12px; border-bottom: 1px solid #eee;">${invoice.transactions}</td>
              <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee;">R${invoice.unitPrice.toFixed(2)}</td>
              <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee;">R${invoice.totalPrice.toFixed(2)}</td>
            </tr>
    `;
        }

        document.getElementById('invoiceSubtotal').textContent = `R${invoice.totalPrice.toFixed(2)} `;
        document.getElementById('invoiceDiscount').textContent = `R${invoice.discount.toFixed(2)} `;
        document.getElementById('invoicePaid').textContent = `R${invoice.paidAmount.toFixed(2)} `;
        document.getElementById('invoiceOutstanding').textContent = `R${invoice.outstanding.toFixed(2)} `;

        modal.classList.add('show');
      }
    }
  });
}

// Updated initStatementModal
function initStatementModal() {
  const modal = document.getElementById('statementModal');
  const close = document.getElementById('closeStatementModal');
  const closeX = modal.querySelector('.close-modal');
  const cancelBtn = document.getElementById('cancelStatementBtn');
  const generateBtn = document.getElementById('generateStatementBtn');

  const resetModal = () => {
    document.getElementById('statementPreview').classList.add('hidden');
    document.getElementById('downloadStatementPDF').classList.add('hidden');
    document.getElementById('generateStatementBtn').classList.remove('hidden');
    modal.classList.remove('show');
  };

  if (close) close.onclick = resetModal;
  if (closeX) closeX.onclick = resetModal;
  if (cancelBtn) cancelBtn.onclick = resetModal;

  if (generateBtn) {
    generateBtn.onclick = () => {
      const period = document.querySelector('input[name="statementPeriod"]:checked').value;
      const preview = document.getElementById('statementPreview');
      const tbody = document.getElementById('statementInvoices');

      const companyName = modal.getAttribute('data-company');

      document.getElementById('statementCompanyName').textContent = companyName || 'Company Name';
      document.getElementById('statementPeriod').textContent = `Period: ${period === 'current' ? 'January 2025' : 'Last 3 Months'} `;

      const invoices = mockData.invoices.filter(inv => inv.company === companyName);

      if (invoices.length > 0) {
        tbody.innerHTML = invoices.map(inv => `
    <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">INV-${String(inv.id).padStart(3, '0')}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">2025-01-31</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${inv.dueDate}</td>
            <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee;">R${inv.totalPrice.toFixed(2)}</td>
            <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee;">R${inv.paidAmount.toFixed(2)}</td>
            <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee;">R${inv.outstanding.toFixed(2)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${inv.status}</td>
          </tr>
    `).join('');

        const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalPrice, 0);
        const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
        const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.outstanding, 0);

        document.getElementById('statementTotalInvoiced').textContent = `R${totalInvoiced.toFixed(2)} `;
        document.getElementById('statementTotalPaid').textContent = `R${totalPaid.toFixed(2)} `;
        document.getElementById('statementTotalOutstanding').textContent = `R${totalOutstanding.toFixed(2)} `;

      } else {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No invoices found for this period</td></tr>';
      }

      preview.classList.remove('hidden');
      document.getElementById('downloadStatementPDF').classList.remove('hidden');
      generateBtn.classList.add('hidden');
    };
  }

  window.onclick = (e) => {
    if (e.target === modal) resetModal();
  };
}

// Updated renderInvoices to handle Statements tab
// We need to override the one in app.js
// Since we are appending, we can just re-assign the function if it was a variable,
// but it's a function declaration.
// However, we can overwrite it by assigning it to window.renderInvoices if it was global,
// or just redefining it if we are in the same scope.
// But wait, function declarations are hoisted. The LAST one wins? No, the first one?
// Actually, if we have two function declarations with the same name, the last one wins in the same scope.
// So appending should work!



// ===================================
// INITIALIZATION OF NEW FEATURES
// ===================================

document.addEventListener('DOMContentLoaded', () => {
  // Init new features
  initAuthTabs();
  initActivityFeed();
  updateAuthBadge();
  updateWaitingRoomBadge();

  // Re-initialize modals with new logic
  // We need to call these again to attach the new event listeners
  // and override the old ones (though old listeners might still exist,
  // but since we replaced the HTML of the modals, the old listeners on modal elements are gone!
  // Wait, we replaced the HTML of the modals in index.html.
  // So the old init functions in app.js (which run on DOMContentLoaded) will try to attach listeners.
  // Our new init functions (also running on DOMContentLoaded) will also try.
  // Since we are appending this code, both DOMContentLoaded listeners will run.
  // The old one runs first, then this one.
  // This one will attach NEW listeners.
  // This should be fine as long as we don't have conflicting listeners.

  initInvoiceModal();
  initStatementModal();
});

// ===================================
// PHASE 6: REFINEMENTS & EXTENSIONS
// ===================================

// ===================================
// INVOICE ENHANCEMENTS
// ===================================

// Override renderInvoices to handle status changes and tab logic
function renderInvoices() {
  const tbody = document.getElementById('invoicesTableBody');
  const filteredInvoices = getFilteredInvoices();

  if (currentTab === 'statements') {
    // Statement View Logic (Existing)
    const companies = mockData.companies;
    tbody.innerHTML = companies.map(c => `
        <tr>
        <td><a href="#" class="table-link">${c.name}</a></td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td><span class="badge badge-success">Active</span></td>
        <td><button class="btn btn-primary view-statement-btn" data-company="${c.name}">View Statement</button></td>
        <td>-</td>
      </tr>
        `).join('');

    document.querySelectorAll('.view-statement-btn').forEach(btn => {
      btn.onclick = () => {
        const company = btn.getAttribute('data-company');
        const modal = document.getElementById('statementModal');
        modal.setAttribute('data-company', company);
        modal.classList.add('show');
      };
    });

  } else {
    // Invoice View Logic (Updated)
    // Filter by tab status (Paid/Unpaid)
    const statusFilter = currentTab === 'paid' ? 'Paid' : 'Unpaid';
    const invoicesToShow = filteredInvoices.filter(inv => inv.status === statusFilter);

    if (invoicesToShow.length === 0) {
      tbody.innerHTML = `<tr> <td colspan="11" class="text-center">No ${statusFilter.toLowerCase()} invoices found</td></tr> `;
      return;
    }

    tbody.innerHTML = invoicesToShow.map(inv => `
      <tr>
        <td><a href="#" class="table-link">${inv.company}</a></td>
        <td>${inv.transactions}</td>
        <td>R${inv.unitPrice.toFixed(2)}</td>
        <td>R${inv.totalPrice.toFixed(2)}</td>
        <td>${formatDate(inv.dueDate)}</td>
        <td>R${inv.paidAmount.toFixed(2)}</td>
        <td>R${inv.discount.toFixed(2)}</td>
        <td>R${inv.outstanding.toFixed(2)}</td>
        <td>
          <select class="status-dropdown ${inv.status.toLowerCase()}" onchange="updateInvoiceStatus(${inv.id}, this.value)">
            <option value="Unpaid" ${inv.status === 'Unpaid' ? 'selected' : ''}>Unpaid ▼</option>
            <option value="Paid" ${inv.status === 'Paid' ? 'selected' : ''}>Paid</option>
          </select>
        </td>
        <td><button class="btn btn-primary view-invoice-btn" data-id="${inv.id}">View</button></td>
        <td>${inv.billingMonth}</td>
      </tr>
        `).join('');

    // Attach View Listeners
    document.querySelectorAll('.view-invoice-btn').forEach(btn => {
      btn.onclick = () => {
        const id = parseInt(btn.getAttribute('data-id'));
        openInvoiceModal(id);
      };
    });
  }
}
window.updateInvoiceStatus = function (id, newStatus) {
  console.log('Update Status Triggered:', id, newStatus);
  const inv = mockData.invoices.find(i => i.id === id);
  if (inv) {
    const oldStatus = inv.status;
    inv.status = newStatus;

    // Update paid and outstanding amounts based on status
    if (newStatus === 'Paid') {
      inv.paidAmount = inv.totalPrice - inv.discount;
      inv.outstanding = 0;
    } else if (newStatus === 'Unpaid') {
      inv.paidAmount = 0;
      inv.outstanding = inv.totalPrice - inv.discount;
    }

    saveToLocalStorage();
    console.log(`Invoice ${id} changed from ${oldStatus} to ${newStatus}`);

    // Re-render invoices table if visible
    if (typeof renderInvoices === 'function' && document.getElementById('invoicesTableBody')) {
      renderInvoices();
    }

    showNotification(`Invoice ${id} marked as ${newStatus}`, 'success');

    // CRITICAL: Always update dashboard immediately to reflect changes
    if (typeof renderDashboard === 'function') {
      console.log('Updating dashboard after invoice status change');
      renderDashboard();
    }
  } else {
    console.error('Invoice not found:', id);
  }
};

// Update the openInvoiceModal function
function openInvoiceModal(invoiceId, companyId) {
  // Fetch invoice and company data
  const invoice = window.invoices.find(i => i.id === invoiceId);
  const company = window.companies.find(c => c.id === companyId);

  if (!invoice || !company) {
    showToast('Invoice or company data not found', 'error');
    return;
  }

  // Populate billing company info
  populateBillingCompanyInfo();

  // Populate client and invoice info
  populateClientInvoiceInfo(company, invoice);

  // Show modal
  document.getElementById('invoiceModal').classList.add('show');
  document.body.style.overflow = 'hidden';
}

// Update the openStatementModal function
function openStatementModal(companyId) {
  const company = window.companies.find(c => c.id === companyId);

  if (!company) {
    showToast('Company data not found', 'error');
    return;
  }

  // Populate billing company info
  populateBillingCompanyInfo('statement');

  // Populate client info
  populateStatementInfo(company, {
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
  });

  // Show modal
  document.getElementById('statementModal').classList.add('show');
  document.body.style.overflow = 'hidden';
}

// Update the usage page initialization
function initializeUsagePage() {
  const usageData = window.usageData || [];

  // Populate usage header
  updateUsageHeader({
    entries: usageData
  });

  const modal = document.getElementById('invoiceModal');
  const company = mockData.companies.find(c => c.name === invoice.company);

  // Populate Header
  document.getElementById('invoiceNumber').textContent = `INV - ${String(invoice.id).padStart(3, '0')
    } `;
  document.getElementById('invoiceDate').textContent = formatDate('2025-01-31');
  document.getElementById('invoiceDueDate').textContent = formatDate(invoice.dueDate);

  // Status Badge
  const badgeContainer = document.getElementById('invoiceStatusBadge');
  badgeContainer.innerHTML = `< span class="status-badge-large ${invoice.status === 'Paid' ? 'status-paid' : 'status-unpaid'}" > ${invoice.status}</span > `;

  // Client Info
  document.getElementById('invoiceClientName').textContent = invoice.company;
  document.getElementById('invoiceClientAddress').textContent = company ? company.address : 'Address not found';
  document.getElementById('invoiceClientTaxId').textContent = company ? `Tax ID: ${company.taxId || '-'} ` : 'Tax ID: -';

  // Line Items (Linked to Priced Transactions)
  const tbody = document.getElementById('invoiceLineItems');
  // Try to find priced transactions for this company
  const pricedItems = mockData.pricedTransactions.filter(pt => pt.company === invoice.company);

  if (pricedItems.length > 0) {
    tbody.innerHTML = pricedItems.map(item => `
      <tr>
        <td style="text-align: left; padding: 12px; border-bottom: 1px solid #eee;">${item.product} (${item.rangeFrom}-${item.rangeTo})</td>
        <td style="text-align: center; padding: 12px; border-bottom: 1px solid #eee;">${item.transactions}</td>
        <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee;">R${item.unitPrice.toFixed(2)}</td>
        <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee;">R${item.totalPrice.toFixed(2)}</td>
      </tr>
      `).join('');
  } else {
    // Fallback to generic if no priced transactions found
    tbody.innerHTML = `
      <tr>
        <td style="text-align: left; padding: 12px; border-bottom: 1px solid #eee;">Consolidated Services</td>
        <td style="text-align: center; padding: 12px; border-bottom: 1px solid #eee;">${invoice.transactions}</td>
        <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee;">R${invoice.unitPrice.toFixed(2)}</td>
        <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee;">R${invoice.totalPrice.toFixed(2)}</td>
      </tr>
      `;
  }

  // Totals & Discount Editing
  document.getElementById('invoiceSubtotal').textContent = `R${invoice.totalPrice.toFixed(2)} `;

  const discountSpan = document.getElementById('invoiceDiscount');
  const discountInput = document.getElementById('invoiceDiscountInput');
  const editBtn = document.getElementById('editDiscountBtn');

  discountSpan.textContent = `R${invoice.discount.toFixed(2)} `;
  discountInput.value = invoice.discount;

  // Reset edit state
  discountSpan.classList.remove('hidden');
  discountInput.classList.add('hidden');

  // Admin only edit
  if (currentUser && currentUser.role === 'Admin') {
    editBtn.classList.remove('hidden');
    editBtn.onclick = () => {
      discountSpan.classList.add('hidden');
      discountInput.classList.remove('hidden');
      discountInput.focus();
    };

    discountInput.onblur = () => {
      const newDiscount = parseFloat(discountInput.value) || 0;
      invoice.discount = newDiscount;
      invoice.outstanding = invoice.totalPrice - newDiscount - invoice.paidAmount;

      discountSpan.textContent = `R${newDiscount.toFixed(2)} `;
      document.getElementById('invoiceOutstanding').textContent = `R${invoice.outstanding.toFixed(2)} `;

      discountSpan.classList.remove('hidden');
      discountInput.classList.add('hidden');

      renderInvoices(); // Update table
    };
  } else {
    editBtn.classList.add('hidden');
  }

  document.getElementById('invoicePaid').textContent = `R${invoice.paidAmount.toFixed(2)} `;
  document.getElementById('invoiceOutstanding').textContent = `R${invoice.outstanding.toFixed(2)} `;

  modal.classList.add('show');
}

// Helper for date formatting
function formatDate(dateString) {
  if (!dateString) return '-';
  // Handle DD/MM/YYYY format
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${day}/${month}/${year}`;
  }
  // Handle other formats
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; // Return original if invalid
  return date.toLocaleDateString('en-ZA', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function showDetails(company) {
  currentCompany = company;
  title.textContent = company.name;

  // Get assigned users
  const assignedUsers = mockData.companyUsers.filter(u => u.companyId === company.id);

  // Get users from transactions for this company (NEW: Consistency fix)
  const transactionUsers = [];
  if (mockData.transactions) {
    const companyTransactions = mockData.transactions.filter(t =>
      t.company === company.name || t.companyId === company.id
    );

    companyTransactions.forEach(t => {
      // Create consistent user object
      const username = t.username || `${t.firstName || 'user'}.${t.surname || 'user'}`.toLowerCase();
      const firstName = t.firstName || t.user?.split(' ')[0] || 'Unknown';
      const surname = t.surname || t.lastName || t.user?.split(' ')[1] || '';

      // Check if not already in list
      if (!assignedUsers.find(u => u.username === username) &&
        !transactionUsers.find(u => u.username === username)) {
        transactionUsers.push({
          username: username,
          firstName: firstName,
          surname: surname,
          position: 'Transaction User',
          lastLogin: t.date || 'N/A',
          password: '***',
          companyId: company.id
        });
      }
    });
  }

  const allUsers = [...assignedUsers, ...transactionUsers];

  if (allUsers.length > 0) {
    usersTableBody.innerHTML = allUsers.map(u => `
        <tr>
          <td>${u.username}</td>
          <td>${u.firstName}</td>
          <td>${u.surname}</td>
          <td>${u.position || 'User'}</td>
          <td>${u.lastLogin}</td>
          <td>${u.password}</td>
        </tr>
      `).join('');
  } else {
    usersTableBody.innerHTML = '<tr><td colspan="6" class="text-center">No users found</td></tr>';
  }

}
// View company details
function viewCompanyDetails(companyId) {
  const company = mockData.companies.find(c => c.id === companyId);
  if (!company) return;

  // Get elements
  const companiesList = document.getElementById('companies-list-view');
  const detailsView = document.getElementById('company-details-view');

  // Return early if required elements don't exist
  if (!companiesList || !detailsView) return;

  // Show company details view
  companiesList.classList.add('hidden');
  detailsView.classList.remove('hidden');

  // Populate company details with null checks
  const companyDetailName = document.getElementById('companyDetailName');
  const companyDetailType = document.getElementById('companyDetailType');
  const companyDetailContact = document.getElementById('companyDetailContact');
  const companyDetailEmail = document.getElementById('companyDetailEmail');
  const companyDetailPhone = document.getElementById('companyDetailPhone');
  const companyDetailAddress = document.getElementById('companyDetailAddress');
  const companyDetailRegistration = document.getElementById('companyDetailRegistration');
  const companyDetailTax = document.getElementById('companyDetailTax');
  const companyDetailIndustry = document.getElementById('companyDetailIndustry');
  const companyDetailFounded = document.getElementById('companyDetailFounded');
  const companyDetailStatus = document.getElementById('companyDetailStatus');

  if (companyDetailName) companyDetailName.textContent = company.name;
  if (companyDetailType) companyDetailType.textContent = company.type;
  if (companyDetailContact) companyDetailContact.textContent = company.contact;
  if (companyDetailEmail) companyDetailEmail.textContent = company.email;
  if (companyDetailPhone) companyDetailPhone.textContent = company.phone || 'N/A';
  if (companyDetailAddress) companyDetailAddress.textContent = company.address;
  if (companyDetailRegistration) companyDetailRegistration.textContent = company.registrationNumber || 'N/A';
  if (companyDetailTax) companyDetailTax.textContent = company.taxId || 'N/A';
  if (companyDetailIndustry) companyDetailIndustry.textContent = company.industry || 'N/A';
  if (companyDetailFounded) companyDetailFounded.textContent = company.foundedDate || 'N/A';
  if (companyDetailStatus) {
    companyDetailStatus.textContent = company.active ? 'Active' : 'Inactive';
    companyDetailStatus.className = `badge ${company.active ? 'badge-success' : 'badge-danger'}`;
  }
}

// ===================================
// ACTIVITIES PAGE (GLOBAL)
// ===================================

function initActivitiesPage() {
  const searchInput = document.getElementById('activitiesSearch');
  const logBtn = document.getElementById('logGlobalActivityBtn');

  renderAllActivities();

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = mockData.activities.filter(a =>
        a.description.toLowerCase().includes(term) ||
        a.type.toLowerCase().includes(term) ||
        (a.outcome && a.outcome.toLowerCase().includes(term))
      );
      renderAllActivities(filtered);
    });
  }

  if (logBtn) {
    logBtn.onclick = () => {
      // Open the existing log activity modal
      // But we need to handle company selection if it's global?
      // For simplicity, let's just alert or redirect to a company for now, 
      // or enhance the modal to allow company selection.
      // Let's enhance the modal to allow company selection if no company is pre-selected.

      const modal = document.getElementById('logActivityModal');
      const form = document.getElementById('logActivityForm');

      if (modal && form) {
        // Check if we need to add a company select field
        let companySelect = document.getElementById('activityCompanySelect');
        if (!companySelect) {
          // Dynamically add company select to the form if it doesn't exist
          const formGroup = document.createElement('div');
          formGroup.className = 'form-group';
          formGroup.innerHTML = `
             <label class="form-label">Company</label>
             <select class="form-select" name="companyId" id="activityCompanySelect" required>
               ${mockData.companies.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
             </select>
           `;
          form.insertBefore(formGroup, form.firstChild);
        }

        modal.classList.add('show');
        form.reset();
        form.querySelector('[name="date"]').value = new Date().toISOString().split('T')[0];

        // Update onsubmit to handle the select
        const originalSubmit = form.onsubmit;
        form.onsubmit = (e) => {
          // We need to ensure we capture the company ID from the select if it exists
          // The existing logic uses hidden input 'activityCompanyId'
          // We should update that hidden input when select changes or just read from select
          const select = document.getElementById('activityCompanySelect');
          if (select) {
            document.getElementById('activityCompanyId').value = select.value;
          }
          if (originalSubmit) originalSubmit(e);
          renderAllActivities(); // Refresh global list
        };
      }
    };
  }
}

function renderAllActivities(activities = getFilteredActivities()) {
  const tbody = document.getElementById('allActivitiesTableBody');
  if (!tbody) return;

  if (activities.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">No activities found</td></tr>';
    return;
  }

  // Sort by date desc
  const sorted = [...activities].sort((a, b) => new Date(b.date) - new Date(a.date));

  tbody.innerHTML = sorted.map(activity => {
    const company = mockData.companies.find(c => c.id === activity.companyId);
    return `
    <tr>
      <td><span class="badge badge-${getActivityBadgeColor(activity.type)}">${activity.type}</span></td>
      <td>${formatDate(activity.date)}</td>
      <td>${company ? company.name : 'Unknown'}</td>
      <td>${activity.description}</td>
      <td>${activity.outcome || '-'}</td>
      <td>${activity.user}</td>
    </tr>
  `;
  }).join('');
}

function getActivityBadgeColor(type) {
  switch (type) {
    case 'Call': return 'primary';
    case 'Email': return 'info';
    case 'Meeting': return 'success';
    case 'Note': return 'warning';
    case 'Task': return 'danger';
    default: return 'secondary';
  }
}
function renderCompanyActivities(companyId) {
  const timeline = document.getElementById('companyActivitiesTimeline');
  const activities = mockData.activities.filter(a => a.companyId === companyId).sort((a, b) => new Date(b.date) - new Date(a.date));

  if (activities.length === 0) {
    timeline.innerHTML = '<p class="text-center text-muted">No activities recorded yet.</p>';
    return;
  }

  timeline.innerHTML = activities.map(activity => `
      <div class="timeline-item">
        <div class="timeline-icon ${getActivityIconClass(activity.type)}">
          ${getActivityIcon(activity.type)}
        </div>
        <div class="timeline-content">
          <div class="timeline-header">
            <span class="timeline-type">${activity.type}</span>
            <span class="timeline-date">${formatDate(activity.date)}</span>
          </div>
          <p class="timeline-desc">${activity.description}</p>
          ${activity.outcome ? `<p class="timeline-outcome"><strong>Outcome:</strong> ${activity.outcome}</p>` : ''}
          <p class="timeline-user">Logged by ${activity.user}</p>
        </div>
      </div>
    `).join('');
}

function getActivityIconClass(type) {
  switch (type) {
    case 'Call': return 'bg-primary';
    case 'Email': return 'bg-info';
    case 'Meeting': return 'bg-success';
    case 'Note': return 'bg-warning';
    case 'Task': return 'bg-danger';
    default: return 'bg-secondary';
  }
}

function getActivityIcon(type) {
  // Return SVG based on type (simplified for brevity)
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/></svg>';
}

function initLogActivity() {
  const logActivityBtn = document.getElementById('logActivityBtn');
  const logActivityModal = document.getElementById('logActivityModal');
  const logActivityForm = document.getElementById('logActivityForm');
  const cancelLogActivity = document.getElementById('cancelLogActivity');

  if (logActivityBtn) {
    logActivityBtn.onclick = () => {
      if (currentCompany) {
        document.getElementById('activityCompanyId').value = currentCompany.id;
        logActivityModal.classList.add('show');
        logActivityForm.reset();
        // Set today's date
        logActivityForm.querySelector('[name="date"]').value = new Date().toISOString().split('T')[0];
      }
    };
  }

  if (logActivityModal) {
    const close = () => logActivityModal.classList.remove('show');
    if (cancelLogActivity) cancelLogActivity.onclick = close;
    const closeX = logActivityModal.querySelector('.close-modal');
    if (closeX) closeX.onclick = close;

    logActivityForm.onsubmit = (e) => {
      e.preventDefault();
      const formData = new FormData(logActivityForm);
      const newActivity = {
        id: mockData.activities.length + 1,
        companyId: parseInt(document.getElementById('activityCompanyId').value),
        type: formData.get('type'),
        date: formData.get('date'),
        description: formData.get('description'),
        outcome: formData.get('outcome'),
        user: currentUser ? currentUser.firstName : 'User'
      };

      mockData.activities.push(newActivity);
      saveToLocalStorage();
      renderCompanyActivities(newActivity.companyId);
      close();
      showNotification('Activity logged successfully!', 'success');
    };
  }
}

// ===================================
// SUPPORT TICKETS
// ===================================

function initSupport() {
  const modal = document.getElementById('createTicketModal');
  const btn = document.getElementById('createTicketBtn');
  const close = modal ? modal.querySelector('.close-modal') : null;
  const cancel = document.getElementById('cancelCreateTicket');
  const form = document.getElementById('createTicketForm');
  const companySelect = document.getElementById('ticketCompanySelect');
  const searchInput = document.getElementById('supportSearch');

  // Tab switching logic
  const tabs = document.querySelectorAll('[data-support-tab]');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      tabs.forEach(t => t.classList.remove('active'));
      // Add active class to clicked tab
      tab.classList.add('active');

      // Render tickets based on selected tab
      const selectedTab = tab.getAttribute('data-support-tab');
      renderTickets(mockData.supportTickets, selectedTab);
    });
  });

  // Initial render
  renderTickets(mockData.supportTickets, 'unresolved');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = mockData.supportTickets.filter(t =>
        t.subject.toLowerCase().includes(term) ||
        t.company.toLowerCase().includes(term) ||
        t.id.toLowerCase().includes(term)
      );
      // Note: Search currently ignores tabs, which is acceptable for now or can be refined
      renderTickets(filtered);
    });
  }

  if (!modal || !btn || !form) return;

  btn.onclick = () => {
    modal.classList.add('show');
    form.reset();

    // Populate companies
    if (companySelect) {
      companySelect.innerHTML = mockData.companies
        .map(c => `<option value="${c.id}">${c.name}</option>`)
        .join('');
    }
  };

  const closeModal = () => modal.classList.remove('show');
  if (close) close.onclick = closeModal;
  if (cancel) cancel.onclick = closeModal;

  window.onclick = (e) => {
    if (e.target === modal) closeModal();
  };

  form.onsubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const companyId = parseInt(formData.get('companyId'));
    const company = mockData.companies.find(c => c.id === companyId);

    if (company) {
      const newTicket = {
        id: `T${String(mockData.supportTickets.length + 1).padStart(3, '0')}`,
        companyId: company.id,
        company: company.name,
        subject: formData.get('subject'),
        description: formData.get('description'),
        priority: formData.get('priority'),
        status: 'Open',
        assignedTo: formData.get('assignedTo'),
        createdDate: new Date().toISOString().split('T')[0]
      };

      mockData.supportTickets.push(newTicket);
      saveToLocalStorage();

      // Re-render based on current active tab
      const activeTabObj = document.querySelector('[data-support-tab].active');
      const activeTab = activeTabObj ? activeTabObj.getAttribute('data-support-tab') : 'unresolved';
      renderTickets(mockData.supportTickets, activeTab);

      closeModal();
      showNotification('Ticket created successfully!', 'success');
    }
  };
}

function renderTickets(tickets = mockData.supportTickets, tab = 'unresolved') {
  const tbody = document.getElementById('supportTableBody');
  if (!tbody) return;

  let filteredTickets = tickets || [];

  // RBAC Filtering for Sales
  if (currentUser && currentUser.userGroup === 'Sales') {
    const fullName = currentUser.firstName + ' ' + currentUser.lastName;
    filteredTickets = filteredTickets.filter(t => t.createdBy === fullName || t.assignedTo === fullName);
  }

  // Filter based on tab
  if (tab === 'unresolved') {
    filteredTickets = filteredTickets.filter(t => t.status === 'Open' || t.status === 'In Progress');
  } else {
    filteredTickets = filteredTickets.filter(t => t.status === 'Resolved' || t.status === 'Closed');
  }

  if (filteredTickets.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center">No tickets found</td></tr>';
    return;
  }

  tbody.innerHTML = filteredTickets.map(ticket => `
    <tr>
      <td>${ticket.id}</td>
      <td>${ticket.subject}</td>
      <td>${ticket.company}</td>
      <td><span class="badge badge-${getPriorityColor(ticket.priority)}">${ticket.priority}</span></td>
      <td><span class="badge badge-${getStatusColor(ticket.status)}">${ticket.status}</span></td>
      <td>${ticket.assignedTo}</td>
      <td>${ticket.createdDate}</td>
      <td>
        <select class="form-select form-select-sm" onchange="updateTicketStatus('${ticket.id}', this.value)" style="width: auto; padding: 2px 5px;">
          <option value="Open" ${ticket.status === 'Open' ? 'selected' : ''}>Open</option>
          <option value="In Progress" ${ticket.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
          <option value="Resolved" ${ticket.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
          <option value="Closed" ${ticket.status === 'Closed' ? 'selected' : ''}>Closed</option>
        </select>
      </td>
    </tr>
  `).join('');
}

function getPriorityColor(priority) {
  switch (priority) {
    case 'Critical': return 'danger';
    case 'High': return 'warning';
    case 'Medium': return 'info';
    case 'Low': return 'success';
    default: return 'secondary';
  }
}

function getStatusColor(status) {
  switch (status) {
    case 'Open': return 'danger';
    case 'In Progress': return 'warning';
    case 'Resolved': return 'success';
    case 'Closed': return 'secondary';
    default: return 'primary';
  }
}

// ===================================
// MARKETING AUTOMATION
// ===================================

function initMarketing() {
  const modal = document.getElementById('createCampaignModal');
  const btn = document.getElementById('createCampaignBtn');
  const close = modal ? modal.querySelector('.close-modal') : null;
  const cancel = document.getElementById('cancelCreateCampaign');
  const form = document.getElementById('createCampaignForm');
  const searchInput = document.getElementById('marketingSearch');

  renderCampaigns();

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = mockData.campaigns.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.type.toLowerCase().includes(term)
      );
      renderCampaigns(filtered);
    });
  }

  const submitBtn = document.getElementById('submitCampaignBtn');

  if (!modal || !btn || !form || !submitBtn) return;

  btn.onclick = () => {
    form.reset();
    document.querySelector('#createCampaignModal h2').textContent = 'Create New Campaign';
    submitBtn.textContent = 'Create Campaign';
    delete form.dataset.editingId;
    modal.classList.add('show');
  };

  const closeModal = () => {
    const m = document.getElementById('createCampaignModal');
    if (m) m.classList.remove('show');
  };
  if (close) close.onclick = closeModal;
  if (cancel) cancel.onclick = closeModal;

  window.onclick = (e) => {
    if (e.target === modal) closeModal();
  };

  submitBtn.onclick = () => {
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    try {
      const formData = new FormData(form);
      const editingId = form.dataset.editingId;

      if (editingId) {
        // Update
        const campaign = mockData.campaigns.find(c => c.id === parseInt(editingId));
        if (campaign) {
          campaign.name = formData.get('name');
          campaign.type = formData.get('type');
          campaign.audience = formData.get('audience');
          showNotification('Campaign updated successfully!', 'success');
        }
      } else {
        // Create
        const newCampaign = {
          id: mockData.campaigns.length + 1,
          name: formData.get('name'),
          type: formData.get('type'),
          status: 'Draft',
          audience: formData.get('audience'),
          sentTo: 0,
          openRate: '-',
          clickRate: '-',
          createdDate: new Date().toISOString().split('T')[0]
        };
        mockData.campaigns.push(newCampaign);
        saveToLocalStorage();
        showNotification('Campaign created successfully!', 'success');
      }

      renderCampaigns();
      closeModal();
    } catch (error) {
      console.error('Marketing submit error:', error);
      alert('Error saving campaign: ' + error.message);
    }
  };
}

function renderCampaigns(campaigns = mockData.campaigns) {
  const tbody = document.getElementById('marketingTableBody');
  if (!tbody) return;

  if (campaigns.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center">No campaigns found</td></tr>';
    return;
  }

  let dataToRender = campaigns;
  if (typeof getPaginatedData === 'function') {
    dataToRender = getPaginatedData(dataToRender, 'marketingTable');
  }

  tbody.innerHTML = dataToRender.map(campaign => `
    <tr>
      <td>${campaign.name}</td>
      <td>${campaign.type}</td>
      <td><span class="badge badge-${getCampaignStatusColor(campaign.status)}">${campaign.status}</span></td>
      <td>${campaign.sentTo}</td>
      <td>${campaign.openRate}</td>
      <td>${campaign.clickRate}</td>
      <td>${campaign.createdDate}</td>
      <td>
        <select class="form-select form-select-sm" onchange="handleCampaignAction(this, ${campaign.id})" style="width: auto; padding: 2px 5px;">
          <option value="" disabled selected>Actions</option>
          <option value="edit">Edit</option>
          <option value="report">View Report</option>
          <option value="delete">Delete</option>
        </select>
      </td>
    </tr>
  `).join('');

  if (typeof renderPaginationControls === 'function') {
    renderPaginationControls('marketingTable', 'marketingPagination');
  }
}

window.handleCampaignAction = function (select, campaignId) {
  const action = select.value;
  select.value = ""; // Reset

  if (action === 'edit') {
    const campaign = mockData.campaigns.find(c => c.id === campaignId);
    if (campaign) {
      const modal = document.getElementById('createCampaignModal');
      const form = document.getElementById('createCampaignForm');

      form.elements['name'].value = campaign.name;
      form.elements['type'].value = campaign.type;
      form.elements['audience'].value = campaign.audience;

      form.dataset.editingId = campaignId;
      document.querySelector('#createCampaignModal h2').textContent = 'Edit Campaign';
      document.getElementById('submitCampaignBtn').textContent = 'Update Campaign';

      modal.classList.add('show');
    }
  } else if (action === 'report') {
    const campaign = mockData.campaigns.find(c => c.id === campaignId);
    if (campaign) {
      alert(`Campaign Report: ${campaign.name}\n\nStatus: ${campaign.status}\nSent To: ${campaign.sentTo}\nOpen Rate: ${campaign.openRate}\nClick Rate: ${campaign.clickRate}\nCreated: ${campaign.createdDate}`);
    }
  } else if (action === 'delete') {
    if (window.showConfirmModal) {
      window.showConfirmModal('Delete Campaign', 'Are you sure you want to delete this campaign?', () => {
        const idx = mockData.campaigns.findIndex(c => c.id === campaignId);
        if (idx !== -1) {
          mockData.campaigns.splice(idx, 1);
          renderCampaigns();
          showNotification('Campaign deleted', 'success');
        }
      });
    } else {
      if (confirm('Delete this campaign?')) {
        const idx = mockData.campaigns.findIndex(c => c.id === campaignId);
        if (idx !== -1) {
          mockData.campaigns.splice(idx, 1);
          renderCampaigns();
          showNotification('Campaign deleted', 'success');
        }
      }
    }
  }
};

function getCampaignStatusColor(status) {
  switch (status) {
    case 'Sent': return 'success';
    case 'Draft': return 'secondary';
    case 'Scheduled': return 'info';
    case 'Sending': return 'warning';
    default: return 'primary';
  }
}

// ===================================
// RUN BILLING
// ===================================

// ===================================
// RUN BILLING
// ===================================

function initRunBilling() {
  const dateFromInput = document.getElementById('billingDateFrom');
  const dateToInput = document.getElementById('billingDateTo');
  const scheduleBtn = document.getElementById('scheduleRunBtn');
  const confirmBtn = document.getElementById('confirmSendAllBtn');
  const tableBody = document.getElementById('runBillingTableBody');
  const summary = document.getElementById('billingRunSummary');

  let generatedInvoices = [];

  if (scheduleBtn && dateFromInput && dateToInput) {
    scheduleBtn.onclick = () => {
      const dateFrom = dateFromInput.value;
      const dateTo = dateToInput.value;

      if (!dateFrom || !dateTo) {
        showNotification('Please select both From and To dates', 'error');
        return;
      }

      if (new Date(dateFrom) > new Date(dateTo)) {
        showNotification('From date cannot be after To date', 'error');
        return;
      }

      // 1. Check for Exceptions
      const hasExceptions = mockData.manualBilling.some(mb => mb.status === 'Rejected') ||
        mockData.batches.some(b => b.status === 'Rejected');

      if (hasExceptions) {
        alert('CRITICAL WARNING: There are outstanding exceptions (Rejected items). You must resolve all exceptions before running billing.');
        return;
      }

      // 2. Generate preview invoices from Priced Transactions
      generatedInvoices = [];
      const activeCompanies = mockData.companies.filter(c => c.active);

      activeCompanies.forEach(company => {
        // Find priced transactions for this company within the date range
        const companyTransactions = mockData.pricedTransactions.filter(pt => {
          return pt.company === company.name &&
            pt.date >= dateFrom &&
            pt.date <= dateTo;
        });

        if (companyTransactions.length > 0) {
          // Calculate total amount
          const totalAmount = companyTransactions.reduce((sum, t) => sum + t.totalPrice, 0);

          generatedInvoices.push({
            company: company.name,
            product: 'Consolidated Usage', // Simplified for preview
            period: `${dateFrom} to ${dateTo}`,
            amount: totalAmount,
            status: 'Ready',
            transactions: companyTransactions // Store for usage view
          });
        }
      });

      renderBillingPreview();

      if (generatedInvoices.length > 0) {
        confirmBtn.disabled = false;
        showNotification(`Generated preview for ${generatedInvoices.length} invoices based on usage`, 'success');
      } else {
        confirmBtn.disabled = true;
        showNotification('No priced transactions found for the selected period', 'info');
      }
    };
  }

  function renderBillingPreview() {
    if (!tableBody) return;

    if (generatedInvoices.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No invoices to generate (No usage found)</td></tr>';
      summary.textContent = '0 Invoices | Total: R 0.00';
      return;
    }

    let total = 0;
    tableBody.innerHTML = generatedInvoices.map((inv, index) => {
      total += parseFloat(inv.amount);
      return `
        <tr>
          <td>${inv.company}</td>
          <td>${inv.product}</td>
          <td>${inv.period}</td>
          <td>R ${parseFloat(inv.amount).toFixed(2)}</td>
          <td><span class="badge badge-info">${inv.status}</span></td>
          <td>
            <div class="btn-group">
              <button class="btn btn-xs btn-secondary" onclick="viewPreviewDocument('Invoice', ${index})">Invoice</button>
              <button class="btn btn-xs btn-secondary" onclick="viewPreviewDocument('Usage', ${index})">Usage</button>
              <button class="btn btn-xs btn-secondary" onclick="viewPreviewDocument('Statement', ${index})">Statement</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    summary.textContent = `${generatedInvoices.length} Invoices | Total: R ${total.toFixed(2)}`;
  }

  // Global function to view documents
  window.viewPreviewDocument = function (type, index) {
    const inv = generatedInvoices[index];
    if (!inv) return;

    if (type === 'Invoice') {
      // Populate Invoice Modal with Preview Data
      const modal = document.getElementById('invoiceModal');
      if (!modal) return;

      document.getElementById('invoiceNumber').textContent = 'PREVIEW';
      document.getElementById('invoiceDate').textContent = new Date().toISOString().split('T')[0];
      document.getElementById('invoiceDueDate').textContent = inv.period; // Using period as proxy for dates
      document.getElementById('invoiceClientName').textContent = inv.company;
      document.getElementById('invoiceClientAddress').textContent = 'Address on file';

      const tbody = document.getElementById('invoiceLineItems');
      tbody.innerHTML = `
        <tr>
          <td style="text-align: left;">${inv.product}</td>
          <td style="text-align: center;">1</td>
          <td style="text-align: right;">R${inv.amount.toFixed(2)}</td>
          <td style="text-align: right;">R${inv.amount.toFixed(2)}</td>
        </tr>
      `;

      document.getElementById('invoiceSubtotal').textContent = `R${inv.amount.toFixed(2)}`;
      document.getElementById('invoiceOutstanding').textContent = `R${inv.amount.toFixed(2)}`;
      document.getElementById('invoicePaid').textContent = 'R0.00';

      modal.classList.add('show');

    } else if (type === 'Usage') {
      // Reuse Invoice Modal for Usage or Alert if no dedicated modal (Creating one effectively)
      // Since we can't easily add HTML, we'll strip the invoice modal to show Usage
      // OR better, use the Invoice Modal but change headers
      const modal = document.getElementById('invoiceModal');
      document.getElementById('invoiceNumber').textContent = 'USAGE REPORT';
      document.getElementById('invoiceClientName').textContent = inv.company;

      const tbody = document.getElementById('invoiceLineItems');
      // Show transactions
      const transList = inv.transactions.map(t => `
        <tr>
          <td style="text-align: left;">${t.date} - ${t.product}</td>
          <td style="text-align: center;">${t.volume || 1}</td>
          <td style="text-align: right;">R${t.unitPrice || 0}</td>
          <td style="text-align: right;">R${(t.totalPrice || t.total || 0).toFixed(2)}</td>
        </tr>
      `).join('');
      tbody.innerHTML = transList;

      document.getElementById('invoiceSubtotal').textContent = `R${inv.amount.toFixed(2)}`;
      document.getElementById('invoiceOutstanding').textContent = `R${inv.amount.toFixed(2)}`;

      modal.classList.add('show');

    } else if (type === 'Statement') {
      const modal = document.getElementById('statementModal');
      if (modal) {
        // Populate Statement Preview
        document.getElementById('statementCompanyName').textContent = inv.company;
        document.getElementById('statementPeriod').textContent = inv.period;
        document.getElementById('statementTotalInvoiced').textContent = `R${inv.amount.toFixed(2)}`;
        document.getElementById('statementTotalOutstanding').textContent = `R${inv.amount.toFixed(2)}`;

        const tbody = document.getElementById('statementInvoices');
        tbody.innerHTML = `
                <tr>
                    <td>PREVIEW</td>
                    <td>${new Date().toISOString().split('T')[0]}</td>
                    <td>-</td>
                    <td style="text-align: right;">R${inv.amount.toFixed(2)}</td>
                    <td style="text-align: right;">R0.00</td>
                    <td style="text-align: right;">R${inv.amount.toFixed(2)}</td>
                    <td>Generated</td>
                </tr>
            `;
        modal.classList.add('show');
      }
    }
  };

  if (confirmBtn) {
    confirmBtn.onclick = () => {
      if (generatedInvoices.length === 0) return;

      if (confirm(`Are you sure you want to generate and send ${generatedInvoices.length} invoices?`)) {

        generatedInvoices.forEach((inv, index) => {
          // 1. Create Invoice Record
          const billingMonth = new Date(dateFromInput.value).toLocaleString('default', { month: 'long', year: 'numeric' });
          mockData.invoices.unshift({
            id: `INV-${Date.now()}-${index}`,
            company: inv.company,
            transactions: inv.transactions.length,
            unitPrice: inv.transactions.length > 0 ? (inv.amount / inv.transactions.length) : 0,
            totalPrice: inv.amount,
            paidAmount: 0,
            discount: 0,
            outstanding: inv.amount,
            status: 'Unpaid',
            dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
            billingMonth: billingMonth,
            items: inv.transactions
          });

          // 2. Add to Transactions as a record (optional, but good for history)
          mockData.transactions.unshift({
            id: `INV-${Date.now()}-${index}`,
            date: new Date().toISOString().split('T')[0],
            company: inv.company,
            user: 'System',
            product: 'Invoice Generation',
            price: inv.amount,
            status: 'Sent'
          });
        });



        saveToLocalStorage();
        renderTransactions();

        showNotification('Billing run completed successfully! Invoices sent.', 'success');

        generatedInvoices = [];
        renderBillingPreview();
        confirmBtn.disabled = true;
        dateFromInput.value = '';
        dateToInput.value = '';
      }
    };
  }
}

// ===================================
// SEARCH FUNCTIONALITY
// ===================================

function initSearch() {
  // Manual Billing Search
  const mbSearch = document.getElementById('manualBillingSearch');
  if (mbSearch) {
    mbSearch.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const rows = document.querySelectorAll('#manualBillingTableBody tr');
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
      });
    });
  }

  // Batch Logger Search
  const blSearch = document.getElementById('batchLoggerSearch');
  if (blSearch) {
    blSearch.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const rows = document.querySelectorAll('#batchTableBody tr');
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
      });
    });
  }
}

// ===================================
// AUTHORIZATION & REJECTIONS
// ===================================

// Duplicate renderAuthorizations removed


function reconsiderItem(id, type) {
  if (type === 'Manual Billing') {
    const item = mockData.manualBilling.find(i => i.id === id);
    if (item) {
      item.status = 'Pending';
      showNotification(`Manual Billing ${id} moved back to Pending`, 'success');
    }
  } else {
    const item = mockData.batches.find(i => i.id === id);
    if (item) {
      item.status = 'Processing'; // Or whatever initial status
      showNotification(`Batch ${id} moved back to Pending`, 'success');
    }
  }
  renderAuthorizations();
}

// ===================================
// PRICING MODAL
// ===================================

function initPricingModal() {
  const modal = document.getElementById('addPriceModal');
  const close = modal.querySelector('.close-modal');
  const cancel = document.getElementById('cancelAddPrice');
  const form = document.getElementById('addPriceForm');
  const companySelect = document.getElementById('priceCompany');
  const addPriceBtn = document.getElementById('addPricingBtn');

  const closeModal = () => modal.classList.remove('show');
  close.onclick = closeModal;
  cancel.onclick = closeModal;

  window.onclick = (e) => {
    if (e.target === modal) closeModal();
  };

  // Use event delegation for Add Price button to ensure it works
  document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'addPricingBtn') {
      // Populate companies
      companySelect.innerHTML = mockData.companies.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

      // Reset form
      form.reset();

      modal.classList.add('show');
    }
  });

  form.onsubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    const validForUnit = formData.get('validForUnit');
    const validForValue = formData.get('validForValue');
    const validForString = `${validForValue} ${validForUnit} `;

    const newPrice = {
      id: mockData.pricing.length + 1,
      companyName: formData.get('company'),
      productName: formData.get('product'),
      rangeFrom: parseInt(formData.get('rangeFrom')),
      rangeTo: parseInt(formData.get('rangeTo')),
      price: parseFloat(formData.get('price')),
      validFor: validForString,
      status: 'Active'
    };

    mockData.pricing.push(newPrice);

    // Also add to priced transactions for consistency
    mockData.pricedTransactions.push({
      company: newPrice.companyName,
      product: newPrice.productName,
      transactions: 0,
      rangeFrom: newPrice.rangeFrom,
      rangeTo: newPrice.rangeTo,
      unitPrice: newPrice.price,
      totalPrice: 0
    });

    saveToLocalStorage();
    renderPricing();
    closeModal();
    showNotification('Pricing configuration added successfully', 'success');
  };
}

// Override resolveException to open modal
function resolveException(company, product) {
  const modal = document.getElementById('addPriceModal');
  const form = document.getElementById('addPriceForm');
  const companySelect = document.getElementById('priceCompany');

  // Populate companies
  companySelect.innerHTML = mockData.companies.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

  // Pre-fill
  companySelect.value = company;
  document.getElementById('priceProduct').value = product;

  modal.classList.add('show');
}

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', () => {
  // Init new features
  initSearch();
  initPricingModal();

  // Re-bind auth tabs to include new rejected tab
  const authTabs = document.querySelectorAll('#authorizations-page .tab');
  authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      authTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      document.querySelectorAll('#authorizations-page .tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById(`auth - ${tabName} -tab`).classList.add('active');

      renderAuthorizations(); // Re-render to ensure correct data
    });
  });

  // Add date filter event listeners
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');

  if (startDateInput) {
    startDateInput.addEventListener('change', () => {
      filterTableByDateRange('transactionsTable', 2); // Date is column index 2
    });
  }

  if (endDateInput) {
    endDateInput.addEventListener('change', () => {
      filterTableByDateRange('transactionsTable', 2);
    });
  }

  // Initialize notifications
  renderNotifications();
});

// ===================================
// UTILITIES
// ===================================

function exportTableToCSV(tableId, filename) {
  const table = document.getElementById(tableId);
  if (!table) return;

  const rows = table.querySelectorAll('tr');
  const csv = [];

  for (const row of rows) {
    const rowData = [];
    const cols = row.querySelectorAll('td, th');

    for (const col of cols) {
      // Get text content, remove newlines and extra spaces
      let data = col.innerText.replace(/(\r\n|\n|\r)/gm, '').replace(/\s+/g, ' ').trim();
      // Escape double quotes
      data = data.replace(/"/g, '""');
      // Wrap in double quotes
      rowData.push(`"${data}"`);
    }
    csv.push(rowData.join(','));
  }

  const csvFile = new Blob([csv.join('\n')], { type: 'text/csv' });
  const downloadLink = document.createElement('a');
  downloadLink.download = filename;
  downloadLink.href = window.URL.createObjectURL(csvFile);
  downloadLink.style.display = 'none';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  showNotification('Export started...', 'success');
}

function viewStatement(id) {
  // Simulation of viewing a statement
  showNotification(`Opening statement #${id}...`, 'info');
  // In a real app, this would open a PDF or a new page
  setTimeout(() => {
    alert(`Statement #${id} would be displayed here.`);
  }, 500);
}

function showPageLoader() {
  const loader = document.createElement('div');
  loader.className = 'page-loader';
  document.body.appendChild(loader);
  loader.style.display = 'block';

  setTimeout(() => {
    loader.style.display = 'none';
    loader.remove();
  }, 800);
}

function filterTable(tableId, query) {
  const table = document.getElementById(tableId);
  if (!table) return;

  const rows = table.querySelectorAll('tbody tr');
  const lowerQuery = query.toLowerCase();

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(lowerQuery) ? '' : 'none';
  });
}

// ===================================
// ADVANCED FILTERING
// ===================================

function filterTableByDateRange(tableId, dateColumnIndex) {
  const startDate = document.getElementById('startDate')?.value;
  const endDate = document.getElementById('endDate')?.value;

  if (!startDate && !endDate) return;

  const table = document.getElementById(tableId);
  if (!table) return;

  const rows = table.querySelectorAll('tbody tr');

  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length <= dateColumnIndex) return;

    const dateCell = cells[dateColumnIndex].textContent.trim();
    const [day, month, year] = dateCell.split('/');
    const rowDate = new Date(`${year}-${month}-${day}`);

    let show = true;

    if (startDate) {
      const start = new Date(startDate);
      if (rowDate < start) show = false;
    }

    if (endDate) {
      const end = new Date(endDate);
      if (rowDate > end) show = false;
    }

    row.style.display = show ? '' : 'none';
  });
}

// ===================================
// NOTIFICATIONS CENTER
// ===================================

const mockNotifications = [
  { id: 1, type: 'warning', message: 'Batch B002 is still processing', timestamp: new Date(Date.now() - 3600000), read: false },
  { id: 2, type: 'error', message: 'Failed to authorize Manual Billing MB001', timestamp: new Date(Date.now() - 7200000), read: false },
  { id: 3, type: 'info', message: '2 items pending authorization', timestamp: new Date(Date.now() - 10800000), read: true },
  { id: 4, type: 'success', message: 'Invoice #1 payment received', timestamp: new Date(Date.now() - 86400000), read: true }
];

function renderNotifications() {
  const container = document.getElementById('notificationsList');
  if (!container) return;

  const unreadCount = mockNotifications.filter(n => !n.read).length;
  const badge = document.getElementById('notificationBadge');
  if (badge) {
    badge.textContent = unreadCount;
    badge.style.display = unreadCount > 0 ? 'block' : 'none';
  }

  if (mockNotifications.length === 0) {
    container.innerHTML = '<div class="notification-empty">No notifications</div>';
    return;
  }

  container.innerHTML = mockNotifications.map(notif => `
    <div class="notification-item ${notif.read ? 'read' : 'unread'}" data-id="${notif.id}">
      <div class="notification-icon ${notif.type}">
        ${getNotificationIcon(notif.type)}
      </div>
      <div class="notification-content">
        <div class="notification-message">${notif.message}</div>
        <div class="notification-time">${formatNotificationTime(notif.timestamp)}</div>
      </div>
      <div class="notification-actions">
        ${!notif.read ? '<button class="notification-mark-read" onclick="markNotificationRead(' + notif.id + ')" title="Mark as read">✓</button>' : ''}
        <button class="notification-delete" onclick="deleteNotification(' + notif.id + ')" title="Delete">✕</button>
      </div>
    </div>
  `).join('');
}

function getNotificationIcon(type) {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  return icons[type] || 'ℹ';
}

function formatNotificationTime(timestamp) {
  const now = new Date();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function toggleNotifications() {
  const panel = document.getElementById('notificationPanel');
  if (!panel) return;

  panel.classList.toggle('show');
  if (panel.classList.contains('show')) {
    renderNotifications();

    // Add click-away listener
    setTimeout(() => {
      document.addEventListener('click', closeNotificationsOnClickAway);
    }, 100);
  } else {
    document.removeEventListener('click', closeNotificationsOnClickAway);
  }
}

function closeNotificationsOnClickAway(event) {
  const panel = document.getElementById('notificationPanel');
  const bell = document.querySelector('.notification-bell');

  if (!panel || !bell) return;

  // Check if click is outside both the panel and the bell icon
  if (!panel.contains(event.target) && !bell.contains(event.target)) {
    panel.classList.remove('show');
    document.removeEventListener('click', closeNotificationsOnClickAway);
  }
}

function markNotificationRead(id) {
  const notif = mockNotifications.find(n => n.id === id);
  if (notif) {
    notif.read = true;
    renderNotifications();
  }
}

function deleteNotification(id) {
  const index = mockNotifications.findIndex(n => n.id === id);
  if (index !== -1) {
    mockNotifications.splice(index, 1);

    // Re-render both views
    renderNotifications();

    // If on notifications page, re-render that too
    const notificationsPage = document.getElementById('notifications-page');
    if (notificationsPage && !notificationsPage.classList.contains('hidden')) {
      renderAllNotifications();
    }

    showNotification('Notification deleted', 'success');
  }
}

function markAllNotificationsRead() {
  mockNotifications.forEach(n => n.read = true);
  renderNotifications();
}

// ===================================
// AUDIT LOGS
// ===================================

const mockAuditLogs = [
  { id: 1, timestamp: new Date(), user: 'Thabo Mahlafunya', action: 'Login', details: 'Successful login', ipAddress: '192.168.1.100' },
  { id: 2, timestamp: new Date(Date.now() - 300000), user: 'Thabo Mahlafunya', action: 'Create', details: 'Created company: Test Corp', ipAddress: '192.168.1.100' },
  { id: 3, timestamp: new Date(Date.now() - 600000), user: 'Sarah Connor', action: 'Update', details: 'Updated invoice #1 status to Paid', ipAddress: '192.168.1.101' },
  { id: 4, timestamp: new Date(Date.now() - 900000), user: 'Thabo Mahlafunya', action: 'Authorize', details: 'Authorized batch B001', ipAddress: '192.168.1.100' },
  { id: 5, timestamp: new Date(Date.now() - 1200000), user: 'Sarah Connor', action: 'Export', details: 'Exported transactions to CSV', ipAddress: '192.168.1.101' }
];

function renderAuditLogs() {
  const tbody = document.getElementById('auditLogsTableBody');
  if (!tbody) return;

  tbody.innerHTML = mockAuditLogs.map(log => `
    <tr>
      <td>${formatAuditTimestamp(log.timestamp)}</td>
      <td>${log.user}</td>
      <td><span class="audit-action-badge">${log.action}</span></td>
      <td>${log.details}</td>
      <td>${log.ipAddress}</td>
    </tr>
  `).join('');

  hidePageLoader();
}

function formatAuditTimestamp(timestamp) {
  return timestamp.toLocaleString('en-ZA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function logAction(action, details) {
  const newLog = {
    id: mockAuditLogs.length + 1,
    timestamp: new Date(),
    user: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Unknown',
    action: action,
    details: details,
    ipAddress: '192.168.1.100'
  };

  mockAuditLogs.unshift(newLog);

  if (mockAuditLogs.length > 100) {
    mockAuditLogs.pop();
  }
}

// ===================================
// ALL NOTIFICATIONS PAGE
// ===================================

function renderAllNotifications() {
  const container = document.getElementById('allNotificationsContainer');
  if (!container) return;

  if (mockNotifications.length === 0) {
    container.innerHTML = '<div class="notification-empty">No notifications</div>';
    return;
  }

  container.innerHTML = mockNotifications.map(notif => `
    <div class="notification-card ${notif.read ? 'read' : 'unread'}">
      <div class="notification-card-header">
        <div class="notification-icon ${notif.type}">
          ${getNotificationIcon(notif.type)}
        </div>
        <div class="notification-card-content">
          <div class="notification-message">${notif.message}</div>
          <div class="notification-time">${formatNotificationTime(notif.timestamp)}</div>
        </div>
        <div class="notification-actions">
          ${!notif.read ? '<button class="btn btn-secondary btn-sm" onclick="markNotificationRead(' + notif.id + ')">Mark as read</button>' : ''}
          <button class="btn btn-secondary btn-sm" onclick="deleteNotification(' + notif.id + ')" style="background: #ef4444;">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

function filterNotifications(query) {
  const container = document.getElementById('allNotificationsContainer');
  if (!container) return;

  const cards = container.querySelectorAll('.notification-card');
  const lowerQuery = query.toLowerCase();

  cards.forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(lowerQuery) ? '' : 'none';
  });
}

// ===================================
// COMPANY DETAILS NAVIGATION - GLOBAL FUNCTIONS
// ===================================

window.backToCompaniesList = function () {
  const companiesList = document.getElementById('companies-list-view');
  const detailsView = document.getElementById('company-details-view');

  if (companiesList && detailsView) {
    detailsView.classList.add('hidden');
    companiesList.classList.remove('hidden');

    // Reset to users tab
    window.switchCompanyTab('users');
  }
};

window.switchCompanyTab = function (tabName) {
  const usersTab = document.getElementById('company-users-tab');
  const infoTab = document.getElementById('company-info-tab');
  const detailsView = document.getElementById('company-details-view');

  if (!detailsView) return;

  // Update tab buttons
  const tabs = detailsView.querySelectorAll('.tab');
  tabs.forEach(tab => {
    if (tab.getAttribute('data-tab') === tabName) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Update tab content
  if (tabName === 'users') {
    if (usersTab) usersTab.classList.add('active');
    if (infoTab) infoTab.classList.remove('active');
  } else if (tabName === 'details') {
    if (usersTab) usersTab.classList.remove('active');
    if (infoTab) infoTab.classList.add('active');
  }
};

// Global function to update ticket status
window.updateTicketStatus = function (ticketId, newStatus) {
  const ticket = mockData.supportTickets.find(t => t.id === ticketId);
  if (ticket) {
    ticket.status = newStatus;
    showNotification(`Ticket ${ticketId} status updated to ${newStatus}`, 'success');

    // Re-render to move to correct tab
    const activeTabObj = document.querySelector('[data-support-tab].active');
    const activeTab = activeTabObj ? activeTabObj.getAttribute('data-support-tab') : 'unresolved';
    renderTickets(mockData.supportTickets, activeTab);
  }
};

window.generateTestTransactions = function (companyName, count = 100) {
  console.log(`Generating ${count} transactions for ${companyName}...`);
  const products = ['Consulting', 'Software License', 'Hosting', 'Support', 'Training'];

  for (let i = 0; i < count; i++) {
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const randomAmount = Math.floor(Math.random() * 5000) + 100;
    const randomDate = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString();

    mockData.transactions.push({
      id: `TXN${mockData.transactions.length + 1000}`,
      company: companyName,
      product: randomProduct,
      amount: randomAmount,
      date: randomDate,
      status: 'Processed',
      count: 1
    });
  }

  saveToLocalStorage();
  console.log('Transactions generated and saved.');
  showNotification(`${count} transactions generated for ${companyName}`, 'success');

  if (typeof renderTransactions === 'function' && currentPage === 'transactions') renderTransactions();
  if (typeof renderDashboard === 'function' && currentPage === 'dashboard') renderDashboard();
};
