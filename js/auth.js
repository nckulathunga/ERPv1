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
        console.log(`[Auth] Attempting login for: ${email}`);
        // Developer Bypass for Rate Limits
        if (email === 'admin@fleetflow.com' && password === 'password' && Store.supabase) {
            const devUser = {
                id: 'dev-admin-id',
                name: 'System Admin (Dev)',
                email: 'admin@fleetflow.com',
                role: 'admin',
                status: 'active'
            };
            this.currentUser = devUser;
            localStorage.setItem('fleetFlowUser', JSON.stringify(devUser));
            return { success: true, user: devUser };
        }

        if (Store.supabase) {
            const { data, error } = await Store.supabase.auth.signInWithPassword({ email, password });
            
            if (!error && data.user) {
                // Fetch profile data
                let userProfile = await Store.getById('profiles', data.user.id);
                
                // Auto-activate admins if local policy allows
                if (userProfile && (userProfile.role === 'admin' || userProfile.role?.name === 'admin') && userProfile.status !== 'active') {
                    console.log(`[Auth] Auto-activating Supabase admin: ${email}`);
                    userProfile.status = 'active';
                    await this.updateUserStatus(data.user.id, 'active');
                }

                if (!userProfile || userProfile.status !== 'active') {
                    await Store.supabase.auth.signOut();
                    const msg = !userProfile ? 'User profile not found. Please contact support.' : 'Account is pending approval by Admin.';
                    return { success: false, message: msg };
                }

                this.currentUser = { ...data.user, ...userProfile };
                localStorage.setItem('fleetFlowUser', JSON.stringify(this.currentUser));
                return { success: true, user: this.currentUser };
            }
            
            // If it's a specific Supabase error (like email not confirmed), return it instead of falling back
            if (error && error.message && !error.message.toLowerCase().includes('invalid login credentials')) {
                console.error('[Auth] Supabase specific error:', error.message);
                return { success: false, message: error.message };
            }

            // If Supabase failed but we have local storage fallback (for development/rate limits)
            console.warn('Supabase login failed or not found. Checking local users...', error ? error.message : '');
        }

        const users = await Store.getAll('users');
        console.log(`[Auth] Local users found: ${users.length}`);
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            const emailMatch = users.find(u => u.email === email);
            if (emailMatch) {
                console.warn(`[Auth] User found with email ${email} but password does not match.`);
            } else {
                console.warn(`[Auth] No user found with email ${email}`);
            }
        } else {
            console.log(`[Auth] Login successful for: ${email} (Status: ${user.status})`);
        }

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
            if (error) {
                // Bypass for Rate Limits during development
                if (error.message.includes('rate limit')) {
                    console.warn('Supabase rate limit hit. Falling back to local storage for this user.');
                    return await this.signupLocal(name, email, password, role);
                }
                return { success: false, message: error.message };
            }

            // Create profile
            const { error: profileError } = await Store.supabase.from('profiles').insert([{
                id: data.user.id,
                name,
                email,
                password, // Store password for management (local fallback consistency)
                role,
                status: 'pending'
            }]);

            if (profileError) {
                console.error('[Auth] Profile creation failed:', profileError.message);
                // If user exists in Auth but not Profile, we might still want to know
                if (profileError.message.includes('unique_email') || profileError.message.includes('already exists')) {
                    return { success: false, message: 'Email already registered or profile exists.' };
                }
                return { success: false, message: 'Profile creation failed: ' + profileError.message };
            }

            return { success: true, message: 'Registration successful! Please wait for Admin approval.' };
        }

        return await this.signupLocal(name, email, password, role);
    },

    async signupLocal(name, email, password, role) {
        const normalizedEmail = email.trim().toLowerCase();
        console.log(`[Auth] Local signup attempt: ${normalizedEmail} as ${role}`);
        const users = await Store.getAll('users');
        if (users.find(u => u.email === normalizedEmail)) {
            console.warn(`[Auth] Signup failed: Email ${normalizedEmail} already registered.`);
            return { success: false, message: 'Email already registered' };
        }

        const newUser = {
            id: Date.now(),
            name,
            email: normalizedEmail,
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

        let roleName = this.currentUser.role || '';
        if (typeof roleName === 'object') roleName = roleName.name || '';
        roleName = roleName.toLowerCase();

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
