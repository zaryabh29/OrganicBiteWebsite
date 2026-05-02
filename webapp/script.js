// API Configuration — auto-detect environment
const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api'
    : 'https://organicbite-api.onrender.com/api';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Animations are now handled by pure CSS @keyframes — no JS needed.

    // 2. Navbar Scroll Effect
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
            navbar.style.padding = '0';
        } else {
            navbar.style.boxShadow = 'none';
        }
    });

    // 3. Smooth Scrolling for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const navHeight = navbar.offsetHeight;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.scrollY - navHeight;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 4. Contact Form Submission (Real API Call)
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.innerText;
            
            btn.innerText = 'Sending...';
            btn.style.opacity = '0.8';
            
            const payload = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                goal: document.getElementById('goal').value,
                message: document.getElementById('message').value
            };
            
            try {
                const res = await fetch(`${API_URL}/contact`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                if (res.ok) {
                    btn.innerText = 'Message Sent!';
                    btn.style.backgroundColor = '#00d26a';
                    btn.style.color = '#000';
                    contactForm.reset();
                } else {
                    btn.innerText = 'Error Sending';
                    btn.style.backgroundColor = '#ef4444';
                }
            } catch (err) {
                btn.innerText = 'Network Error';
                btn.style.backgroundColor = '#ef4444';
            }
            
            setTimeout(() => {
                btn.innerText = originalText;
                btn.style.backgroundColor = '';
                btn.style.color = '';
                btn.style.opacity = '1';
            }, 3000);
        });
    }

    // 5. Theme Toggle Logic
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = themeToggleBtn.querySelector('i');
    
    // Check saved theme
    const savedTheme = localStorage.getItem('organic-bite-theme') || 'dark';
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        themeIcon.classList.remove('ph-sun');
        themeIcon.classList.add('ph-moon');
    }

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        
        if (currentTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('organic-bite-theme', 'light');
            themeIcon.classList.remove('ph-sun');
            themeIcon.classList.add('ph-moon');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('organic-bite-theme', 'dark');
            themeIcon.classList.remove('ph-moon');
            themeIcon.classList.add('ph-sun');
        }
    });

    // 6. Backend Integration & Modals
    // Load Public CMS Data
    async function loadPublicData() {
        const plansContainer = document.getElementById('dynamic-plans-container');
        const blogsContainer = document.getElementById('dynamic-blogs-container');
        const reviewsContainer = document.getElementById('dynamic-reviews-container');

        try {
            // Load Plans
            const plansRes = await fetch(`${API_URL}/mealplans`);
            if (!plansRes.ok) throw new Error('Failed to fetch meal plans');
            const plans = await plansRes.json();
            
            if (plans && plans.length > 0) {
                plansContainer.innerHTML = plans.map((p, index) => `
                    <div class="plan-card ${index === 1 ? 'featured' : ''} fade-in-up" style="transition-delay: ${index * 0.1}s;">
                        ${index === 1 ? '<div class="popular-tag">Most Popular</div>' : ''}
                        <div class="plan-image"><img src="${p.image_url}" alt="${p.name}"></div>
                        <div class="plan-content">
                            ${p.badge ? `<div class="plan-badge">${p.badge}</div>` : ''}
                            <h3>${p.name}</h3>
                            <p>${p.description}</p>
                            <ul class="plan-features">
                                ${p.features.map(f => `<li><i class="ph-bold ph-check"></i> ${f}</li>`).join('')}
                            </ul>
                            <div class="plan-price" data-price="${p.price}">From PKR ${p.price} <span>/ week</span></div>
                            <button class="btn ${index === 1 ? 'btn-primary' : 'btn-outline'} full-width" onclick="initiateCheckout('${p.name}', '${p.price}')">Select Plan</button>
                        </div>
                    </div>
                `).join('');
                // CSS @keyframes handles animation automatically
            } else {
                plansContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No plans currently available.</p>';
            }

            // Load Blogs
            const blogsRes = await fetch(`${API_URL}/blogs`);
            if (!blogsRes.ok) throw new Error('Failed to fetch blogs');
            const blogs = await blogsRes.json();
            
            if (blogs && blogs.length > 0) {
                blogsContainer.innerHTML = blogs.map(b => `
                    <div class="blog-card fade-in-up">
                        <div class="blog-image"><img src="${b.image_url}" alt="${b.title}"></div>
                        <div class="blog-content">
                            <div class="blog-meta">${b.created_at} &bull; By ${b.author}</div>
                            <h3>${b.title}</h3>
                            <p style="font-size: 0.875rem; color: var(--text-secondary);">${b.excerpt}</p>
                            <a href="#" onclick="event.preventDefault(); openBlog(${b.id})" style="color: var(--primary-color); font-weight: bold; font-size: 0.875rem; text-decoration: none; margin-top: 1rem; display: inline-block;">Read More &rarr;</a>
                        </div>
                    </div>
                `).join('');
                // CSS @keyframes handles animation automatically
            } else {
                blogsContainer.innerHTML = '<p style="text-align: center;">No articles available yet.</p>';
            }
            // Load Reviews
            const reviewsRes = await fetch(`${API_URL}/reviews`);
            if (!reviewsRes.ok) throw new Error('Failed to fetch reviews');
            const reviews = await reviewsRes.json();
            
            if (reviews && reviews.length > 0) {
                reviewsContainer.innerHTML = reviews.map((r, index) => `
                    <div class="review-card fade-in-up" style="transition-delay: ${index * 0.1}s; padding: 2rem; background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border-color);">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
                            <h4 style="margin:0;">${r.name}</h4>
                            <div style="color: #fbbf24;">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
                        </div>
                        <p style="font-size: 0.875rem; color: var(--text-secondary); margin: 0;">"${r.comment}"</p>
                        <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 1rem; opacity: 0.7;">${r.created_at}</p>
                    </div>
                `).join('');
                // CSS @keyframes handles animation automatically
            } else {
                reviewsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No reviews available yet.</p>';
            }

        } catch(e) {
            console.error('Failed to load dynamic data', e);
        }
    }
    
    loadPublicData();
    
    // Auth State
    async function updateNavUI() {
        const token = localStorage.getItem('organic-bite-token');
        const loginBtn = document.getElementById('nav-login-btn');
        const dashBtn = document.getElementById('nav-dashboard-btn');
        const adminBtn = document.getElementById('nav-admin-btn');
        
        loginBtn.style.display = 'none';
        dashBtn.style.display = 'none';
        adminBtn.style.display = 'none';
        
        if (token) {
            dashBtn.style.display = 'inline-flex';
            
            // Check if admin
            const is_admin = localStorage.getItem('organic-bite-admin') === 'true';
            if (is_admin) {
                adminBtn.style.display = 'inline-flex';
            }
        } else {
            loginBtn.style.display = 'inline-flex';
        }
    }
    
    updateNavUI();

    // Login Form Submit
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');
        
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            
            if (res.ok) {
                localStorage.setItem('organic-bite-token', data.token);
                localStorage.setItem('organic-bite-admin', data.user.is_admin);
                closeModal('auth-modal');
                updateNavUI();
                errorEl.innerText = '';
                document.getElementById('login-form').reset();
            } else {
                errorEl.innerText = data.error || 'Login failed';
            }
        } catch (err) {
            errorEl.innerText = 'Network error. Backend might be down.';
        }
    });

    // Register Form Submit
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const errorEl = document.getElementById('register-error');
        
        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const data = await res.json();
            
            if (res.ok) {
                errorEl.style.color = '#00d26a';
                errorEl.innerText = 'Account created! Please log in.';
                document.getElementById('register-form').reset();
                setTimeout(() => switchAuthTab('login'), 2000);
            } else {
                errorEl.style.color = '#ef4444';
                errorEl.innerText = data.error || 'Registration failed';
            }
        } catch (err) {
            errorEl.style.color = '#ef4444';
            errorEl.innerText = 'Network error.';
        }
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', async () => {
        const token = localStorage.getItem('organic-bite-token');
        if (token) {
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            localStorage.removeItem('organic-bite-token');
            localStorage.removeItem('organic-bite-admin');
            updateNavUI();
            closeModal('dashboard-modal');
        }
    });

    // Load Dashboard Subscriptions
    window.loadDashboard = async function() {
        switchUserTab('subs'); // Default to subs tab
        loadUserProfile();
        
        const token = localStorage.getItem('organic-bite-token');
        const container = document.getElementById('subscriptions-container');
        
        if (!token) return;
        
        container.innerHTML = '<p class="loading-text">Loading...</p>';
        
        try {
            const res = await fetch(`${API_URL}/subscriptions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (res.ok) {
                const subs = Array.isArray(data) ? data : data.subscriptions || [];
                if (subs.length === 0) {
                    container.innerHTML = '<p>You have no active subscriptions yet.</p><a href="#plans" class="btn btn-outline mt-4" onclick="closeModal(\'dashboard-modal\')">View Meal Plans</a>';
                } else {
                    container.innerHTML = subs.map(sub => {
                        let actionBtns = '';
                        if(sub.status === 'Active') {
                            actionBtns = `<button class="btn btn-outline btn-small" onclick="userSubAction(${sub.id}, 'cancel')">Cancel</button>
                                          <button class="btn btn-outline btn-small" style="border-color:#ef4444; color:#ef4444; margin-left:0.5rem;" onclick="userSubAction(${sub.id}, 'refund')">Refund</button>`;
                        } else if(sub.status === 'Cancelled') {
                            actionBtns = `<button class="btn btn-outline btn-small" style="border-color:#ef4444; color:#ef4444; margin-left:0.5rem;" onclick="userSubAction(${sub.id}, 'refund')">Request Refund</button>`;
                        }
                        return `
                        <div class="subscription-card" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                            <div>
                                <h4>${sub.plan_name}</h4>
                                <p style="margin:0; font-size:0.875rem;">Started: ${sub.start_date}</p>
                            </div>
                            <div style="display:flex; align-items:center; gap:1rem;">
                                <div class="sub-status">${sub.status}</div>
                                <div>${actionBtns}</div>
                            </div>
                        </div>
                        `;
                    }).join('');
                }
            } else {
                container.innerHTML = '<p class="error-text">Failed to load subscriptions.</p>';
            }
        } catch (err) {
            container.innerHTML = '<p class="error-text">Network Error.</p>';
        }
    };

    window.switchUserTab = function(tab) {
        document.querySelectorAll('.user-tab').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.user-panel').forEach(panel => {
            panel.classList.remove('active');
            panel.style.display = ''; // Clear inline styles
        });
        
        const btn = document.getElementById(`tab-${tab}`);
        if (btn) btn.classList.add('active');
        
        const panel = document.getElementById(`user-${tab}`);
        if (panel) panel.classList.add('active');
    };

    window.loadUserProfile = async function() {
        const token = localStorage.getItem('organic-bite-token');
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/user/profile`, { headers: { 'Authorization': `Bearer ${token}` }});
            if(res.ok) {
                const data = await res.json();
                document.getElementById('profile-name').value = data.name || '';
                document.getElementById('profile-email').value = data.email || '';
                document.getElementById('profile-height').value = data.height || '';
                document.getElementById('profile-weight').value = data.weight || '';
                document.getElementById('profile-allergies').value = data.allergies || '';
                document.getElementById('profile-address').value = data.address || '';
                document.getElementById('profile-time').value = data.delivery_time || 'Morning (7AM - 9AM)';
            }
        } catch(e) { console.error('Error loading profile'); }
    };

    document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('organic-bite-token');
        const data = {
            name: document.getElementById('profile-name').value,
            height: document.getElementById('profile-height').value,
            weight: document.getElementById('profile-weight').value,
            allergies: document.getElementById('profile-allergies').value,
            address: document.getElementById('profile-address').value,
            delivery_time: document.getElementById('profile-time').value
        };
        const msgEl = document.getElementById('profile-msg');
        try {
            const res = await fetch(`${API_URL}/user/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });
            if(res.ok) {
                msgEl.innerText = 'Profile saved successfully!';
                msgEl.style.color = 'var(--primary-color)';
                setTimeout(() => msgEl.innerText = '', 3000);
            } else {
                msgEl.innerText = 'Failed to save profile.';
                msgEl.style.color = '#ef4444';
            }
        } catch(err) { 
            msgEl.innerText = 'Network error.';
            msgEl.style.color = '#ef4444';
        }
    });

    document.getElementById('review-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('organic-bite-token');
        const data = {
            rating: document.getElementById('review-rating').value,
            comment: document.getElementById('review-comment').value
        };
        const msgEl = document.getElementById('review-msg');
        try {
            const res = await fetch(`${API_URL}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });
            if(res.ok) {
                msgEl.innerText = 'Thank you! Your review has been submitted for moderation.';
                msgEl.style.color = 'var(--primary-color)';
                document.getElementById('review-form').reset();
                setTimeout(() => msgEl.innerText = '', 5000);
            } else {
                msgEl.innerText = 'Failed to submit review.';
                msgEl.style.color = '#ef4444';
            }
        } catch(err) {
            msgEl.innerText = 'Network error.';
            msgEl.style.color = '#ef4444';
        }
    });

    window.userSubAction = async function(id, action) {
        if(!confirm(`Are you sure you want to ${action} this subscription?`)) return;
        const token = localStorage.getItem('organic-bite-token');
        try {
            const res = await fetch(`${API_URL}/subscriptions/${id}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ action })
            });
            if(res.ok) {
                alert(`Subscription successfully ${action === 'cancel' ? 'cancelled' : 'flagged for refund'}.`);
                loadDashboard();
            } else {
                alert('Action failed.');
            }
        } catch(e) { alert('Network error.'); }
    };

    // Checkout Submit
    document.getElementById('checkout-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('organic-bite-token');
        const planName = document.getElementById('checkout-plan-name').innerText;
        const errorEl = document.getElementById('checkout-error');
        const btn = document.getElementById('checkout-form').querySelector('button');
        
        if (!token) {
            errorEl.innerText = 'You must be logged in to subscribe.';
            return;
        }
        
        btn.innerText = 'Processing...';
        btn.disabled = true;
        
        try {
            const res = await fetch(`${API_URL}/subscribe`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ plan_name: planName })
            });
            const data = await res.json();
            
            if (res.ok) {
                btn.innerText = 'Success!';
                btn.style.backgroundColor = '#00d26a';
                btn.style.color = '#000';
                
                setTimeout(() => {
                    closeModal('checkout-modal');
                    openModal('dashboard-modal');
                    
                    // Reset button
                    btn.innerText = 'Confirm Payment';
                    btn.style.backgroundColor = '';
                    btn.style.color = '';
                    btn.disabled = false;
                }, 1500);
            } else {
                errorEl.innerText = data.error || 'Subscription failed.';
                btn.innerText = 'Confirm Payment';
                btn.disabled = false;
            }
        } catch (err) {
            errorEl.innerText = 'Network error.';
            btn.innerText = 'Confirm Payment';
            btn.disabled = false;
        }
    });
});

// Modal Global Functions
window.openModal = function(id) {
    document.getElementById(id).classList.add('active');
    if (id === 'dashboard-modal') {
        window.loadDashboard();
    }
};

window.closeModal = function(id) {
    document.getElementById(id).classList.remove('active');
};

window.switchAuthTab = function(tab) {
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');
    
    tabs.forEach(t => t.classList.remove('active'));
    forms.forEach(f => f.style.display = 'none');
    
    if (tab === 'login') {
        tabs[0].classList.add('active');
        document.getElementById('login-form').style.display = 'block';
    } else {
        tabs[1].classList.add('active');
        document.getElementById('register-form').style.display = 'block';
    }

    // Toggle Social Buttons
    const socialContainer = document.querySelector('.social-login-container');
    const divider = document.querySelector('.auth-divider');
    if(socialContainer && divider) {
        socialContainer.style.display = 'flex';
        divider.style.display = 'block';
    }
};

window.mockGoogleLogin = async function() {
    // For demonstration: logs the user in as a test account.
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@organicbite.pk', password: 'organicbite' })
        });
        
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('organic-bite-token', data.token);
            if(data.user) {
                localStorage.setItem('organic-bite-admin', data.user.is_admin);
            } else {
                // Hardcode fallback if API structure misses user obj
                localStorage.setItem('organic-bite-admin', 'true');
            }
            alert('Successfully authenticated via Google! (Mock User)');
            closeModal('auth-modal');
            location.reload(); // Refresh to update Nav State globally
        } else {
            alert('Mock Google Login failed. Make sure the backend is running and the user exists.');
        }
    } catch(err) {
        console.error(err);
        alert('Connection error during social login.');
    }
};

window.initiateCheckout = function(planName, price) {
    const token = localStorage.getItem('organic-bite-token');
    
    if (!token) {
        openModal('auth-modal');
        return;
    }
    
    // Store original values for promo calculations
    window.currentCheckoutPlan = planName;
    window.currentCheckoutBasePrice = parseFloat(price);
    window.currentCheckoutDiscountPercent = 0;
    
    document.getElementById('checkout-plan-name').innerText = planName;
    document.getElementById('checkout-base-price').innerText = `PKR ${price}`;
    document.getElementById('checkout-discount-row').style.display = 'none';
    document.getElementById('checkout-total-price').innerText = `PKR ${price}`;
    document.getElementById('promo-input').value = '';
    document.getElementById('promo-msg').innerText = '';
    document.getElementById('checkout-error').innerText = '';
    
    openModal('checkout-modal');
};

document.getElementById('apply-promo-btn').addEventListener('click', async () => {
    const code = document.getElementById('promo-input').value.trim();
    const msgEl = document.getElementById('promo-msg');
    if(!code) return;
    
    try {
        const res = await fetch(`${API_URL}/promo/validate?code=${code}`);
        const data = await res.json();
        if(res.ok) {
            window.currentCheckoutDiscountPercent = data.discount_percent;
            const discountAmt = Math.round(window.currentCheckoutBasePrice * (data.discount_percent / 100));
            const total = window.currentCheckoutBasePrice - discountAmt;
            
            document.getElementById('checkout-discount-row').style.display = 'flex';
            document.getElementById('checkout-discount-text').innerText = data.discount_percent;
            document.getElementById('checkout-discount-amount').innerText = `- PKR ${discountAmt}`;
            document.getElementById('checkout-total-price').innerText = `PKR ${total}`;
            
            msgEl.innerText = 'Promo applied!';
            msgEl.style.color = 'var(--primary-color)';
        } else {
            msgEl.innerText = data.error || 'Invalid code.';
            msgEl.style.color = '#ef4444';
        }
    } catch(e) {
        msgEl.innerText = 'Network error.';
        msgEl.style.color = '#ef4444';
    }
});

// --- ADMIN PANEL LOGIC ---
window.switchAdminTab = function(tab) {
    const tabs = document.querySelectorAll('.admin-tab');
    const panels = document.querySelectorAll('.admin-panel');
    
    tabs.forEach(t => t.classList.remove('active'));
    panels.forEach(p => p.style.display = 'none');
    
    // Find the clicked tab index based on the argument
    const tabMap = { 'insights': 0, 'users': 1, 'subscriptions': 2, 'cms': 3, 'promos': 4, 'reviews': 5, 'messages': 6 };
    if(tabs[tabMap[tab]]) tabs[tabMap[tab]].classList.add('active');
    const panel = document.getElementById(`admin-${tab}`);
    if(panel) panel.style.display = 'block';
    
    if (tab === 'insights') loadAdminInsights();
    else if (tab === 'users') loadAdminUsers();
    else if (tab === 'subscriptions') loadAdminSubscriptions();
    else if (tab === 'messages') loadAdminMessages();
    else if (tab === 'cms') loadAdminCMS();
    else if (tab === 'promos') loadAdminPromos();
    else if (tab === 'reviews') loadAdminReviews();
};

window.loadAdminInsights = async function() {
    const token = localStorage.getItem('organic-bite-token');
    try {
        const res = await fetch(`${API_URL}/admin/insights`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
            const data = await res.json();
            document.getElementById('insight-users').innerText = data.total_users;
            document.getElementById('insight-subs').innerText = data.active_subscriptions;
            document.getElementById('insight-rev').innerText = `PKR ${data.monthly_revenue}`;
            document.getElementById('insight-msgs').innerText = data.unread_messages;
        }
    } catch(err) { console.error('Insights error', err); }
};

window.loadAdminUsers = async function() {
    const tbody = document.getElementById('admin-users-tbody');
    const token = localStorage.getItem('organic-bite-token');
    try {
        const res = await fetch(`${API_URL}/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
            const data = await res.json();
            tbody.innerHTML = data.users.map(u => `<tr><td>${u.id}</td><td>${u.name}</td><td>${u.email}</td><td>${u.is_admin ? 'Yes' : 'No'}</td><td>${u.created_at}</td></tr>`).join('');
        }
    } catch(err) { tbody.innerHTML = '<tr><td colspan="5">Error loading</td></tr>'; }
};

