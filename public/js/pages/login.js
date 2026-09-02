function renderLoginPage() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="card" style="max-width:360px; margin:4rem auto;">
            <h3>Login</h3>
            <div id="login-error" class="error-text"></div>
            <label>Email</label>
            <input id="login-email" type="email" />
            <label>Password</label>
            <input id="login-password" type="password" />
            <button class="primary" onclick="handleLogin()">Login</button>
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
        window.location.hash = '#/events';
    } catch (err) {
        errorEl.textContent = err.message;
    }
}