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


// ===== EXPANDABLE MEDIA TILES =====
// Any element with class "expandable" containing a child ".expandable-media-wrap"
// becomes click-to-toggle. Only one tile per slide is open at a time.
// Iframes inside hidden tiles are loaded lazily via data-src to keep the deck snappy.
function initExpandableTiles(slideEl) {
    if (!slideEl) return;
    const tiles = slideEl.querySelectorAll('.expandable');
    tiles.forEach(tile => {
        if (tile._expandableBound) return;
        tile._expandableBound = true;
        tile.addEventListener('click', (e) => {
            // Ignore clicks that landed on links / iframes / interactive media
            const tag = (e.target.tagName || '').toLowerCase();
            if (tag === 'a' || tag === 'iframe' || tag === 'img' || tag === 'video') return;

            const wasOpen = tile.classList.contains('is-open');

            // Close every other tile in the same slide
            slideEl.querySelectorAll('.expandable.is-open').forEach(t => {
                if (t !== tile) t.classList.remove('is-open');
            });

            if (wasOpen) {
                tile.classList.remove('is-open');
                return;
            }

            // Lazy-load any iframes inside this tile
            tile.querySelectorAll('iframe[data-src]').forEach(ifr => {
                ifr.setAttribute('src', ifr.getAttribute('data-src'));
                ifr.removeAttribute('data-src');
            });

            tile.classList.add('is-open');
        });
    });
}
window.initExpandableTiles = initExpandableTiles;


// ===== PAM ARCHITECTURE LIGHTBOX =====
// Click an icon trigger in the four-panel PAM grid → open a centered modal with
// the corresponding real-world image. Close on backdrop click, close button, or Escape.
(function pamLightbox() {
    let lastFocused = null;

    function getLightbox() {
        return document.getElementById('pamLightbox');
    }

    function openLightbox(trigger) {
        const box = getLightbox();
        if (!box) return;
        const img   = box.querySelector('#pamLightboxImg');
        const title = box.querySelector('#pamLightboxTitle');
        const desc  = box.querySelector('#pamLightboxDesc');

        const src     = trigger.getAttribute('data-pam-img')     || '';
        const caption = trigger.getAttribute('data-pam-caption') || '';
        const heading = trigger.getAttribute('data-pam-title')   || '';

        // Graceful fallback if the image hasn't been provided yet
        img.onerror = () => {
            img.onerror = null;
            img.alt = heading + ' — görsel bulunamadı';
            img.removeAttribute('src');
            img.style.minHeight = '220px';
            img.style.background =
                'repeating-linear-gradient(45deg,#eef2f8,#eef2f8 12px,#e2e8f0 12px,#e2e8f0 24px)';
        };
        img.style.minHeight = '';
        img.style.background = '';
        img.alt = heading;
        img.src = src;

        title.textContent = heading;
        desc.textContent  = caption;

        lastFocused = document.activeElement;
        box.classList.add('is-open');
        box.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        // Focus the close button for keyboard users
        const closeBtn = box.querySelector('.pam-lightbox-close');
        if (closeBtn) setTimeout(() => closeBtn.focus(), 50);
    }

    function closeLightbox() {
        const box = getLightbox();
        if (!box || !box.classList.contains('is-open')) return;
        box.classList.remove('is-open');
        box.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        // Clear src after the close transition so a stale image doesn't flash on reopen
        setTimeout(() => {
            const img = box.querySelector('#pamLightboxImg');
            if (img && !box.classList.contains('is-open')) img.removeAttribute('src');
        }, 320);
        if (lastFocused && typeof lastFocused.focus === 'function') {
            try { lastFocused.focus(); } catch (e) { /* noop */ }
        }
    }

    // Click delegation — works for triggers in any slide, including ones loaded later
    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('.pam-icon-trigger');
        if (trigger) {
            e.preventDefault();
            e.stopPropagation();
            openLightbox(trigger);
            return;
        }
        // Backdrop or close-button click
        if (e.target.closest('[data-pam-close]')) {
            e.preventDefault();
            closeLightbox();
        }
    });

    // Keyboard: Escape closes; Enter/Space activates triggers (button default already handles this)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'Esc') {
            const box = getLightbox();
            if (box && box.classList.contains('is-open')) {
                e.stopPropagation();
                closeLightbox();
            }
        }
    });

    window.openPamLightbox  = openLightbox;
    window.closePamLightbox = closeLightbox;
})();