window.loadAdminSubscriptions = async function() {
    const tbody = document.getElementById('admin-subs-tbody');
    const token = localStorage.getItem('organic-bite-token');
    try {
        const res = await fetch(`${API_URL}/admin/subscriptions`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
            const data = await res.json();
            const subs = Array.isArray(data) ? data : data.subscriptions || [];
            tbody.innerHTML = subs.map(s => {
                let actionBtn = '';
                if(s.status === 'Refund Requested') {
                    actionBtn = `<button class="btn btn-primary btn-small" onclick="adminSubAction(${s.id}, 'refund')">Process Refund</button>`;
                } else if(s.status === 'Active') {
                    actionBtn = `<button class="btn btn-outline btn-small" onclick="adminSubAction(${s.id}, 'cancel')">Cancel Sub</button>`;
                }
                return `
                <tr>
                    <td>${s.id}</td>
                    <td>${s.user_name}</td>
                    <td>${s.plan_name}</td>
                    <td><span class="sub-status" style="font-size:0.875rem; padding:0.25rem 0.5rem; background:var(--bg-secondary); border-radius:4px;">${s.status}</span></td>
                    <td>${s.start_date}</td>
                    <td>${actionBtn} <button class="btn btn-outline btn-small" style="border-color:#ef4444; color:#ef4444; margin-left:5px;" onclick="deleteSubscription(${s.id})">Delete</button></td>
                </tr>
                `;
            }).join('');
        }
    } catch(err) { tbody.innerHTML = '<tr><td colspan="6">Error loading</td></tr>'; }
};

