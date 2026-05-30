// Navigation and slide control
var currentSlide = 0;
var slides = [];
var totalSlides = 0;
var currentFragmentIndex = -1;

// Initialize presentation
async function initPresentation() {
    try {
        await loadSections();
        slides = document.querySelectorAll('.slide');
        totalSlides = slides.length;
        calculateSectionStartSlides();
        generateNavButtons();
        updateSlideNumbers();
        setupNavigation();

        // Restore from URL hash (1-indexed: #slide=1 is the first slide)
        const hashMatch = location.hash.match(/^#slide=(\d+)$/);
        if (hashMatch) {
            const savedSlide = parseInt(hashMatch[1], 10) - 1; // convert 1-indexed URL to 0-indexed internal
            if (savedSlide >= 0 && savedSlide < totalSlides) {
                currentSlide = savedSlide;
            }
        }

        slides[currentSlide].classList.add('active');
        updateSectionNav();
        updateProgressBar();
        updateSlideCounter();

        console.log(`Presentation loaded: ${totalSlides} slides, starting at slide ${currentSlide}`);
    } catch (error) {
        console.error('Failed to initialize presentation:', error);
    }
}

// Load all section files
async function loadSections() {
    const container = document.getElementById('slide-container');

    for (const section of PRESENTATION_CONFIG.sections) {
        try {
            const response = await fetch(section.file);
            if (!response.ok) {
                throw new Error(`Failed to load ${section.file}`);
            }
            const html = await response.text();
            const slideCountBefore = container.querySelectorAll('.slide').length;
            container.insertAdjacentHTML('beforeend', html);
            section._actualStartSlide = slideCountBefore;
        } catch (error) {
            console.error(`Error loading section ${section.id}:`, error);
        }
    }
}

// Calculate section start slides
function calculateSectionStartSlides() {
    PRESENTATION_CONFIG.sections.forEach((section) => {
        if (section._actualStartSlide !== undefined) {
            section.startSlide = section._actualStartSlide;
        }
    });
    PRESENTATION_CONFIG.totalSlides = totalSlides;
}

// Generate navigation buttons
function generateNavButtons() {
    const navButtons = document.getElementById('navButtons');
    if (!navButtons) return;
    navButtons.innerHTML = '';

    PRESENTATION_CONFIG.sections.forEach((section, sectionIndex) => {
        const sectionContainer = document.createElement('div');
        sectionContainer.className = 'nav-section';

        const sectionBtn = document.createElement('button');
        sectionBtn.className = 'nav-section-btn';
        sectionBtn.innerHTML = `<span class="nav-section-num">${sectionIndex + 1}</span><span class="nav-section-label">${section.navLabel}</span><span class="nav-section-arrow">\u203a</span>`;
        sectionBtn.onclick = (e) => {
            e.stopPropagation();
            sectionContainer.classList.toggle('expanded');
        };
        sectionContainer.appendChild(sectionBtn);

        const slidesMenu = document.createElement('div');
        slidesMenu.className = 'nav-slides-menu';

        const nextSection = PRESENTATION_CONFIG.sections[sectionIndex + 1];
        const sectionStart = section.startSlide;
        const sectionEnd = nextSection ? nextSection.startSlide : totalSlides;

        for (let i = sectionStart; i < sectionEnd; i++) {
            const slide = slides[i];
            if (slide) {
                const h1 = slide.querySelector('h1');
                const title = h1 ? h1.textContent.trim() : `Slayt ${i - sectionStart + 1}`;
                const slideNum = i - sectionStart + 1;

                const slideBtn = document.createElement('button');
                slideBtn.className = 'nav-slide-btn';
                slideBtn.innerHTML = `<span class="nav-slide-num">${slideNum}</span>${truncateTitle(title, 25)}`;
                slideBtn.onclick = (e) => {
                    e.stopPropagation();
                    jumpToSection(i);
                };
                slidesMenu.appendChild(slideBtn);
            }
        }

        sectionContainer.appendChild(slidesMenu);
        navButtons.appendChild(sectionContainer);
    });
}

function truncateTitle(title, maxLength) {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength - 1) + '\u2026';
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Fullscreen error: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

// Setup navigation
function setupNavigation() {
    document.addEventListener('keydown', (e) => {
        const tag = e.target.tagName.toLowerCase();
        if (tag === 'textarea' || tag === 'input' || e.target.isContentEditable) return;
        if (e.key === 'ArrowRight' || e.key === ' ') {
            e.preventDefault();
            nextSlide();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            prevSlide();
        } else if (e.key === 'f' || e.key === 'F') {
            e.preventDefault();
            toggleFullscreen();
        }
    });

    // Touch support
    let touchStartX = 0;
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });
    document.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        if (touchEndX < touchStartX - 50) nextSlide();
        if (touchEndX > touchStartX + 50) prevSlide();
    });
}

