// NextHire Vault - Complete Interactive Features
// Expert-level JavaScript with analytics, ROI calculator, animations, and more

'use strict';

// 🎯 GLOBAL CONFIGURATION
const NEXTHIRE_CONFIG = {
    version: '1.0.0',
    debug: true,
    analytics: {
        enabled: true,
        trackScrollDepth: true,
        trackTimeOnPage: true,
        trackInteractions: true
    },
    animations: {
        enabled: true,
        duration: 800,
        easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    }
};

// 🚀 ADVANCED ANALYTICS CLASS
class NextHireAnalytics {
    constructor() {
        this.sessionData = {
            startTime: Date.now(),
            pageViews: 1,
            maxScrollDepth: 0,
            interactions: 0,
            ctaClicks: 0,
            timeOnSections: {},
            userAgent: navigator.userAgent,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            referrer: document.referrer,
            utmSource: this.getUrlParameter('utm_source'),
            utmMedium: this.getUrlParameter('utm_medium'),
            utmCampaign: this.getUrlParameter('utm_campaign')
        };
        
        this.initTracking();
    }
    
    getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }
    
    initTracking() {
        this.trackScrollDepth();
        this.trackTimeOnSections();
        this.trackCTAClicks();
        this.trackROICalculatorUsage();
        this.trackFormAbandonment();
    }
    
    trackScrollDepth() {
        let maxScroll = 0;
        const trackScroll = this.throttle(() => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
            );
            
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                this.sessionData.maxScrollDepth = scrollPercent;
                
                // Track milestone scrolling
                if ([25, 50, 75, 90, 100].includes(scrollPercent)) {
                    this.trackEvent('scroll_milestone', {
                        scroll_percent: scrollPercent,
                        time_to_reach: (Date.now() - this.sessionData.startTime) / 1000,
                        section: this.getCurrentSection()
                    });
                }
            }
        }, 250);
        
        window.addEventListener('scroll', trackScroll);
    }
    
    trackTimeOnSections() {
        const sections = document.querySelectorAll('section[class]');
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const sectionName = entry.target.className;
                
                if (entry.isIntersecting) {
                    this.sessionData.timeOnSections[sectionName] = Date.now();
                } else if (this.sessionData.timeOnSections[sectionName]) {
                    const timeSpent = Date.now() - this.sessionData.timeOnSections[sectionName];
                    
                    this.trackEvent('section_time', {
                        section: sectionName,
                        time_spent_seconds: Math.round(timeSpent / 1000),
                        scroll_depth_when_left: this.sessionData.maxScrollDepth
                    });
                }
            });
        }, { threshold: 0.5 });
        
        sections.forEach(section => sectionObserver.observe(section));
    }
    
    trackCTAClicks() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href*="paypal"], .hero-cta, .final-cta, .nav-cta, .primary-payment')) {
                this.sessionData.ctaClicks++;
                
                const buttonText = e.target.textContent.trim().substring(0, 50);
                const buttonLocation = this.getCurrentSection();
                const scrollPosition = this.sessionData.maxScrollDepth;
                
                this.trackEvent('cta_click', {
                    button_text: buttonText,
                    button_location: buttonLocation,
                    scroll_position: scrollPosition,
                    time_on_page: (Date.now() - this.sessionData.startTime) / 1000,
                    cta_click_number: this.sessionData.ctaClicks,
                    previous_interactions: this.sessionData.interactions
                });
                
                // Track conversion funnel
                this.trackEvent('conversion_funnel', {
                    stage: 'cta_click',
                    funnel_position: this.sessionData.ctaClicks,
                    time_to_click: (Date.now() - this.sessionData.startTime) / 1000
                });
            }
            
            this.sessionData.interactions++;
        });
    }
    
    trackROICalculatorUsage() {
        const salaryInput = document.getElementById('salary');
        if (salaryInput) {
            let calculatorInteractions = 0;
            let calculatorStartTime = null;
            
            salaryInput.addEventListener('focus', () => {
                calculatorStartTime = Date.now();
                this.trackEvent('roi_calculator_start', {
                    default_salary: salaryInput.value,
                    time_before_interaction: (Date.now() - this.sessionData.startTime) / 1000
                });
            });
            
            salaryInput.addEventListener('input', this.throttle(() => {
                calculatorInteractions++;
                const salary = parseInt(salaryInput.value) || 0;
                
                this.trackEvent('roi_calculator_change', {
                    new_salary: salary,
                    interaction_number: calculatorInteractions,
                    time_spent_calculating: calculatorStartTime ? 
                        (Date.now() - calculatorStartTime) / 1000 : 0
                });
            }, 500));
        }
    }
    
    trackFormAbandonment() {
        // Track when users visit checkout section but don't click CTA
        const checkoutSection = document.getElementById('checkout');
        if (checkoutSection) {
            let checkoutViewed = false;
            let checkoutViewTime = null;
            
            const checkoutObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !checkoutViewed) {
                        checkoutViewed = true;
                        checkoutViewTime = Date.now();
                        
                        this.trackEvent('checkout_section_viewed', {
                            time_to_reach_checkout: (Date.now() - this.sessionData.startTime) / 1000,
                            scroll_depth: this.sessionData.maxScrollDepth,
                            interactions_before_checkout: this.sessionData.interactions
                        });
                    }
                });
            }, { threshold: 0.7 });
            
            checkoutObserver.observe(checkoutSection);
            
            // Track abandonment on page leave
            window.addEventListener('beforeunload', () => {
                if (checkoutViewed && this.sessionData.ctaClicks === 0) {
                    this.trackEvent('checkout_abandonment', {
                        time_in_checkout: checkoutViewTime ? 
                            (Date.now() - checkoutViewTime) / 1000 : 0,
                        total_time_on_page: (Date.now() - this.sessionData.startTime) / 1000,
                        final_scroll_depth: this.sessionData.maxScrollDepth
                    });
                }
            });
        }
    }
    
    getCurrentSection() {
        const sections = document.querySelectorAll('section');
        const scrollPos = window.scrollY + window.innerHeight / 2;
        
        for (let section of sections) {
            const rect = section.getBoundingClientRect();
            const sectionTop = rect.top + window.scrollY;
            const sectionBottom = sectionTop + rect.height;
            
            if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
                return section.className || section.id || 'unknown_section';
            }
        }
        return 'unknown_section';
    }
    
    trackEvent(eventName, properties = {}) {
        const eventData = {
            ...properties,
            timestamp: new Date().toISOString(),
            session_id: this.getSessionId(),
            page_url: window.location.href,
            user_agent: this.sessionData.userAgent,
            viewport: this.sessionData.viewport,
            referrer: this.sessionData.referrer,
            utm_source: this.sessionData.utmSource,
            utm_medium: this.sessionData.utmMedium,
            utm_campaign: this.sessionData.utmCampaign,
            session_duration: (Date.now() - this.sessionData.startTime) / 1000
        };
        
        // Store locally for analysis
        this.storeEventLocally(eventName, eventData);
        
        // Send to external analytics (implement as needed)
        this.sendToAnalytics(eventName, eventData);
        
        if (NEXTHIRE_CONFIG.debug) {
            console.log('📊 Event:', eventName, eventData);
        }
    }
    
    getSessionId() {
        let sessionId = localStorage.getItem('nexthire_session_id');
        if (!sessionId) {
            sessionId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('nexthire_session_id', sessionId);
        }
        return sessionId;
    }
    
    storeEventLocally(eventName, eventData) {
        try {
            const events = JSON.parse(localStorage.getItem('nexthire_analytics') || '[]');
            events.push({ event: eventName, data: eventData });
            
            // Keep only last 500 events
            if (events.length > 500) {
                events.splice(0, events.length - 500);
            }
            
            localStorage.setItem('nexthire_analytics', JSON.stringify(events));
        } catch (e) {
            console.warn('Could not store analytics locally:', e);
        }
    }
    
    sendToAnalytics(eventName, eventData) {
        // Google Analytics 4
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, eventData);
        }
        
        // Facebook Pixel
        if (typeof fbq !== 'undefined') {
            fbq('track', eventName, eventData);
        }
    }
    
    // Helper method
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // Public methods for analysis
    getAnalyticsData() {
        try {
            return JSON.parse(localStorage.getItem('nexthire_analytics') || '[]');
        } catch (e) {
            return [];
        }
    }
    
    getConversionFunnel() {
        const events = this.getAnalyticsData();
        const funnel = {
            page_views: events.filter(e => e.event === 'page_view').length,
            roi_calculator_uses: events.filter(e => e.event === 'roi_calculator_start').length,
            checkout_views: events.filter(e => e.event === 'checkout_section_viewed').length,
            cta_clicks: events.filter(e => e.event === 'cta_click').length,
            conversions: events.filter(e => e.event === 'conversion_complete').length
        };
        
        return funnel;
    }
}

