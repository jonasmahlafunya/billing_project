// billing_fixes.js
// Billing Management System - Comprehensive Fixes
// Version 1.0.0

/**
 * DATA MANAGER - Handles localStorage operations
 */
class DataManager {
    constructor() {
        this.storageKey = 'billingSystemData';
        this.initStorage();
    }

    initStorage() {
        if (!localStorage.getItem(this.storageKey)) {
            const initialData = {
                companies: [],
                transactions: [],
                invoices: [],
                users: []
            };
            localStorage.setItem(this.storageKey, JSON.stringify(initialData));
        }
    }

    getData() {
        return JSON.parse(localStorage.getItem(this.storageKey)) || {};
    }

    saveData(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));

        // CRITICAL SYNC: Ensure the global mockData object is also updated
        if (typeof mockData !== 'undefined') {
            Object.assign(mockData, data);

            // Trigger MySQL Save
            if (typeof saveToDatabase === 'function') {
                saveToDatabase();
            } else if (typeof saveToLocalStorage === 'function') {
                saveToLocalStorage();
            }
        }
        return true;
    }

    // COMPANY OPERATIONS
    getCompanies() {
        return this.getData().companies || [];
    }

    getCompanyById(id) {
        const companies = this.getCompanies();
        return companies.find(c => c.id === id);
    }

    addCompany(company) {
        try {
            const data = this.getData();
            company.id = 'COMP_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            company.createdAt = new Date().toISOString();
            company.status = 'active';

            data.companies.push(company);
            this.saveData(data);

            console.log('Company added:', company);
            return company.id;
        } catch (error) {
            console.error('Error adding company:', error);
            return false;
        }
    }

    updateCompany(id, companyData) {
        try {
            const data = this.getData();
            const index = data.companies.findIndex(c => c.id === id);

            if (index !== -1) {
                data.companies[index] = { ...data.companies[index], ...companyData };
                this.saveData(data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating company:', error);
            return false;
        }
    }

    deleteCompany(id) {
        try {
            const data = this.getData();
            const initialLength = data.companies.length;
            data.companies = data.companies.filter(c => c.id !== id);

            if (data.companies.length < initialLength) {
                this.saveData(data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deleting company:', error);
            return false;
        }
    }

    // GENERAL OPERATIONS
    getAll(collection) {
        return this.getData()[collection] || [];
    }

    addItem(collection, item) {
        try {
            const data = this.getData();
            if (!data[collection]) data[collection] = [];

            item.id = collection.toUpperCase() + '_' + Date.now();
            item.createdAt = new Date().toISOString();

            data[collection].push(item);
            this.saveData(data);
            return item.id;
        } catch (error) {
            console.error(`Error adding to ${collection}:`, error);
            return false;
        }
    }
}

/**
 * MODAL MANAGER - Handles modal operations
 */
class ModalManager {
    constructor() {
        this.activeModal = null;
        this.initModalEvents();
    }

    initModalEvents() {
        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.close(this.activeModal);
            }
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (this.activeModal && e.target.classList.contains('modal')) {
                this.close(this.activeModal);
            }
        });
    }

    open(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            // Hide any active modal first
            if (this.activeModal && this.activeModal !== modalId) {
                this.close(this.activeModal);
            }

            modal.style.display = 'block';
            this.activeModal = modalId;

            // Clear form if it's a company modal
            if (modalId === 'companyModal') {
                this.clearCompanyForm();
            }

            // Add active class for animation
            setTimeout(() => {
                modal.classList.add('active');
            }, 10);
        }
    }

    close(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');

            setTimeout(() => {
                modal.style.display = 'none';
                if (this.activeModal === modalId) {
                    this.activeModal = null;
                }
            }, 300);
        }
    }

    clearCompanyForm() {
        const form = document.getElementById('companyForm');
        if (form) {
            form.reset();
            // Clear any hidden ID field
            const idField = form.querySelector('[name="companyId"]');
            if (idField) idField.value = '';

            // Update form title for new company
            const title = form.closest('.modal')?.querySelector('.modal-header h2');
            if (title) title.textContent = 'Add New Company';
        }
    }
}

/**
 * TOAST NOTIFICATION SYSTEM
 */
