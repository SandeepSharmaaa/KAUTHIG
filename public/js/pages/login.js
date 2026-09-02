// ============================================================
// login.js — Login page
// ============================================================

function renderLoginPage() {
    // Hide navbar on login page
    document.getElementById('navbar').style.display = 'none';

    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="login-container">
            <div class="login-card">
                <div class="login-header">
                    <h1>KAUTHIG</h1>
                    <p class="text-muted">Event Registration System</p>
                </div>
                <div id="login-error" class="error-text"></div>
                <div class="form-group">
                    <label>Email</label>
                    <input id="login-email" type="email" placeholder="you@example.com" />
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input id="login-password" type="password" placeholder="Enter password" onkeydown="if(event.key==='Enter') handleLogin()" />
                </div>
                <button class="btn-primary" style="width:100%;" onclick="handleLogin()">Sign In</button>
                <div class="login-footer">
                    <p class="text-muted" style="font-size:0.8rem; margin-top:1.5rem;">
                        Demo: <strong>priya@kauthig.com</strong> / <strong>password123</strong>
                    </p>
                </div>
            </div>
        </div>
    `;
}

async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    errorEl.textContent = '';

    try {
        await login(email, password);
        window.location.hash = '#/dashboard';
    } catch (err) {
        errorEl.textContent = err.message;
    }
}