// 🚀 INITIALIZATION
document.addEventListener('DOMContentLoaded', function() {
    logMessage('🚀 NextHire Vault Expert Edition Loading...', 'info');
    
    // Initialize all features
    initializeROICalculator();
    initializeCountdown();
    initializeScrollAnimations();
    initializeCounterAnimations();
    initializeFAQAccordion();
    initializeEnhancedCheckout();
    initializeSocialSharing();
    
    // Initialize analytics
    window.NextHireAnalytics = new NextHireAnalytics();
    
    // Add global event listeners
    addGlobalEventListeners();
    
    // Performance monitoring
    measurePagePerformance();
    
    logMessage('✨ All conversion systems ready!', 'success');
});

// 💰 ROI CALCULATOR - Enhanced with Error Handling
function initializeROICalculator() {
    const salaryInput = document.getElementById('salary');
    if (!salaryInput) {
        logMessage('ROI calculator input not found', 'warning');
        return;
    }
    
    function updateCalculations() {
        try {
            const salary = parseInt(salaryInput.value) || 150000;
            
            // Validate input range
            if (salary < 50000 || salary > 1000000) {
                logMessage('Salary input out of range', 'warning');
                return;
            }
            
            // Calculate costs
            const dailyCost = Math.round(salary / 365);
            const weeklyCost = Math.round(salary / 52);
            const monthlyCost = Math.round(salary / 12);
            const paybackHours = Math.round((197 / dailyCost) * 24);
            
            // Update display elements safely
            updateElementText('daily-cost', dailyCost.toLocaleString());
            updateElementText('weekly-cost', weeklyCost.toLocaleString()); 
            updateElementText('monthly-cost', monthlyCost.toLocaleString());
            
            // Format payback time
            let paybackText;
            if (paybackHours < 24) {
                paybackText = paybackHours + ' hours';
            } else if (paybackHours < 168) {
                paybackText = Math.round(paybackHours / 24) + ' days';
            } else {
                paybackText = Math.round(paybackHours / 168) + ' weeks';
            }
            
            updateElementText('payback-time', paybackText);
            
        } catch (error) {
            logMessage('Error in ROI calculation: ' + error.message, 'error');
        }
    }
    
    // Event listeners with debouncing
    let calculationTimeout;
    salaryInput.addEventListener('input', function() {
        clearTimeout(calculationTimeout);
        calculationTimeout = setTimeout(updateCalculations, 300);
    });
    
    // Initial calculation
    updateCalculations();
    
    logMessage('💰 ROI Calculator initialized', 'success');
}