class Toast {
    static show(message, type = 'info', duration = 3000) {
        // Remove existing toast
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        // Create toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${message}</span>
                <button class="toast-close">&times;</button>
            </div>
        `;

        document.body.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 10);

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.hide(toast);
        });

        // Auto hide
        if (duration > 0) {
            setTimeout(() => this.hide(toast), duration);
        }

        return toast;
    }

    static hide(toast) {
        if (toast) {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }
    }

    static success(message) {
        return this.show(message, 'success');
    }

    static error(message) {
        return this.show(message, 'error');
    }

    static info(message) {
        return this.show(message, 'info');
    }
}

/**
 * VALIDATION SYSTEM
 */
class Validators {
    static required(value) {
        return value !== null && value !== undefined && String(value).trim() !== '';
    }

    static email(value) {
        if (!this.required(value)) return true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    }

    static phone(value) {
        if (!this.required(value)) return true;
        // South African phone format (+27 XXX XXX XXXX)
        const phoneRegex = /^(\+27|0)[1-8][0-9]{8}$/;
        return phoneRegex.test(value.replace(/\s+/g, ''));
    }

    static minLength(value, min) {
        if (!this.required(value)) return true;
        return String(value).length >= min;
    }

    static maxLength(value, max) {
        if (!this.required(value)) return false;
        return String(value).length <= max;
    }
}

/**
 * FORM VALIDATOR
 */
function validateForm(formId, rules) {
    const form = document.getElementById(formId);
    const errors = [];
    let isValid = true;

    // Clear previous errors
    form.querySelectorAll('.error-message').forEach(el => el.remove());
    form.querySelectorAll('.has-error').forEach(el => el.classList.remove('has-error'));

    // Validate each field
    for (const [fieldName, fieldRules] of Object.entries(rules)) {
        const input = form.querySelector(`[name="${fieldName}"]`);
        if (!input) continue;

        const value = input.value.trim();

        for (const rule of fieldRules) {
            let validationResult;

            if (typeof rule.validate === 'function') {
                validationResult = rule.validate(value);
            } else if (typeof rule.validate === 'string') {
                validationResult = Validators[rule.validate](value);
            }

            if (!validationResult) {
                isValid = false;
                errors.push({
                    field: fieldName,
                    message: rule.message
                });

                // Add error class
                input.parentElement.classList.add('has-error');

                // Add error message
                const errorEl = document.createElement('div');
                errorEl.className = 'error-message';
                errorEl.textContent = rule.message;
                errorEl.style.color = '#e74c3c';
                errorEl.style.fontSize = '12px';
                errorEl.style.marginTop = '5px';

                input.parentElement.appendChild(errorEl);
                break;
            }
        }
    }

    return { isValid, errors };
}

/**
 * CSV EXPORTER
 */
class CSVExporter {
    static exportTable(tableId, filename = 'export.csv') {
        const table = document.getElementById(tableId);
        if (!table) {
            console.error('Table not found:', tableId);
            return false;
        }

        let csv = [];
        const rows = table.querySelectorAll('tr');

        rows.forEach(row => {
            const rowData = [];
            const cells = row.querySelectorAll('td, th');

            cells.forEach(cell => {
                // Remove button HTML and get text content
                let text = cell.textContent.trim();

                // Clean up the text
                text = text.replace(/\n/g, ' ')
                    .replace(/\s+/g, ' ')
                    .replace(/[",]/g, ' ');

                // Wrap in quotes if contains comma
                if (text.includes(',')) {
                    text = `"${text}"`;
                }

                rowData.push(text);
            });

            csv.push(rowData.join(','));
        });

        const csvString = csv.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
        return true;
    }
}

/**
 * TABLE SEARCH
 */
class TableSearch {
    constructor(tableId, searchInputId) {
        this.table = document.getElementById(tableId);
        this.searchInput = document.getElementById(searchInputId);

        if (!this.table || !this.searchInput) {
            console.error('Table or search input not found');
            return;
        }

        this.init();
    }

    init() {
        this.searchInput.addEventListener('input', (e) => {
            this.filterTable(e.target.value.toLowerCase());
        });

        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.searchInput.value = '';
                this.filterTable('');
            }
        });
    }

    filterTable(searchTerm) {
        const rows = this.table.querySelectorAll('tbody tr');
        let visibleCount = 0;

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });

        // Show "no results" message if needed
        this.showNoResults(visibleCount === 0);
    }

    showNoResults(show) {
        let noResultsRow = this.table.querySelector('.no-results-row');

        if (show && !noResultsRow) {
            const tbody = this.table.querySelector('tbody');
            const colCount = this.table.querySelector('thead tr').cells.length;

            noResultsRow = document.createElement('tr');
            noResultsRow.className = 'no-results-row';
            noResultsRow.innerHTML = `
                <td colspan="${colCount}" style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 48px;">🔍</div>
                    <h3>No matching companies found</h3>
                    <p>Try a different search term</p>
                </td>
            `;
            tbody.appendChild(noResultsRow);
        } else if (!show && noResultsRow) {
            noResultsRow.remove();
        }
    }
}

/**
 * TABLE PAGINATION
 */
class TablePagination {
    constructor(tableId, options = {}) {
        this.table = document.getElementById(tableId);
        this.rowsPerPage = options.rowsPerPage || 10;
        this.currentPage = 1;

        if (!this.table) {
            console.error('Table not found:', tableId);
            return;
        }

        this.init();
    }

    init() {
        const rows = this.table.querySelectorAll('tbody tr');
        this.totalRows = rows.length;
        this.totalPages = Math.ceil(this.totalRows / this.rowsPerPage);

        this.createPaginationControls();
        this.renderPage();
    }

    createPaginationControls() {
        // Remove existing pagination
        const existingPagination = this.table.parentNode.querySelector('.table-pagination');
        if (existingPagination) existingPagination.remove();

        // Create new pagination
        const pagination = document.createElement('div');
        pagination.className = 'table-pagination';

        pagination.innerHTML = `
            <div class="pagination-info">
                Showing <span class="page-start">1</span>-<span class="page-end">${Math.min(this.rowsPerPage, this.totalRows)}</span>
                of <span class="total-rows">${this.totalRows}</span> companies
            </div>
            <div class="pagination-controls">
                <button class="pagination-btn first-page" ${this.currentPage === 1 ? 'disabled' : ''}>«</button>
                <button class="pagination-btn prev-page" ${this.currentPage === 1 ? 'disabled' : ''}>‹</button>
                <span class="page-numbers">
                    Page <input type="number" min="1" max="${this.totalPages}" value="${this.currentPage}" class="page-input">
                    of <span class="total-pages">${this.totalPages}</span>
                </span>
                <button class="pagination-btn next-page" ${this.currentPage === this.totalPages ? 'disabled' : ''}>›</button>
                <button class="pagination-btn last-page" ${this.currentPage === this.totalPages ? 'disabled' : ''}>»</button>
            </div>
        `;

        this.table.parentNode.appendChild(pagination);
        this.bindPaginationEvents(pagination);
    }

    bindPaginationEvents(pagination) {
        // Page input
        const pageInput = pagination.querySelector('.page-input');
        pageInput.addEventListener('change', (e) => {
            const page = parseInt(e.target.value);
            if (page >= 1 && page <= this.totalPages) {
                this.currentPage = page;
                this.renderPage();
                this.createPaginationControls();
            } else {
                e.target.value = this.currentPage;
            }
        });

        // Navigation buttons
        pagination.querySelector('.first-page').addEventListener('click', () => {
            this.currentPage = 1;
            this.renderPage();
            this.createPaginationControls();
        });

        pagination.querySelector('.prev-page').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderPage();
                this.createPaginationControls();
            }
        });

        pagination.querySelector('.next-page').addEventListener('click', () => {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
                this.renderPage();
                this.createPaginationControls();
            }
        });

        pagination.querySelector('.last-page').addEventListener('click', () => {
            this.currentPage = this.totalPages;
            this.renderPage();
            this.createPaginationControls();
        });
    }

    renderPage() {
        const rows = this.table.querySelectorAll('tbody tr');
        const start = (this.currentPage - 1) * this.rowsPerPage;
        const end = start + this.rowsPerPage;

        rows.forEach((row, index) => {
            if (index >= start && index < end) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });

        // Update pagination info
        const startEl = document.querySelector('.page-start');
        const endEl = document.querySelector('.page-end');

        if (startEl && endEl) {
            startEl.textContent = start + 1;
            endEl.textContent = Math.min(end, this.totalRows);
        }
    }
}

/**
 * UTILITY FUNCTIONS
 */
class Utils {
    static formatCurrency(amount) {
        return new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR'
        }).format(amount);
    }

    static formatDate(date) {
        return new Date(date).toLocaleDateString('en-ZA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    static generateId(prefix = 'ID') {
        return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    static showLoader() {
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'flex';
    }

    static hideLoader() {
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'none';
    }
}

/**
 * NOTIFICATION MANAGER
 */
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.maxNotifications = 5;
        this.initContainer();
    }

    initContainer() {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        this.container = container;
    }

    add(notification) {
        const id = 'NOTIF_' + Date.now();
        const notificationObj = {
            id,
            ...notification,
            timestamp: new Date(),
            read: false
        };

        this.notifications.unshift(notificationObj);
        if (this.notifications.length > this.maxNotifications) {
            this.notifications.pop();
        }

        this.render();
        return id;
    }

    render() {
        this.container.innerHTML = '';

        this.notifications.slice(0, this.maxNotifications).forEach(notif => {
            const notifEl = document.createElement('div');
            notifEl.className = `notification ${notif.read ? 'read' : 'unread'}`;
            notifEl.innerHTML = `
                <div class="notification-header">
                    <strong>${notif.title}</strong>
                    <span class="notification-time">${Utils.formatDate(notif.timestamp)}</span>
                </div>
                <div class="notification-body">${notif.message}</div>
            `;

            this.container.appendChild(notifEl);
        });
    }

    markAsRead(id) {
        const notif = this.notifications.find(n => n.id === id);
        if (notif) {
            notif.read = true;
            this.render();
        }
    }

    clearAll() {
        this.notifications = [];
        this.render();
    }
}

/**
 * INITIALIZE MODULES
 */
const dataManager = new DataManager();
const modalManager = new ModalManager();
const notificationManager = new NotificationManager();

/**
 * LOAD COMPANIES FUNCTION
 */
function loadCompanies() {
    const companies = dataManager.getCompanies();
    const tbody = document.querySelector('#companiesTable tbody');

    if (!tbody) {
        console.error('Companies table tbody not found');
        return;
    }

    if (companies.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px;">🏢</div>
                    <h3>No companies found</h3>
                    <p>Get started by creating your first company</p>
                    <button onclick="modalManager.open('companyModal')" class="btn btn-primary">
                        Add Company
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = companies.map(company => `
        <tr>
            <td>${company.id}</td>
            <td>${company.parentId || '-'}</td>
            <td>${company.id}</td>
            <td>${company.name}</td>
            <td>${company.type}</td>
            <td>${company.contact}</td>
            <td>${company.email}</td>
            <td>${company.address || 'N/A'}</td>
            <td><span class="status-badge status-active">Active</span></td>
            <td>
                <button onclick="editCompany('${company.id}')" class="btn-icon" title="Edit">✏️</button>
                <button onclick="deleteCompany('${company.id}')" class="btn-icon" title="Delete">🗑️</button>
                <button onclick="viewCompany('${company.id}')" class="btn-icon" title="View">👁️</button>
            </td>
        </tr>
    `).join('');

    // Reinitialize pagination
    const pagination = new TablePagination('companiesTable', {
        rowsPerPage: 10
    });
}

/**
 * COMPANY FORM HANDLER
 */
document.addEventListener('DOMContentLoaded', function () {
    const companyForm = document.getElementById('companyForm');
    if (companyForm) {
        companyForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const formData = new FormData(e.target);
            const company = {
                name: formData.get('companyName'),
                contact: formData.get('contactPerson'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                type: formData.get('companyType'),
                address: formData.get('address'),
                regNumber: formData.get('regNumber'),
                taxId: formData.get('taxId'),
                industry: formData.get('industry'),
                foundedDate: formData.get('foundedDate')
            };

            // Validate
            const validation = validateForm('companyForm', {
                companyName: [
                    { validate: Validators.required, message: 'Company name is required' }
                ],
                email: [
                    { validate: Validators.required, message: 'Email is required' },
                    { validate: Validators.email, message: 'Invalid email format' }
                ],
                phone: [
                    { validate: Validators.required, message: 'Phone is required' },
                    { validate: Validators.phone, message: 'Invalid phone format' }
                ]
            });

            if (!validation.isValid) {
                Toast.error('Please fix the errors in the form');
                return;
            }

            // Check if editing existing company
            const companyId = formData.get('companyId');

            if (companyId) {
                // Update existing company
                const updated = dataManager.updateCompany(companyId, company);
                if (updated) {
                    Toast.success('Company updated successfully');
                    modalManager.close('companyModal');
                    loadCompanies();
                    notificationManager.add({
                        title: 'Company Updated',
                        message: `${company.name} has been updated`
                    });
                } else {
                    Toast.error('Failed to update company');
                }
            } else {
                // Save new company
                const saved = dataManager.addCompany(company);

                if (saved) {
                    Toast.success('Company created successfully');
                    modalManager.close('companyModal');
                    loadCompanies();
                    notificationManager.add({
                        title: 'New Company',
                        message: `${company.name} has been added`
                    });
                } else {
                    Toast.error('Failed to create company');
                }
            }
        });
    }
});

/**
 * BUTTON HANDLERS
 */
// Edit company
function editCompany(id) {
    const company = dataManager.getCompanyById(id);
    if (company) {
        // Populate form with company data
        const form = document.getElementById('companyForm');
        if (form) {
            form.querySelector('[name="companyName"]').value = company.name || '';
            form.querySelector('[name="contactPerson"]').value = company.contact || '';
            form.querySelector('[name="email"]').value = company.email || '';
            form.querySelector('[name="phone"]').value = company.phone || '';
            form.querySelector('[name="companyType"]').value = company.type || '';
            form.querySelector('[name="address"]').value = company.address || '';
            form.querySelector('[name="regNumber"]').value = company.regNumber || '';
            form.querySelector('[name="taxId"]').value = company.taxId || '';
            form.querySelector('[name="industry"]').value = company.industry || '';
            form.querySelector('[name="foundedDate"]').value = company.foundedDate || '';

            // Add hidden field for company ID
            let idField = form.querySelector('[name="companyId"]');
            if (!idField) {
                idField = document.createElement('input');
                idField.type = 'hidden';
                idField.name = 'companyId';
                form.appendChild(idField);
            }
            idField.value = company.id;
        }

        // Update modal title
        const modalTitle = document.querySelector('#companyModal .modal-header h2');
        if (modalTitle) {
            modalTitle.textContent = 'Edit Company';
        }

        modalManager.open('companyModal');
    }
}

// Generic Confirm Modal
window.showConfirmModal = function (title, message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    if (!modal) {
        if (confirm(message)) onConfirm();
        return;
    }

    document.getElementById('confirmModalTitle').textContent = title;
    document.getElementById('confirmModalMessage').textContent = message;

    const confirmBtn = document.getElementById('confirmModalBtn');
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.onclick = () => {
        onConfirm();
        modal.classList.remove('show');
    };

    modal.classList.add('show');
};

// Delete company
window.deleteCompany = function (id) {
    const company = dataManager.getCompanyById(id);
    if (!company) return;

    // Safegaurd: Check if invoices exist
    const hasInvoices = typeof mockData !== 'undefined' && mockData.invoices && mockData.invoices.some(inv => inv.company === company.name);

    if (hasInvoices) {
        window.showConfirmModal(
            'Cannot Delete Client',
            `Company "${company.name}" has active invoices and cannot be hard-deleted. Do you want to soft-delete (deactivate) instead?`,
            () => {
                company.active = false;
                company.status = 'inactive';
                dataManager.updateCompany(id, company);
                if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
                Toast.info('Company marked as inactive');
                loadCompanies();
                if (typeof renderCompanies === 'function') renderCompanies();
                if (typeof renderDashboard === 'function') renderDashboard();
            }
        );
        return;
    }

    window.showConfirmModal(
        'Delete Company',
        'Are you sure you want to delete this company? This action cannot be undone.',
        () => {
            const deleted = dataManager.deleteCompany(id);
            if (deleted) {
                Toast.success('Company deleted successfully');
                loadCompanies();
                if (typeof renderCompanies === 'function') renderCompanies();
                if (typeof renderDashboard === 'function') renderDashboard();
                notificationManager.add({
                    title: 'Company Deleted',
                    message: `${company?.name || 'Company'} has been deleted`
                });
            } else {
                Toast.error('Failed to delete company');
            }
        }
    );
}

// View company
function viewCompany(id) {
    // In a real application, this would navigate to company details
    const company = dataManager.getCompanyById(id);
    if (company) {
        Toast.info(`Viewing: ${company.name}`, 2000);
        // Here you would typically navigate to a detail page
        // For now, we'll just show an alert with basic info
        const info = `
            Company: ${company.name}
            Contact: ${company.contact}
            Email: ${company.email}
            Phone: ${company.phone}
            Type: ${company.type}
            Address: ${company.address}
        `;
        alert(info);
    }
}

// Export CSV Button
document.addEventListener('DOMContentLoaded', function () {
    const exportBtn = document.getElementById('exportCompaniesBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function () {
            const success = CSVExporter.exportTable('companiesTable', 'companies.csv');
            if (success) {
                Toast.success('Companies exported successfully');
            } else {
                Toast.error('Failed to export companies');
            }
        });
    }
});

// Create Company Button handler
document.addEventListener('DOMContentLoaded', function () {
    const createBtns = document.querySelectorAll('[onclick*="companyModal"], .btn-add-company');
    createBtns.forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            modalManager.open('companyModal');
        });
    });
});

/**
 * UPDATE DASHBOARD METRICS
 */
function updateDashboardMetrics() {
    const companies = dataManager.getCompanies();
    const transactions = dataManager.getAll('transactions');
    const invoices = dataManager.getAll('invoices');

    // Calculate totals
    const totalRevenue = transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const paidInvoices = invoices.filter(i => i.status === 'paid').length;
    const totalInvoices = invoices.length;
    const collectionRate = totalInvoices > 0 ? (paidInvoices / totalInvoices * 100) : 0;

    // Update DOM
    const revenueEl = document.getElementById('totalRevenue');
    if (revenueEl) revenueEl.textContent = Utils.formatCurrency(totalRevenue);

    const rateEl = document.getElementById('collectionRate');
    if (rateEl) rateEl.textContent = collectionRate.toFixed(1) + '%';

    const companiesEl = document.getElementById('totalCompanies');
    if (companiesEl) companiesEl.textContent = companies.length;

    const invoicesEl = document.getElementById('invoicesThisMonth');
    if (invoicesEl) {
        // For demo, show all invoices as this month's
        invoicesEl.textContent = invoices.length;
    }
}

/**
 * INITIALIZE ON PAGE LOAD
 */
document.addEventListener('DOMContentLoaded', function () {
    console.log('Billing System Initialized');

    // Hide loader after page loads
    setTimeout(() => {
        Utils.hideLoader();
    }, 500);

    // Load initial data
    loadCompanies();
    updateDashboardMetrics();

    // Initialize search for companies table
    const searchInput = document.getElementById('companySearchInput');
    if (searchInput) {
        new TableSearch('companiesTable', 'companySearchInput');
    }

    // Initialize modal close buttons
    document.querySelectorAll('.modal .close, .modal .cancel-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const modal = this.closest('.modal');
            if (modal) {
                modalManager.close(modal.id);
            }
        });
    });

    // Add sample data if database is empty
    if (dataManager.getCompanies().length === 0) {
        // Add sample company
        dataManager.addCompany({
            name: 'Sample Corporation',
            contact: 'John Doe',
            email: 'john@sample.com',
            phone: '+27 11 123 4567',
            type: 'parent',
            address: '123 Main Street, Sandton, Johannesburg',
            regNumber: '2020/123456/07',
            taxId: '9012345678',
            industry: 'Technology',
            foundedDate: '2020-01-15'
        });

        // Add sample transactions and invoices
        dataManager.addItem('transactions', {
            amount: 15000,
            type: 'payment',
            description: 'Q1 Payment',
            date: new Date().toISOString()
        });

        dataManager.addItem('invoices', {
            amount: 25000,
            status: 'paid',
            client: 'Sample Corporation',
            dueDate: new Date().toISOString()
        });

        loadCompanies();
        updateDashboardMetrics();
    }

    // Initialize sidebar navigation if it exists
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            if (this.getAttribute('href') === '#') {
                e.preventDefault();
            }
            // Update active state
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
});