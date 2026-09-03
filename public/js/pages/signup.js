// ============================================================
// signup.js — Create Account page with role selection
// ============================================================

function renderSignupPage() {
    const navbar = document.getElementById('navbar');
    navbar.innerHTML = '';
    navbar.style.display = 'none';

    const app = document.getElementById('app');
    app.style.padding = '0';
    app.style.maxWidth = 'none';

    app.innerHTML = `
        <div class="login-container">
            <div class="login-card" style="max-width:440px;">
                <div class="login-header">
                    <h1>🎪 KAUTHIG</h1>
                    <p class="text-muted">Create your account</p>
                </div>
                <div id="signup-error" class="error-text"></div>
                <div class="form-group">
                    <label>Full Name</label>
                    <input id="signup-name" type="text" placeholder="e.g. Rahul Kumar" />
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input id="signup-email" type="email" placeholder="you@example.com" />
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input id="signup-password" type="password" placeholder="Min 6 characters" />
                </div>
                <div class="form-group">
                    <label>I want to join as</label>
                    <div class="role-selector">
                        <label class="role-option" id="role-guest-label">
                            <input type="radio" name="signup-role" value="guest" checked />
                            <div class="role-card">
                                <div class="role-icon">🎫</div>
                                <div class="role-name">Guest</div>
                                <div class="role-desc">Browse events & register for sessions</div>
                            </div>
                        </label>
                        <label class="role-option" id="role-organizer-label">
                            <input type="radio" name="signup-role" value="organizer" />
                            <div class="role-card">
                                <div class="role-icon">📋</div>
                                <div class="role-name">Organizer</div>
                                <div class="role-desc">Create events, manage sessions & staff</div>
                            </div>
                        </label>
                        <label class="role-option" id="role-staff-label">
                            <input type="radio" name="signup-role" value="check_in_staff" />
                            <div class="role-card">
                                <div class="role-icon">✅</div>
                                <div class="role-name">Check-in Staff</div>
                                <div class="role-desc">Check in attendees at the door</div>
                            </div>
                        </label>
                    </div>
                </div>
                <button class="btn-primary" style="width:100%;padding:0.75rem;font-size:1rem;" onclick="handleSignup()">Create Account</button>
                <div class="login-footer" style="margin-top:1.5rem;">
                    <p class="text-muted">Already have an account?</p>
                    <a href="#/login" style="font-weight:600;font-size:1rem;">← Sign In</a>
                </div>
            </div>
        </div>
    `;

    const resetStyles = () => {
        app.style.padding = '';
        app.style.maxWidth = '';
    };
    window.addEventListener('hashchange', resetStyles, { once: true });

    // Enter key on password
    document.getElementById('signup-password').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSignup();
    });
}

async function handleSignup() {
    const errorEl = document.getElementById('signup-error');
    errorEl.textContent = '';

    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const role = document.querySelector('input[name="signup-role"]:checked')?.value;

    if (!name || !email || !password) {
        errorEl.textContent = 'All fields are required';
        return;
    }
    if (password.length < 6) {
        errorEl.textContent = 'Password must be at least 6 characters';
        return;
    }
    if (!role) {
        errorEl.textContent = 'Please select a role';
        return;
    }

    try {
        const data = await api.post('/auth/signup', { name, email, password, role });
        currentUser = data.user;
        window.location.hash = '#/dashboard';
    } catch (err) {
        errorEl.textContent = err.message;
    }
}