// Fragment helpers
function getFragments(slideEl) {
    var frags = Array.from(slideEl.querySelectorAll('[data-fragment]'));
    frags.sort(function(a, b) {
        return parseInt(a.getAttribute('data-fragment')) - parseInt(b.getAttribute('data-fragment'));
    });
    return frags;
}

function resetFragments(slideEl) {
    slideEl.querySelectorAll('[data-fragment]').forEach(function(el) {
        el.classList.remove('fragment-visible');
    });
    currentFragmentIndex = -1;
}

function showAllFragments(slideEl) {
    var frags = getFragments(slideEl);
    frags.forEach(function(el) {
        el.classList.add('fragment-visible');
    });
    currentFragmentIndex = frags.length - 1;
}

// Show specific slide
function showSlide(n, direction) {
    if (slides.length === 0) return;
    slides[currentSlide].classList.remove('active');
    currentSlide = (n + totalSlides) % totalSlides;
    slides[currentSlide].classList.add('active');

    if (direction === 'backward') {
        showAllFragments(slides[currentSlide]);
    } else {
        resetFragments(slides[currentSlide]);
    }

    updateButtons();
    updateSectionNav();
    updateProgressBar();
    updateSlideCounter();

    // Trigger animations on the new slide
    triggerSlideAnimations(slides[currentSlide]);

    history.replaceState(null, null, `#slide=${currentSlide + 1}`);
}

// Next slide
function nextSlide() {
    var frags = getFragments(slides[currentSlide]);
    if (frags.length > 0 && currentFragmentIndex < frags.length - 1) {
        currentFragmentIndex++;
        frags[currentFragmentIndex].classList.add('fragment-visible');
        return;
    }
    showSlide(currentSlide + 1, 'forward');
}

// Previous slide
function prevSlide() {
    var frags = getFragments(slides[currentSlide]);
    if (frags.length > 0 && currentFragmentIndex >= 0) {
        frags[currentFragmentIndex].classList.remove('fragment-visible');
        currentFragmentIndex--;
        return;
    }
    showSlide(currentSlide - 1, 'backward');
}

function jumpToSection(slideIndex) {
    showSlide(slideIndex, 'forward');
}

function openNav() {
    document.getElementById('navButtons').classList.remove('collapsed');
}

function closeNav() {
    document.getElementById('navButtons').classList.add('collapsed');
}

function updateButtons() {
    // Optional button state updates
}

// Progress bar
function updateProgressBar() {
    const fill = document.getElementById('progressFill');
    if (fill) {
        const pct = ((currentSlide + 1) / totalSlides) * 100;
        fill.style.width = pct + '%';
    }
}

// Slide counter
function updateSlideCounter() {
    const counter = document.getElementById('slideCounter');
    if (counter) {
        counter.textContent = `${currentSlide + 1} / ${totalSlides}`;
    }
}

let _previousActiveSectionIndex = -1;

