/* ==========================================================================
   NEXIFING — script.js
   Version 3.0
   Full interactive layer — menu, animations, forms, utilities, UX polish
   ========================================================================== */

(() => {
  "use strict";

  /* ==========================================================================
     0. UTILITIES
     ========================================================================== */
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
  const throttle = (fn, wait) => {
    let last = 0, timer = null;
    return function(...args){
      const now = Date.now();
      const remaining = wait - (now - last);
      if (remaining <= 0){
        clearTimeout(timer);
        timer = null;
        last = now;
        fn.apply(this, args);
      } else if (!timer){
        timer = setTimeout(() => {
          last = Date.now();
          timer = null;
          fn.apply(this, args);
        }, remaining);
      }
    };
  };
  const debounce = (fn, wait) => {
    let timer;
    return function(...args){
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  };

  const safeLog = (label, ...args) => {
    try { console.log(`%c NEXIFING · ${label}`, "color:#5b8cff;font-weight:600", ...args); }
    catch(e){}
  };

  /* ==========================================================================
     1. MOBILE MENU
     ========================================================================== */
  const menuToggle = $("#menuToggle");
  const nav = $("#nav");

  function openMenu(){
    if (!nav) return;
    menuToggle.classList.add("active");
    nav.classList.add("open");
    document.body.style.overflow = "hidden";
    menuToggle.setAttribute("aria-expanded", "true");
  }
  function closeMenu(){
    if (!nav) return;
    menuToggle.classList.remove("active");
    nav.classList.remove("open");
    document.body.style.overflow = "";
    menuToggle.setAttribute("aria-expanded", "false");
  }
  function toggleMenu(){
    if (!nav) return;
    nav.classList.contains("open") ? closeMenu() : openMenu();
  }

  if (menuToggle && nav){
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.addEventListener("click", toggleMenu);

    nav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("open")) closeMenu();
    });

    window.addEventListener("resize", debounce(() => {
      if (window.innerWidth > 900 && nav.classList.contains("open")) closeMenu();
    }, 150));
  }

  /* ==========================================================================
     2. HEADER SHADOW ON SCROLL
     ========================================================================== */
  const header = $(".header");
  if (header){
    const updateHeader = throttle(() => {
      if (window.pageYOffset > 20){
        header.style.boxShadow = "0 1px 0 rgba(255,255,255,.02), 0 8px 24px rgba(0,0,0,.4)";
      } else {
        header.style.boxShadow = "none";
      }
    }, 100);
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  /* ==========================================================================
     3. READING PROGRESS BAR
     ========================================================================== */
  const progressBar = document.createElement("div");
  progressBar.className = "read-progress";
  progressBar.setAttribute("aria-hidden", "true");
  document.body.appendChild(progressBar);

  const updateProgress = throttle(() => {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.transform = `scaleX(${pct / 100})`;
  }, 40);
  window.addEventListener("scroll", updateProgress, { passive: true });

  /* ==========================================================================
     4. SCROLL REVEAL
     ========================================================================== */
  const revealTargets = $$(
    ".service, .process-step, .work-card, .industry, .tech-group, " +
    ".why-item, .faq details, .section-head, .testimonial, .pricing-card, " +
    ".intro-p, .intro-left, .clients-label, .pricing-note, .cta-note"
  );

  if ("IntersectionObserver" in window && !prefersReducedMotion){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting){
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });

    revealTargets.forEach((el, i) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(24px)";
      const delay = Math.min(i * 0.03, 0.3);
      el.style.transition =
        `opacity .7s cubic-bezier(.22,1,.36,1) ${delay}s, ` +
        `transform .7s cubic-bezier(.22,1,.36,1) ${delay}s`;
      io.observe(el);
    });
  } else {
    revealTargets.forEach(el => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
  }

  /* ==========================================================================
     5. SMOOTH SCROLL FOR ANCHORS
     ========================================================================== */
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (!href || href === "#" || href.length < 2) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top, behavior: prefersReducedMotion ? "auto" : "smooth" });
      if (history.pushState) history.pushState(null, "", href);
    });
  });

  /* ==========================================================================
     6. FAQ ACCORDION — one open at a time
     ========================================================================== */
  const faqItems = $$(".faq details");
  faqItems.forEach(item => {
    item.addEventListener("toggle", () => {
      if (item.open){
        faqItems.forEach(other => {
          if (other !== item && other.open) other.open = false;
        });
      }
    });
  });

  /* ==========================================================================
     7. ACTIVE NAV HIGHLIGHT
     ========================================================================== */
  const sections = $$("section[id]");
  const navLinks = $$(".nav a[href^='#']");

  if (sections.length && navLinks.length && "IntersectionObserver" in window){
    const map = new Map();
    navLinks.forEach(link => {
      const id = link.getAttribute("href").slice(1);
      const sec = document.getElementById(id);
      if (sec) map.set(sec, link);
    });

    const navObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const link = map.get(entry.target);
        if (!link) return;
        if (entry.isIntersecting){
          navLinks.forEach(l => l.style.color = "");
          link.style.color = "var(--text)";
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px", threshold: 0 });

    map.forEach((link, sec) => navObs.observe(sec));
  }

  /* ==========================================================================
     8. COUNT-UP ANIMATION FOR HERO STATS
     ========================================================================== */
  const heroStats = $$(".hero-stats .stat-n");

  function animateCount(el){
    if (prefersReducedMotion) return;

    const originalText = el.textContent.trim();

    /* Detect non-numeric values like "< 24h", "99.9%", "3+ yrs" */
    const suffixMatch = originalText.match(/([%+a-zA-Z<>\s]+)$/);
    const suffix = suffixMatch ? suffixMatch[1] : "";
    const numericPart = originalText.replace(suffix, "").trim();

    /* Handle decimal values like 99.9 */
    const isDecimal = numericPart.includes(".");
    const target = parseFloat(numericPart);
    if (isNaN(target)) return;

    const duration = 1400;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = target * eased;

      if (isDecimal){
        el.textContent = current.toFixed(1) + suffix;
      } else {
        el.textContent = Math.round(current).toLocaleString("en-US") + suffix;
      }
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  if (heroStats.length && "IntersectionObserver" in window){
    const statObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting){
          heroStats.forEach(animateCount);
          statObs.disconnect();
        }
      });
    }, { threshold: 0.4 });
    const heroStatsEl = $(".hero-stats");
    if (heroStatsEl) statObs.observe(heroStatsEl);
  }

  /* ==========================================================================
     9. BACK TO TOP
     ========================================================================== */
  const backToTop = document.createElement("button");
  backToTop.className = "back-to-top";
  backToTop.setAttribute("aria-label", "Back to top");
  backToTop.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';
  document.body.appendChild(backToTop);

  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  });

  const toggleBackTop = throttle(() => {
    backToTop.classList.toggle("visible", window.pageYOffset > 600);
  }, 100);
  window.addEventListener("scroll", toggleBackTop, { passive: true });

  /* ==========================================================================
     10. EXTERNAL LINK SAFETY
     ========================================================================== */
  const hostname = window.location.hostname;
  $$("a[href^='http']").forEach(link => {
    try {
      const url = new URL(link.href);
      if (url.hostname !== hostname && !link.hasAttribute("target")){
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      }
    } catch(e){}
  });

  /* ==========================================================================
     11. FORM VALIDATION HELPERS
     ========================================================================== */
  const validators = {
    required: (v) => v.trim().length > 0 || "This field is required",
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || "Invalid email address",
    minLength: (n) => (v) => v.trim().length >= n || `Must be at least ${n} characters`,
    maxLength: (n) => (v) => v.trim().length <= n || `Must be under ${n} characters`,
    phone: (v) => /^[\d\s+()-]{7,}$/.test(v.trim()) || "Invalid phone number"
  };

  function validateField(input, rules){
    const value = input.value;
    for (const rule of rules){
      const result = rule(value);
      if (result !== true){
        return { valid: false, message: result };
      }
    }
    return { valid: true };
  }

  /* ==========================================================================
     12. CONTACT FORM
     ========================================================================== */
  const contactForm = $("#contactForm");
  if (contactForm){
    const name = $("#cfName");
    const email = $("#cfEmail");
    const project = $("#cfProject");
    const message = $("#cfMessage");
    const submitBtn = $("#cfSubmit");
    const noteEl = $("#cfNote");

    /* Inline error display */
    function showError(input, msg){
      if (!input) return;
      input.classList.add("error");
      const errEl = input.parentElement.querySelector(".form-error");
      if (errEl) errEl.textContent = msg;
    }
    function clearError(input){
      if (!input) return;
      input.classList.remove("error");
      const errEl = input.parentElement.querySelector(".form-error");
      if (errEl) errEl.textContent = "";
    }

    [name, email, message].forEach(input => {
      if (!input) return;
      input.addEventListener("input", () => clearError(input));
    });

    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();

      let valid = true;

      const nameCheck = validateField(name, [validators.required, validators.minLength(2)]);
      if (!nameCheck.valid){ showError(name, nameCheck.message); valid = false; }

      const emailCheck = validateField(email, [validators.required, validators.email]);
      if (!emailCheck.valid){ showError(email, emailCheck.message); valid = false; }

      const msgCheck = validateField(message, [validators.required, validators.minLength(10)]);
      if (!msgCheck.valid){ showError(message, msgCheck.message); valid = false; }

      if (!valid){
        if (noteEl){
          noteEl.textContent = "Please fix the errors above";
          noteEl.style.color = "var(--danger)";
        }
        return;
      }

      /* Persist draft on submit (so it's not lost) */
      saveFormDraft(contactForm);

      submitBtn.disabled = true;
      const original = submitBtn.textContent;
      submitBtn.textContent = "Sending...";
      if (noteEl){ noteEl.textContent = ""; }

      setTimeout(() => {
        if (noteEl){
          noteEl.textContent = "✓ Message sent — we'll reply within 24 hours.";
          noteEl.style.color = "var(--success)";
        }
        submitBtn.disabled = false;
        submitBtn.textContent = original;
        contactForm.reset();
        clearFormDraft(contactForm);
      }, 1200);
    });

    /* Draft persistence */
    function saveFormDraft(form){
      try {
        const data = {};
        new FormData(form).forEach((v, k) => { data[k] = v; });
        localStorage.setItem("nexifing_contact_draft", JSON.stringify(data));
      } catch(e){}
    }
    function clearFormDraft(form){
      try { localStorage.removeItem("nexifing_contact_draft"); } catch(e){}
    }
    function restoreFormDraft(form){
      try {
        const raw = localStorage.getItem("nexifing_contact_draft");
        if (!raw) return;
        const data = JSON.parse(raw);
        Object.entries(data).forEach(([k, v]) => {
          const el = form.querySelector(`[name="${k}"]`);
          if (el) el.value = v;
        });
      } catch(e){}
    }
    restoreFormDraft(contactForm);

    /* Auto-save draft every 3 seconds while typing */
    let draftTimer;
    contactForm.addEventListener("input", () => {
      clearTimeout(draftTimer);
      draftTimer = setTimeout(() => saveFormDraft(contactForm), 3000);
    });
  }

  /* ==========================================================================
     13. HERO PARALLAX
     ========================================================================== */
  const heroGlows = $$(".hero .glow");
  if (heroGlows.length && !prefersReducedMotion){
    const parallax = throttle(() => {
      const y = window.pageYOffset;
      heroGlows.forEach((glow, i) => {
        glow.style.transform = `translateY(${y * (0.15 + i * 0.1)}px)`;
      });
    }, 40);
    window.addEventListener("scroll", parallax, { passive: true });
  }

  /* ==========================================================================
     14. IMAGE PREFETCH
     ========================================================================== */
  if ("requestIdleCallback" in window){
    requestIdleCallback(() => {
      ["nexifing-logo.png", "favicon.png"].forEach(src => {
        const img = new Image();
        img.src = src;
      });
    });
  }

  /* ==========================================================================
     15. HOVER WILL-CHANGE HINTS
     ========================================================================== */
  $$(".work-card, .service, .pricing-card").forEach(card => {
    card.addEventListener("mouseenter", () => { card.style.willChange = "transform"; });
    card.addEventListener("mouseleave", () => { card.style.willChange = "auto"; });
  });

  /* ==========================================================================
     16. KEYBOARD SHORTCUTS
     ========================================================================== */
  document.addEventListener("keydown", (e) => {
    /* "/" focuses search (if exists) */
    if (e.key === "/" && !isTyping(e.target)){
      const searchInput = $("#searchInput");
      if (searchInput){
        e.preventDefault();
        searchInput.focus();
      }
    }
    /* "g h" → home (github-style) */
    if (e.key === "g" && !isTyping(e.target)){
      const handler = (ev) => {
        if (ev.key === "h"){ window.location.href = "/"; }
        document.removeEventListener("keydown", handler);
      };
      document.addEventListener("keydown", handler);
      setTimeout(() => document.removeEventListener("keydown", handler), 800);
    }
  });

  function isTyping(el){
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable;
  }

  /* ==========================================================================
     17. TOAST NOTIFICATIONS
     ========================================================================== */
  function showToast(message, type = "info", duration = 3000){
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("visible"));

    setTimeout(() => {
      toast.classList.remove("visible");
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
  window.NEXIFING = window.NEXIFING || {};
  window.NEXIFING.showToast = showToast;

  /* ==========================================================================
     18. COPY-TO-CLIPBOARD BUTTONS
     ========================================================================== */
  $$("[data-copy]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const text = btn.dataset.copy;
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        showToast("Copied to clipboard", "success", 1800);
        btn.classList.add("copied");
        setTimeout(() => btn.classList.remove("copied"), 1500);
      } catch(e){
        showToast("Copy failed", "error", 1800);
      }
    });
  });

  /* ==========================================================================
     19. YEAR AUTO-FILL
     ========================================================================== */
  $$("[data-year]").forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  /* ==========================================================================
     20. INJECTED STYLES (toast, progress, back-to-top)
     ========================================================================== */
  const styleEl = document.createElement("style");
  styleEl.textContent = `
    /* Reading progress */
    .read-progress{
      position:fixed;top:0;left:0;right:0;height:2px;
      background:linear-gradient(90deg,#5b8cff,#7b5bff);
      transform:scaleX(0);transform-origin:left;
      z-index:200;pointer-events:none;
      transition:transform .1s linear;
    }

    /* Back to top */
    .back-to-top{
      position:fixed;bottom:24px;right:24px;
      width:48px;height:48px;border-radius:50%;
      background:var(--surface);border:1px solid var(--border-2);
      color:var(--text-2);
      display:flex;align-items:center;justify-content:center;
      cursor:pointer;z-index:90;
      opacity:0;pointer-events:none;
      transform:translateY(12px);
      transition:all .3s cubic-bezier(.22,1,.36,1);
      box-shadow:0 8px 24px rgba(0,0,0,.4);
    }
    .back-to-top.visible{opacity:1;pointer-events:auto;transform:translateY(0)}
    .back-to-top:hover{
      background:linear-gradient(135deg,#5b8cff,#7b5bff);
      border-color:transparent;color:#fff;
      transform:translateY(-2px);
      box-shadow:0 12px 32px rgba(91,140,255,.4);
    }
    .back-to-top svg{display:block}

    /* Toast */
    .toast{
      position:fixed;bottom:32px;left:50%;
      transform:translate(-50%,20px);
      padding:14px 24px;border-radius:10px;
      background:var(--surface);border:1px solid var(--border-2);
      color:var(--text);font-size:14px;font-weight:500;
      box-shadow:0 20px 60px rgba(0,0,0,.5);
      z-index:250;pointer-events:none;
      opacity:0;
      transition:opacity .25s cubic-bezier(.22,1,.36,1),
                 transform .25s cubic-bezier(.22,1,.36,1);
      max-width:calc(100vw - 40px);
    }
    .toast.visible{opacity:1;transform:translate(-50%,0)}
    .toast-success{border-color:rgba(74,222,128,.4);color:#4ade80}
    .toast-error{border-color:rgba(248,113,113,.4);color:#f87171}
    .toast-info{border-color:rgba(91,140,255,.4);color:#5b8cff}

    /* Form error states */
    .form-error{
      display:block;margin-top:6px;
      font-family:var(--mono);font-size:12px;
      color:var(--danger);letter-spacing:.02em;
      min-height:0;
    }
    input.error, textarea.error{
      border-color:var(--danger) !important;
    }

    /* Copied state */
    .copied{
      background:rgba(74,222,128,.15) !important;
      border-color:rgba(74,222,128,.5) !important;
      color:#4ade80 !important;
    }

    @media(max-width:640px){
      .back-to-top{bottom:16px;right:16px;width:42px;height:42px}
      .toast{font-size:13px;padding:12px 18px}
    }
    @media(prefers-reduced-motion:reduce){
      .back-to-top,.toast,.read-progress{transition:none}
    }
  `;
  document.head.appendChild(styleEl);

  /* ==========================================================================
     21. CONSOLE BANNER
     ========================================================================== */
  try {
    console.log(
      "%c NEXIFING ",
      "background:linear-gradient(135deg,#5b8cff,#7b5bff);color:#fff;font-weight:800;padding:6px 12px;border-radius:6px;letter-spacing:.14em;font-size:12px"
    );
    console.log(
      "%c Web Development Studio · https://7az3ma7m3dm-oss.github.io/nexifing/",
      "color:#7a7a92;font-size:11px"
    );
    console.log(
      "%c Tip: press '/' to focus search · type 'g h' to jump home",
      "color:#5b8cff;font-size:11px;font-style:italic"
    );
  } catch(e){}

  /* ==========================================================================
     22. READY
     ========================================================================== */
  safeLog("init", "all systems ready");
  document.documentElement.setAttribute("data-nexifing-ready", "true");

})();
