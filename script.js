/* =========================================================
   GAMENEST — interactivity
   ========================================================= */

(() => {
  "use strict";

  /* ---------- Language toggle ---------- */
  const langBtn = document.getElementById("langBtn");
  let lang = "en";

  function applyLang(l){
    lang = l;
    const html = document.documentElement;
    html.lang = l;
    html.dir = l === "ar" ? "rtl" : "ltr";
    if (langBtn) langBtn.textContent = l === "en" ? "عربي" : "EN";

    document.querySelectorAll("[data-en][data-ar]").forEach(el => {
      el.textContent = l === "en" ? el.dataset.en : el.dataset.ar;
    });

    /* Re-render open ticket so its labels stay in the current language */
    refreshTicket();
  }

  if (langBtn){
    langBtn.addEventListener("click", () => {
      applyLang(lang === "en" ? "ar" : "en");
    });
  }

  /* ---------- Mobile menu ---------- */
  const menuBtn = document.getElementById("menuBtn");
  const navLinks = document.getElementById("navLinks");

  if (menuBtn && navLinks){
    menuBtn.addEventListener("click", () => {
      navLinks.classList.toggle("open");
    });
    navLinks.querySelectorAll("a").forEach(a => {
      a.addEventListener("click", () => navLinks.classList.remove("open"));
    });
  }

  /* ---------- Copy payment numbers ---------- */
  document.querySelectorAll(".copy-num").forEach(btn => {
    btn.addEventListener("click", async () => {
      const numEl = btn.parentElement.querySelector("[data-copy]");
      if (!numEl) return;
      const value = numEl.dataset.copy;

      try {
        await navigator.clipboard.writeText(value);
      } catch {
        /* Fallback for older browsers / non-HTTPS */
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch {}
        document.body.removeChild(ta);
      }

      const original = btn.textContent;
      btn.textContent = lang === "en" ? "Copied" : "تم النسخ";
      btn.classList.add("ok");
      setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove("ok");
      }, 1600);
    });
  });

  /* ---------- Order modal ---------- */
  const modal     = document.getElementById("orderModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalPrice = document.getElementById("modalPrice");
  const ticketEl  = document.getElementById("ticketText");
  const userInput = document.getElementById("username");
  const copyTicket = document.getElementById("copyTicket");

  let activeProduct = null;
  let activeOrderId = null;

  function makeOrderId(){
    const now = new Date();
    const stamp =
      now.getFullYear().toString().slice(-2) +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0");
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `GN-${stamp}-${rand}`;
  }

  function buildTicket(){
    if (!activeProduct || !activeOrderId) return "";
    const user  = (userInput && userInput.value.trim()) || "—";
    const price = Number(activeProduct.price).toLocaleString("en-US");

    if (lang === "ar"){
      return `تذكرة GAMENEST 🎟️

رقم التذكرة: ${activeOrderId}
الاسم: ${user}
المنتج: ${activeProduct.product}
السعر: ${price} جنيه

الدفع على: فودافون كاش / إنستاباي / تيلدا — Adam Mohamed Omar
سأرسل هذه التذكرة إلى @GamenestGifts مع لقطة الدفع.`;
    }

    return `GAMENEST Ticket 🎟️

Ticket No: ${activeOrderId}
Customer: ${user}
Product: ${activeProduct.product}
Price: ${price} EGP

Pay to: Vodafone Cash / InstaPay / Telda — Adam Mohamed Omar
Sending this ticket to @GamenestGifts with payment screenshot.`;
  }

  function refreshTicket(){
    if (ticketEl) ticketEl.textContent = buildTicket();
  }

  function openModal(card){
    if (!modal || !card) return;

    activeProduct = {
      product: card.dataset.product,
      price:   card.dataset.price
    };
    activeOrderId = makeOrderId();

    if (modalTitle) modalTitle.textContent = activeProduct.product;
    if (modalPrice)
      modalPrice.textContent =
        Number(activeProduct.price).toLocaleString("en-US") + " EGP";

    if (userInput) userInput.value = "";
    if (copyTicket){
      copyTicket.textContent = lang === "en" ? "Copy Ticket" : "انسخ التذكرة";
      copyTicket.classList.remove("ok");
    }

    refreshTicket();

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    if (userInput) setTimeout(() => userInput.focus(), 200);
  }

  function closeModal(){
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    activeProduct = null;
    activeOrderId = null;
  }

  /* Attach open-modal to every Order button */
  document.querySelectorAll(".order-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const card = btn.closest("[data-product]");
      openModal(card);
    });
  });

  /* Close modal: backdrop, X button, or Esc */
  if (modal){
    modal.querySelectorAll("[data-close]").forEach(el => {
      el.addEventListener("click", closeModal);
    });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
    });
  }

  /* Live-update ticket when username changes */
  if (userInput) userInput.addEventListener("input", refreshTicket);

  /* Copy ticket button */
  if (copyTicket){
    copyTicket.addEventListener("click", async () => {
      refreshTicket();
      const text = ticketEl ? ticketEl.textContent : "";
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        /* Fallback */
        if (ticketEl){
          const range = document.createRange();
          range.selectNodeContents(ticketEl);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          try { document.execCommand("copy"); } catch {}
        }
      }

      const original = lang === "en" ? "Copy Ticket" : "انسخ التذكرة";
      const done     = lang === "en" ? "Copied!"     : "تم النسخ!";
      copyTicket.textContent = done;
      copyTicket.classList.add("ok");
      setTimeout(() => {
        copyTicket.textContent = original;
        copyTicket.classList.remove("ok");
      }, 1800);
    });
  }

  /* ---------- Init ---------- */
  applyLang("en");
})();
