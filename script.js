/* ================================================================
   Mejbahul Haq — Portfolio Website JavaScript
   ================================================================
   This file handles:
   1. Particle Network Animation (Shanto-style background)
   2. Typewriter Text Animation
   3. Scroll Reveal Animations
   4. Smooth Scrolling & Active Nav
   5. Mobile Navigation Toggle
   6. Dark Mode Toggle
   ================================================================ */

// ================================================================
// 🌐 1. PARTICLE NETWORK ANIMATION
// Creates animated dots connected by lines (like Shanto's background)
// ================================================================
class ParticleNetwork {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: null, y: null, radius: 150 };
        this.animationId = null;

        // -- Particle Settings — reads color and settings from SITE.neurons or style.css -- 
        this.particleCount = 80;         // Number of dots
        this.particleSize = 2;           // Size of each dot
        this.lineDistance = 150;         // Max distance to draw connecting lines
        this.speed = 0.4;                // Movement speed
        let dynamicAccent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#F86E49';

        const siteCfg = (typeof SITE !== 'undefined' ? SITE : (window.SITE || null));
        if (siteCfg && siteCfg.neurons) {
            if (siteCfg.neurons.on === false) {
                if (this.canvas) this.canvas.style.display = 'none';
                return;
            }
            if (siteCfg.neurons.color) {
                dynamicAccent = siteCfg.neurons.color;
            }
            if (siteCfg.neurons.density) {
                this.particleCount = Math.floor(this.particleCount * (siteCfg.neurons.density || 1));
            }
        }

        this.particleColor = dynamicAccent;
        this.lineColor = dynamicAccent;
        this.lineOpacity = (siteCfg && siteCfg.neurons && siteCfg.neurons.opacity ? siteCfg.neurons.opacity * 0.25 : 0.15);
        this.particleOpacity = (siteCfg && siteCfg.neurons && siteCfg.neurons.opacity ? siteCfg.neurons.opacity * 0.7 : 0.5);

        this.init();
        this.bindEvents();
    }

    init() {
        this.resize();
        this.createParticles();
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles() {
        this.particles = [];
        // Scale particle count based on screen size for performance
        const area = this.canvas.width * this.canvas.height;
        const count = Math.min(this.particleCount, Math.floor(area / 15000));

        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * this.speed,
                vy: (Math.random() - 0.5) * this.speed,
                size: Math.random() * this.particleSize + 0.5,
                opacity: Math.random() * this.particleOpacity + 0.2,
                pulseSpeed: Math.random() * 0.02 + 0.005,
                pulsePhase: Math.random() * Math.PI * 2
            });
        }
    }

    drawParticle(p, time) {
        // Pulsing opacity effect
        const pulse = Math.sin(time * p.pulseSpeed + p.pulsePhase) * 0.3 + 0.7;
        const opacity = p.opacity * pulse;

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = this.hexToRGBA(this.particleColor, opacity);
        this.ctx.fill();

        // Glow effect
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        this.ctx.fillStyle = this.hexToRGBA(this.particleColor, opacity * 0.1);
        this.ctx.fill();
    }

    drawLines() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < this.lineDistance) {
                    const opacity = this.lineOpacity * (1 - dist / this.lineDistance);
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.strokeStyle = this.hexToRGBA(this.lineColor, opacity);
                    this.ctx.lineWidth = 0.8;
                    this.ctx.stroke();
                }
            }

            // Draw lines to mouse position
            if (this.mouse.x !== null) {
                const dx = this.particles[i].x - this.mouse.x;
                const dy = this.particles[i].y - this.mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < this.mouse.radius) {
                    const opacity = 0.2 * (1 - dist / this.mouse.radius);
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.mouse.x, this.mouse.y);
                    this.ctx.strokeStyle = this.hexToRGBA(this.particleColor, opacity);
                    this.ctx.lineWidth = 0.6;
                    this.ctx.stroke();
                }
            }
        }
    }

    updateParticles() {
        for (const p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;

            // Bounce off edges
            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

            // Mouse interaction — gentle push
            if (this.mouse.x !== null) {
                const dx = p.x - this.mouse.x;
                const dy = p.y - this.mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < this.mouse.radius) {
                    const force = (this.mouse.radius - dist) / this.mouse.radius;
                    p.vx += (dx / dist) * force * 0.02;
                    p.vy += (dy / dist) * force * 0.02;
                }
            }

            // Speed limiting
            const maxSpeed = this.speed * 1.5;
            const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            if (currentSpeed > maxSpeed) {
                p.vx = (p.vx / currentSpeed) * maxSpeed;
                p.vy = (p.vy / currentSpeed) * maxSpeed;
            }
        }
    }

    animate() {
        const time = Date.now();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.updateParticles();
        this.drawLines();
        for (const p of this.particles) {
            this.drawParticle(p, time);
        }
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.resize();
            this.createParticles();
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener('mouseout', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });

        // Touch support for particle interaction on mobile and tablet
        const handleTouch = (e) => {
            if (e.touches && e.touches.length > 0) {
                this.mouse.x = e.touches[0].clientX;
                this.mouse.y = e.touches[0].clientY;
            }
        };

        window.addEventListener('touchstart', handleTouch, { passive: true });
        window.addEventListener('touchmove', handleTouch, { passive: true });
        window.addEventListener('touchend', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        }, { passive: true });
        window.addEventListener('touchcancel', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        }, { passive: true });

        // Pause animation when tab is not visible (performance)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                cancelAnimationFrame(this.animationId);
            } else {
                this.animate();
            }
        });
    }

    hexToRGBA(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}