window.adminSubAction = async function(id, action) {
    const token = localStorage.getItem('organic-bite-token');
    try {
        const res = await fetch(`${API_URL}/admin/subscriptions/${id}/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ action })
        });
        if(res.ok) {
            alert(`Action successfully applied!`);
            loadAdminSubscriptions();
        } else {
            alert('Failed to apply action.');
        }
    } catch(e) { alert('Network error.'); }
};

window.loadAdminMessages = async function() {
    const tbody = document.getElementById('admin-msgs-tbody');
    const token = localStorage.getItem('organic-bite-token');
    try {
        const res = await fetch(`${API_URL}/admin/contacts`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
            const data = await res.json();
            tbody.innerHTML = data.messages.map(m => `
                <tr>
                    <td>${m.id}</td>
                    <td>${m.name}</td>
                    <td>${m.email}</td>
                    <td>${m.goal}</td>
                    <td>${m.message}</td>
                    <td><button class="btn btn-outline btn-small" onclick="deleteMessage(${m.id})">Delete</button></td>
                </tr>
            `).join('');
        }
    } catch(err) { tbody.innerHTML = '<tr><td colspan="6">Error loading</td></tr>'; }
};

window.updateSubStatus = async function(id, status) {
    const token = localStorage.getItem('organic-bite-token');
    await fetch(`${API_URL}/admin/subscriptions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({status})
    });
};

