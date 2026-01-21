// Configuración de la API
const API_BASE_URL = '/api';

// Estado global de la aplicación
const AppState = {
    user: null,
    token: localStorage.getItem('token'),
    currentSection: 'dashboard'
};

// Utilidades
const Utils = {
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP'
        }).format(amount);
    },

    formatDate: (date) => {
        return new Date(date).toLocaleDateString('es-CO');
    },

    showError: (elementId, message) => {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    },

    hideError: (elementId) => {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    },

    showModal: (content) => {
        const modalOverlay = document.getElementById('modalOverlay');
        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = content;
        modalOverlay.classList.add('active');
    },

    hideModal: () => {
        const modalOverlay = document.getElementById('modalOverlay');
        modalOverlay.classList.remove('active');
    }
};

// API Client
const API = {
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (AppState.token) {
            config.headers.Authorization = `Bearer ${AppState.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error en la petición');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Auth endpoints
    async login(credentials) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    },

    async getMe() {
        return this.request('/auth/me');
    },

    // Dashboard
    async getDashboard() {
        return this.request('/reports/dashboard');
    },

    // Clients
    async getClients(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/clients?${queryString}`);
    },

    async createClient(clientData) {
        return this.request('/clients', {
            method: 'POST',
            body: JSON.stringify(clientData)
        });
    },

    // Loans
    async getLoans(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/loans?${queryString}`);
    },

    async createLoan(loanData) {
        return this.request('/loans', {
            method: 'POST',
            body: JSON.stringify(loanData)
        });
    },

    // Payments
    async getPayments(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/payments?${queryString}`);
    },

    async createPayment(paymentData) {
        return this.request('/payments', {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
    },

    // Reports
    async getOverdueLoans() {
        return this.request('/reports/overdue');
    }
};

// Authentication
const Auth = {
    async login(credentials) {
        try {
            const response = await API.login(credentials);
            AppState.token = response.token;
            AppState.user = response.user;
            localStorage.setItem('token', response.token);
            this.showApp();
            return response;
        } catch (error) {
            Utils.showError('loginError', error.message);
            throw error;
        }
    },

    logout() {
        AppState.token = null;
        AppState.user = null;
        localStorage.removeItem('token');
        this.showLogin();
    },

    showLogin() {
        document.getElementById('loginScreen').classList.add('active');
        document.getElementById('appScreen').classList.remove('active');
    },

    showApp() {
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('appScreen').classList.add('active');
        this.updateUserInfo();
        Dashboard.load();
    },

    updateUserInfo() {
        const userInfo = document.getElementById('userInfo');
        if (AppState.user) {
            userInfo.textContent = `${AppState.user.username} (${AppState.user.role})`;
        }
    },

    async checkAuth() {
        if (AppState.token) {
            try {
                const response = await API.getMe();
                AppState.user = response.user;
                this.showApp();
            } catch (error) {
                this.logout();
            }
        } else {
            this.showLogin();
        }
    }
};

// Dashboard
const Dashboard = {
    async load() {
        try {
            const data = await API.getDashboard();
            this.updateStats(data);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    },

    updateStats(data) {
        // Actualizar estadísticas principales
        document.getElementById('totalClients').textContent = data.clients.total;
        document.getElementById('activeLoans').textContent = data.loans.active;
        document.getElementById('overdueLoans').textContent = data.loans.overdue;
        document.getElementById('todayCollection').textContent = Utils.formatCurrency(data.collections.today.amount);

        // Actualizar resumen financiero
        document.getElementById('totalLent').textContent = Utils.formatCurrency(data.amounts.totalLent);
        document.getElementById('totalCollected').textContent = Utils.formatCurrency(data.amounts.totalCollected);
        document.getElementById('pendingAmount').textContent = Utils.formatCurrency(data.amounts.pending);

        // Actualizar cobranzas
        document.getElementById('todayCollectionDetail').textContent = Utils.formatCurrency(data.collections.today.amount);
        document.getElementById('weekCollection').textContent = Utils.formatCurrency(data.collections.week);
        document.getElementById('monthCollection').textContent = Utils.formatCurrency(data.collections.month);
    }
};

// Clients
const Clients = {
    async load() {
        try {
            const data = await API.getClients();
            this.renderTable(data.clients);
        } catch (error) {
            console.error('Error loading clients:', error);
        }
    },

    renderTable(clients) {
        const tbody = document.querySelector('#clientsTable tbody');
        tbody.innerHTML = '';

        clients.forEach(client => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${client.firstName} ${client.lastName}</td>
                <td>${client.cedula}</td>
                <td>${client.phone}</td>
                <td><span class="status-badge status-${client.status}">${client.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="Clients.view('${client._id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="Clients.edit('${client._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    showCreateModal() {
        const modalContent = `
            <div class="modal-header">
                <h3>Nuevo Cliente</h3>
                <button class="close-modal" onclick="Utils.hideModal()">&times;</button>
            </div>
            <form id="createClientForm">
                <div class="form-group">
                    <label for="firstName">Nombre</label>
                    <input type="text" id="firstName" name="firstName" required>
                </div>
                <div class="form-group">
                    <label for="lastName">Apellido</label>
                    <input type="text" id="lastName" name="lastName" required>
                </div>
                <div class="form-group">
                    <label for="cedula">Cédula</label>
                    <input type="text" id="cedula" name="cedula" required>
                </div>
                <div class="form-group">
                    <label for="phone">Teléfono</label>
                    <input type="text" id="phone" name="phone" required>
                </div>
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email">
                </div>
                <div class="form-group">
                    <label for="address">Dirección</label>
                    <textarea id="address" name="address" rows="3"></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Crear Cliente</button>
            </form>
        `;
        Utils.showModal(modalContent);
    },

    async create(formData) {
        try {
            await API.createClient(formData);
            Utils.hideModal();
            this.load();
        } catch (error) {
            console.error('Error creating client:', error);
        }
    },

    view(clientId) {
        console.log('View client:', clientId);
    },

    edit(clientId) {
        console.log('Edit client:', clientId);
    }
};

// Loans
const Loans = {
    async load() {
        try {
            const data = await API.getLoans();
            this.renderTable(data.loans);
        } catch (error) {
            console.error('Error loading loans:', error);
        }
    },

    renderTable(loans) {
        const tbody = document.querySelector('#loansTable tbody');
        tbody.innerHTML = '';

        loans.forEach(loan => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${loan.client.firstName} ${loan.client.lastName}</td>
                <td>${Utils.formatCurrency(loan.amount)}</td>
                <td>${Utils.formatCurrency(loan.totalAmount)}</td>
                <td>${Utils.formatCurrency(loan.paidAmount)}</td>
                <td>${Utils.formatCurrency(loan.remainingAmount)}</td>
                <td><span class="status-badge status-${loan.status}">${loan.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="Loans.view('${loan._id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-success" onclick="Payments.showCreateModal('${loan._id}')">
                        <i class="fas fa-money-bill-wave"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    view(loanId) {
        console.log('View loan:', loanId);
    }
};

// Payments
const Payments = {
    async load() {
        try {
            const data = await API.getPayments();
            this.renderTable(data.payments);
        } catch (error) {
            console.error('Error loading payments:', error);
        }
    },

    renderTable(payments) {
        const tbody = document.querySelector('#paymentsTable tbody');
        tbody.innerHTML = '';

        payments.forEach(payment => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${Utils.formatDate(payment.paymentDate)}</td>
                <td>${payment.client.firstName} ${payment.client.lastName}</td>
                <td>${Utils.formatCurrency(payment.amount)}</td>
                <td>${payment.paymentMethod}</td>
                <td>${payment.collectedBy.username}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="Payments.view('${payment._id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    showCreateModal(loanId = null) {
        const modalContent = `
            <div class="modal-header">
                <h3>Registrar Pago</h3>
                <button class="close-modal" onclick="Utils.hideModal()">&times;</button>
            </div>
            <form id="createPaymentForm">
                <div class="form-group">
                    <label for="loanId">Préstamo ID</label>
                    <input type="text" id="loanId" name="loanId" value="${loanId || ''}" required>
                </div>
                <div class="form-group">
                    <label for="amount">Monto</label>
                    <input type="number" id="amount" name="amount" step="0.01" required>
                </div>
                <div class="form-group">
                    <label for="paymentMethod">Método de Pago</label>
                    <select id="paymentMethod" name="paymentMethod">
                        <option value="cash">Efectivo</option>
                        <option value="transfer">Transferencia</option>
                        <option value="check">Cheque</option>
                        <option value="other">Otro</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="notes">Notas</label>
                    <textarea id="notes" name="notes" rows="3"></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Registrar Pago</button>
            </form>
        `;
        Utils.showModal(modalContent);
    },

    async create(formData) {
        try {
            await API.createPayment(formData);
            Utils.hideModal();
            this.load();
            Dashboard.load(); // Actualizar dashboard
        } catch (error) {
            console.error('Error creating payment:', error);
        }
    },

    view(paymentId) {
        console.log('View payment:', paymentId);
    }
};

// Reports
const Reports = {
    async load() {
        try {
            const overdueLoans = await API.getOverdueLoans();
            this.renderOverdueLoans(overdueLoans);
        } catch (error) {
            console.error('Error loading reports:', error);
        }
    },

    renderOverdueLoans(loans) {
        const container = document.getElementById('overdueList');
        container.innerHTML = '';

        if (loans.length === 0) {
            container.innerHTML = '<p>No hay préstamos vencidos</p>';
            return;
        }

        loans.forEach(loan => {
            const item = document.createElement('div');
            item.className = 'overdue-item';
            item.innerHTML = `
                <div>
                    <strong>${loan.client.firstName} ${loan.client.lastName}</strong>
                    <br>
                    <small>Cédula: ${loan.client.cedula} | Tel: ${loan.client.phone}</small>
                    <br>
                    <span class="amount danger">Pendiente: ${Utils.formatCurrency(loan.remainingAmount)}</span>
                    <br>
                    <small>Días vencido: ${loan.daysOverdue}</small>
                </div>
            `;
            container.appendChild(item);
        });
    }
};

// Navigation
const Navigation = {
    init() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
            });
        });
    },

    showSection(sectionName) {
        // Actualizar navegación activa
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Mostrar sección
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionName).classList.add('active');

        // Cargar datos de la sección
        AppState.currentSection = sectionName;
        this.loadSectionData(sectionName);
    },

    loadSectionData(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                Dashboard.load();
                break;
            case 'clients':
                Clients.load();
                break;
            case 'loans':
                Loans.load();
                break;
            case 'payments':
                Payments.load();
                break;
            case 'reports':
                Reports.load();
                break;
        }
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        Utils.hideError('loginError');
        
        const formData = new FormData(e.target);
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        try {
            await Auth.login(credentials);
        } catch (error) {
            // Error ya mostrado en Auth.login
        }
    });

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', () => {
        Auth.logout();
    });

    // Modal overlay click to close
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            Utils.hideModal();
        }
    });

    // Add buttons
    document.getElementById('addClientBtn').addEventListener('click', () => {
        Clients.showCreateModal();
    });

    document.getElementById('addPaymentBtn').addEventListener('click', () => {
        Payments.showCreateModal();
    });

    // Form submissions (delegated events)
    document.addEventListener('submit', async (e) => {
        if (e.target.id === 'createClientForm') {
            e.preventDefault();
            const formData = new FormData(e.target);
            const clientData = Object.fromEntries(formData);
            await Clients.create(clientData);
        }

        if (e.target.id === 'createPaymentForm') {
            e.preventDefault();
            const formData = new FormData(e.target);
            const paymentData = Object.fromEntries(formData);
            paymentData.amount = parseFloat(paymentData.amount);
            await Payments.create(paymentData);
        }
    });

    // Initialize navigation
    Navigation.init();

    // Check authentication
    Auth.checkAuth();
});