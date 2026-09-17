(() => {
  "use strict";

  /* ================= LANGUAGE TOGGLE ================= */
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
    updateCheckoutPreview();
  }

  if (langBtn) langBtn.addEventListener("click", () => applyLang(lang === "en" ? "ar" : "en"));

  /* ================= MOBILE MENU ================= */
  const menuBtn = document.getElementById("menuBtn");
  const navLinks = document.getElementById("navLinks");
  if (menuBtn && navLinks){
    menuBtn.addEventListener("click", () => navLinks.classList.toggle("open"));
    navLinks.querySelectorAll("a").forEach(a =>
      a.addEventListener("click", () => navLinks.classList.remove("open"))
    );
  }

  /* ================= COPY PAYMENT NUMBERS ================= */
  document.querySelectorAll(".copy-num").forEach(btn => {
    btn.addEventListener("click", async () => {
      const numEl = btn.parentElement.querySelector("[data-copy]");
      if (!numEl) return;
      const value = numEl.dataset.copy;
      try { await navigator.clipboard.writeText(value); }
      catch { fallbackCopy(value); }
      const prev = btn.textContent;
      btn.textContent = lang === "en" ? "COPIED" : "تم النسخ";
      btn.classList.add("ok");
      setTimeout(() => { btn.textContent = prev; btn.classList.remove("ok"); }, 1500);
    });
  });

  function fallbackCopy(text){
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch {}
    document.body.removeChild(ta);
  }

  /* ================= PRODUCT CATALOG META ================= */
  const DESC = {
    vb: {
      en: "Top up your Fortnite wallet with pure V-Bucks. Delivered to your Epic account in minutes — no password required.",
      ar: "اشحن محفظة فورتنايت بالفي-بوكس. تُسلّم إلى حسابك على Epic في دقائق — بدون كلمة سر."
    },
    crew: {
      en: "Fortnite Crew subscription — includes monthly V-Bucks, a Crew Pack, and the current Battle Pass. Auto-renewed for the chosen duration.",
      ar: "اشتراك Fortnite Crew — يشمل في-بوكس شهرياً، حزمة الكرو، والباتل باس الحالي. يتجدد تلقائياً للمدة المختارة."
    },
    gift: {
      en: "Send a gift directly to any Fortnite friend's account. Perfect for birthdays, wins, and surprises.",
      ar: "أرسل هدية مباشرة إلى حساب أي صديق في فورتنايت. مثالية لأعياد الميلاد والمناسبات."
    }
  };

  function kindText(kind, key){
    const map = DESC[kind] || DESC.vb;
    return map[lang] || map.en;
  }

  /* ================= PRODUCT DETAIL MODAL ================= */
  const productModal = document.getElementById("productModal");
  const detailTitle  = document.getElementById("detailTitle");
  const detailDesc   = document.getElementById("detailDesc");
  const detailPrice  = document.getElementById("detailPrice");
  const detailCode   = document.getElementById("detailCode");

  let activeProduct = null;
  let activeKind    = "vb";
  let activeOrderId = null;

  function makeOrderId(){
    const now = new Date();
    const stamp = now.getFullYear().toString().slice(-2) +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0");
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `GN-${stamp}-${rand}`;
  }

  function openProductModal(card){
    if (!productModal || !card) return;
    activeProduct = { product: card.dataset.product, price: card.dataset.price };
    activeKind = card.dataset.kind || "vb";
    activeOrderId = makeOrderId();

    if (detailTitle) detailTitle.textContent = activeProduct.product;
    if (detailDesc)  detailDesc.textContent  = kindText(activeKind, "desc");
    if (detailPrice) detailPrice.textContent =
      Number(activeProduct.price).toLocaleString("en-US") + " ";
    if (detailCode)  detailCode.textContent  = activeKind.toUpperCase() + " // " + activeOrderId;

    productModal.classList.add("open");
    productModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeProductModal(){
    if (!productModal) return;
    productModal.classList.remove("open");
    productModal.setAttribute("aria-hidden", "true");
    if (!checkoutModal || !checkoutModal.classList.contains("open")) {
      document.body.style.overflow = "";
    }
  }

  document.querySelectorAll(".order-btn").forEach(btn => {
    btn.addEventListener("click", () => openProductModal(btn.closest("[data-product]")));
  });

  if (productModal){
    productModal.querySelectorAll("[data-close]").forEach(el =>
      el.addEventListener("click", closeProductModal)
    );
  }

  /* ================= CHECKOUT MODAL ================= */
  const checkoutModal = document.getElementById("checkoutModal");
  const coTitle    = document.getElementById("coTitle");
  const coSubtotal = document.getElementById("coSubtotal");
  const coTotal    = document.getElementById("coTotal");
  const coUser     = document.getElementById("coUser");
  const coReference= document.getElementById("coReference");
  const piMethod   = document.getElementById("piMethod");
  const piAddress  = document.getElementById("piAddress");
  const copyAddrBtn= document.getElementById("copyAddress");
  const confirmBtn = document.getElementById("confirmOrder");
  const backToProduct = document.getElementById("backToProduct");

  const PAYMENTS = {
    vodafone: { label: "VODAFONE CASH", value: "0104 264 1080" },
    instapay: { label: "INSTAPAY",      value: "0115 893 4284" },
    telda:    { label: "TELDA",         value: "@itzadam"     }
  };
  let activePayment = "vodafone";

  function openCheckoutModal(){
    if (!checkoutModal || !activeProduct) return;
    closeProductModal();

    if (coTitle)    coTitle.textContent    = activeProduct.product;
    const price = Number(activeProduct.price).toLocaleString("en-US") + " EGP";
    if (coSubtotal) coSubtotal.textContent = price;
    if (coTotal)    coTotal.textContent    = price;

    updatePaymentUI();
    updateCheckoutPreview();

    checkoutModal.classList.add("open");
    checkoutModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTimeout(() => { if (coUser) coUser.focus(); }, 200);
  }

  function closeCheckoutModal(){
    if (!checkoutModal) return;
    checkoutModal.classList.remove("open");
    checkoutModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function updatePaymentUI(){
    const pay = PAYMENTS[activePayment];
    if (piMethod)  piMethod.textContent  = pay.label;
    if (piAddress) piAddress.textContent = pay.value;
    document.querySelectorAll(".pay-tab").forEach(t => {
      t.classList.toggle("active", t.dataset.pay === activePayment);
    });
  }

  function buildTicket(){
    if (!activeProduct || !activeOrderId) return "";
    const user  = (coUser && coUser.value.trim()) || "—";
    const price = Number(activeProduct.price).toLocaleString("en-US");
    const pay   = PAYMENTS[activePayment];

    if (lang === "ar"){
      return `تذكرة GAMENEST 🎟️\n\nرقم التذكرة: ${activeOrderId}\nاسم اللاعب: ${user}\nالمنتج: ${activeProduct.product}\nالسعر: ${price} جنيه\n\nطريقة الدفع: ${pay.label}\nرقم/عنوان التحويل: ${pay.value}\nصاحب الحساب: Adam Mohamed Omar\n\nسأرسل هذه التذكرة + لقطة الدفع إلى @GamenestGifts.`;
    }
    return `GAMENEST Ticket 🎟️\n\nTicket No: ${activeOrderId}\nFortnite Username: ${user}\nProduct: ${activeProduct.product}\nPrice: ${price} EGP\n\nPayment Method: ${pay.label}\nPay to: ${pay.value}\nAccount Holder: Adam Mohamed Omar\n\nSending this ticket + payment screenshot to @GamenestGifts.`;
  }

  function updateCheckoutPreview(){
    if (coReference) coReference.textContent = buildTicket();
  }

  if (coUser) coUser.addEventListener("input", updateCheckoutPreview);

  document.querySelectorAll(".pay-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      activePayment = tab.dataset.pay;
      updatePaymentUI();
      updateCheckoutPreview();
    });
  });

  if (copyAddrBtn){
    copyAddrBtn.addEventListener("click", async () => {
      const pay = PAYMENTS[activePayment];
      try { await navigator.clipboard.writeText(pay.value); }
      catch { fallbackCopy(pay.value); }
      const prev = copyAddrBtn.textContent;
      copyAddrBtn.textContent = lang === "en" ? "COPIED!" : "تم النسخ!";
      copyAddrBtn.classList.add("ok");
      setTimeout(() => {
        copyAddrBtn.textContent = prev;
        copyAddrBtn.classList.remove("ok");
      }, 1600);
    });
  }

  if (confirmBtn){
    confirmBtn.addEventListener("click", async () => {
      updateCheckoutPreview();
      const text = coReference ? coReference.textContent : "";
      try { await navigator.clipboard.writeText(text); }
      catch { fallbackCopy(text); }
      confirmBtn.textContent = lang === "en" ? "COPIED — SEND ON INSTAGRAM" : "تم النسخ — أرسلها على إنستجرام";
      confirmBtn.classList.add("ok");
      setTimeout(() => {
        confirmBtn.textContent = lang === "en" ? "COPY TICKET TO CONFIRM" : "انسخ التذكرة للتأكيد";
        confirmBtn.classList.remove("ok");
      }, 2200);
    });
  }

  if (backToProduct){
    backToProduct.addEventListener("click", e => {
      e.preventDefault();
      closeCheckoutModal();
      if (activeProduct){
        // re-open the product modal for the same product
        const matchingCard = [...document.querySelectorAll("[data-product]")]
          .find(c => c.dataset.product === activeProduct.product);
        if (matchingCard) openProductModal(matchingCard);
      }
    });
  }

  if (checkoutModal){
    checkoutModal.querySelectorAll("[data-close-checkout]").forEach(el =>
      el.addEventListener("click", closeCheckoutModal)
    );
  }

  /* ================= DETAIL MODAL → ACTIONS ================= */
  const buyNowBtn  = document.getElementById("buyNowBtn");
  const addCartBtn = document.getElementById("addCartBtn");

  if (buyNowBtn){
    buyNowBtn.addEventListener("click", () => {
      if (!activeProduct) return;
      openCheckoutModal();
    });
  }

  if (addCartBtn){
    addCartBtn.addEventListener("click", () => {
      if (!activeProduct) return;
      // "Add to cart" behaves as: jump straight to checkout with this item
      // (kept simple since GAMENEST orders are usually one item at a time)
      openCheckoutModal();
    });
  }

  /* ================= ESC KEY ================= */
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if (checkoutModal && checkoutModal.classList.contains("open")) closeCheckoutModal();
    else if (productModal && productModal.classList.contains("open")) closeProductModal();
  });

  /* ================= INIT ================= */
  applyLang("en");
})();