window.deleteSubscription = async function(id) {
    if(!confirm('Are you sure you want to delete this subscription?')) return;
    const token = localStorage.getItem('organic-bite-token');
    await fetch(`${API_URL}/admin/subscriptions/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    loadAdminSubscriptions();
};

window.deleteMessage = async function(id) {
    if(!confirm('Are you sure you want to delete this message?')) return;
    const token = localStorage.getItem('organic-bite-token');
    await fetch(`${API_URL}/admin/contacts/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    loadAdminMessages();
};

// Initial admin load override
const originalOpenModal = window.openModal;
window.openModal = function(id) {
    originalOpenModal(id);
    if (id === 'admin-modal') {
        loadAdminInsights();
    }
};

window.loadAdminCMS = async function() {
    try {
        const plansRes = await fetch(`${API_URL}/mealplans`);
        const plans = await plansRes.json();
        document.getElementById('cms-plans-tbody').innerHTML = plans.map(p => `
            <tr>
                <td>${p.id}</td>
                <td>${p.name}</td>
                <td>${p.price}</td>
                <td>
                    <button class="btn btn-outline btn-small" onclick="editPlan(${p.id})">Edit</button>
                    <button class="btn btn-outline btn-small" onclick="deletePlan(${p.id})" style="margin-left:5px; border-color: #ef4444; color: #ef4444;">Delete</button>
                </td>
            </tr>
        `).join('');

        const blogsRes = await fetch(`${API_URL}/blogs`);
        const blogs = await blogsRes.json();
        document.getElementById('cms-blogs-tbody').innerHTML = blogs.map(b => `
            <tr>
                <td>${b.id}</td>
                <td>${b.title}</td>
                <td>${b.created_at}</td>
                <td>
                    <button class="btn btn-outline btn-small" onclick="editBlog(${b.id})">Edit</button>
                    <button class="btn btn-outline btn-small" onclick="deleteBlog(${b.id})" style="margin-left:5px; border-color: #ef4444; color: #ef4444;">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch(e) { console.error(e); }
};

window.editPlan = async function(id) {
    const plansRes = await fetch(`${API_URL}/mealplans`);
    const plans = await plansRes.json();
    const plan = plans.find(p => p.id === id);
    if(plan) {
        document.getElementById('plan-id').value = plan.id;
        document.getElementById('plan-name').value = plan.name;
        document.getElementById('plan-badge').value = plan.badge || '';
        document.getElementById('plan-price').value = plan.price;
        document.getElementById('plan-image').value = plan.image_url;
        document.getElementById('plan-features').value = plan.features.join(',');
        document.getElementById('plan-desc').value = plan.description;
        document.getElementById('plan-submit-btn').innerText = 'Update Plan';
        document.getElementById('add-plan-form').scrollIntoView({behavior: 'smooth'});
    }
};

window.resetPlanForm = function() {
    document.getElementById('add-plan-form').reset();
    document.getElementById('plan-id').value = '';
    document.getElementById('plan-submit-btn').innerText = 'Add Plan';
};

window.deletePlan = async function(id) {
    if(!confirm('Delete this plan?')) return;
    const token = localStorage.getItem('organic-bite-token');
    await fetch(`${API_URL}/admin/mealplans/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    loadAdminCMS();
    loadPublicData();
};

window.editBlog = async function(id) {
    const res = await fetch(`${API_URL}/blogs/${id}`);
    const blog = await res.json();
    if(blog) {
        document.getElementById('blog-id').value = blog.id;
        document.getElementById('blog-title').value = blog.title;
        document.getElementById('blog-image').value = blog.image_url;
        document.getElementById('blog-excerpt').value = blog.excerpt;
        document.getElementById('blog-content').value = blog.content;
        document.getElementById('blog-submit-btn').innerText = 'Update Blog';
        document.getElementById('add-blog-form').scrollIntoView({behavior: 'smooth'});
    }
};

window.resetBlogForm = function() {
    document.getElementById('add-blog-form').reset();
    document.getElementById('blog-id').value = '';
    document.getElementById('blog-submit-btn').innerText = 'Publish Blog';
};

window.deleteBlog = async function(id) {
    if(!confirm('Delete this blog?')) return;
    const token = localStorage.getItem('organic-bite-token');
    await fetch(`${API_URL}/admin/blogs/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    loadAdminCMS();
    loadPublicData();
};

window.openBlog = async function(id) {
    try {
        const res = await fetch(`${API_URL}/blogs/${id}`);
        const blog = await res.json();
        
        document.getElementById('blog-reader-container').innerHTML = `
            <img src="${blog.image_url}" alt="${blog.title}" class="blog-reader-image">
            <div class="blog-reader-meta">${blog.created_at} &bull; By ${blog.author}</div>
            <h1 class="blog-reader-title">${blog.title}</h1>
            <div class="blog-reader-content">
                ${blog.content
                    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/^\- (.*$)/gim, '<li>$1</li>')
                    .replace(/\n/g, '<br>')}
            </div>
        `;
        openModal('blog-modal');
    } catch(e) {
        console.error(e);
        alert('Failed to load blog post.');
    }
};

window.loadAdminPromos = async function() {
    const token = localStorage.getItem('organic-bite-token');
    try {
        const res = await fetch(`${API_URL}/admin/promos`, { headers: { 'Authorization': `Bearer ${token}` } });
        const promos = await res.json();
        document.getElementById('admin-promos-tbody').innerHTML = promos.map(p => `
            <tr>
                <td>${p.code}</td>
                <td>${p.discount_percent}%</td>
                <td><button class="btn btn-outline btn-small" style="border-color:#ef4444; color:#ef4444;" onclick="deletePromo(${p.id})">Delete</button></td>
            </tr>
        `).join('');
    } catch(e) { console.error(e); }
};

window.deletePromo = async function(id) {
    if(!confirm('Delete this promo code?')) return;
    const token = localStorage.getItem('organic-bite-token');
    await fetch(`${API_URL}/admin/promos/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    loadAdminPromos();
};

window.loadAdminReviews = async function() {
    const token = localStorage.getItem('organic-bite-token');
    try {
        const res = await fetch(`${API_URL}/admin/reviews`, { headers: { 'Authorization': `Bearer ${token}` } });
        const reviews = await res.json();
        document.getElementById('admin-reviews-tbody').innerHTML = reviews.map(r => `
            <tr>
                <td>${r.name}</td>
                <td>${r.rating}/5</td>
                <td>${r.comment.substring(0, 30)}...</td>
                <td>${r.is_featured ? '<span style="color:#10b981;">Yes</span>' : '<span style="color:#6b7280;">No</span>'}</td>
                <td>
                    <button class="btn btn-outline btn-small" onclick="toggleReviewFeatured(${r.id}, ${!r.is_featured})">
                        ${r.is_featured ? 'Unfeature' : 'Feature'}
                    </button>
                    <button class="btn btn-outline btn-small" style="border-color:#ef4444; color:#ef4444; margin-left:5px;" onclick="deleteReview(${r.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch(e) { console.error(e); }
};

window.toggleReviewFeatured = async function(id, isFeatured) {
    const token = localStorage.getItem('organic-bite-token');
    await fetch(`${API_URL}/admin/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ is_featured: isFeatured })
    });
    loadAdminReviews();
    loadPublicData(); // Reload homepage reviews
};

window.deleteReview = async function(id) {
    if(!confirm('Delete this review?')) return;
    const token = localStorage.getItem('organic-bite-token');
    await fetch(`${API_URL}/admin/reviews/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    loadAdminReviews();
    loadPublicData();
};

window.openLegal = function(type) {
    const titleEl = document.getElementById('legal-title');
    const contentEl = document.getElementById('legal-content');
    
    if(type === 'terms') {
        titleEl.innerText = "Terms & Conditions";
        contentEl.innerHTML = `
            <p>Welcome to Organic Bite. By using our services, you agree to the following terms and conditions:</p><br>
            <strong>1. Service Usage</strong><br>
            <p>Our meal plans are designed for general fitness and well-being. We are not a medical facility and our meals should not be used as a treatment for any medical condition.</p><br>
            <strong>2. Subscriptions & Payments</strong><br>
            <p>All meal plans are billed on a recurring weekly basis unless explicitly stated otherwise. You must cancel your subscription at least 48 hours before the next billing cycle to avoid being charged.</p><br>
            <strong>3. Delivery</strong><br>
            <p>Deliveries are made within specified time windows. If you are not present to receive the delivery, our drivers will follow the alternate instructions provided in your account profile.</p><br>
            <strong>4. Account Security</strong><br>
            <p>You are responsible for safeguarding your login credentials. Organic Bite is not liable for unauthorized access to your account resulting from user negligence.</p>
        `;
    } else if(type === 'privacy') {
        titleEl.innerText = "Privacy Policy";
        contentEl.innerHTML = `
            <p>Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your data.</p><br>
            <strong>1. Data Collection</strong><br>
            <p>We collect essential information required to deliver your meals, process payments, and improve your experience. This includes your name, delivery address, email, phone number, and dietary preferences.</p><br>
            <strong>2. Data Usage</strong><br>
            <p>Your information is used strictly for fulfilling your orders, personalizing your meal plans, and communicating important service updates. We do not sell your personal data to third-party marketing companies.</p><br>
            <strong>3. Data Security</strong><br>
            <p>We implement industry-standard security measures, including SSL encryption, to protect your sensitive data during transmission and storage.</p><br>
            <strong>4. Your Rights</strong><br>
            <p>You have the right to request access to, modification of, or deletion of your personal data stored on our servers. Contact our support team to exercise these rights.</p>
        `;
    } else if(type === 'refund') {
        titleEl.innerText = "Refund Policy";
        contentEl.innerHTML = `
            <p>At Organic Bite, we strive for 100% customer satisfaction. Please review our refund and cancellation policies below.</p><br>
            <strong>1. Order Cancellations</strong><br>
            <p>Because our meals are prepared fresh and strictly macro-calibrated to your specific needs, we cannot accept cancellations or offer refunds once meal preparation has begun (usually 24 hours prior to delivery).</p><br>
            <strong>2. Quality Issues</strong><br>
            <p>If there is an issue with the quality, safety, or accuracy of your delivery, please contact us within 12 hours of receiving your meal. We will issue a replacement meal or a prorated refund to your original payment method.</p><br>
            <strong>3. Subscription Terminations</strong><br>
            <p>You may terminate your recurring subscription at any time. However, any payments already processed for the upcoming week's delivery are non-refundable.</p>
        `;
    }
    
    openModal('legal-modal');
};

// Add Plan Submit
document.addEventListener('DOMContentLoaded', () => {
    const addPlanForm = document.getElementById('add-plan-form');
    if(addPlanForm) {
        addPlanForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = localStorage.getItem('organic-bite-token');
            const id = document.getElementById('plan-id').value;
            const data = {
                name: document.getElementById('plan-name').value,
                badge: document.getElementById('plan-badge').value,
                price: document.getElementById('plan-price').value,
                image_url: document.getElementById('plan-image').value,
                features: document.getElementById('plan-features').value,
                description: document.getElementById('plan-desc').value
            };
            
            const method = id ? 'PUT' : 'POST';
            const url = id ? `${API_URL}/admin/mealplans/${id}` : `${API_URL}/admin/mealplans`;

            await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });
            
            alert(`Plan ${id ? 'updated' : 'added'} successfully!`);
            resetPlanForm();
            loadAdminCMS();
            loadPublicData();
        });
    }

    const addPromoForm = document.getElementById('add-promo-form');
    if(addPromoForm) {
        addPromoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = localStorage.getItem('organic-bite-token');
            const data = {
                code: document.getElementById('promo-code').value,
                discount_percent: parseInt(document.getElementById('promo-discount').value)
            };
            await fetch(`${API_URL}/admin/promos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });
            alert('Promo created!');
            addPromoForm.reset();
            loadAdminPromos();
        });
    }

    const addBlogForm = document.getElementById('add-blog-form');
    if(addBlogForm) {
        addBlogForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = localStorage.getItem('organic-bite-token');
            const id = document.getElementById('blog-id').value;
            const data = {
                title: document.getElementById('blog-title').value,
                image_url: document.getElementById('blog-image').value,
                excerpt: document.getElementById('blog-excerpt').value,
                content: document.getElementById('blog-content').value
            };
            
            const method = id ? 'PUT' : 'POST';
            const url = id ? `${API_URL}/admin/blogs/${id}` : `${API_URL}/admin/blogs`;

            await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });
            
            alert(`Blog ${id ? 'updated' : 'published'} successfully!`);
            resetBlogForm();
            loadAdminCMS();
            loadPublicData();
        });
    }
});