// ================================================================
// ✍️ 2. TYPEWRITER TEXT ANIMATION
// Types out the hero name letter by letter
// ================================================================
class TypewriterEffect {
    constructor(elementId, text, speed = 80) {
        this.element = document.getElementById(elementId);
        if (!this.element) return;
        this.text = text;
        this.speed = speed;
        this.index = 0;
        this.isDeleting = false;
        this.pauseDelay = 2000;
        this.element.textContent = '';
        this.start();
    }

    start() {
        this.type();
    }

    type() {
        if (this.index <= this.text.length) {
            this.element.textContent = this.text.slice(0, this.index);
            this.index++;
            setTimeout(() => this.type(), this.speed);
        }
        // Stop after typing is complete — no deletion loop
    }
}


// ================================================================
// 👁️ 3. SCROLL REVEAL ANIMATIONS
// Elements with class 'reveal' fade in when scrolled into view
// ================================================================
class ScrollReveal {
    constructor() {
        this.elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
        this.threshold = 0.15;
        this.init();
    }

    init() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('visible');
                            this.observer.unobserve(entry.target);
                        }
                    });
                },
                { threshold: this.threshold, rootMargin: '0px 0px -50px 0px' }
            );

            this.elements.forEach(el => this.observer.observe(el));
        } else {
            // Fallback for older browsers
            this.elements.forEach(el => el.classList.add('visible'));
        }
    }
}


// ================================================================
// 🧭 4. ACTIVE NAVIGATION HIGHLIGHTING
// Highlights the nav link matching the current scroll position
// ================================================================
class ActiveNavigation {
    constructor() {
        this.sections = document.querySelectorAll('.section[id]');
        this.navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
        this.navbar = document.getElementById('navbar');
        this.init();
    }

    init() {
        window.addEventListener('scroll', () => {
            this.updateActiveLink();
            this.updateNavbarStyle();
        });
    }

    updateActiveLink() {
        let currentSection = '';
        const scrollY = window.pageYOffset;

        this.sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;

            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });

        this.navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }

    updateNavbarStyle() {
        if (window.scrollY > 50) {
            this.navbar.classList.add('scrolled');
        } else {
            this.navbar.classList.remove('scrolled');
        }
    }
}


// ================================================================
// 📱 5. MOBILE NAVIGATION TOGGLE
// ================================================================
class MobileNav {
    constructor() {
        this.hamburger = document.getElementById('navHamburger');
        this.navLinks = document.getElementById('navLinks');
        if (!this.hamburger || !this.navLinks) return;
        this.init();
    }

    init() {
        this.hamburger.addEventListener('click', () => this.toggle());

        // Close menu when a link is clicked
        this.navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => this.close());
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.hamburger.contains(e.target) && !this.navLinks.contains(e.target)) {
                this.close();
            }
        });
    }

    toggle() {
        this.hamburger.classList.toggle('active');
        this.navLinks.classList.toggle('open');
    }

    close() {
        this.hamburger.classList.remove('active');
        this.navLinks.classList.remove('open');
    }
}


// ================================================================
// 🌙 6. DARK MODE TOGGLE
// ================================================================
class ThemeToggle {
    constructor() {
        this.toggleBtn = document.getElementById('themeToggle');
        this.icon = this.toggleBtn?.querySelector('i');
        if (!this.toggleBtn) return;

        // Check saved preference
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.applyTheme(this.currentTheme);

        this.toggleBtn.addEventListener('click', () => {
            this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
            this.applyTheme(this.currentTheme);
            localStorage.setItem('theme', this.currentTheme);
        });
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        if (this.icon) {
            this.icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }

        // Update particle colors for dark mode
        if (window.particleNetwork) {
            const dynamicAccent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#C9A96E';
            window.particleNetwork.particleColor = dynamicAccent;
            window.particleNetwork.lineColor = dynamicAccent;
            if (theme === 'dark') {
                window.particleNetwork.lineOpacity = 0.2;
                window.particleNetwork.particleOpacity = 0.6;
            } else {
                window.particleNetwork.lineOpacity = 0.15;
                window.particleNetwork.particleOpacity = 0.5;
            }
        }

        // Update interactive mouse and touch colors
        if (window.interactiveMouseTouch) {
            window.interactiveMouseTouch.updateColors();
        }
    }
}


// ================================================================
// 🔢 7. NUMBER COUNTER ANIMATION
// Animates numbers when they scroll into view
// ================================================================
class NumberCounter {
    constructor() {
        this.counters = document.querySelectorAll('[data-count]');
        if (this.counters.length === 0) return;
        this.init();
    }

    init() {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateCount(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.5 }
        );

        this.counters.forEach(counter => observer.observe(counter));
    }

    animateCount(el) {
        const target = parseInt(el.getAttribute('data-count'));
        const duration = 2000;
        const startTime = performance.now();

        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(target * eased);

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                el.textContent = target;
            }
        };

        requestAnimationFrame(update);
    }
}