// ⏰ COUNTDOWN TIMER - Enhanced with Time Zones
function initializeCountdown() {
    const countdownElements = {
        days: document.getElementById('days'),
        hours: document.getElementById('hours'), 
        minutes: document.getElementById('minutes'),
        seconds: document.getElementById('seconds')
    };
    
    // Check if elements exist
    const missingElements = Object.entries(countdownElements)
        .filter(([key, element]) => !element)
        .map(([key]) => key);
        
    if (missingElements.length > 0) {
        logMessage(`Countdown elements missing: ${missingElements.join(', ')}`, 'warning');
        return;
    }
    
    // Calculate target date (3 days, 14 hours, 27 minutes from now)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3);
    targetDate.setHours(targetDate.getHours() + 14);
    targetDate.setMinutes(targetDate.getMinutes() + 27);
    
    function updateCountdown() {
        try {
            const now = new Date().getTime();
            const distance = targetDate.getTime() - now;
            
            if (distance < 0) {
                // Timer expired
                clearInterval(countdownTimer);
                const container = document.querySelector('.scarcity-timer');
                if (container) {
                    container.innerHTML = '<div style="color: white; font-size: 1.2rem; font-weight: 600;">⚡ Launch Week Pricing Extended!</div>';
                }
                if (window.NextHireAnalytics) {
                    window.NextHireAnalytics.trackEvent('countdown_expired');
                }
                return;
            }
            
            // Calculate time units
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            // Update display with padding
            countdownElements.days.textContent = days.toString().padStart(2, '0');
            countdownElements.hours.textContent = hours.toString().padStart(2, '0');
            countdownElements.minutes.textContent = minutes.toString().padStart(2, '0');
            countdownElements.seconds.textContent = seconds.toString().padStart(2, '0');
            
        } catch (error) {
            logMessage('Error updating countdown: ' + error.message, 'error');
        }
    }
    
    // Start countdown
    const countdownTimer = setInterval(updateCountdown, 1000);
    updateCountdown(); // Initial update
    
    logMessage('⏰ Countdown timer initialized', 'success');
}