// ===== SMA MODAL (dedicated, separate from the PAM image lightbox) =====
// Opens when the SMA Kompozit card (#smaCard) is clicked.
// Closes on backdrop click, ✕ button, or Escape.
(function smaModal() {
    let lastFocused = null;

    function getModal() { return document.getElementById('smaModal'); }

    function open() {
        const modal = getModal();
        if (!modal) return;
        lastFocused = document.activeElement;
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        const closeBtn = modal.querySelector('.sma-modal-close');
        if (closeBtn) setTimeout(() => closeBtn.focus(), 60);
    }
    function close() {
        const modal = getModal();
        if (!modal || !modal.classList.contains('is-open')) return;
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (lastFocused && typeof lastFocused.focus === 'function') {
            try { lastFocused.focus(); } catch (e) { /* noop */ }
        }
    }

    document.addEventListener('click', (e) => {
        const card = e.target.closest('#smaCard');
        if (card) { e.preventDefault(); open(); return; }
        if (e.target.closest('[data-sma-close]')) { e.preventDefault(); close(); }
    });

    document.addEventListener('keydown', (e) => {
        const modal = getModal();
        // Enter/Space activates the card (it's a div with role="button")
        if ((e.key === 'Enter' || e.key === ' ') && document.activeElement && document.activeElement.id === 'smaCard') {
            e.preventDefault();
            open();
            return;
        }
        if ((e.key === 'Escape' || e.key === 'Esc') && modal && modal.classList.contains('is-open')) {
            e.stopPropagation();
            close();
        }
    });

    window.openSmaModal  = open;
    window.closeSmaModal = close;
})();


// ===== TRL CARD SPOTLIGHT (JS fallback for browsers without CSS :has() support) =====
// Adds `.is-spotlighting` to .trl-cards and `.is-active` to the hovered card so
// other cards can be dimmed via the JS-fallback rules in styles.css.
(function trlSpotlight() {
    // Skip entirely if :has() is supported — CSS handles it natively
    try {
        if (CSS && CSS.supports && CSS.supports('selector(:has(*))')) return;
    } catch (e) { /* old browser — keep going */ }

    function bind(container) {
        if (!container || container._trlBound) return;
        container._trlBound = true;
        const cards = container.querySelectorAll('.trl-card');
        cards.forEach(card => {
            const on  = () => { container.classList.add('is-spotlighting');    card.classList.add('is-active'); };
            const off = () => { container.classList.remove('is-spotlighting'); card.classList.remove('is-active'); };
            card.addEventListener('mouseenter', on);
            card.addEventListener('mouseleave', off);
            card.addEventListener('focus',  on);
            card.addEventListener('blur',   off);
        });
    }

    function scan() { document.querySelectorAll('.trl-cards').forEach(bind); }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scan);
    } else {
        scan();
    }
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
})();


// ===== COMPLIANCE COLLISION SIMULATOR =====
// State machine on .compliance-arena:
//   data-state="idle"     → CTA visible, animations hidden
//   data-state="playing"  → CTA fades out, both SVG animations fade in & run
//   data-state="done"     → animations finish in their "post-impact" pose, result text + reset show
// CSS keyframes drive the actual visuals; this JS just toggles the state.
//
// Why SVG/CSS instead of Lottie JSON files: hand-authored Lottie schemas produce
// lower-fidelity visuals than tuned SVG. The state-machine API below is identical,
// so swapping in lottie-web players later (one per stage) is a drop-in change.
(function complianceSim() {
    const ANIM_MS = 3400; // must match the CSS keyframe durations

    function bind() {
        const arena   = document.getElementById('complianceArena');
        const playBtn = document.getElementById('complianceSimBtn');
        const resetBtn= document.getElementById('complianceResetBtn');
        if (!arena || !playBtn || arena._complianceBound) return;
        arena._complianceBound = true;

        let timer = null;

        function play() {
            if (arena.dataset.state === 'playing') return;
            // Force a restart of the CSS animations by re-applying the state
            arena.dataset.state = 'idle';
            // Reflow so the animation restarts cleanly when state changes back
            void arena.offsetWidth;
            arena.dataset.state = 'playing';
            clearTimeout(timer);
            timer = setTimeout(() => {
                arena.dataset.state = 'done';
            }, ANIM_MS);
        }
        function reset() {
            clearTimeout(timer);
            arena.dataset.state = 'idle';
        }

        playBtn.addEventListener('click', (e) => {
            e.preventDefault();
            play();
        });
        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                e.preventDefault();
                play(); // "Tekrar Oynat" — replay rather than just resetting to idle
            });
        }

        // Initialize state
        if (!arena.dataset.state) arena.dataset.state = 'idle';
    }

    // Bind on initial DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bind);
    } else {
        bind();
    }
    // Re-bind whenever sections are injected (slides are loaded dynamically)
    const obs = new MutationObserver(bind);
    obs.observe(document.body, { childList: true, subtree: true });

    window.playComplianceSim = () => {
        const btn = document.getElementById('complianceSimBtn');
        if (btn) btn.click();
    };
})();