// ================================================================
// 🖼️ 8. IMAGE ERROR HANDLER
// Shows a placeholder or fallback image if profile photo fails to load
// ================================================================
function handleImageErrors() {
    const heroPhoto = document.getElementById('heroPhoto');
    if (heroPhoto) {
        heroPhoto.addEventListener('error', function() {
            if (this.getAttribute('data-fallback-tried') !== 'true') {
                this.setAttribute('data-fallback-tried', 'true');
                this.src = 'assets/profile.jpg';
                return;
            }
            this.src = 'data:image/svg+xml,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
                    <rect width="200" height="200" rx="100" fill="#FFF4F0"/>
                    <circle cx="100" cy="80" r="35" fill="#F86E49" opacity="0.3"/>
                    <ellipse cx="100" cy="155" rx="55" ry="35" fill="#F86E49" opacity="0.2"/>
                    <text x="100" y="185" text-anchor="middle" fill="#F86E49" font-size="12" font-family="Poppins, sans-serif">Add Photo</text>
                </svg>
            `);
            this.alt = 'Profile photo';
        });
    }

    const aboutImg = document.getElementById('aboutPhoto') || document.querySelector('.about-image img');
    if (aboutImg) {
        aboutImg.addEventListener('error', function() {
            if (this.getAttribute('data-fallback-tried') !== 'true') {
                this.setAttribute('data-fallback-tried', 'true');
                this.src = 'assets/about.jpeg';
                return;
            }
            this.src = 'data:image/svg+xml,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" fill="none">
                    <rect width="400" height="400" rx="16" fill="#FFF4F0"/>
                    <circle cx="200" cy="160" r="60" fill="#F86E49" opacity="0.25"/>
                    <ellipse cx="200" cy="290" rx="90" ry="55" fill="#F86E49" opacity="0.18"/>
                    <text x="200" y="370" text-anchor="middle" fill="#F86E49" font-size="16" font-family="Poppins, sans-serif">Photo</text>
                </svg>
            `);
        });
    }
}


// ================================================================
// 🎯 9. SMOOTH SCROLL FOR ANCHOR LINKS
// ================================================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (!targetId || targetId === '#' || targetId.length <= 1) return;
            try {
                const targetEl = document.querySelector(targetId);
                if (targetEl) {
                    e.preventDefault();
                    targetEl.scrollIntoView({ behavior: 'smooth' });
                }
            } catch (err) {
                // Ignore invalid selector gracefully
            }
        });
    });
}


// ================================================================
// ✨ 10. INTERACTIVE MOUSE & TOUCH EFFECTS
// Follower cursor, stardust particle trail, click shockwaves,
// mobile touch ripples, and 3D card tilt with spotlight glow.
// ================================================================
class InteractiveMouseTouch {
    constructor() {
        this.cursorDot = document.getElementById('cursorDot');
        this.cursorRing = document.getElementById('cursorRing');
        this.canvas = document.getElementById('interaction-canvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.ripples = [];
        this.animationId = null;

        this.mouse = { x: -100, y: -100 };
        this.ring = { x: -100, y: -100 };
        this.lastSpawn = { x: -100, y: -100 };
        this.isHovering = false;
        this.isTouchDevice = false;

        this.updateColors();
        this.init();
    }

    updateColors() {
        const rootStyle = getComputedStyle(document.documentElement);
        this.primaryColor = rootStyle.getPropertyValue('--primary').trim() || '#F86E49';
        this.accentColor = rootStyle.getPropertyValue('--accent').trim() || '#F64360';
        this.magentaColor = rootStyle.getPropertyValue('--phyhunt-magenta').trim() || '#F4137B';
        this.colorPalette = [this.primaryColor, this.accentColor, this.magentaColor, '#FFA1B2', '#FF8F6E'];
    }

    init() {
        this.resize();
        this.bindEvents();
        this.initCards();
        this.startLoop();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize(), { passive: true });

        // Mouse movement (Desktop)
        window.addEventListener('mousemove', (e) => {
            if (this.isTouchDevice) return;

            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;

            if (this.cursorDot && this.cursorRing) {
                this.cursorDot.classList.add('cursor-visible');
                this.cursorRing.classList.add('cursor-visible');
            }

            // Move dot immediately with hardware acceleration
            if (this.cursorDot) {
                this.cursorDot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
            }

            // Spawn stardust sparkle trail
            const dx = e.clientX - this.lastSpawn.x;
            const dy = e.clientY - this.lastSpawn.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 14) {
                this.spawnSparkle(e.clientX, e.clientY, 1);
                this.lastSpawn.x = e.clientX;
                this.lastSpawn.y = e.clientY;
            }
        }, { passive: true });

        // Mouse leave window
        document.documentElement.addEventListener('mouseleave', () => {
            if (this.cursorDot && this.cursorRing) {
                this.cursorDot.classList.remove('cursor-visible');
                this.cursorRing.classList.remove('cursor-visible');
            }
        });

        // Mouse enter window
        document.documentElement.addEventListener('mouseenter', () => {
            if (!this.isTouchDevice && this.cursorDot && this.cursorRing) {
                this.cursorDot.classList.add('cursor-visible');
                this.cursorRing.classList.add('cursor-visible');
            }
        });