// 📊 COUNTER ANIMATIONS - Production Ready
function initializeCounterAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.target.classList.contains('panic-metrics')) {
                setTimeout(() => animateCounters(), 300);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const metricsSection = document.querySelector('.panic-metrics');
    if (metricsSection) {
        observer.observe(metricsSection);
    }
}

function animateCounters() {
    const counters = document.querySelectorAll('.metric-number');
    
    if (counters.length === 0) {
        logMessage('No metric counters found', 'warning');
        return;
    }
    
    counters.forEach((counter, index) => {
        try {
            // Get target value and attributes
            const target = parseFloat(counter.getAttribute('data-target'));
            const prefix = counter.getAttribute('data-prefix') || '';
            const suffix = counter.getAttribute('data-suffix') || '';
            const isDecimal = target % 1 !== 0;
            
            // Validate target
            if (isNaN(target) || target < 0) {
                logMessage(`Invalid target value for counter ${index}`, 'warning');
                return;
            }
            
            // Reset counter display
            counter.textContent = prefix + '0' + suffix;
            
            // Animation settings
            const duration = 2000;
            const steps = 60;
            const increment = target / steps;
            let current = 0;
            let step = 0;
            
            // Stagger animation start
            setTimeout(() => {
                const timer = setInterval(() => {
                    step++;
                    current = increment * step;
                    
                    if (current >= target) {
                        // Final accurate value
                        const finalValue = isDecimal ? target.toFixed(1) : target.toString();
                        counter.textContent = prefix + finalValue + suffix;
                        clearInterval(timer);
                        
                        // Track completion
                        if (window.NextHireAnalytics) {
                            window.NextHireAnalytics.trackEvent('counter_animation_complete', {
                                counter_index: index,
                                final_value: target
                            });
                        }
                    } else {
                        // Update current value
                        const displayValue = isDecimal ? current.toFixed(1) : Math.floor(current).toString();
                        counter.textContent = prefix + displayValue + suffix;
                    }
                }, duration / steps);
            }, index * 200); // Staggered start
            
        } catch (error) {
            logMessage(`Error animating counter ${index}: ${error.message}`, 'error');
        }
    });
    
    logMessage('📊 Counter animations started', 'info');
}

