/**
 * Store.js
 * Handles data persistence using localStorage.
 * Simulates a database with "tables" for Users, Vehicles, Maintenance, FuelLogs, etc.
 */

const Store = {
    dbName: 'FleetFlowDB',
    // Supabase Configuration - USER NEEDS TO FILL THESE
    supabaseUrl: 'YOUR_SUPABASE_URL',
    supabaseKey: 'YOUR_SUPABASE_ANON_KEY',
    supabase: null,

    init() {
        if (this.supabaseUrl !== 'YOUR_SUPABASE_URL' && typeof supabase !== 'undefined') {
            this.supabase = supabase.createClient(this.supabaseUrl, this.supabaseKey);
            console.log('Supabase Initialized');
        } else {
            console.warn('Supabase not configured or script not loaded. Falling back to localStorage.');
        }

        if (!localStorage.getItem(this.dbName)) {
            this.seedData();
        } else {
            this.migrateRoles();
        }
    },

    migrateRoles() {
        const db = this.getDB();
        if (db.roles && db.roles.length > 0 && typeof db.roles[0] === 'string') {
            console.log('Migrating legacy roles to object format...');
            const defaultPermissions = {
                admin: ['view_dashboard', 'manage_vehicles', 'manage_expenses', 'manage_fuel_logs', 'manage_maintenance_logs', 'manage_invoices', 'manage_users', 'export_reports'],
                manager: ['view_dashboard', 'manage_vehicles', 'manage_expenses', 'manage_fuel_logs', 'manage_maintenance_logs', 'export_reports'],
                finance: ['view_dashboard', 'manage_expenses', 'manage_invoices', 'export_reports'],
                supervisor: ['manage_vehicles', 'manage_expenses', 'manage_fuel_logs', 'manage_maintenance_logs'],
                driver: ['manage_expenses', 'manage_fuel_logs'],
                accountant: ['view_dashboard', 'manage_expenses', 'manage_invoices', 'export_reports']
            };

            db.roles = db.roles.map(roleName => ({
                name: roleName,
                permissions: defaultPermissions[roleName] || []
            }));
            this.saveDB(db);
        }
    },

    seedData() {
        const initialData = {
            users: [
                { id: 1, name: 'Admin User', email: 'admin@fleetflow.com', password: 'password', role: 'admin', status: 'active' },
                { id: 2, name: 'Fleet Manager', email: 'manager@fleetflow.com', password: 'password', role: 'manager', status: 'active' },
                { id: 3, name: 'Finance User', email: 'finance@fleetflow.com', password: 'password', role: 'finance', status: 'active' },
                { id: 4, name: 'Driver Dave', email: 'driver@fleetflow.com', password: 'password', role: 'driver', status: 'active' },
            ],
            vehicles: [
                { id: 'V001', make: 'Volvo', model: 'FH16', year: 2022, plate: 'ABC-1234', status: 'Active', mileage: 120000 },
                { id: 'V002', make: 'Scania', model: 'R450', year: 2021, plate: 'XYZ-5678', status: 'Maintenance', mileage: 154000 },
                { id: 'V003', make: 'Mercedes', model: 'Actros', year: 2023, plate: 'LMN-9012', status: 'Active', mileage: 45000 },
            ],
            fuelLogs: [
                { id: 1, vehicleId: 'V001', date: '2023-10-01', liters: 300, cost: 450.00, odometer: 118000 },
                { id: 2, vehicleId: 'V001', date: '2023-10-05', liters: 280, cost: 420.00, odometer: 119500 },
                { id: 3, vehicleId: 'V003', date: '2023-10-02', liters: 350, cost: 525.00, odometer: 44000 },
            ],
            maintenanceLogs: [
                { id: 1, vehicleId: 'V002', date: '2023-09-15', description: 'Oil Change', cost: 250.00, type: 'Routine' },
                { id: 2, vehicleId: 'V002', date: '2023-10-10', description: 'Brake Replacement', cost: 1200.00, type: 'Repair' },
            ],
            invoices: [
                { id: 'INV-001', clientId: 'Client A', amount: 5000.00, issueDate: '2023-10-01', status: 'Paid' },
                { id: 'INV-002', clientId: 'Client B', amount: 3200.00, issueDate: '2023-10-05', status: 'Pending' },
            ],
            roles: [
                { name: 'admin', permissions: ['view_dashboard', 'manage_vehicles', 'manage_expenses', 'manage_fuel_logs', 'manage_maintenance_logs', 'manage_invoices', 'manage_users', 'export_reports'] },
                { name: 'manager', permissions: ['view_dashboard', 'manage_vehicles', 'manage_expenses', 'manage_fuel_logs', 'manage_maintenance_logs', 'export_reports'] },
                { name: 'finance', permissions: ['view_dashboard', 'manage_expenses', 'manage_invoices', 'export_reports'] },
                { name: 'supervisor', permissions: ['manage_vehicles', 'manage_expenses', 'manage_fuel_logs', 'manage_maintenance_logs'] },
                { name: 'driver', permissions: ['manage_expenses', 'manage_fuel_logs'] },
                { name: 'accountant', permissions: ['view_dashboard', 'manage_expenses', 'manage_invoices', 'export_reports'] }
            ],
            generalExpenses: []
        };
        localStorage.setItem(this.dbName, JSON.stringify(initialData));
        console.log('Database Seeded');
    },

    getDB() {
        return JSON.parse(localStorage.getItem(this.dbName)) || {};
    },

    saveDB(data) {
        localStorage.setItem(this.dbName, JSON.stringify(data));
    },

    // Generic Get All
    async getAll(collection) {
        if (this.supabase && collection !== 'roles') { // Keep roles in local/meta for simplicity or fetch if needed
            const { data, error } = await this.supabase.from(collection).select('*');
            if (error) {
                console.error(`Error fetching ${collection}:`, error);
                return this.getAllLocal(collection);
            }
            return data;
        }
        return this.getAllLocal(collection);
    },

    getAllLocal(collection) {
        const db = this.getDB();
        return db[collection] || [];
    },

    // Generic Get by ID
    async getById(collection, id) {
        if (this.supabase && collection !== 'roles') {
            const { data, error } = await this.supabase.from(collection).select('*').eq('id', id).single();
            if (error) {
                console.error(`Error fetching ${collection} by ID:`, error);
                return this.getAllLocal(collection).find(item => item.id == id);
            }
            return data;
        }
        const items = this.getAllLocal(collection);
        return items.find(item => item.id == id);
    },

    // Generic Add
    async add(collection, item) {
        if (this.supabase && collection !== 'roles') {
            const { data, error } = await this.supabase.from(collection).insert([item]).select();
            if (error) {
                console.error(`Error adding to ${collection}:`, error);
                return this.addLocal(collection, item);
            }
            return data[0];
        }
        return this.addLocal(collection, item);
    },

    addLocal(collection, item) {
        const db = this.getDB();
        if (!db[collection]) db[collection] = [];

        if (!item.id) {
            item.id = Date.now();
        }

        db[collection].push(item);
        this.saveDB(db);
        return item;
    },

    // Generic Update
    async update(collection, id, updates) {
        if (this.supabase && collection !== 'roles') {
            const { data, error } = await this.supabase.from(collection).update(updates).eq('id', id).select();
            if (error) {
                console.error(`Error updating ${collection}:`, error);
                return this.updateLocal(collection, id, updates);
            }
            return data[0];
        }
        return this.updateLocal(collection, id, updates);
    },

    updateLocal(collection, id, updates) {
        const db = this.getDB();
        const index = db[collection].findIndex(item => item.id == id);
        if (index !== -1) {
            db[collection][index] = { ...db[collection][index], ...updates };
            this.saveDB(db);
            return db[collection][index];
        }
        return null;
    },

    // Generic Delete
    async delete(collection, id) {
        if (this.supabase && collection !== 'roles') {
            const { error } = await this.supabase.from(collection).delete().eq('id', id);
            if (error) {
                console.error(`Error deleting from ${collection}:`, error);
                this.deleteLocal(collection, id);
            }
            return;
        }
        this.deleteLocal(collection, id);
    },

    deleteLocal(collection, id) {
        const db = this.getDB();
        const filtered = db[collection].filter(item => item.id != id);
        db[collection] = filtered;
        this.saveDB(db);
    },

    // Save entire collection (for arrays like roles)
    save(collection, data) {
        const db = this.getDB();
        db[collection] = data;
        this.saveDB(db);
    },

    // Specialized Logic
    async calculateEfficiency(vehicleId) {
        const allLogs = await this.getAll('fuelLogs');
        const logs = allLogs.filter(l => l.vehicleId === vehicleId).sort((a, b) => new Date(a.date) - new Date(b.date));
        if (logs.length < 2) return 0;

        let totalFuel = 0;
        const first = logs[0];
        const last = logs[logs.length - 1];
        const totalDist = last.odometer - first.odometer;

        for (let i = 1; i < logs.length; i++) {
            totalFuel += parseFloat(logs[i].liters);
        }

        if (totalFuel === 0) return 0;
        return (totalDist / totalFuel).toFixed(2); // km/L
    }
};

// Initialize on load
Store.init();
