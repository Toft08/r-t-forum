const routes = {
    'login': {
        view: 'auth-view',
        init: showLoginForm
    },
    'register': {
        view: 'auth-view',
        init: showRegisterForm
    },
    'main': {
        view: 'main-view',
        init: initMainView
    }
};

export function initRouter(initialRoute) {
    // Show initial route
    navigateTo(initialRoute);
    
    // Handle navigation events
    window.addEventListener('popstate', handlePopState);
}

export function navigateTo(routeName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.add('hidden');
    });
    
    const route = routes[routeName];
    if (route) {
        // Show the selected view
        document.getElementById(route.view).classList.remove('hidden');
        
        // Initialize the view
        if (route.init) route.init();
        
        // Update browser history
        history.pushState(null, null, `#${routeName}`);
    }
}

function showLoginForm() {
    // Hide register form, show login form
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
}

function showRegisterForm() {
    // Hide login form, show register form
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
}

function initMainView() {
    // Initialize main view components
    // (posts, chat, etc.)
}

function handlePopState() {
    // Handle browser back/forward navigation
    const hash = window.location.hash.replace('#', '') || 'login';
    navigateTo(hash);
}