        // Mouse click shockwave & spark burst
        window.addEventListener('mousedown', (e) => {
            if (this.isTouchDevice) return;
            if (this.cursorRing) this.cursorRing.classList.add('cursor-active');

            this.spawnRipple(e.clientX, e.clientY, 38, 2.5);
            this.spawnSparkBurst(e.clientX, e.clientY, 12);
        });

        window.addEventListener('mouseup', () => {
            if (this.cursorRing) this.cursorRing.classList.remove('cursor-active');
        });

        // Hover reaction on interactive elements
        const interactiveSelector = 'a, button, .btn, .interest-card, .project-card, .skill-tag, .contact-card, .cert-card, .edu-item, .achievement-item, .stat-item, .theme-toggle, .nav-hamburger, .hero-photo, .footer-social a, input, textarea';

        document.addEventListener('mouseover', (e) => {
            if (this.isTouchDevice) return;
            const target = e.target.closest(interactiveSelector);
            if (target) {
                this.isHovering = true;
                if (this.cursorRing) this.cursorRing.classList.add('cursor-hover');
                if (this.cursorDot) this.cursorDot.classList.add('cursor-hover');
            }
        });

        document.addEventListener('mouseout', (e) => {
            if (this.isTouchDevice) return;
            const target = e.target.closest(interactiveSelector);
            if (target) {
                this.isHovering = false;
                if (this.cursorRing) this.cursorRing.classList.remove('cursor-hover');
                if (this.cursorDot) this.cursorDot.classList.remove('cursor-hover');
            }
        });

