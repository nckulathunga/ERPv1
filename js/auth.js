/**
 * Auth.js
 * Handles User Authentication and RBAC
 */

const Auth = {
    currentUser: null,

    init() {
        const savedUser = localStorage.getItem('fleetFlowUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
    },

    async login(email, password) {
        if (Store.supabase) {
            const { data, error } = await Store.supabase.auth.signInWithPassword({ email, password });
            if (error) return { success: false, message: error.message };

            // Fetch profile data
            const userProfile = await Store.getById('profiles', data.user.id);
            if (!userProfile || userProfile.status !== 'active') {
                await Store.supabase.auth.signOut();
                return { success: false, message: 'Account is pending approval by Admin.' };
            }

            this.currentUser = { ...data.user, ...userProfile };
            localStorage.setItem('fleetFlowUser', JSON.stringify(this.currentUser));
            return { success: true, user: this.currentUser };
        }

        const users = await Store.getAll('users');
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            if (user.role === 'admin' && user.status !== 'active') {
                user.status = 'active';
                await Store.update('users', user.id, { status: 'active' });
            }

            if (user.status !== 'active') {
                return { success: false, message: 'Account is pending approval by Admin.' };
            }
            this.currentUser = user;
            localStorage.setItem('fleetFlowUser', JSON.stringify(user));
            return { success: true, user };
        }
        return { success: false, message: 'Invalid credentials' };
    },

    async signup(name, email, password, role) {
        if (Store.supabase) {
            const { data, error } = await Store.supabase.auth.signUp({ email, password });
            if (error) return { success: false, message: error.message };

            // Create profile
            await Store.supabase.from('profiles').insert([{
                id: data.user.id,
                name,
                email,
                role,
                status: 'pending'
            }]);

            return { success: true, message: 'Registration successful! Please wait for Admin approval.' };
        }

        const users = await Store.getAll('users');
        if (users.find(u => u.email === email)) {
            return { success: false, message: 'Email already registered' };
        }

        const newUser = {
            id: Date.now(),
            name,
            email,
            password,
            role,
            status: 'pending'
        };

        await Store.add('users', newUser);
        return { success: true, message: 'Registration successful! Please wait for Admin approval.' };
    },

    async updateUserStatus(userId, status) {
        return await Store.update('profiles', userId, { status }) || await Store.update('users', userId, { status });
    },

    logout() {
        this.currentUser = null;
        localStorage.removeItem('fleetFlowUser');
        window.location.reload();
    },

    isAuthenticated() {
        return !!this.currentUser;
        //return true;
    },

    getCurrentUser() {
        return this.currentUser;
    },

    // Check if current user has permission for a specific feature
    async hasPermission(permission) {
        if (!this.currentUser) return false;

        const roleName = (this.currentUser.role || '').toLowerCase();

        // Admins have all permissions
        if (roleName === 'admin') return true;

        // Fetch permissions for this role from the store
        const roles = await Store.getAll('roles');
        const roleObj = roles.find(r => r.name === roleName);

        if (roleObj && roleObj.permissions) {
            return roleObj.permissions.includes(permission);
        }

        return false;
    }
};

Auth.init();