// ===== CUSTOM MEAL BUILDER LOGIC =====
let allIngredients = [];
let currentCustomMeal = {
    protein: null,
    carb: null,
    veggie: null
};

window.openCustomBuilder = async function() {
    const token = localStorage.getItem('organic-bite-token');
    if(!token) {
        alert('Please login to use the Custom Meal Builder.');
        openModal('auth-modal');
        return;
    }

    openModal('custom-builder-modal');
    if (allIngredients.length === 0) {
        try {
            const res = await fetch(`${API_URL}/ingredients`);
            allIngredients = await res.json();
            switchBuilderCategory('protein');
        } catch (e) {
            console.error('Failed to load ingredients', e);
        }
    }
};

window.switchBuilderCategory = function(category) {
    const tabs = document.querySelectorAll('.builder-tab');
    tabs.forEach(t => {
        t.classList.remove('active');
        if(t.innerText.toLowerCase().includes(category)) t.classList.add('active');
    });

    const grid = document.getElementById('builder-items-grid');
    const filtered = allIngredients.filter(i => i.category === category);

    grid.innerHTML = filtered.map(i => `
        <div class="ingredient-card ${currentCustomMeal[category]?.id === i.id ? 'selected' : ''}" onclick="selectIngredient(${i.id}, '${category}')">
            <img src="${i.image_url}" class="ingredient-image">
            <h4>${i.name}</h4>
            <p>${i.protein}g P &bull; ${i.carbs}g C &bull; ${i.calories} kcal</p>
        </div>
    `).join('');
};