// ❓ FAQ ACCORDION - Enhanced Accessibility
function initializeFAQAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    if (faqItems.length === 0) {
        logMessage('No FAQ items found', 'warning');
        return;
    }
    
    faqItems.forEach((item, index) => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        
        if (!question || !answer) {
            logMessage(`FAQ item ${index} missing question or answer`, 'warning');
            return;
        }
        
        question.addEventListener('click', function() {
            toggleFAQ(item, index);
        });
        
        // Keyboard support
        question.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleFAQ(item, index);
            }
        });
    });
    
    logMessage(`❓ FAQ accordion initialized with ${faqItems.length} items`, 'success');
}

function toggleFAQ(faqItem, index) {
    try {
        const question = faqItem.querySelector('.faq-question');
        const isActive = faqItem.classList.contains('active');
        
        // Close all FAQ items
        document.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
            const q = item.querySelector('.faq-question');
            if (q) q.setAttribute('aria-expanded', 'false');
        });
        
        // Open clicked item if it wasn't active
        if (!isActive) {
            faqItem.classList.add('active');
            question.setAttribute('aria-expanded', 'true');
            
            // Track FAQ engagement
            if (window.NextHireAnalytics) {
                window.NextHireAnalytics.trackEvent('faq_opened', {
                    faq_index: index,
                    question: question.textContent.trim()
                });
            }
        }
        
    } catch (error) {
        logMessage('Error toggling FAQ: ' + error.message, 'error');
    }
}

// 🎭 SCROLL ANIMATIONS - Intersection Observer
function initializeScrollAnimations() {
    if (!window.IntersectionObserver) {
        logMessage('IntersectionObserver not supported', 'warning');
        return;
    }
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Track section views
                const sectionId = entry.target.id || entry.target.className;
                if (window.NextHireAnalytics) {
                    window.NextHireAnalytics.trackEvent('section_viewed', {
                        section: sectionId,
                        intersection_ratio: entry.intersectionRatio
                    });
                }
            }
        });
    }, { threshold: 0.3, rootMargin: '0px 0px -50px 0px' });
    
    // Observe animated elements
    const animatedElements = document.querySelectorAll(
        '.fade-in-up, .fade-in-left, .fade-in-right'
    );
    
    animatedElements.forEach(el => observer.observe(el));
    
    // Fallback for metrics animation
    setTimeout(() => {
        const metricsSection = document.querySelector('.panic-metrics');
        const firstCounter = document.querySelector('.metric-number');
        
        if (firstCounter && firstCounter.textContent.includes('0') && 
            !firstCounter.textContent.includes('147')) {
            logMessage('📊 Fallback: Triggering counter animation', 'info');
            animateCounters();
        }
    }, 3000);
    
    logMessage('🎭 Scroll animations initialized', 'success');
}

// 💳 ENHANCED CHECKOUT FUNCTIONALITY
function initializeEnhancedCheckout() {
    const paypalBtn = document.getElementById('paypal-btn');
    
    if (paypalBtn) {
        paypalBtn.addEventListener('click', function(e) {
            handlePayPalCheckout(this);
        });
    }
}

function handlePayPalCheckout(button) {
    // Add loading state
    button.classList.add('loading');
    button.disabled = true;
    
    // Track checkout initiation
    if (window.NextHireAnalytics) {
        window.NextHireAnalytics.trackEvent('checkout_initiated', {
            package: 'complete',
            amount: 197,
            payment_method: 'paypal'
        });
    }
    
    // Update progress indicator
    updateCheckoutProgress(2);
    
    // Reset button after delay
    setTimeout(() => {
        if (button) {
            button.classList.remove('loading');
            button.disabled = false;
            updateCheckoutProgress(1);
        }
    }, 3000);
}

function updateCheckoutProgress(step) {
    const steps = document.querySelectorAll('.progress-step');
    steps.forEach((stepEl, index) => {
        if (index + 1 <= step) {
            stepEl.classList.add('active');
        } else {
            stepEl.classList.remove('active');
        }
    });
}

// 🔍 SOCIAL SHARING FUNCTIONALITY
function initializeSocialSharing() {
    // Add share buttons dynamically
    addSocialShareButtons();
}

