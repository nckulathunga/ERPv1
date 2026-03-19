/**
 * Store.js
 * Handles data persistence using localStorage.
 * Simulates a database with "tables" for Users, Vehicles, Maintenance, FuelLogs, etc.
 */

const Store = {
    dbName: 'nckulathunga',
    // Supabase Configuration - USER NEEDS TO FILL THESE
    supabaseUrl: 'https://pswajipccmiecdkqrnkv.supabase.co',
    supabaseKey: 'sb_publishable_ORaaWubNVMOpfQ-1G_OjrQ_EvhK-wEl',
    supabase: null,

    init() {
        if (this.supabaseUrl && this.supabaseKey && typeof supabase !== 'undefined') {
            this.supabase = supabase.createClient(this.supabaseUrl, this.supabaseKey);
            console.log('Supabase Initialized');
        } else {
            console.warn('Supabase not configured or script not loaded. Falling back to localStorage.');
        }

        if (!localStorage.getItem(this.dbName)) {
            this.seedData();
        } else {
            this.migrateRoles();
            this.repairUserData();
        }
    },

    repairUserData() {
        const db = this.getDB();
        if (db.users) {
            let changed = false;
            db.users.forEach(user => {
                // If password was wiped, restore to default 'password'
                if (user.password === '' || user.password === undefined || user.password === null) {
                    user.password = 'password';
                    changed = true;
                }
                // Normalize emails to lowercase
                if (user.email && user.email !== user.email.toLowerCase()) {
                    user.email = user.email.toLowerCase();
                    changed = true;
                }
            });
            if (changed) {
                console.log('Repaired corrupted user data.');
                this.saveDB(db);
            }
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
    getTableName(collection) {
        const map = {
            'users': 'profiles',
            'fuelLogs': 'fuel_logs',
            'maintenanceLogs': 'maintenance_logs',
            'generalExpenses': 'general_expenses'
        };
        return map[collection] || collection;
    },

    async getAll(collection) {
        let items = [];
        if (this.supabase) {
            const tableName = this.getTableName(collection);
            const { data, error } = await this.supabase.from(tableName).select('*');
            if (error) {
                console.error(`Error fetching ${collection}:`, error);
            } else {
                items = data || [];
            }
        }

        // Merge local data (or fallback completely if not on Supabase)
        const localItems = this.getAllLocal(collection);
        if (!this.supabase || collection === 'users' || collection === 'roles') {
            localItems.forEach(li => {
                const identifier = collection === 'users' ? 'email' : 'id';
                if (!items.find(i => i[identifier] === li[identifier])) {
                    items.push(li);
                }
            });
        }
        return items;
    },

    getAllLocal(collection) {
        const db = this.getDB();
        return db[collection] || [];
    },

    // Generic Get by ID
    async getById(collection, id) {
        if (this.supabase) {
            const tableName = this.getTableName(collection);
            const { data, error } = await this.supabase.from(tableName).select('*').eq('id', id).single();
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
        if (this.supabase) {
            const tableName = this.getTableName(collection);
            const { data, error } = await this.supabase.from(tableName).insert([item]).select();
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
        let supabaseResult = null;
        if (this.supabase) {
            const tableName = this.getTableName(collection);
            const { data, error } = await this.supabase.from(tableName).update(updates).eq('id', id).select();
            if (error) {
                console.error(`Error updating ${collection}:`, error);
            } else if (data && data.length > 0) {
                supabaseResult = data[0];
            }
        }

        // Also update local if it exists there or if supabase update didn't affect any rows
        const localResult = this.updateLocal(collection, id, updates);
        return supabaseResult || localResult;
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
        if (this.supabase) {
            const tableName = this.getTableName(collection);
            const { error } = await this.supabase.from(tableName).delete().eq('id', id);
            if (error) {
                console.error(`Error deleting from ${collection}:`, error);
            }
        }
        // Always attempt local delete to keep things clean
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
    },

    resetDB() {
        localStorage.removeItem(this.dbName);
        this.init();
    }
};

// Initialize on load
Store.init();