// ===== VIDEO CARDS =====
// On http(s):// — intercept the click and embed the YouTube iframe inline (autoplay).
// On file:// — let the <a target="_blank"> open YouTube in a new tab (Error 153 makes
// inline embeds impossible from file:// origins).
// Also fills any <img.video-thumb data-vid-thumb="..."> from i.ytimg.com if the bundled
// data-uri image isn't present (e.g. when running directly from the multi-file source).
(function videoCards() {
    function fillThumb(img) {
        if (!img || img.src) return;
        const vid = img.getAttribute('data-vid-thumb');
        if (!vid) return;
        // Try maxresdefault first, then hqdefault as a fallback (some videos lack maxres)
        img.src = `https://i.ytimg.com/vi/${vid}/maxresdefault.jpg`;
        img.addEventListener('error', function once() {
            img.removeEventListener('error', once);
            img.src = `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
        });
    }
    // Initial fill
    document.querySelectorAll('img.video-thumb[data-vid-thumb]').forEach(fillThumb);
    // Re-fill any newly-revealed thumbnails when slides change
    const obs = new MutationObserver(() => {
        document.querySelectorAll('img.video-thumb[data-vid-thumb]:not([src])').forEach(fillThumb);
    });
    obs.observe(document.body, { childList: true, subtree: true });

    // Click handler — embed inline if possible, otherwise let the link open in a new tab.
    // Capture phase + stopPropagation so the click never reaches the outer .expandable
    // toggle handler (which would otherwise close the popover when the user tries to play).
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.video-card');
        if (!card) return;
        const vid = card.dataset.vid;
        if (!vid) return;
        e.stopPropagation();
        // file:// → cannot embed reliably (YouTube Error 153). Let <a target="_blank"> handle navigation.
        if (location.protocol === 'file:') return;
        // http(s):// → embed inline with autoplay
        e.preventDefault();
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${vid}?rel=0&autoplay=1&modestbranding=1`;
        iframe.title = card.dataset.title || 'YouTube video';
        iframe.setAttribute('allow', 'accelerometer; autoplay; encrypted-media; picture-in-picture');
        iframe.setAttribute('allowfullscreen', '');
        iframe.style.cssText = 'display:block; width:100%; aspect-ratio:16/9; border:0; border-radius:inherit;';
        card.replaceWith(iframe);
    }, true); // capture phase
})();


// ===== TRL CARD SPOTLIGHT (JS fallback for browsers without CSS :has()) =====
(function trlSpotlight() {
    try {
        if (CSS && CSS.supports && CSS.supports('selector(:has(*))')) return;
    } catch (e) { /* noop */ }

    function bind(container) {
        if (!container || container._trlBound) return;
        container._trlBound = true;
        const cards = container.querySelectorAll('.trl-card');
        cards.forEach(card => {
            const on  = () => { container.classList.add('is-spotlighting');    card.classList.add('is-active'); };
            const off = () => { container.classList.remove('is-spotlighting'); card.classList.remove('is-active'); };
            card.addEventListener('mouseenter', on);
            card.addEventListener('mouseleave', off);
            card.addEventListener('focus',  on);
            card.addEventListener('blur',   off);
        });
    }
    function scan() { document.querySelectorAll('.trl-cards').forEach(bind); }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scan);
    } else {
        scan();
    }
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
})();
