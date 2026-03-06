/**
 * App.js
 * Main Controller
 */

const App = {
    currentView: 'dashboard',

    async init() {
        this.setupNavigation();
        await this.checkAuth();
        this.updateUserInfo();
        this.updateLanguageSelectors();
    },

    updateLanguageSelectors() {
        const lang = I18n.currentLang;
        const desktopSelect = document.getElementById('desktop-lang-select');
        const mobileSelect = document.getElementById('mobile-lang-select');
        if (desktopSelect) desktopSelect.value = lang;
        if (mobileSelect) mobileSelect.value = lang;
    },

    async checkAuth() {
        if (!Auth.isAuthenticated()) {
            this.showLogin();
        } else {
            await this.showApp();
        }
    },

    showLogin() {
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('app-container').classList.add('hidden');

        document.getElementById('auth-container').innerHTML = `
            <div class="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md glass-card fade-in">
                <div class="text-center mb-8">
                    <div class="inline-block p-3 rounded-full bg-blue-100 text-primary mb-4">
                         <span class="text-4xl">🚛</span>
                    </div>
                    <h1 class="text-2xl font-bold text-gray-800">${I18n.t('welcome_back')}</h1>
                    <p class="text-gray-500 text-sm">${I18n.t('sign_in_text')}</p>
                    
                     <div class="absolute top-4 right-4">
                        <select onchange="I18n.setLanguage(this.value)" class="text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:ring-0 cursor-pointer">
                            <option value="en" ${I18n.currentLang === 'en' ? 'selected' : ''}>EN</option>
                            <option value="si" ${I18n.currentLang === 'si' ? 'selected' : ''}>SI</option>
                            <option value="ta" ${I18n.currentLang === 'ta' ? 'selected' : ''}>TA</option>
                        </select>
                    </div>

                </div>
                
                <form onsubmit="App.handleLogin(event)" class="space-y-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">${I18n.t('email')}</label>
                        <input 
                            type="email" 
                            id="email" 
                            name="email" 
                            value="admin@fleetflow.com" 
                            class="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            required
                        >
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">${I18n.t('password')}</label>
                        <input 
                            type="password" 
                            id="password" 
                            name="password" 
                            value="password" 
                            class="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            required
                        >
                    </div>
                    <button type="submit" class="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5">
                        ${I18n.t('sign_in')}
                    </button>
                    
                    <div class="text-center mt-4">
                         <button type="button" onclick="App.showSignup()" class="text-sm text-primary hover:underline">
                            ${I18n.t('no_account')}
                        </button>
                    </div>

                    <div class="text-center text-xs text-gray-400 mt-4">
                        <p>${I18n.t('demo_credentials')}</p>
                        <p>admin@fleetflow.com / password</p>
                        <button type="button" onclick="localStorage.clear(); window.location.reload();" class="mt-4 text-red-400 hover:text-red-600 underline">
                            ${I18n.t('reset_demo')}
                        </button>
                    </div>
                </form>
            </div>
        `;
    },

    async showSignup() {
        document.getElementById('auth-container').innerHTML = await UI.renderSignupForm();
    },

    async handleSignup(e) {
        e.preventDefault();
        const name = e.target.name.value;
        const email = e.target.email.value;
        const password = e.target.password.value;
        const role = e.target.role.value;

        const result = await Auth.signup(name, email, password, role);
        if (result.success) {
            alert(result.message);
            this.showLogin();
        } else {
            alert(result.message);
        }
    },

    async showApp() {
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');

        // Render Navigation based on Role
        await this.renderSidebar();

        // Default View
        await this.navigateTo('dashboard');
    },

    updateUserInfo() {
        const user = Auth.getCurrentUser();
        if (user) {
            document.getElementById('user-name').textContent = user.name;
            document.getElementById('user-role').textContent = user.role.toUpperCase();
            document.getElementById('user-avatar').textContent = user.name.split(' ').map(n => n[0]).join('').substring(0, 2);
        }
    },

    async handleLogin(e) {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;

        const result = await Auth.login(email, password);
        if (result.success) {
            await this.checkAuth();
            this.updateUserInfo();
        } else {
            alert(result.message);
        }
    },

    async handleLogout() {
        Auth.logout();
    },

    setupNavigation() {
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());

        // Mobile Interactions
        const menuBtn = document.getElementById('mobile-menu-btn');
        const overlay = document.getElementById('mobile-sidebar-overlay');
        const sidebar = document.getElementById('sidebar');

        const toggleSidebar = () => {
            sidebar.classList.toggle('sidebar-open');
            sidebar.classList.toggle('hidden'); // Simplify for mobile
            overlay.classList.toggle('hidden');
        };

        menuBtn.addEventListener('click', toggleSidebar);
        overlay.addEventListener('click', toggleSidebar);
    },

    async renderSidebar() {
        const nav = document.getElementById('sidebar-nav');

        const items = [
            { id: 'dashboard', label: I18n.t('dashboard'), icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', permission: 'view_dashboard' },
            { id: 'vehicles', label: I18n.t('fleet'), icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16v.01M21 12.14l-3.328-1.745A1.996 1.996 0 0017.306 10H15V6a2 2 0 00-2-2H8a2 2 0 00-2 2v8l3.125 1.625c.343.179.695.344 1.053.493V21H16v-2.015c.358-.149.71-.314 1.053-.493l1.822.947A2 2 0 0021 17.653V12.14z', permission: 'manage_vehicles' },
            { id: 'invoices', label: I18n.t('invoices'), icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', permission: 'manage_invoices' },
            { id: 'expenses', label: I18n.t('expenses'), icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', permission: 'manage_expenses' },
            { id: 'users', label: I18n.t('users'), icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', permission: 'manage_users' },
        ];

        const filteredItems = await Promise.all(items.map(async item => {
            const hasPerm = await Auth.hasPermission(item.permission);
            return hasPerm ? item : null;
        }));

        nav.innerHTML = filteredItems
            .filter(item => item !== null)
            .map(item => `
                <a href="#" onclick="event.preventDefault(); App.navigateTo('${item.id}')" class="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:text-primary hover:bg-blue-50 transition-colors">
                    <svg class="mr-3 h-6 w-6 text-gray-400 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${item.icon}"></path></svg>
                    ${item.label}
                </a>
            `).join('');
    },

    async navigateTo(pageId) {
        this.currentView = pageId;
        await this.renderSidebar();

        // Specific view permission checks
        if (pageId === 'dashboard' && !await Auth.hasPermission('view_dashboard')) {
            const nextBest = await (async () => {
                for (const p of ['vehicles', 'expenses', 'invoices']) {
                    if (await Auth.hasPermission(`manage_${p}`)) return p;
                }
                return null;
            })();
            if (nextBest) return await this.navigateTo(nextBest);
        }

        if (pageId === 'users' && !await Auth.hasPermission('manage_users')) {
            return await this.navigateTo('dashboard');
        }

        switch (pageId) {
            case 'dashboard':
                await UI.renderDashboard();
                break;
            case 'vehicles':
                await UI.renderVehicles();
                break;
            case 'invoices':
                await UI.renderInvoices();
                break;
            case 'expenses':
                await UI.renderExpenses();
                break;
            case 'users':
                await UI.renderUserManagement();
                break;
        }
    },

    async handleUserAction(userId, status) {
        if (confirm(`Are you sure you want to set this user to ${status}?`)) {
            await Auth.updateUserStatus(userId, status);
            await this.navigateTo('users'); // Refresh
        }
    },

    editUser(userId) {
        this.openModal('edit_user', userId);
    },

    async handleEditUserSubmit(e, userId) {
        e.preventDefault();
        const data = new FormData(e.target);

        const updates = {
            name: data.get('name'),
            email: data.get('email'),
            password: data.get('password'),
            role: data.get('role'),
            status: data.get('status')
        };

        await Store.update('users', userId, updates);
        this.closeModal();
        await this.navigateTo('users');
    },

    async deleteUser(userId) {
        if (confirm(I18n.t('confirm_delete'))) {
            await Store.delete('users', userId);
            await this.navigateTo('users');
        }
    },

    // Role Management
    addRole() {
        this.openModal('add_role');
    },

    editRole(oldName) {
        this.openModal('edit_role', oldName);
    },

    async deleteRole(roleName) {
        if (confirm(I18n.t('confirm_delete'))) {
            let roles = (await Store.getAll('roles')) || [];
            roles = roles.filter(r => r.name !== roleName);
            await Store.save('roles', roles);
            await this.navigateTo('users');
        }
    },

    async handleAddRoleSubmit(e) {
        e.preventDefault();
        const data = new FormData(e.target);
        const roleName = data.get('roleName').toLowerCase().trim();
        const permissions = data.getAll('permissions');

        let roles = (await Store.getAll('roles')) || [];
        if (!roles.find(r => r.name === roleName) && roleName) {
            roles.push({ name: roleName, permissions });
            await Store.save('roles', roles);
        }
        this.closeModal();
        await this.navigateTo('users');
    },

    async handleEditRoleSubmit(e, oldName) {
        e.preventDefault();
        const data = new FormData(e.target);
        const newName = data.get('roleName').toLowerCase().trim();
        const permissions = data.getAll('permissions');

        let roles = (await Store.getAll('roles')) || [];
        const index = roles.findIndex(r => r.name === oldName);
        if (index !== -1 && newName) {
            roles[index] = { name: newName, permissions };
            await Store.save('roles', roles);

            // Also update users with old role
            const users = (await Store.getAll('users')) || [];
            await Promise.all(users.map(async u => {
                if (u.role === oldName) {
                    await Store.update('users', u.id, { role: newName });
                }
            }));
        }
        this.closeModal();
        await this.navigateTo('users');
    },

    // --- Actions ---

    viewVehicleDetails(id) {
        UI.renderVehicleDetails(id);
    },

    async openModal(type, id = null) {
        if (type === 'vehicle') {
            const form = await UI.renderVehicleForm();
            UI.renderModal(I18n.t('add_vehicle'), form);
        } else if (type === 'fuel') {
            const form = await UI.renderFuelForm(id);
            UI.renderModal(I18n.t('log_fuel'), form);
        } else if (type === 'maintenance') {
            const form = await UI.renderMaintenanceForm(id);
            UI.renderModal(I18n.t('log_maintenance'), form);
        } else if (type === 'invoice') {
            const form = await UI.renderInvoiceForm();
            UI.renderModal(I18n.t('create_invoice'), form);
        } else if (type === 'edit_user') {
            console.log('Edit user called with ID:', id);
            const user = await Store.getById('users', id);
            console.log('User found:', user);
            if (user) {
                const form = await UI.renderEditUserForm(user);
                UI.renderModal(I18n.t('edit_user'), form);
            } else {
                console.error('User not found with ID:', id);
                alert('User not found!');
            }
        } else if (type === 'edit_vehicle') {
            const vehicle = await Store.getById('vehicles', id);
            if (vehicle) {
                const form = await UI.renderEditVehicleForm(vehicle);
                UI.renderModal(I18n.t('edit_vehicle'), form);
            }
        } else if (type === 'edit_fuel') {
            const log = await Store.getById('fuelLogs', id);
            if (log) {
                const form = await UI.renderEditFuelForm(log);
                UI.renderModal(I18n.t('edit_fuel_log'), form);
            }
        } else if (type === 'edit_maintenance') {
            const log = await Store.getById('maintenanceLogs', id);
            if (log) {
                const form = await UI.renderEditMaintenanceForm(log);
                UI.renderModal(I18n.t('edit_maintenance_log'), form);
            }
        } else if (type === 'edit_invoice') {
            const invoice = await Store.getById('invoices', id);
            if (invoice) {
                const form = await UI.renderEditInvoiceForm(invoice);
                UI.renderModal(I18n.t('edit_invoice'), form);
            }
        } else if (type === 'general_expense') {
            const form = await UI.renderGeneralExpenseForm();
            UI.renderModal(I18n.t('log_general_expense'), form);
        } else if (type === 'edit_general_expense') {
            const expense = await Store.getById('generalExpenses', id);
            if (expense) {
                const form = await UI.renderEditGeneralExpenseForm(expense);
                UI.renderModal(I18n.t('edit_expense'), form);
            }
        } else if (type === 'add_role') {
            const form = await UI.renderRoleForm();
            UI.renderModal(I18n.t('add_role'), form);
        } else if (type === 'edit_role') {
            const form = await UI.renderRoleForm(id);
            UI.renderModal(I18n.t('edit_role'), form);
        }
    },

    closeModal() {
        document.getElementById('modal-container').innerHTML = '';
    },

    async handleVehicleSubmit(e) {
        e.preventDefault();
        const data = new FormData(e.target);
        const vehicle = {
            id: 'V' + Date.now().toString().slice(-4),
            plate: data.get('plate'),
            make: data.get('make'),
            model: data.get('model'),
            year: parseInt(data.get('year')),
            mileage: parseInt(data.get('mileage')),
            status: 'Active'
        };

        await Store.add('vehicles', vehicle);
        this.closeModal();
        await this.navigateTo('vehicles');
    },

    async deleteVehicle(id) {
        if (confirm(I18n.t('confirm_delete'))) {
            await Store.delete('vehicles', id);
            await this.navigateTo('vehicles');
        }
    },

    editVehicle(id) {
        this.openModal('edit_vehicle', id);
    },

    editFuelLog(id) {
        this.openModal('edit_fuel', id);
    },

    async handleEditVehicleSubmit(e, id) {
        e.preventDefault();
        const data = new FormData(e.target);
        const updates = {
            plate: data.get('plate'),
            make: data.get('make'),
            model: data.get('model'),
            year: parseInt(data.get('year')),
            mileage: parseInt(data.get('mileage')),
            status: data.get('status')
        };

        await Store.update('vehicles', id, updates);
        this.closeModal();
        await this.navigateTo('vehicles');
    },

    async handleFuelSubmit(e, vid) {
        e.preventDefault();
        const data = new FormData(e.target);
        const vehicleId = vid || data.get('vehicleId');
        const log = {
            id: Date.now(),
            vehicleId: vehicleId,
            date: data.get('date'),
            liters: parseFloat(data.get('liters')),
            cost: parseFloat(data.get('cost')),
            odometer: parseInt(data.get('odometer'))
        };

        // Update Vehicle Mileage
        const vehicle = await Store.getById('vehicles', vehicleId);
        if (vehicle && log.odometer > vehicle.mileage) {
            await Store.update('vehicles', vehicleId, { mileage: log.odometer });
        }

        await Store.add('fuelLogs', log);
        this.closeModal();
        if (this.currentView === 'expenses') {
            await this.navigateTo('expenses');
        } else {
            await this.viewVehicleDetails(vehicleId);
        }
    },

    async deleteFuelLog(id) {
        if (confirm(I18n.t('confirm_delete'))) {
            const log = await Store.getById('fuelLogs', id);
            if (log) {
                const vehicleId = log.vehicleId;
                await Store.delete('fuelLogs', id);
                if (this.currentView === 'expenses') {
                    await this.navigateTo('expenses');
                } else {
                    await this.viewVehicleDetails(vehicleId);
                }
            }
        }
    },

    editMaintenanceLog(id) {
        this.openModal('edit_maintenance', id);
    },

    async handleEditMaintenanceSubmit(e, id) {
        e.preventDefault();
        const data = new FormData(e.target);
        const log = await Store.getById('maintenanceLogs', id);

        const updates = {
            date: data.get('date'),
            description: data.get('description'),
            type: data.get('type'),
            cost: parseFloat(data.get('cost'))
        };

        await Store.update('maintenanceLogs', id, updates);

        this.closeModal();
        if (this.currentView === 'expenses') {
            await this.navigateTo('expenses');
        } else if (log) {
            await this.viewVehicleDetails(log.vehicleId);
        }
    },

    async deleteMaintenanceLog(id) {
        if (confirm(I18n.t('confirm_delete'))) {
            const log = await Store.getById('maintenanceLogs', id);
            if (log) {
                const vehicleId = log.vehicleId;
                await Store.delete('maintenanceLogs', id);
                if (this.currentView === 'expenses') {
                    await this.navigateTo('expenses');
                } else {
                    await this.viewVehicleDetails(vehicleId);
                }
            }
        }
    },

    async handleInvoiceSubmit(e) {
        e.preventDefault();
        const data = new FormData(e.target);
        const invoice = {
            id: 'INV-' + Date.now().toString().slice(-5),
            clientId: data.get('client'),
            issueDate: data.get('date'),
            amount: parseFloat(data.get('amount')),
            status: data.get('status')
        };

        await Store.add('invoices', invoice);
        this.closeModal();
        await this.navigateTo('invoices');
    },

    editInvoice(id) {
        this.openModal('edit_invoice', id);
    },

    async handleEditInvoiceSubmit(e, id) {
        e.preventDefault();
        const data = new FormData(e.target);

        const updates = {
            clientId: data.get('client'),
            issueDate: data.get('date'),
            amount: parseFloat(data.get('amount')),
            status: data.get('status')
        };

        await Store.update('invoices', id, updates);
        this.closeModal();
        await this.navigateTo('invoices');
    },

    async deleteInvoice(id) {
        if (confirm(I18n.t('confirm_delete'))) {
            await Store.delete('invoices', id);
            await this.navigateTo('invoices');
        }
    },

    async handleGeneralExpenseSubmit(e) {
        e.preventDefault();
        const data = new FormData(e.target);
        const expense = {
            id: Date.now(),
            type: data.get('type'),
            date: data.get('date'),
            description: data.get('description'),
            cost: parseFloat(data.get('cost')),
            vehicleId: data.get('vehicleId') || null
        };

        await Store.add('generalExpenses', expense);
        this.closeModal();
        await this.navigateTo('expenses');
    },

    editGeneralExpense(id) {
        this.openModal('edit_general_expense', id);
    },

    async handleEditGeneralExpenseSubmit(e, id) {
        e.preventDefault();
        const data = new FormData(e.target);
        const updates = {
            type: data.get('type'),
            date: data.get('date'),
            description: data.get('description'),
            cost: parseFloat(data.get('cost')),
            vehicleId: data.get('vehicleId') || null
        };

        await Store.update('generalExpenses', id, updates);
        this.closeModal();
        await this.navigateTo('expenses');
    },

    async deleteGeneralExpense(id) {
        if (confirm(I18n.t('confirm_delete'))) {
            await Store.delete('generalExpenses', id);
            await this.navigateTo('expenses');
        }
    },

    async printInvoice(id) {
        const invoice = await Store.getById('invoices', id);
        if (!invoice) return;

        // Simple Print View Injection
        const printArea = document.createElement('div');
        printArea.id = 'invoice-print-section';
        printArea.innerHTML = `
            <div class="p-8 max-w-4xl mx-auto">
                <div class="flex justify-between items-center mb-8">
                    <h1 class="text-4xl font-bold text-gray-800">INVOICE</h1>
                    <div class="text-right">
                        <p class="font-bold text-xl text-primary">${I18n.t('app_name')}</p>
                        <p class="text-sm text-gray-500">123 Logistics Way</p>
                    </div>
                </div>
                <div class="bg-gray-50 p-6 rounded-lg mb-8">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-sm text-gray-500 uppercase">${I18n.t('bill_to')}</p>
                            <p class="font-bold text-lg">${invoice.clientId}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm text-gray-500 uppercase">${I18n.t('invoice_num')}</p>
                            <p class="font-bold">${invoice.id}</p>
                            <p class="text-sm text-gray-500 uppercase mt-2">${I18n.t('issue_date')}</p>
                            <p class="font-bold">${invoice.issueDate}</p>
                        </div>
                    </div>
                </div>
                <table class="w-full mb-8">
                    <thead>
                        <tr class="border-b-2 border-gray-800">
                            <th class="text-left py-2">${I18n.t('description')}</th>
                            <th class="text-right py-2">${I18n.t('amount')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="border-b border-gray-200">
                            <td class="py-4">${I18n.t('logistics_services')}</td>
                            <td class="text-right py-4">${UI.formatCurrency(invoice.amount)}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td class="pt-4 font-bold text-right">${I18n.t('total')}</td>
                            <td class="pt-4 font-bold text-right text-xl">${UI.formatCurrency(invoice.amount)}</td>
                        </tr>
                    </tfoot>
                </table>
                <div class="mt-12 text-center text-gray-500 text-sm">
                    <p>${I18n.t('thank_you')}</p>
                </div>
            </div>
        `;
        document.body.appendChild(printArea);
        window.print();
        document.body.removeChild(printArea);
    },

    async exportDashboard(format) {
        if (!await Auth.hasPermission('export_reports')) {
            alert(I18n.t('no_permission') || 'You do not have permission to export reports.');
            return;
        }
        // 1. Get filtered data (reusing UI filter logic if possible, or re-implementing)
        let fuelLogs = (await Store.getAll('fuelLogs')) || [];
        let maintenanceLogs = (await Store.getAll('maintenanceLogs')) || [];
        let generalExpenses = (await Store.getAll('generalExpenses')) || [];
        let invoices = (await Store.getAll('invoices')) || [];

        // Apply date filters from UI
        fuelLogs = UI.filterByDate(fuelLogs, 'date');
        maintenanceLogs = UI.filterByDate(maintenanceLogs, 'date');
        generalExpenses = UI.filterByDate(generalExpenses, 'date');
        invoices = UI.filterByDate(invoices, 'issueDate');

        // Apply vehicle filter from UI
        const currentVehicleId = UI.dashboardFilter.vehicleId;
        if (currentVehicleId !== 'all') {
            fuelLogs = fuelLogs.filter(l => l.vehicleId === currentVehicleId);
            maintenanceLogs = maintenanceLogs.filter(l => l.vehicleId === currentVehicleId);
            generalExpenses = generalExpenses.filter(l => l.vehicleId === currentVehicleId);
        }

        const fileName = `FleetFlow_Report_${new Date().toISOString().split('T')[0]}`;

        if (format === 'excel') {
            this.exportToExcel(fuelLogs, maintenanceLogs, generalExpenses, invoices, fileName);
        } else if (format === 'pdf') {
            this.exportToPDF(fuelLogs, maintenanceLogs, generalExpenses, invoices, fileName);
        }
    },

    async exportExpenses(format) {
        if (!await Auth.hasPermission('export_reports')) {
            alert(I18n.t('no_permission') || 'You do not have permission to export reports.');
            return;
        }
        let fuel = (await Store.getAll('fuelLogs')) || [];
        let maintenance = (await Store.getAll('maintenanceLogs')) || [];
        let generalExpenses = (await Store.getAll('generalExpenses')) || [];

        // Apply filters
        fuel = UI.filterItemsByDate(fuel, UI.expensesFilter, 'date');
        maintenance = UI.filterItemsByDate(maintenance, UI.expensesFilter, 'date');
        generalExpenses = UI.filterItemsByDate(generalExpenses, UI.expensesFilter, 'date');

        if (UI.expensesFilter.vehicleId !== 'all') {
            fuel = fuel.filter(l => l.vehicleId === UI.expensesFilter.vehicleId);
            maintenance = maintenance.filter(l => l.vehicleId === UI.expensesFilter.vehicleId);
            generalExpenses = generalExpenses.filter(l => l.vehicleId === UI.expensesFilter.vehicleId);
        }

        const fileName = `FleetFlow_Expenses_${new Date().toISOString().split('T')[0]}`;

        if (format === 'excel') {
            this.exportToExcel(fuel, maintenance, generalExpenses, [], fileName);
        } else if (format === 'pdf') {
            this.exportToPDF(fuel, maintenance, generalExpenses, [], fileName);
        }
    },

    async exportToExcel(fuel, maintenance, general, invoices, fileName) {
        const wb = XLSX.utils.book_new();

        // Helper to get plate number
        const getPlate = async (id) => {
            const v = await Store.getById('vehicles', id);
            return v ? v.plate : id;
        };

        // Fuel Logs Sheet
        const fuelData = await Promise.all(fuel.map(async l => ({
            Date: l.date,
            'Vehicle (Plate)': await getPlate(l.vehicleId),
            Liters: l.liters,
            'Cost (Rs.)': l.cost,
            'Odometer (km)': l.odometer
        })));
        const wsFuel = XLSX.utils.json_to_sheet(fuelData);
        XLSX.utils.book_append_sheet(wb, wsFuel, "Fuel Logs");

        // Maintenance Sheet
        const maintData = await Promise.all(maintenance.map(async l => ({
            Date: l.date,
            'Vehicle (Plate)': await getPlate(l.vehicleId),
            Description: l.description,
            Type: l.type,
            'Cost (Rs.)': l.cost
        })));
        const wsMaint = XLSX.utils.json_to_sheet(maintData);
        XLSX.utils.book_append_sheet(wb, wsMaint, "Maintenance");

        // General Expenses Sheet
        const generalData = await Promise.all(general.map(async l => ({
            Date: l.date,
            Category: I18n.t(l.type) || l.type,
            Description: l.description,
            'Vehicle (Plate)': await getPlate(l.vehicleId),
            'Cost (Rs.)': l.cost
        })));
        const wsGeneral = XLSX.utils.json_to_sheet(generalData);
        XLSX.utils.book_append_sheet(wb, wsGeneral, "General Expenses");

        // Invoices Sheet
        const invData = invoices.map(i => ({
            'Invoice #': i.id,
            'Client Name': i.clientId,
            'Issue Date': i.issueDate,
            'Amount (Rs.)': i.amount,
            Status: i.status
        }));
        const wsInv = XLSX.utils.json_to_sheet(invData);
        XLSX.utils.book_append_sheet(wb, wsInv, "Invoices");

        XLSX.writeFile(wb, `${fileName}.xlsx`);
    },

    async exportToPDF(fuel, maintenance, general, invoices, fileName) {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            alert('PDF library (jsPDF) is not loaded. Please check your internet connection and reload.');
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        if (typeof doc.autoTable !== 'function') {
            alert('PDF Table library (jspdf-autotable) is not loaded. Please reload the page.');
            return;
        }

        const getPlate = async (id) => {
            const v = await Store.getById('vehicles', id);
            return v ? v.plate : id;
        };

        doc.setFontSize(18);
        doc.text('FleetFlow Dashboard Report', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

        let finalY = 35;

        // Invoices Section
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('Invoices Summary', 14, finalY + 10);
        doc.autoTable({
            startY: finalY + 15,
            head: [['Invoice #', 'Client', 'Date', 'Amount (Rs.)', 'Status']],
            body: invoices.map(i => [i.id, i.clientId, i.issueDate, i.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }), i.status]),
        });
        finalY = doc.lastAutoTable.finalY;

        // Fuel Section
        doc.text('Fuel Consumption History', 14, finalY + 15);
        const fuelBody = await Promise.all(fuel.map(async l => [l.date, await getPlate(l.vehicleId), l.liters, l.cost.toLocaleString(undefined, { minimumFractionDigits: 2 }), l.odometer.toLocaleString()]));
        doc.autoTable({
            startY: finalY + 20,
            head: [['Date', 'Vehicle (Plate)', 'Liters', 'Cost (Rs.)', 'Odometer (km)']],
            body: fuelBody,
        });
        finalY = doc.lastAutoTable.finalY;

        // Maintenance Section
        if (finalY > 210) { doc.addPage(); finalY = 10; }
        doc.text('Maintenance History', 14, finalY + 15);
        const maintBody = await Promise.all(maintenance.map(async l => [l.date, await getPlate(l.vehicleId), l.description, l.type, l.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })]));
        doc.autoTable({
            startY: finalY + 20,
            head: [['Date', 'Vehicle (Plate)', 'Description', 'Type', 'Cost (Rs.)']],
            body: maintBody,
        });
        finalY = doc.lastAutoTable.finalY;

        // General Expenses Section
        if (finalY > 210) { doc.addPage(); finalY = 10; }
        doc.text('General Expenses History', 14, finalY + 15);
        const generalBody = await Promise.all(general.map(async l => [l.date, I18n.t(l.type) || l.type, l.description, await getPlate(l.vehicleId), l.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })]));
        doc.autoTable({
            startY: finalY + 20,
            head: [['Date', 'Category', 'Description', 'Vehicle (Plate)', 'Cost (Rs.)']],
            body: generalBody,
        });

        doc.save(`${fileName}.pdf`);
    }
};

// Start App
document.addEventListener('DOMContentLoaded', () => App.init());
