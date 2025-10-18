// Smooth scrolling utility
function smoothScrollTo(element, offset = 0) {
    if (!element) return;
    
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const targetPosition = elementPosition - offset;
    
    // Check if smooth scrolling is supported
    if ('scrollBehavior' in document.documentElement.style) {
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    } else {
        // Fallback for older browsers
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const duration = Math.min(Math.abs(distance) / 2, 1000); // Max 1 second
        let start = null;
        
        function animation(currentTime) {
            if (start === null) start = currentTime;
            const timeElapsed = currentTime - start;
            const progress = Math.min(timeElapsed / duration, 1);
            
            // Easing function
            const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            window.scrollTo(0, startPosition + distance * ease);
            
            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            }
        }
        
        requestAnimationFrame(animation);
    }
}

// Smooth scroll to top
function smoothScrollToTop() {
    if ('scrollBehavior' in document.documentElement.style) {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    } else {
        // Fallback for older browsers
        const startPosition = window.pageYOffset;
        const duration = Math.min(startPosition / 2, 1000);
        let start = null;
        
        function animation(currentTime) {
            if (start === null) start = currentTime;
            const timeElapsed = currentTime - start;
            const progress = Math.min(timeElapsed / duration, 1);
            
            const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            window.scrollTo(0, startPosition * (1 - ease));
            
            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            }
        }
        
        requestAnimationFrame(animation);
    }
}

// Toast notification system
class ToastManager {
    constructor() {
        this.container = document.getElementById('toastContainer');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            this.container.id = 'toastContainer';
            document.body.appendChild(this.container);
        }
    }

    show(message, type = 'error', duration = 4000) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        
        const icon = type === 'error' ? '⚠️' : '✅';
        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span>${message}</span>
        `;

        this.container.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }
}

const toastManager = new ToastManager();

// Multiple avatar services with fallback
class AvatarLoader {
    constructor() {
        this.services = [
            `https://render.crafty.gg/3d/bust/`,
            `https://vzge.me/bust/50/`,
            // Add more services here if needed
        ];
        this.fallbackUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjIwIiB5PSIyMCIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1iZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTQiPkFWPzwvdGV4dD4KPC9zdmc+';
    }

    async loadAvatar(element, playerName, size = 40) {
        const fallbackUrl = size === 40 ? this.fallbackUrl : 
            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMwIiBoZWlnaHQ9IjMwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjE1IiB5PSIxNSIgZG9taW5hbnQtYmFzZWxpbmU9Im1iZGRsZSIgdGV4dC1hbmNob3I9Im1iZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTAiPkFWPzwvdGV4dD4KPC9zdmc+';

        for (let i = 0; i < this.services.length; i++) {
            try {
                const url = this.services[i] + playerName;
                await this.tryLoadImage(element, url);
                return; // Success, exit
            } catch (error) {
                console.log(`Avatar service ${i + 1} failed for ${playerName}:`, error);
                if (i === this.services.length - 1) {
                    // All services failed, use fallback
                    element.src = fallbackUrl;
                    element.classList.add('loaded');
                }
            }
        }
    }

    tryLoadImage(element, url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                element.src = url;
                element.classList.add('loaded');
                resolve();
            };
            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };
            img.src = url;
        });
    }
}

const avatarLoader = new AvatarLoader();

// Export for use in other files
window.toastManager = toastManager;
window.avatarLoader = avatarLoader;

// Attach an information button with popover that shows tier points
function attachTierInfoButton(container) {
    if (!container) return;
    try {
        // Ensure container can anchor absolutely positioned elements
        const cs = window.getComputedStyle(container);
        if (cs && cs.position === 'static') {
            container.style.position = 'relative';
        }

        let infoBtn = container.querySelector(':scope > .tiers-info-btn');
        let popover = container.querySelector(':scope > .tiers-info-popover');

        if (!infoBtn) {
            infoBtn = document.createElement('button');
            infoBtn.className = 'tiers-info-btn';
            infoBtn.type = 'button';
            infoBtn.setAttribute('aria-expanded', 'false');
            infoBtn.innerHTML = '<span class="tiers-info-icon" aria-hidden="true"></span><span class="tiers-info-text">Информация</span>';
            container.appendChild(infoBtn);
        }

        if (!popover) {
            popover = document.createElement('div');
            popover.className = 'tiers-info-popover';
            popover.setAttribute('role', 'dialog');
            popover.setAttribute('aria-hidden', 'true');
            container.appendChild(popover);
        }

        // Build content
        popover.innerHTML = buildTiersPointsHtml();

        function togglePopover(show) {
            const willShow = (typeof show === 'boolean') ? show : popover.getAttribute('aria-hidden') === 'true';
            popover.setAttribute('aria-hidden', willShow ? 'false' : 'true');
            infoBtn.setAttribute('aria-expanded', willShow ? 'true' : 'false');
            if (willShow) {
                const onDocClick = (e) => {
                    if (!popover.contains(e.target) && !infoBtn.contains(e.target)) {
                        togglePopover(false);
                        document.removeEventListener('click', onDocClick);
                    }
                };
                setTimeout(() => document.addEventListener('click', onDocClick), 0);
            }
        }

        // красивое появление кнопки после вставки
        requestAnimationFrame(() => {
            infoBtn.classList.add('show');
        });

        infoBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            togglePopover();
        };
    } catch (e) {
        console.warn('attachTierInfoButton failed:', e);
    }
}

function buildTiersPointsHtml() {
    const rows = [];
    const order = ['HT1','LT1','HT2','LT2','HT3','LT3','HT4','LT4','HT5','LT5'];
    order.forEach((tier) => {
        const base = (window.tierScores && window.tierScores[tier]) || 0;
        rows.push(
            `<li class="tp-row"><span class=\"tp-tier ${tier}\">${tier}</span><span class=\"tp-dots\"></span><span class=\"tp-points\">${base} очков</span></li>`
        );
    });
    return `
        <div class=\"tp-wrap\">\n            <div class=\"tp-title\">Очки за тир</div>\n            <ul class=\"tp-list\">${rows.join('')}</ul>\n        </div>\n    `;
}

// Export
window.attachTierInfoButton = attachTierInfoButton;