        // Touch event handlers (Mobile & Tablet)
        window.addEventListener('touchstart', (e) => {
            this.isTouchDevice = true;
            if (this.cursorDot && this.cursorRing) {
                this.cursorDot.style.display = 'none';
                this.cursorRing.style.display = 'none';
            }

            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                this.spawnRipple(touch.clientX, touch.clientY, 54, 2.5);
                this.spawnSparkBurst(touch.clientX, touch.clientY, 8);
            }
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                this.spawnSparkle(touch.clientX, touch.clientY, 1);
            }
        }, { passive: true });
    }

    initCards() {
        const cards = document.querySelectorAll('.project-card, .interest-card, .contact-card, .edu-item, .achievement-item, .stat-item, .about-card, .cert-card');

        cards.forEach(card => {
            card.classList.add('spotlight-card');

            const handleMove = (clientX, clientY) => {
                const rect = card.getBoundingClientRect();
                const x = clientX - rect.left;
                const y = clientY - rect.top;
                card.style.setProperty('--card-mouse-x', `${x}px`);
                card.style.setProperty('--card-mouse-y', `${y}px`);

                // Gentle 3D perspective tilt
                if (!this.isTouchDevice && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    const rotateX = ((y - centerY) / centerY) * -5;
                    const rotateY = ((x - centerX) / centerX) * 5;
                    card.style.transform = `perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
                }
            };

            card.addEventListener('mousemove', (e) => {
                handleMove(e.clientX, e.clientY);
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });

            card.addEventListener('touchstart', (e) => {
                if (e.touches.length > 0) {
                    handleMove(e.touches[0].clientX, e.touches[0].clientY);
                    card.classList.add('touch-active');
                }
            }, { passive: true });

            card.addEventListener('touchmove', (e) => {
                if (e.touches.length > 0) {
                    handleMove(e.touches[0].clientX, e.touches[0].clientY);
                }
            }, { passive: true });

            card.addEventListener('touchend', () => {
                card.classList.remove('touch-active');
            }, { passive: true });
        });
    }

    spawnSparkle(x, y, count = 1) {
        for (let i = 0; i < count; i++) {
            const color = this.colorPalette[Math.floor(Math.random() * this.colorPalette.length)];
            const isStar = Math.random() > 0.45;
            this.particles.push({
                x: x + (Math.random() - 0.5) * 6,
                y: y + (Math.random() - 0.5) * 6,
                vx: (Math.random() - 0.5) * 1.2,
                vy: (Math.random() - 0.5) * 1.2 - 0.4,
                size: Math.random() * 2.5 + 1.2,
                color: color,
                alpha: 0.85,
                decay: Math.random() * 0.025 + 0.02,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.1,
                isStar: isStar
            });
        }
    }

    spawnSparkBurst(x, y, count = 12) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.4;
            const speed = Math.random() * 2.8 + 1.6;
            const color = this.colorPalette[Math.floor(Math.random() * this.colorPalette.length)];
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 3 + 1.5,
                color: color,
                alpha: 0.95,
                decay: Math.random() * 0.03 + 0.025,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.15,
                isStar: Math.random() > 0.3
            });
        }
    }

    spawnRipple(x, y, maxRadius = 45, lineWidth = 2) {
        this.ripples.push({
            x: x,
            y: y,
            radius: 4,
            maxRadius: maxRadius,
            alpha: 0.9,
            color: this.accentColor,
            lineWidth: lineWidth
        });
    }

    drawSparkleStar(ctx, x, y, size, rotation, color, alpha) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.fillStyle = this.hexToRGBA(color, alpha);

        ctx.beginPath();
        ctx.moveTo(0, -size * 2);
        ctx.quadraticCurveTo(0, 0, size * 2, 0);
        ctx.quadraticCurveTo(0, 0, 0, size * 2);
        ctx.quadraticCurveTo(0, 0, -size * 2, 0);
        ctx.quadraticCurveTo(0, 0, 0, -size * 2);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    startLoop() {
        const loop = () => {
            // Smooth ring follower interpolation (lerp)
            if (!this.isTouchDevice && this.cursorRing && this.mouse.x !== -100) {
                this.ring.x += (this.mouse.x - this.ring.x) * 0.18;
                this.ring.y += (this.mouse.y - this.ring.y) * 0.18;
                this.cursorRing.style.transform = `translate3d(${this.ring.x}px, ${this.ring.y}px, 0) translate(-50%, -50%)`;
            }

            // Draw canvas effects
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // 1. Draw and update expanding ripple rings
            for (let i = this.ripples.length - 1; i >= 0; i--) {
                const r = this.ripples[i];
                r.radius += (r.maxRadius - r.radius) * 0.14 + 0.8;
                r.alpha -= 0.035;

                if (r.alpha <= 0 || r.radius >= r.maxRadius) {
                    this.ripples.splice(i, 1);
                    continue;
                }

                this.ctx.beginPath();
                this.ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
                this.ctx.strokeStyle = this.hexToRGBA(r.color, r.alpha);
                this.ctx.lineWidth = r.lineWidth;
                this.ctx.stroke();

                if (r.radius > 8) {
                    this.ctx.beginPath();
                    this.ctx.arc(r.x, r.y, r.radius * 0.65, 0, Math.PI * 2);
                    this.ctx.strokeStyle = this.hexToRGBA(r.color, r.alpha * 0.5);
                    this.ctx.lineWidth = r.lineWidth * 0.7;
                    this.ctx.stroke();
                }
            }

            // 2. Draw and update sparkle particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.96;
                p.vy *= 0.96;
                p.rotation += p.rotSpeed;
                p.alpha -= p.decay;

                if (p.alpha <= 0) {
                    this.particles.splice(i, 1);
                    continue;
                }

                if (p.isStar) {
                    this.drawSparkleStar(this.ctx, p.x, p.y, p.size, p.rotation, p.color, p.alpha);
                } else {
                    this.ctx.beginPath();
                    this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    this.ctx.fillStyle = this.hexToRGBA(p.color, p.alpha);
                    this.ctx.fill();

                    this.ctx.beginPath();
                    this.ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
                    this.ctx.fillStyle = this.hexToRGBA(p.color, p.alpha * 0.25);
                    this.ctx.fill();
                }
            }

            this.animationId = requestAnimationFrame(loop);
        };

        this.animationId = requestAnimationFrame(loop);
    }

    hexToRGBA(hex, alpha) {
        if (!hex || !hex.startsWith('#')) return `rgba(246, 67, 96, ${alpha})`;
        let cleanHex = hex.replace('#', '');
        if (cleanHex.length === 3) {
            cleanHex = cleanHex.split('').map(c => c + c).join('');
        }
        const r = parseInt(cleanHex.slice(0, 2), 16) || 246;
        const g = parseInt(cleanHex.slice(2, 4), 16) || 67;
        const b = parseInt(cleanHex.slice(4, 6), 16) || 96;
        return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
    }
}


// ================================================================
// 📋 11. DYNAMIC CONFIG-DRIVEN PORTFOLIO RENDERER
// Automatically builds the website layout from the SITE object
// ================================================================
function renderPortfolioFromConfig(SITE) {
    if (!SITE) return;

    // 1. Page Title & Meta
    if (SITE.name) {
        document.title = `${SITE.name} — ${SITE.role || 'Portfolio'}`;
    }

    // 2. Navbar Logo & Dynamic Navigation Links
    const navLogo = document.getElementById('navLogo');
    if (navLogo) {
        navLogo.innerHTML = `${SITE.shortName || SITE.name || 'Portfolio'}<span>.</span>`;
    }

    const navLinksContainer = document.getElementById('navLinks');
    if (navLinksContainer) {
        const links = [];
        links.push({ id: 'home', label: 'Home' });
        if (SITE.biography && SITE.biography.length) links.push({ id: 'about', label: 'About' });
        if (SITE.education && SITE.education.length) links.push({ id: 'education', label: 'Education' });
        if ((SITE.interests && SITE.interests.length) || (SITE.research && SITE.research.length)) links.push({ id: 'interests', label: 'Interests' });
        if (SITE.skills && SITE.skills.length) links.push({ id: 'skills', label: 'Skills' });
        if (SITE.projects && SITE.projects.length) links.push({ id: 'projects', label: 'Projects' });
        if ((SITE.achievements && SITE.achievements.length) || (SITE.activities && SITE.activities.length)) links.push({ id: 'achievements', label: 'Achievements' });
        if ((SITE.certificates && SITE.certificates.length) || (SITE.training && SITE.training.length)) links.push({ id: 'certificates', label: 'Certificates' });
        links.push({ id: 'contact', label: 'Contact' });

        let navHTML = links.map(link => `<a href="#${link.id}">${link.label}</a>`).join('');
        navHTML += `
            <button class="theme-toggle" id="themeToggle" aria-label="Toggle dark mode">
                <i class="fas fa-moon"></i>
            </button>
        `;
        navLinksContainer.innerHTML = navHTML;
    }

    // 3. Hero Section
    const heroPhotoImg = document.getElementById('heroPhoto');
    if (heroPhotoImg && SITE.photo) {
        heroPhotoImg.src = SITE.photo;
        heroPhotoImg.alt = `${SITE.name || 'Profile'} Photo`;
    }

    const heroSubtitle = document.getElementById('heroSubtitle');
    if (heroSubtitle && SITE.role) {
        const words = SITE.role.split(' ');
        heroSubtitle.innerHTML = words.map(w => {
            if (w === '&' || w === 'and') return `<span class="subtitle-separator">${w}</span>`;
            return `<span class="subtitle-word">${w}</span>`;
        }).join(' ');
    }

    const heroUniversity = document.getElementById('heroUniversity');
    if (heroUniversity) {
        if (SITE.location) {
            heroUniversity.innerHTML = `<i class="fas fa-university"></i> ${SITE.location}`;
            heroUniversity.style.display = '';
        } else {
            heroUniversity.style.display = 'none';
        }
    }

    const heroSession = document.getElementById('heroSession');
    if (heroSession) {
        if (SITE.session) {
            heroSession.innerHTML = `<i class="fas fa-calendar-alt"></i> ${SITE.session}`;
            heroSession.style.display = '';
        } else {
            heroSession.style.display = 'none';
        }
    }

    const heroDescription = document.getElementById('heroDescription');
    if (heroDescription && SITE.about) {
        heroDescription.textContent = SITE.about;
    }

    const heroButtons = document.getElementById('heroButtons');
    if (heroButtons) {
        let btnHTML = '';
        if (SITE.projects && SITE.projects.length) {
            btnHTML += `<a href="#projects" class="btn btn--primary btn--glow"><i class="fas fa-rocket"></i> View My Projects</a>`;
        }
        btnHTML += `<a href="#contact" class="btn btn--outline"><i class="fas fa-envelope"></i> Contact Me</a>`;
        if ((SITE.certificates && SITE.certificates.length) || (SITE.training && SITE.training.length)) {
            btnHTML += `<a href="#certificates" class="btn btn--outline"><i class="fas fa-certificate"></i> My Certificates</a>`;
        }
        if (SITE.cv) {
            btnHTML += `<a href="${SITE.cv}" target="_blank" class="btn btn--outline"><i class="fas fa-file-alt"></i> ${SITE.cvLabel || 'Curriculum Vitae'}</a>`;
        }
        if (SITE.resume) {
            btnHTML += `<a href="${SITE.resume}" target="_blank" class="btn btn--outline"><i class="fas fa-file-pdf"></i> Resume</a>`;
        }
        heroButtons.innerHTML = btnHTML;
    }

    // 4. About / Biography & Stats
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
        if (!SITE.biography || SITE.biography.length === 0) {
            aboutSection.style.display = 'none';
        } else {
            aboutSection.style.display = '';
            const bioContainer = document.getElementById('aboutBioContainer');
            if (bioContainer) {
                bioContainer.innerHTML = SITE.biography.map(p => `<p>${p}</p>`).join('');
            }
            const aboutPhoto = document.getElementById('aboutPhoto');
            if (aboutPhoto && (SITE.aboutPhoto || SITE.photo)) {
                aboutPhoto.src = SITE.aboutPhoto || SITE.photo;
            }

            const statsContainer = document.getElementById('aboutStatsContainer');
            if (statsContainer) {
                const statsList = SITE.stats || SITE.impact || [];
                if (statsList.length > 0) {
                    statsContainer.innerHTML = statsList.map(st => `
                        <div class="stat-item">
                            <span class="stat-number">${st.number || st.title || ''}</span>
                            <span class="stat-label">${st.label || st.text || ''}</span>
                        </div>
                    `).join('');
                    statsContainer.style.display = 'flex';
                } else {
                    statsContainer.style.display = 'none';
                }
            }
        }
    }

    // 5. Education
    const eduSection = document.getElementById('education');
    if (eduSection) {
        if (!SITE.education || SITE.education.length === 0) {
            eduSection.style.display = 'none';
        } else {
            eduSection.style.display = '';
            const eduTimeline = document.getElementById('educationTimeline');
            if (eduTimeline) {
                eduTimeline.innerHTML = SITE.education.map(item => `
                    <div class="edu-item reveal">
                        <h3>${item.title || ''}</h3>
                        <p class="edu-school"><i class="fas fa-university"></i> ${item.place || ''}</p>
                        <div class="edu-details">
                            ${item.period ? `<span><i class="fas fa-calendar"></i> ${item.period}</span>` : ''}
                            ${item.level ? `<span><i class="fas fa-book"></i> ${item.level}</span>` : ''}
                            ${item.result ? `<span><i class="fas fa-star"></i> ${item.result}</span>` : ''}
                            ${item.note ? `<span><i class="fas fa-info-circle"></i> ${item.note}</span>` : ''}
                        </div>
                    </div>
                `).join('');
            }
        }
    }

    // 6. Interests / Research
    const interestsSection = document.getElementById('interests');
    if (interestsSection) {
        const interestItems = SITE.interests || SITE.research || [];
        if (interestItems.length === 0) {
            interestsSection.style.display = 'none';
        } else {
            interestsSection.style.display = '';
            const interestsGrid = document.getElementById('interestsGrid');
            if (interestsGrid) {
                interestsGrid.innerHTML = interestItems.map((item, idx) => `
                    <div class="interest-card reveal stagger-${(idx % 6) + 1}">
                        <div class="interest-icon">
                            <i class="fas fa-${item.icon || (item.visual === 'ml' ? 'brain' : item.visual === 'solar' ? 'solar-panel' : 'microchip')}"></i>
                        </div>
                        <h3>${item.title || ''}</h3>
                        <p>${item.description || item.text || ''}</p>
                    </div>
                `).join('');
            }
        }
    }

    // 7. Skills
    const skillsSection = document.getElementById('skills');
    if (skillsSection) {
        if (!SITE.skills || SITE.skills.length === 0) {
            skillsSection.style.display = 'none';
        } else {
            skillsSection.style.display = '';
            const skillsContainer = document.getElementById('skillsContainer');
            if (skillsContainer) {
                let skillsHTML = '';
                SITE.skills.forEach((sk, idx) => {
                    if (typeof sk === 'string') {
                        skillsHTML += `<div class="skill-tag reveal stagger-${(idx % 6) + 1}"><i class="fas fa-check-circle"></i> ${sk}</div>`;
                    } else if (sk.group && sk.items) {
                        sk.items.forEach((item, iIdx) => {
                            skillsHTML += `<div class="skill-tag reveal stagger-${((idx + iIdx) % 6) + 1}"><i class="fas fa-${sk.icon || 'cogs'}"></i> ${item}</div>`;
                        });
                    } else {
                        const iconClass = sk.isBrand ? `fab fa-${sk.icon || 'code'}` : `fas fa-${sk.icon || 'check-circle'}`;
                        skillsHTML += `<div class="skill-tag reveal stagger-${(idx % 6) + 1}"><i class="${iconClass}"></i> ${sk.name || ''}</div>`;
                    }
                });
                skillsContainer.innerHTML = skillsHTML;
            }
        }
    }

    // 8. Projects
    const projectsSection = document.getElementById('projects');
    if (projectsSection) {
        if (!SITE.projects || SITE.projects.length === 0) {
            projectsSection.style.display = 'none';
        } else {
            projectsSection.style.display = '';
            const projectsGrid = document.getElementById('projectsGrid');
            if (projectsGrid) {
                projectsGrid.innerHTML = SITE.projects.map(proj => `
                    <div class="project-card reveal">
                        <div class="project-card-image">
                            ${proj.image ? `<img src="${proj.image}" alt="${proj.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
                            <div class="project-placeholder" style="${proj.image ? 'display: none;' : ''}">
                                <i class="fas fa-${proj.icon || 'microchip'}"></i>
                            </div>
                        </div>
                        <div class="project-card-body">
                            ${proj.category ? `<div class="project-tags" style="margin-bottom: 8px;"><span>${proj.category}</span></div>` : ''}
                            <h3>${proj.title || ''}</h3>
                            <p>${proj.description || ''}</p>
                            ${proj.tags && proj.tags.length ? `
                                <div class="project-tags">
                                    ${proj.tags.map(t => `<span>${t}</span>`).join('')}
                                </div>
                            ` : ''}
                            ${proj.links && proj.links.length ? `
                                <div style="margin-top: 14px; display: flex; gap: 8px; flex-wrap: wrap;">
                                    ${proj.links.map(l => `<a href="${l.url}" target="_blank" class="cert-link"><i class="fas fa-external-link-alt"></i> ${l.label}</a>`).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('');
            }
        }
    }

    // 9. Achievements / Activities
    const achievementsSection = document.getElementById('achievements');
    if (achievementsSection) {
        const achList = SITE.achievements || SITE.activities || [];
        if (achList.length === 0) {
            achievementsSection.style.display = 'none';
        } else {
            achievementsSection.style.display = '';
            const achievementsContent = document.getElementById('achievementsContent');
            if (achievementsContent) {
                achievementsContent.innerHTML = achList.map(ach => `
                    <div class="achievement-item reveal">
                        <div class="achievement-icon">
                            <i class="fas fa-${ach.icon || 'trophy'}"></i>
                        </div>
                        <div>
                            <h4>${ach.title || ''}</h4>
                            <p>${ach.text || ach.description || (ach.event ? `${ach.event} · ${ach.place || ''}` : '')}</p>
                        </div>
                    </div>
                `).join('');
            }
        }
    }

    // 10. Certificates / Training
    const certSection = document.getElementById('certificates');
    if (certSection) {
        const certList = SITE.certificates || SITE.training || [];
        if (certList.length === 0) {
            certSection.style.display = 'none';
        } else {
            certSection.style.display = '';
            const certificatesGrid = document.getElementById('certificatesGrid');
            if (certificatesGrid) {
                certificatesGrid.innerHTML = certList.map((cert, idx) => `
                    <div class="certificate-card reveal stagger-${(idx % 6) + 1}">
                        <div class="cert-icon">
                            <i class="fas fa-${cert.icon || 'award'}"></i>
                        </div>
                        <div class="cert-info">
                            <h4>${cert.title || ''}</h4>
                            <p>${cert.organization || cert.place || ''}</p>
                            ${cert.link ? `
                                <a href="${cert.link}" target="_blank" class="cert-link">
                                    <i class="fas fa-external-link-alt"></i> ${cert.linkLabel || 'View Certificate'}
                                </a>
                            ` : ''}
                        </div>
                        <div class="cert-badge">
                            <i class="fas fa-check-circle"></i>
                        </div>
                    </div>
                `).join('');
            }
        }
    }

    // 11. Contact
    const contactGrid = document.getElementById('contactGrid');
    if (contactGrid) {
        let contactHTML = '';
        if (SITE.email) {
            contactHTML += `
                <div class="contact-card reveal stagger-1">
                    <div class="contact-card-icon"><i class="fas fa-envelope"></i></div>
                    <h4>Email</h4>
                    <a href="mailto:${SITE.email}">${SITE.email}</a>
                </div>
            `;
        }
        if (SITE.whatsapp) {
            contactHTML += `
                <div class="contact-card reveal stagger-2">
                    <div class="contact-card-icon"><i class="fab fa-whatsapp"></i></div>
                    <h4>WhatsApp</h4>
                    <a href="${SITE.whatsapp}" target="_blank">Send Message</a>
                </div>
            `;
        } else if (SITE.phone) {
            contactHTML += `
                <div class="contact-card reveal stagger-2">
                    <div class="contact-card-icon"><i class="fas fa-phone-alt"></i></div>
                    <h4>Phone</h4>
                    <a href="tel:${SITE.phone}">${SITE.phone}</a>
                </div>
            `;
        }
        if (SITE.socials && SITE.socials.length) {
            const socialIconMap = {
                linkedin: 'fab fa-linkedin-in',
                github: 'fab fa-github',
                facebook: 'fab fa-facebook-f',
                email: 'fas fa-envelope',
                whatsapp: 'fab fa-whatsapp',
                link: 'fas fa-link'
            };
            SITE.socials.forEach((soc, idx) => {
                if (soc.icon === 'email' || (soc.icon === 'whatsapp' && SITE.whatsapp)) return;
                contactHTML += `
                    <div class="contact-card reveal stagger-${((idx + 2) % 6) + 1}">
                        <div class="contact-card-icon"><i class="${socialIconMap[soc.icon] || 'fas fa-link'}"></i></div>
                        <h4>${soc.label}</h4>
                        <a href="${soc.url}" target="_blank">${soc.label} Profile</a>
                    </div>
                `;
            });
        }
        contactGrid.innerHTML = contactHTML;
    }

    const contactButtons = document.getElementById('contactButtons');
    if (contactButtons) {
        let btnsHTML = '';
        if (SITE.email) {
            btnsHTML += `<a href="mailto:${SITE.email}" class="btn btn--primary btn--glow"><i class="fas fa-paper-plane"></i> Email Me</a>`;
        }
        if (SITE.whatsapp) {
            btnsHTML += `<a href="${SITE.whatsapp}" target="_blank" class="btn btn--outline"><i class="fab fa-whatsapp"></i> WhatsApp</a>`;
        }
        contactButtons.innerHTML = btnsHTML;
    }

    // 12. Footer
    const footerName = document.getElementById('footerName');
    if (footerName) {
        footerName.innerHTML = `<strong>${SITE.name || 'Portfolio'}</strong> · ${SITE.role || 'Student'}`;
    }

    const footerSocial = document.getElementById('footerSocial');
    if (footerSocial) {
        const socialIconMap = {
            linkedin: 'fab fa-linkedin-in',
            github: 'fab fa-github',
            facebook: 'fab fa-facebook-f',
            email: 'fas fa-envelope',
            whatsapp: 'fab fa-whatsapp'
        };
        let socHTML = '';
        if (SITE.email) socHTML += `<a href="mailto:${SITE.email}" aria-label="Email"><i class="fas fa-envelope"></i></a>`;
        if (SITE.whatsapp) socHTML += `<a href="${SITE.whatsapp}" target="_blank" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a>`;
        (SITE.socials || []).forEach(soc => {
            if (soc.icon === 'email' || soc.icon === 'whatsapp') return;
            socHTML += `<a href="${soc.url}" target="_blank" aria-label="${soc.label}"><i class="${socialIconMap[soc.icon] || 'fas fa-link'}"></i></a>`;
        });
        footerSocial.innerHTML = socHTML;
    }
}


// ================================================================
// ⚡ INITIALIZE EVERYTHING ON PAGE LOAD
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
    const siteConfig = (typeof SITE !== 'undefined' ? SITE : (window.SITE || null));

    // 1. Render all website sections from SITE configuration
    renderPortfolioFromConfig(siteConfig);

    // 2. Start particle network animation
    window.particleNetwork = new ParticleNetwork('particle-canvas');

    // 3. Start typewriter with hero name
    const heroName = (siteConfig && siteConfig.name) ? siteConfig.name : 'Portfolio';
    new TypewriterEffect('typewriter', heroName, 85);

    // 4. Initialize scroll reveals
    new ScrollReveal();

    // 5. Active navigation highlighting
    new ActiveNavigation();

    // 6. Mobile navigation
    new MobileNav();

    // 7. Dark mode toggle
    new ThemeToggle();

    // 8. Number counter (for stats)
    new NumberCounter();

    // 9. Image error handling & fallback
    handleImageErrors();

    // 10. Smooth scrolling
    initSmoothScroll();

    // 11. Interactive mouse & touch effects (halo, ripples, sparkles, 3D card tilt & spotlight)
    window.interactiveMouseTouch = new InteractiveMouseTouch();
});
