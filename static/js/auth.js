export async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/check');
        if (response.ok) {
            const data = await response.json();
            return data.authenticated;
        }
    } catch (error) {
        console.error('Auth check failed:', error);
    }
    return false;
}

export async function login(email, password) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        if (response.ok) {
            return { success: true, user: data.user };
        } else {
            return { success: false, error: data.error };
        }
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
}

// Similar functions for register, logout, etc.