function addSocialShareButtons() {
    const shareContainer = document.createElement('div');
    shareContainer.className = 'social-share-fixed';
    shareContainer.innerHTML = `
        <div class="share-trigger" id="shareToggle">
            <span class="share-icon">📤</span>
            <span class="share-text">Share</span>
        </div>
        <div class="share-options" id="shareOptions">
            <button class="share-btn twitter" onclick="shareOnTwitter()">
                <span>🐦</span> Tweet
            </button>
            <button class="share-btn linkedin" onclick="shareOnLinkedIn()">
                <span>💼</span> LinkedIn
            </button>
            <button class="share-btn copy" onclick="copyLink()">
                <span>🔗</span> Copy Link
            </button>
        </div>
    `;
    
    document.body.appendChild(shareContainer);
    
    // Toggle share options
    document.getElementById('shareToggle').addEventListener('click', function() {
        document.getElementById('shareOptions').classList.toggle('show');
    });
    
    // Add CSS for social sharing
    const shareCSS = `
        .social-share-fixed {
            position: fixed;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        
        .share-trigger {
            background: var(--success-gradient);
            color: white;
            padding: 12px;
            border-radius: 25px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.9rem;
            font-weight: 600;
            box-shadow: 0 4px 15px rgba(22, 163, 74, 0.3);
            transition: all 0.3s ease;
        }
        
        .share-trigger:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(22, 163, 74, 0.4);
        }
        
        .share-options {
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 0.5rem;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        .share-options.show {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }
        
        .share-btn {
            width: 100%;
            background: none;
            border: none;
            color: var(--text-white);
            padding: 10px 16px;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.9rem;
            transition: all 0.2s ease;
            white-space: nowrap;
        }
        
        .share-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateX(2px);
        }
        
        @media (max-width: 768px) {
            .social-share-fixed {
                right: 15px;
                bottom: 80px;
                top: auto;
                transform: none;
            }
            
            .share-text {
                display: none;
            }
        }
    `;
    
    const style = document.createElement('style');
    style.textContent = shareCSS;
    document.head.appendChild(style);
}

// Global functions for social sharing
window.shareOnTwitter = function() {
    const text = "Just discovered NextHire Vault - finally a resume system built for real layoffs, not just pretty templates. Built by tech survivors for tech survivors. 95% ATS pass rate! 🔥";
    const url = window.location.href;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    
    if (window.NextHireAnalytics) {
        window.NextHireAnalytics.trackEvent('social_share', {
            platform: 'twitter',
            content_type: 'landing_page'
        });
    }
};

window.shareOnLinkedIn = function() {
    const url = window.location.href;
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    
    window.open(linkedInUrl, '_blank', 'width=600,height=400');
    
    if (window.NextHireAnalytics) {
        window.NextHireAnalytics.trackEvent('social_share', {
            platform: 'linkedin',
            content_type: 'landing_page'
        });
    }
};

window.copyLink = function() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        showNotification('Link copied to clipboard!', 'success');
        
        if (window.NextHireAnalytics) {
            window.NextHireAnalytics.trackEvent('social_share', {
                platform: 'copy_link',
                content_type: 'landing_page'
            });
        }
    });
};

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--success-gradient);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: 600;
        opacity: 0;
        transform: translateY(-20px);
        transition: all 0.3s ease;
        z-index: 10000;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 🌐 GLOBAL EVENT LISTENERS
