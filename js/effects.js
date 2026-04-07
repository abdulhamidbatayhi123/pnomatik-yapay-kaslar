// ===== PREMIUM EFFECTS (SAFE VERSION) =====
// All effects are wrapped in try-catch and designed to not break the presentation

// ===== CINEMATIC PRELOADER =====
try {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const preloader = document.getElementById('preloader');
            if (preloader) {
                preloader.classList.add('hidden');
                setTimeout(() => preloader.remove(), 1000);
            }
        }, 2200); // 2.2 seconds allows the bar to load
    });
} catch(e) { console.warn('Preloader effect skipped:', e); }

// ===== CURSOR RING EFFECT =====
try {
    const spotlight = document.getElementById('cursorSpotlight');
    if (spotlight) {
        let sx = window.innerWidth / 2, sy = window.innerHeight / 2;
        let tx = sx, ty = sy;
        document.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; });
        (function animateSpot() {
            sx += (tx - sx) * 0.06;
            sy += (ty - sy) * 0.06;
            spotlight.style.left = sx + 'px';
            spotlight.style.top = sy + 'px';
            requestAnimationFrame(animateSpot);
        })();
    }
} catch(e) { console.warn('Spotlight effect skipped:', e); }


// ===== STAGGERED CARD REVEAL ON SLIDE CHANGE =====
// Uses a flag to prevent re-entry and infinite loops
try {
    let lastProcessedSlide = null;

    function revealSlideContent() {
        const activeSlide = document.querySelector('.slide.active');
        if (!activeSlide || activeSlide === lastProcessedSlide) return;
        lastProcessedSlide = activeSlide;

        // Animate cards with stagger
        const cards = activeSlide.querySelectorAll('.glass-card, .feature-card, .ai-card, .roadmap-item, .flow-step, .presenter-card');
        cards.forEach((card, i) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100 + i * 70);
            
            // Re-bind spotlight tracker for newly revealed cards
            card.addEventListener('mousemove', e => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            });
        });

        // Animate headings
        const headings = activeSlide.querySelectorAll('h1, h2, h3');
        headings.forEach((heading, i) => {
            heading.style.opacity = '0';
            heading.style.filter = 'blur(10px)';
            heading.style.transform = 'translateY(15px)';
            setTimeout(() => {
                heading.style.transition = 'opacity 0.8s ease, filter 0.8s ease, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
                heading.style.opacity = '1';
                heading.style.filter = 'blur(0)';
                heading.style.transform = 'translateY(0)';
                heading.classList.add('shimmer-active');
            }, 100 + i * 150);
        });

        // Animate paragraphs and lists
        const texts = activeSlide.querySelectorAll('p, .icon-list li, .timeline-item');
        texts.forEach((text, i) => {
            text.style.opacity = '0';
            text.style.transform = 'translateY(10px)';
            setTimeout(() => {
                text.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                text.style.opacity = '1';
                text.style.transform = 'translateY(0)';
            }, 300 + i * 50);
        });
    }

    // Listen for slide changes via the navigation system
    const origNext = window.nextSlide;
    const origPrev = window.prevSlide;
    if (origNext) {
        window.nextSlide = function() { origNext(); setTimeout(revealSlideContent, 50); };
    }
    if (origPrev) {
        window.prevSlide = function() { origPrev(); setTimeout(revealSlideContent, 50); };
    }
    // Also handle keyboard nav
    document.addEventListener('keydown', () => setTimeout(revealSlideContent, 100));

    // Initial reveal
    setTimeout(revealSlideContent, 500);

} catch(e) { console.warn('Reveal effect skipped:', e); }


// ===== KEYBOARD HINT (shows briefly on load) =====
try {
    const hint = document.createElement('div');
    hint.className = 'keyboard-hint';
    hint.innerHTML = '⌨️ <span>Ok tuşları ile gezinin</span>';
    document.body.appendChild(hint);
    setTimeout(() => { hint.style.opacity = '1'; hint.style.transform = 'translateY(0)'; }, 2000);
    setTimeout(() => {
        hint.style.opacity = '0';
        hint.style.transform = 'translateY(10px)';
        setTimeout(() => hint.remove(), 500);
    }, 6000);
} catch(e) { console.warn('Keyboard hint skipped:', e); }
