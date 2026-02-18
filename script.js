document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const elements = {
        menuToggle: document.querySelector('.menu-toggle'),
        mobileMenu: document.querySelector('.mobile-menu'),
        themeToggleBtn: document.getElementById('theme-toggle-btn'),
        tabBtns: document.querySelectorAll('.tab-btn'),
        configContents: document.querySelectorAll('.config-content'),
        loginBtn: document.getElementById('login-btn'),
        mobileLoginBtn: document.getElementById('mobile-login-btn'),
        loginModal: document.getElementById('login-modal'),
        paymentModal: document.getElementById('payment-modal'),
        loginTabs: document.querySelectorAll('.login-tab'),
        loginForms: document.querySelectorAll('.login-form-container'),
        premiumBtns: document.querySelectorAll('.btn-premium'),
        paymentForm: document.getElementById('mpesa-form'),
        closeBtns: document.querySelectorAll('.close'),
        robbieJRBtn: document.getElementById('robbiejr-class-btn'),
        robbieJRModal: document.getElementById('robbiejr-class-modal'),
        feedbackForm: document.getElementById('feedback-form'),
        newsletterForm: document.getElementById('newsletter-form'),
        paypalContainer: document.getElementById('paypal-button-container')
    };

    // Initialize all functionality
    initMobileMenu();
    initThemeToggle();
    initTabSwitching();
    initModals();
    initForms();
    initSmoothScrolling();
    initPayPalButton();
    checkPremiumAccess();

    // Mobile menu functionality
    function initMobileMenu() {
        if (!elements.menuToggle || !elements.mobileMenu) return;

        elements.menuToggle.addEventListener('click', toggleMobileMenu);

        document.addEventListener('click', function(e) {
            if (elements.mobileMenu.style.display === 'block' && 
                !e.target.closest('.menu-toggle') && 
                !e.target.closest('.mobile-menu')) {
                closeMobileMenu();
            }
        });
    }

    function toggleMobileMenu() {
        elements.mobileMenu.style.display = 
            elements.mobileMenu.style.display === 'block' ? 'none' : 'block';
    }

    function closeMobileMenu() {
        elements.mobileMenu.style.display = 'none';
    }


    // Theme toggle functionality
    function initThemeToggle() {
        if (!elements.themeToggleBtn) return;

        elements.themeToggleBtn.addEventListener('click', toggleTheme);

        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            elements.themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }

    function toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const isDarkTheme = document.body.classList.contains('dark-theme');
        elements.themeToggleBtn.innerHTML = isDarkTheme ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
    }

    // Tab switching functionality
    function initTabSwitching() {
        // Config tabs
        elements.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn, elements.configContents, 'config'));
        });

        // Login tabs
        elements.loginTabs.forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab, elements.loginForms, 'form'));
        });
    }

    function switchTab(activeBtn, contentElements, type) {
        activeBtn.parentElement.querySelectorAll('.tab-btn, .login-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        activeBtn.classList.add('active');
        contentElements.forEach(content => content.classList.remove('active'));
        const tabId = activeBtn.getAttribute('data-tab');
        document.getElementById(`${tabId}-${type === 'form' ? 'form' : 'configs'}`).classList.add('active');
    }

    // Modal functionality
    function initModals() {
        if (elements.loginBtn) {
            elements.loginBtn.addEventListener('click', () => showModal(elements.loginModal));
        }


        if (elements.mobileLoginBtn) {
            elements.mobileLoginBtn.addEventListener('click', () => {
                showModal(elements.loginModal);
                closeMobileMenu();
            });
        }

        elements.premiumBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const configId = btn.getAttribute('data-id');
                const price = btn.getAttribute('data-price');
                const configName = btn.parentElement.querySelector('h3').textContent;
                const configFile = btn.getAttribute('data-file');
                document.getElementById('payment-info').textContent = `Pay for ${configName}`;
                document.getElementById('payment-amount').textContent = price;
                elements.paymentForm.setAttribute('data-config', configId);
                elements.paymentForm.setAttribute('data-file', configFile);
                showModal(elements.paymentModal);
            });
        });

        if (elements.robbieJRBtn) {
            elements.robbieJRBtn.addEventListener('click', () => showModal(elements.robbieJRModal));
        }

        elements.closeBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const modal = this.closest('.modal');
                if (modal) hideModal(modal);
            });
        });


        window.addEventListener('click', function(e) {
            if (e.target.classList.contains('modal')) {
                hideModal(e.target);
            }
        });
    }


    function showModal(modal) {
        if (modal) modal.style.display = 'block';
    }


    function hideModal(modal) {
        if (modal) modal.style.display = 'none';
    }


    // Form handling
    function initForms() {
        if (elements.paymentForm) {
            elements.paymentForm.addEventListener('submit', handlePayment);
        }


        if (elements.feedbackForm) {
            elements.feedbackForm.addEventListener('submit', handleFeedback);
        }

        if (elements.newsletterForm) {
            elements.newsletterForm.addEventListener('submit', handleNewsletter);
        }
    }


    // ✅ UPDATED FUNCTION
    function handlePayment(e) {
        e.preventDefault();


        const phoneInput = document.getElementById('phone-number').value.trim();
        const configId = this.getAttribute('data-config');
        const configFile = this.getAttribute('data-file');
        const amount = document.getElementById('payment-amount').textContent;

        const phoneRegex = /^(07|01)[0-9]{8}$/;
        if (!phoneRegex.test(phoneInput)) {
            showPaymentStatus("Please enter a valid M-Pesa number (07XXXXXXXX or 01XXXXXXXX)", "error");
            return;
        }


        const payButton = document.getElementById('pay-button');
        payButton.disabled = true;
        payButton.textContent = "Processing...";
        showPaymentStatus("Sending payment request to M-Pesa...", "info");

        fetch('/.netlify/functions/stkpush', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: `254${phoneInput.slice(1)}`,
                amount: parseInt(amount)
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.ResponseCode === "0") {
                showPaymentStatus("STK Push sent! Check your phone to complete payment.", "success");
            } else {
                const message = data.errorMessage || data.CustomerMessage || "Payment failed. Try again.";
                showPaymentStatus(message, "error");
            }
        })

        .catch(() => {
            showPaymentStatus("Network error. Please try again.", "error");
        })
        .finally(() => {
            payButton.disabled = false;
            payButton.textContent = "Pay Now";
        });
    }


    function showPaymentStatus(message, type) {
        const statusElement = document.getElementById('payment-status');
        statusElement.textContent = message;
        statusElement.style.color = `var(--${type}-color)`;
    }


    function handleFeedback(e) {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;
        const submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending...";

        const botToken = '7756702380:AAFtev0dwCjhR6FJQft6yRl7P0EE2BvzQJ4';
        const chatId = '7819091632';
        const text = `New feedback from ${name} (${email}):\n\n${message}`;
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;


        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: text })
        })

        .then(response => response.json())
        .then(data => {
            if (data.ok) {
                alert("Thank you for your feedback!");
                elements.feedbackForm.reset();
            } else {
                alert("Failed to send feedback. Try again.");
            }
        })

        .catch(() => alert("Failed to send feedback. Try again."))
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = "Send Message";
        });
    }


    function handleNewsletter(e) {
        e.preventDefault();
        const email = this.querySelector('input[type="email"]').value;
        const submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = "Subscribing...";
        setTimeout(() => {
            alert("Thank you for subscribing!");
            elements.newsletterForm.reset();
            submitBtn.disabled = false;
            submitBtn.textContent = "Subscribe";
        }, 1500);
    }


    function initSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                if (this.getAttribute('href') !== '#') {
                    e.preventDefault();
                    const targetId = this.getAttribute('href');
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        if (elements.mobileMenu && elements.mobileMenu.style.display === 'block') {
                            closeMobileMenu();
                        }
                        window.scrollTo({
                            top: targetElement.offsetTop - 80,
                            behavior: 'smooth'
                        });
                    }
                }
            });
        });
    }


    function initPayPalButton() {
        if (!elements.paypalContainer) return;
        const paypalBtn = document.createElement('button');
        paypalBtn.className = 'btn';
        paypalBtn.style.backgroundColor = '#0070ba';
        paypalBtn.style.display = 'flex';
        paypalBtn.style.alignItems = 'center';
        paypalBtn.style.justifyContent = 'center';
        paypalBtn.style.gap = '0.5rem';
        paypalBtn.innerHTML = '<i class="fab fa-paypal"></i> Pay with PayPal';


        paypalBtn.addEventListener('click', function() {
            const configName = document.querySelector('.international-premium h3').textContent;
            const price = document.querySelector('.international-premium .config-price').textContent;
            alert(`This would process PayPal payment for ${configName} (${price}) in a real implementation.`);
        });


        elements.paypalContainer.appendChild(paypalBtn);
    }


    function checkPremiumAccess() {
        const premiumAccess = localStorage.getItem("premium_access");
    }
});