function updateSectionNav() {
    document.querySelectorAll('.nav-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-section-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.nav-slide-btn').forEach(b => b.classList.remove('active'));

    const sections = PRESENTATION_CONFIG.sections;
    for (let i = 0; i < sections.length; i++) {
        const currentSection = sections[i];
        const nextSection = sections[i + 1];
        const sectionStart = currentSection.startSlide;
        const sectionEnd = nextSection ? nextSection.startSlide - 1 : PRESENTATION_CONFIG.totalSlides - 1;

        if (currentSlide >= sectionStart && currentSlide <= sectionEnd) {
            const navSections = document.querySelectorAll('.nav-section');
            if (navSections[i]) {
                navSections[i].classList.add('active');
                navSections[i].querySelector('.nav-section-btn')?.classList.add('active');

                if (i !== _previousActiveSectionIndex) {
                    navSections[i].classList.add('expanded');
                    _previousActiveSectionIndex = i;
                }

                const slideIndex = currentSlide - sectionStart;
                const slideButtons = navSections[i].querySelectorAll('.nav-slide-btn');
                if (slideButtons[slideIndex]) {
                    slideButtons[slideIndex].classList.add('active');
                }
            }
            break;
        }
    }
}

function updateSlideNumbers() {
    const sections = PRESENTATION_CONFIG.sections;
    slides.forEach((slide, globalIndex) => {
        const slideNumber = slide.querySelector('.slide-number');
        if (slideNumber) {
            // Per-slide breadcrumb override: <div class="slide" data-static-label="...">
            const staticLabel = slide.getAttribute('data-static-label');
            if (staticLabel) {
                slideNumber.textContent = staticLabel;
                return;
            }
            let sectionIndex = 0;
            for (let i = 0; i < sections.length; i++) {
                const nextSection = sections[i + 1];
                if (!nextSection || globalIndex < nextSection.startSlide) {
                    sectionIndex = i;
                    break;
                }
            }
            const currentSection = sections[sectionIndex];
            const nextSection = sections[sectionIndex + 1];
            const sectionStart = currentSection.startSlide;
            const sectionEnd = nextSection ? nextSection.startSlide : totalSlides;
            const sectionTotal = sectionEnd - sectionStart;
            const slideInSection = globalIndex - sectionStart + 1;
            slideNumber.textContent = `${currentSection.navLabel}  ·  ${slideInSection} / ${sectionTotal}`;
        }
    });
}

// Trigger animations when slide becomes active
function triggerSlideAnimations(slideEl) {
    // Initialize any interactive canvases on this slide
    const pamSim = slideEl.querySelector('#pamSimCanvas');
    if (pamSim && !pamSim._initialized) {
        initPAMSimulator(pamSim);
        pamSim._initialized = true;
    }

    const braidVis = slideEl.querySelector('#braidAngleCanvas');
    if (braidVis && !braidVis._initialized) {
        initBraidAngleVis(braidVis);
        braidVis._initialized = true;
    }

    const systemFlow = slideEl.querySelector('#systemFlowCanvas');
    if (systemFlow && !systemFlow._initialized) {
        initSystemFlow(systemFlow);
        systemFlow._initialized = true;
    }

    // Static model (Chou-Hannaford) sliders — initialize the first time this slide is shown
    const statikSlider = slideEl.querySelector('#statik-p-slider');
    if (statikSlider && !slideEl._statikInitialized) {
        if (typeof initStatikModel === 'function') {
            initStatikModel();
            slideEl._statikInitialized = true;
        }
    }

    // Wire any expandable media tiles on this slide
    if (typeof initExpandableTiles === 'function') {
        initExpandableTiles(slideEl);
    }

    // Animate counters
    slideEl.querySelectorAll('.counter[data-target]').forEach(counter => {
        if (!counter._animated) {
            animateCounter(counter);
            counter._animated = true;
        }
    });
}

window.addEventListener('DOMContentLoaded', initPresentation);