function addGlobalEventListeners() {
    // Error handling
    window.addEventListener('error', function(e) {
        if (window.NextHireAnalytics) {
            window.NextHireAnalytics.trackEvent('javascript_error', {
                message: e.message,
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno
            });
        }
        logMessage(`JavaScript error: ${e.message}`, 'error');
    });
    
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', function(event) {
        if (window.NextHireAnalytics) {
            window.NextHireAnalytics.trackEvent('unhandled_promise_rejection', {
                reason: event.reason?.toString() || 'Unknown'
            });
        }
        logMessage(`Unhandled promise rejection: ${event.reason}`, 'error');
    });
    
    // Smooth scrolling for hero CTA
    document.querySelector('.hero-cta')?.addEventListener('click', function(e) {
        e.preventDefault();
        scrollToCheckout();
    });
    
    // Track PayPal clicks with loading states
    document.addEventListener('click', function(e) {
        if (e.target.matches('a[href*="paypal"]')) {
            console.log('💳 PayPal checkout initiated');
            
            // Show loading state
            e.target.style.opacity = '0.7';
            const originalText = e.target.innerHTML;
            e.target.innerHTML = e.target.innerHTML.replace(/Secure Checkout|Unlock/, 'Opening PayPal...');
            
            setTimeout(() => {
                if (e.target) {
                    e.target.style.opacity = '1';
                    e.target.innerHTML = originalText;
                }
            }, 3000);
        }
    });
}

// 🔧 UTILITY FUNCTIONS
function updateElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    } else {
        logMessage(`Element with ID '${elementId}' not found`, 'warning');
    }
}

function scrollToCheckout() {
    const checkout = document.getElementById('checkout');
    if (checkout) {
        checkout.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
        
        if (window.NextHireAnalytics) {
            window.NextHireAnalytics.trackEvent('cta_scroll_to_checkout', {
                trigger: 'button_click'
            });
        }
    }
}

function measurePagePerformance() {
    if (!window.performance) return;
    
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
            const domContentLoaded = perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart;
            
            if (window.NextHireAnalytics) {
                window.NextHireAnalytics.trackEvent('page_performance', {
                    load_time: Math.round(loadTime),
                    dom_content_loaded: Math.round(domContentLoaded),
                    total_page_load: Math.round(perfData.loadEventEnd - perfData.fetchStart)
                });
            }
            
            logMessage(`⚡ Page loaded in ${Math.round(loadTime)}ms`, 'info');
        }, 0);
    });
}

function logMessage(message, type = 'info') {
    if (!NEXTHIRE_CONFIG.debug) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
        info: '💡',
        success: '✅', 
        warning: '⚠️',
        error: '❌'
    }[type] || '💡';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
}

// 🧪 TESTING & DEBUGGING FUNCTIONS
function testCounters() {
    logMessage('🧪 Testing counter animation manually...', 'info');
    animateCounters();
}

function getAnalytics() {
    if (window.NextHireAnalytics) {
        const events = window.NextHireAnalytics.getAnalyticsData();
        console.table(events.slice(-10));
        return events;
    }
    return [];
}

function clearAnalytics() {
    try {
        localStorage.removeItem('nexthire_analytics');
        localStorage.removeItem('nexthire_session_id');
        logMessage('Analytics data cleared', 'success');
    } catch (error) {
        logMessage('Error clearing analytics: ' + error.message, 'error');
    }
}

// 🌍 GLOBAL EXPORTS
window.NEXTHIRE = {
    // Public API
    testCounters,
    getAnalytics,
    clearAnalytics,
    scrollToCheckout,
    
    // Configuration
    config: NEXTHIRE_CONFIG,
    
    // Version info
    version: NEXTHIRE_CONFIG.version,
    
    // Health check
    healthCheck: () => {
        logMessage('🏥 NextHire Vault health check:', 'info');
        logMessage(`Version: ${NEXTHIRE_CONFIG.version}`, 'info');
        logMessage(`Analytics: ${NEXTHIRE_CONFIG.analytics.enabled ? 'Enabled' : 'Disabled'}`, 'info');
        logMessage(`Animations: ${NEXTHIRE_CONFIG.animations.enabled ? 'Enabled' : 'Disabled'}`, 'info');
        return {
            version: NEXTHIRE_CONFIG.version,
            status: 'healthy',
            features: {
                analytics: NEXTHIRE_CONFIG.analytics.enabled,
                animations: NEXTHIRE_CONFIG.animations.enabled
            }
        };
    }
};

// 🎉 FINAL INITIALIZATION MESSAGE
logMessage('🔥 NextHire Vault Expert Edition - Ready to convert visitors into customers!', 'success');