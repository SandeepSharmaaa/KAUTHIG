// ============================================================
// login.js — Login page with link to signup
// ============================================================

function renderLoginPage() {
    const navbar = document.getElementById('navbar');
    navbar.innerHTML = '';
    navbar.style.display = 'none';

    const app = document.getElementById('app');
    app.style.padding = '0';
    app.style.maxWidth = 'none';

    app.innerHTML = `
        <div class="login-container">
            <div class="login-card">
                <div class="login-header">
                    <h1>🎪 KAUTHIG</h1>
                    <p class="text-muted">Event Registration System</p>
                </div>
                <div id="login-error" class="error-text"></div>
                <div class="form-group">
                    <label>Email</label>
                    <input id="login-email" type="email" placeholder="you@example.com" />
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input id="login-password" type="password" placeholder="Enter password" />
                </div>
                <button class="btn-primary" style="width:100%;padding:0.75rem;font-size:1rem;" onclick="handleLogin()">Sign In</button>
                <div class="login-footer" style="margin-top:1.5rem;">
                    <p class="text-muted">Don't have an account?</p>
                    <a href="#/signup" style="font-weight:600;font-size:1rem;">Create Account →</a>
                </div>
            </div>
        </div>
    `;

    // Reset app styles when leaving login
    const resetStyles = () => {
        app.style.padding = '';
        app.style.maxWidth = '';
    };
    window.addEventListener('hashchange', resetStyles, { once: true });

    // Enter key
    document.getElementById('login-password').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    document.getElementById('login-email').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById('login-password').focus();
    });
}

async function handleLogin() {
    const errorEl = document.getElementById('login-error');
    errorEl.textContent = '';

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        errorEl.textContent = 'Please enter email and password';
        return;
    }

    try {
        const data = await api.post('/auth/login', { email, password });
        currentUser = data.user;
        window.location.hash = '#/dashboard';
    } catch (err) {
        errorEl.textContent = err.message;
    }
}