window.selectIngredient = function(id, category) {
    const ingredient = allIngredients.find(i => i.id === id);
    currentCustomMeal[category] = ingredient;
    
    // Update UI
    document.getElementById(`slot-${category}`).querySelector('.slot-value').innerText = ingredient.name;
    switchBuilderCategory(category); // Re-render grid to show selection
    updateBuilderMacros();
};

window.updateBuilderMacros = function() {
    let totals = { cal: 0, p: 0, c: 0, f: 0 };
    
    Object.values(currentCustomMeal).forEach(ing => {
        if (ing) {
            totals.cal += ing.calories;
            totals.p += ing.protein;
            totals.c += ing.carbs;
            totals.f += ing.fat;
        }
    });

    document.getElementById('total-calories').innerText = totals.cal;
    document.getElementById('total-protein').innerText = totals.p + 'g';
    document.getElementById('total-carbs').innerText = totals.c + 'g';
    document.getElementById('total-fat').innerText = totals.f + 'g';

    // Enable confirm button if all 3 selected
    const confirmBtn = document.getElementById('confirm-custom-meal');
    confirmBtn.disabled = !(currentCustomMeal.protein && currentCustomMeal.carb && currentCustomMeal.veggie);
};

window.submitCustomMeal = async function() {
    const token = localStorage.getItem('organic-bite-token');
    const payload = {
        protein_id: currentCustomMeal.protein.id,
        carb_id: currentCustomMeal.carb.id,
        veggie_id: currentCustomMeal.veggie.id
    };

    try {
        const res = await fetch(`${API_URL}/custom-order`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert('Custom meal ordered successfully! You can view it in your dashboard.');
            closeModal('custom-builder-modal');
            // Reset for next time
            currentCustomMeal = { protein: null, carb: null, veggie: null };
            document.querySelectorAll('.slot-value').forEach(v => v.innerText = 'None selected');
            updateBuilderMacros();
        } else {
            alert('Failed to place custom order.');
        }
    } catch (e) {
        console.error(e);
        alert('Network error.');
    }
};
