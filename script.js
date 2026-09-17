/* ==========================================================================
   GAMENEST — Main Script
   Handles: catalog rendering, cart, favorites, search, modals, checkout,
            payment buttons, countdown, toasts.
   ========================================================================== */

(() => {
  "use strict";

  /* ==========================================================================
     1. CATALOG
     ========================================================================== */
  const PRODUCTS = [
    /* V-Bucks */
    { id:"vb-800",   kind:"vb",   img:"vbucks.png", product:"800 V-Bucks",               price:199  },
    { id:"vb-2400",  kind:"vb",   img:"vbucks.png", product:"2400 V-Bucks",              price:479  },
    { id:"vb-4500",  kind:"vb",   img:"vbucks.png", product:"4500 V-Bucks",              price:759  },
    { id:"vb-12500", kind:"vb",   img:"vbucks.png", product:"12500 V-Bucks",             price:1749 },

    /* Crew */
    { id:"cr-1",     kind:"crew", img:"crew.png",   product:"Fortnite Crew — 1 Month",   price:210  },
    { id:"cr-2",     kind:"crew", img:"crew.png",   product:"Fortnite Crew — 2 Months",  price:379  },
    { id:"cr-3",     kind:"crew", img:"crew.png",   product:"Fortnite Crew — 3 Months",  price:559  },
    { id:"cr-6",     kind:"crew", img:"crew.png",   product:"Fortnite Crew — 6 Months",  price:1049 },
    { id:"cr-12",    kind:"crew", img:"crew.png",   product:"Fortnite Crew — 12 Months", price:1959 },

    /* Gifts */
    { id:"gf-500",   kind:"gift", img:"gift.png",   product:"500 V-Bucks Gift",           price:95   },
    { id:"gf-800",   kind:"gift", img:"gift.png",   product:"800 V-Bucks Gift",           price:150  },
    { id:"gf-1200",  kind:"gift", img:"gift.png",   product:"1200 V-Bucks Gift",          price:225  },
    { id:"gf-1500",  kind:"gift", img:"gift.png",   product:"1500 V-Bucks Gift",          price:280  },
    { id:"gf-1800",  kind:"gift", img:"gift.png",   product:"1800 V-Bucks Gift",          price:330  },
    { id:"gf-2000",  kind:"gift", img:"gift.png",   product:"2000 V-Bucks Gift",          price:375 }
  ];

  /* ==========================================================================
     2. DESCRIPTIONS
     ========================================================================== */
  const DESC = {
    vb: {
      en: "Top up your Fortnite wallet with pure V-Bucks. Delivered straight to your Epic Games account in minutes — no password required, no waiting, no risk.",
      ar: "اشحن محفظة فورتنايت بالفي-بوكس. تُسلّم مباشرة إلى حسابك على Epic Games في دقائق — بدون كلمة سر، بدون انتظار، وبدون أي مخاطرة."
    },
    crew: {
      en: "Fortnite Crew subscription — includes monthly V-Bucks, a Crew Pack, and the current Battle Pass. Delivered for the full duration you select.",
      ar: "اشتراك Fortnite Crew — يشمل في-بوكس شهرياً، حزمة الكرو، والباتل باس الحالي. يُسلّم للمدة الكاملة التي تختارها."
    },
    gift: {
      en: "Send a gift directly to any Fortnite friend's account. Perfect for birthdays, wins, and surprises — delivered instantly to their Epic account.",
      ar: "أرسل هدية مباشرة إلى حساب أي صديق في فورتنايت. مثالية لأعياد الميلاد والمناسبات — تُسلّم فوراً إلى حسابهم على Epic."
    }
  };

  /* ==========================================================================
     3. PAYMENTS
     ========================================================================== */
  const PAYMENTS = {
    vodafone: {
      label:"VODAFONE CASH",
      value:"0104 264 1080",
      link:"http://vf.eg/vfcash?id=mt&qrId=wgmEpY"
    },
    instapay: {
      label:"INSTAPAY",
      value:"0115 893 4284",
      link:"https://ipn.eg/S/iadqm/instapay/9n2XjE"
    },
    telda: {
      label:"TELDA",
      value:"@itzadam",
      link:""
    }
  };

  const HOLDER = "Adam Mohamed Omar";
  const HANDLE = "@GamenestGifts";

  /* ==========================================================================
     4. STATE
     ========================================================================== */
  let lang = "en";
  let activeProduct = null;
  let activePayment = "vodafone";
  let activeOrderId = null;
  let toastTimer = null;

  /* ==========================================================================
     5. STORAGE
     ========================================================================== */
  const Storage = {
    get(key, fallback){
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch { return fallback; }
    },
    set(key, val){
      try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
    }
  };

  const getCart  = () => Storage.get("gn_cart", []);
  const setCart  = (c) => { Storage.set("gn_cart", c); updateBadges(); renderCart(); };
  const getFavs  = () => Storage.get("gn_favs", []);
  const setFavs  = (f) => { Storage.set("gn_favs", f); updateBadges(); renderFavs(); };

  /* ==========================================================================
     6. HELPERS
     ========================================================================== */
  const $  = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
  const fmt = (n) => Number(n).toLocaleString("en-US");

  function makeOrderId(){
    const now = new Date();
    const y = String(now.getFullYear()).slice(-2);
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const rnd = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `GN-${y}${m}${d}-${rnd}`;
  }

  async function copyText(text){
    try { await navigator.clipboard.writeText(text); return true; }
    catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        return ok;
      } catch { return false; }
    }
  }

  function toast(msg){
    const el = $("#toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 1900);
  }

  /* ==========================================================================
     7. LANGUAGE
     ========================================================================== */
  function applyLang(l){
    lang = l;
    document.documentElement.lang = l;
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";

    const langBtn = $("#langBtn");
    if (langBtn) langBtn.textContent = l === "en" ? "عربي" : "EN";

    $$("[data-en][data-ar]").forEach(el => {
      const text = l === "en" ? el.dataset.en : el.dataset.ar;
      if (text !== undefined) el.textContent = text;
    });

    renderAllProducts();
    renderCart();
    renderFavs();
    updateCheckoutPreview();
    updateSearchResults();
  }

  const langBtn = $("#langBtn");
  if (langBtn){
    langBtn.addEventListener("click", () => applyLang(lang === "en" ? "ar" : "en"));
  }

  /* ==========================================================================
     8. MOBILE MENU
     ========================================================================== */
  const menuBtn = $("#menuBtn");
  const navLinks = $("#navLinks");
  if (menuBtn && navLinks){
    menuBtn.addEventListener("click", () => navLinks.classList.toggle("open"));
    $$("a", navLinks).forEach(a =>
      a.addEventListener("click", () => navLinks.classList.remove("open"))
    );
  }

  /* ==========================================================================
     9. PRODUCT CARDS
     ========================================================================== */
  function buildCardHTML(p){
    const isFav = getFavs().some(f => f.id === p.id);
    const tag =
      p.kind === "vb"   ? "// FORTNITE | V-BUCKS" :
      p.kind === "crew" ? "// FORTNITE | CREW"    :
                          "// FORTNITE | GIFTS";

    return `
      <article class="pcard-prod"
               data-id="${p.id}"
               data-product="${p.product}"
               data-price="${p.price}"
               data-kind="${p.kind}"
               data-img="${p.img}">
        <div class="pcard-media">
          <img src="${p.img}" alt="${p.product}" loading="lazy" onerror="this.style.display='none'">
          <button class="fav-btn${isFav ? " active" : ""}"
                  type="button"
                  aria-label="Toggle favorite"
                  data-fav="${p.id}">
            <svg viewBox="0 0 24 24" fill="${isFav ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/>
            </svg>
          </button>
        </div>
        <div class="pcard-info">
          <div class="pcard-tag">${tag}</div>
          <h3 class="pcard-title">${p.product}</h3>
          <div class="pcard-price">From <b>${fmt(p.price)}</b> EGP</div>
          <div class="pcard-actions">
            <button class="pcard-btn ghost" type="button" data-action="cart">ADD_TO_CART</button>
            <button class="pcard-btn fill"  type="button" data-action="buy">PURCHASE</button>
          </div>
        </div>
      </article>
    `;
  }

  function renderAllProducts(){
    const vbGrid = $("#gridVB");
    const crGrid = $("#gridCrew");
    const gfGrid = $("#gridGift");

    if (vbGrid) vbGrid.innerHTML = PRODUCTS.filter(p => p.kind === "vb").map(buildCardHTML).join("");
    if (crGrid) crGrid.innerHTML = PRODUCTS.filter(p => p.kind === "crew").map(buildCardHTML).join("");
    if (gfGrid) gfGrid.innerHTML = PRODUCTS.filter(p => p.kind === "gift").map(buildCardHTML).join("");

    bindCards();
  }

  function bindCards(){
    $$(".pcard-prod").forEach(card => {
      $$(".pcard-btn", card).forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const action = btn.dataset.action;
          if (action === "cart") addToCartById(card.dataset.id);
          else if (action === "buy") openProductModal(card);
        });
      });
      $$(".fav-btn", card).forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          toggleFavorite(card.dataset.id);
        });
      });
    });
  }

  /* ==========================================================================
     10. BADGES
     ========================================================================== */
  function updateBadges(){
    const cartCount = getCart().reduce((sum, i) => sum + (i.qty || 1), 0);
    const favCount  = getFavs().length;

    const ccEl = $("#cartCount");
    const fcEl = $("#favCount");

    if (ccEl){
      ccEl.textContent = cartCount;
      ccEl.hidden = cartCount === 0;
    }
    if (fcEl){
      fcEl.textContent = favCount;
      fcEl.hidden = favCount === 0;
    }
  }

  /* ==========================================================================
     11. CART
     ========================================================================== */
  const findProduct = (id) => PRODUCTS.find(p => p.id === id);

  function addToCartById(id){
    const p = findProduct(id);
    if (!p) return;
    const cart = getCart();
    const found = cart.find(i => i.id === id);
    if (found) found.qty = (found.qty || 1) + 1;
    else cart.push({ id:p.id, product:p.product, price:p.price, kind:p.kind, img:p.img, qty:1 });
    setCart(cart);
    toast(lang === "en" ? "Added to cart" : "تمت الإضافة للسلة");
  }

  function renderCart(){
    const box = $("#cartItems");
    const totalEl = $("#cartTotal");
    if (!box) return;

    const cart = getCart();
    if (cart.length === 0){
      box.innerHTML = `<div class="empty-msg">${lang === "en" ? "Your cart is empty." : "سلتك فارغة."}</div>`;
      if (totalEl) totalEl.textContent = "0 EGP";
      return;
    }

    box.innerHTML = cart.map((it, i) => `
      <div class="cart-item">
        <img src="${it.img}" alt="" onerror="this.style.display='none'">
        <div class="ci-info">
          <div class="ci-title">${it.product}</div>
          <div class="ci-price">${fmt(it.price)} EGP × ${it.qty || 1}</div>
        </div>
        <button class="ci-remove" type="button" data-remove="${i}" aria-label="Remove">×</button>
      </div>
    `).join("");

    const sum = cart.reduce((s, i) => s + i.price * (i.qty || 1), 0);
    if (totalEl) totalEl.textContent = fmt(sum) + " EGP";

    $$("[data-remove]", box).forEach(btn => {
      btn.addEventListener("click", () => {
        const c = getCart();
        c.splice(Number(btn.dataset.remove), 1);
        setCart(c);
      });
    });
  }

  /* ==========================================================================
     12. FAVORITES
     ========================================================================== */
  function toggleFavorite(id){
    const favs = getFavs();
    const idx = favs.findIndex(f => f.id === id);
    const p = findProduct(id);
    if (!p) return;

    if (idx > -1){
      favs.splice(idx, 1);
      toast(lang === "en" ? "Removed from favorites" : "حُذفت من المفضلة");
    } else {
      favs.push({ id: p.id, product: p.product, price: p.price, kind: p.kind, img: p.img });
      toast(lang === "en" ? "Added to favorites" : "أُضيفت للمفضلة");
    }
    setFavs(favs);
    renderAllProducts();
  }

  function renderFavs(){
    const box = $("#favItems");
    if (!box) return;

    const favs = getFavs();
    if (favs.length === 0){
      box.innerHTML = `<div class="empty-msg">${lang === "en" ? "No favorites yet." : "لا مفضلات بعد."}</div>`;
      return;
    }
    box.innerHTML = favs.map((it, i) => `
      <div class="cart-item">
        <img src="${it.img}" alt="" onerror="this.style.display='none'">
        <div class="ci-info">
          <div class="ci-title">${it.product}</div>
          <div class="ci-price">${fmt(it.price)} EGP</div>
        </div>
        <button class="ci-remove" type="button" data-fav-remove="${i}" aria-label="Remove">×</button>
      </div>
    `).join("");

    $$("[data-fav-remove]", box).forEach(btn => {
      btn.addEventListener("click", () => {
        const f = getFavs();
        f.splice(Number(btn.dataset.favRemove), 1);
        setFavs(f);
        renderAllProducts();
      });
    });
  }

  /* ==========================================================================
     13. MODAL HELPERS
     ========================================================================== */
  function openModal(modal){
    if (!modal) return;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal(modal){
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    const anyOpen = $$(".modal.open").length > 0;
    if (!anyOpen) document.body.style.overflow = "";
  }

  /* ==========================================================================
     14. PRODUCT DETAIL MODAL
     ========================================================================== */
  const productModal = $("#productModal");
  const detailTitle  = $("#detailTitle");
  const detailDesc   = $("#detailDesc");
  const detailPrice  = $("#detailPrice");
  const detailCode   = $("#detailCode");
  const detailImg    = $("#detailImg");

  function openProductModal(card){
    if (!productModal || !card) return;
    activeProduct = {
      id:      card.dataset.id,
      product: card.dataset.product,
      price:   Number(card.dataset.price),
      kind:    card.dataset.kind,
      img:     card.dataset.img
    };
    activeOrderId = makeOrderId();

    if (detailTitle) detailTitle.textContent = activeProduct.product;
    if (detailDesc)  detailDesc.textContent  = (DESC[activeProduct.kind] || DESC.vb)[lang];
    if (detailPrice) detailPrice.textContent = fmt(activeProduct.price) + " ";
    if (detailCode)  detailCode.textContent  = activeProduct.kind.toUpperCase() + " // " + activeOrderId;
    if (detailImg)   detailImg.src = activeProduct.img;

    openModal(productModal);
  }

  if (productModal){
    $$("[data-close]", productModal).forEach(el =>
      el.addEventListener("click", () => closeModal(productModal))
    );
  }

  const addCartBtn = $("#addCartBtn");
  if (addCartBtn){
    addCartBtn.addEventListener("click", () => {
      if (!activeProduct) return;
      addToCartById(activeProduct.id);
      closeModal(productModal);
    });
  }

  const buyNowBtn = $("#buyNowBtn");
  if (buyNowBtn){
    buyNowBtn.addEventListener("click", () => {
      if (!activeProduct) return;
      openCheckoutModal();
    });
  }

  /* ==========================================================================
     15. CHECKOUT MODAL
     ========================================================================== */
  const checkoutModal = $("#checkoutModal");
  const coTitle     = $("#coTitle");
  const coSubtotal  = $("#coSubtotal");
  const coTotal     = $("#coTotal");
  const coUser      = $("#coUser");
  const coReference = $("#coReference");
  const coMethod    = $("#coMethod");
  const coAddress   = $("#coAddress");

  function openCheckoutModal(){
    if (!checkoutModal || !activeProduct) return;
    closeModal(productModal);

    if (coTitle) coTitle.textContent = activeProduct.product;
    const priceStr = fmt(activeProduct.price) + " EGP";
    if (coSubtotal) coSubtotal.textContent = priceStr;
    if (coTotal)    coTotal.textContent    = priceStr;

    updatePaymentUI();
    updateCheckoutPreview();

    openModal(checkoutModal);
    setTimeout(() => coUser?.focus(), 220);
  }

  function updatePaymentUI(){
    const pay = PAYMENTS[activePayment];
    if (coMethod)  coMethod.textContent  = pay.label;
    if (coAddress) coAddress.textContent = pay.value;
    $$(".pay-tab").forEach(t => t.classList.toggle("active", t.dataset.pay === activePayment));
  }

  $$(".pay-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      activePayment = tab.dataset.pay;
      updatePaymentUI();
      updateCheckoutPreview();
    });
  });

  function buildTicket(){
    if (!activeProduct || !activeOrderId) return "";
    const user = (coUser?.value.trim()) || "—";
    const price = fmt(activeProduct.price);
    const pay = PAYMENTS[activePayment];

    if (lang === "ar"){
      return [
        `تذكرة GAMENEST 🎟️`,
        ``,
        `رقم التذكرة: ${activeOrderId}`,
        `اسم اللاعب: ${user}`,
        `المنتج: ${activeProduct.product}`,
        `السعر: ${price} جنيه`,
        ``,
        `طريقة الدفع: ${pay.label}`,
        `عنوان التحويل: ${pay.value}`,
        `صاحب الحساب: ${HOLDER}`,
        ``,
        `سأرسل هذه التذكرة + لقطة الدفع إلى ${HANDLE} على إنستجرام أو ديسكورد.`
      ].join("\n");
    }

    return [
      `GAMENEST Ticket 🎟️`,
      ``,
      `Ticket No: ${activeOrderId}`,
      `Fortnite Username: ${user}`,
      `Product: ${activeProduct.product}`,
      `Price: ${price} EGP`,
      ``,
      `Payment Method: ${pay.label}`,
      `Pay to: ${pay.value}`,
      `Account Holder: ${HOLDER}`,
      ``,
      `Sending this ticket + payment screenshot to ${HANDLE}.`
    ].join("\n");
  }

  function updateCheckoutPreview(){
    if (coReference) coReference.textContent = buildTicket();
  }

  if (coUser){
    coUser.addEventListener("input", updateCheckoutPreview);
  }

  if (checkoutModal){
    $$("[data-close-checkout]", checkoutModal).forEach(el =>
      el.addEventListener("click", () => closeModal(checkoutModal))
    );
  }

  /* ==========================================================================
     16. PAY NOW / RECEIPT / TICKET
     ========================================================================== */
  const payNowBtn = $("#payNowBtn");
  if (payNowBtn){
    payNowBtn.addEventListener("click", () => {
      const pay = PAYMENTS[activePayment];
      const user = coUser?.value.trim();

      if (!user){
        toast(lang === "en" ? "Enter your username first" : "أدخل اسمك أولاً");
        coUser?.focus();
        return;
      }

      if (pay.link){
        window.open(pay.link, "_blank", "noopener");
        toast(lang === "en" ? "Complete payment, then download receipt" : "أكمل الدفع، ثم حمّل الإيصال");
      } else {
        copyText(pay.value);
        toast(lang === "en" ? "Telda handle copied" : "تم نسخ عنوان تيلدا");
      }
    });
  }

  const downloadReceipt = $("#downloadReceipt");
  if (downloadReceipt){
    downloadReceipt.addEventListener("click", () => {
      const user = coUser?.value.trim();
      if (!user){
        toast(lang === "en" ? "Enter your username first" : "أدخل اسمك أولاً");
        coUser?.focus();
        return;
      }
      const ticket = buildTicket();
      const blob = new Blob([ticket], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeOrderId || "gamenest-ticket"}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 500);
      toast(lang === "en" ? "Receipt downloaded" : "تم تحميل الإيصال");
    });
  }

  const copyTicketBtn = $("#copyTicket");
  if (copyTicketBtn){
    copyTicketBtn.addEventListener("click", async () => {
      updateCheckoutPreview();
      const text = coReference?.textContent || "";
      const ok = await copyText(text);
      toast(ok
        ? (lang === "en" ? "Ticket copied" : "تم نسخ التذكرة")
        : (lang === "en" ? "Copy failed" : "فشل النسخ"));
    });
  }

  /* ==========================================================================
     17. CART / FAV / SEARCH MODALS
     ========================================================================== */
  const cartModal = $("#cartModal");
  const favModal  = $("#favModal");
  const searchModal = $("#searchModal");

  const cartBtn = $("#cartBtn");
  if (cartBtn && cartModal) cartBtn.addEventListener("click", () => openModal(cartModal));

  const favBtn = $("#favBtn");
  if (favBtn && favModal) favBtn.addEventListener("click", () => openModal(favModal));

  const searchBtn = $("#searchBtn");
  if (searchBtn && searchModal){
    searchBtn.addEventListener("click", () => {
      openModal(searchModal);
      setTimeout(() => $("#searchInput")?.focus(), 220);
    });
  }

  if (cartModal) $$("[data-close-cart]", cartModal).forEach(el => el.addEventListener("click", () => closeModal(cartModal)));
  if (favModal)  $$("[data-close-fav]",  favModal).forEach(el => el.addEventListener("click", () => closeModal(favModal)));
  if (searchModal) $$("[data-close-search]", searchModal).forEach(el => el.addEventListener("click", () => closeModal(searchModal)));

  /* Cart → checkout */
  const cartCheckout = $("#cartCheckout");
  if (cartCheckout){
    cartCheckout.addEventListener("click", () => {
      const cart = getCart();
      if (cart.length === 0){
        toast(lang === "en" ? "Cart is empty" : "السلة فارغة");
        return;
      }
      const first = cart[0];
      activeProduct = {
        id: first.id, product: first.product, price: first.price,
        kind: first.kind, img: first.img
      };
      activeOrderId = makeOrderId();
      closeModal(cartModal);
      openCheckoutModal();
    });
  }

  /* ==========================================================================
     18. SEARCH
     ========================================================================== */
  const searchInput = $("#searchInput");
  const searchResults = $("#searchResults");

  function updateSearchResults(){
    if (!searchResults) return;
    const q = (searchInput?.value || "").trim().toLowerCase();

    if (!q){
      searchResults.innerHTML = `<div class="empty-msg">${lang === "en" ? "Type to search the catalog." : "اكتب للبحث في الكتالوج."}</div>`;
      return;
    }

    const results = PRODUCTS.filter(p =>
      p.product.toLowerCase().includes(q) || p.kind.toLowerCase().includes(q)
    );

    if (results.length === 0){
      searchResults.innerHTML = `<div class="empty-msg">${lang === "en" ? "No matches found." : "لا نتائج."}</div>`;
      return;
    }

    searchResults.innerHTML = results.map(p => `
      <div class="search-result" data-id="${p.id}">
        <img src="${p.img}" alt="" onerror="this.style.display='none'">
        <div>
          <div class="sr-title">${p.product}</div>
          <div class="sr-price">${fmt(p.price)} EGP</div>
        </div>
        <div class="sr-go">${lang === "en" ? "VIEW →" : "← عرض"}</div>
      </div>
    `).join("");

    $$(".search-result", searchResults).forEach(row => {
      row.addEventListener("click", () => {
        const id = row.dataset.id;
        const p = findProduct(id);
        if (!p) return;
        closeModal(searchModal);
        openProductModal({
          dataset: {
            id: p.id, product: p.product, price: p.price,
            kind: p.kind, img: p.img
          }
        });
      });
    });
  }

  if (searchInput){
    searchInput.addEventListener("input", updateSearchResults);
  }

  /* ==========================================================================
     19. PAYMENT GATEWAY BUTTONS
     ========================================================================== */
    $$(".gateway:not(.gateway-compact)").forEach(gate => {
    const btn = $(".gw-btn", gate);
    if (!btn) return;

    btn.addEventListener("click", () => {
      const method = gate.dataset.method;
      const link = gate.dataset.link;
      const value = gate.dataset.value;
      const name = gate.dataset.name;

      if (method === "telda" || !link){
        copyText(value);
        toast(lang === "en" ? "Copied: " + value : "تم النسخ: " + value);
      } else {
        window.open(link, "_blank", "noopener");
        toast(lang === "en" ? "Opening " + name + "..." : "جاري فتح " + name + "...");
      }

      if (!activeProduct){
        activeProduct = { id:"custom", product:"Custom Order", price:0, kind:"vb", img:"vbucks.png" };
        activeOrderId = makeOrderId();
      }
      if (coTitle) coTitle.textContent = activeProduct.product;
      if (coSubtotal) coSubtotal.textContent = fmt(activeProduct.price) + " EGP";
      if (coTotal) coTotal.textContent = fmt(activeProduct.price) + " EGP";

      activePayment = method;
      updatePaymentUI();
      updateCheckoutPreview();
      openCheckoutModal();
    });
  });

  /* ==========================================================================
     20. COUNTDOWN TIMER
     ========================================================================== */
  function startCountdown(){
    const hEl = $("#cdH");
    const mEl = $("#cdM");
    const sEl = $("#cdS");
    if (!hEl || !mEl || !sEl) return;

    const now = new Date();
    const target = new Date(now);
    const day = target.getDay();
    const daysUntilEnd = (7 - day) % 7;
    target.setDate(target.getDate() + daysUntilEnd);
    target.setHours(23, 59, 59, 0);
    if (target.getTime() <= now.getTime()){
      target.setDate(target.getDate() + 7);
    }

    function tick(){
      const diff = target.getTime() - Date.now();
      if (diff <= 0){
        hEl.textContent = "00";
        mEl.textContent = "00";
        sEl.textContent = "00";
        return;
      }
      const totalSec = Math.floor(diff / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;

      hEl.textContent = String(h).padStart(2, "0");
      mEl.textContent = String(m).padStart(2, "0");
      sEl.textContent = String(s).padStart(2, "0");
    }

    tick();
    setInterval(tick, 1000);
  }

  /* ==========================================================================
     21. ESC KEY
     ========================================================================== */
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const openModalEl = $(".modal.open");
    if (openModalEl) closeModal(openModalEl);
  });

  /* ==========================================================================
     22. INIT
     ========================================================================== */
  function init(){
    renderAllProducts();
    updateBadges();
    renderCart();
    renderFavs();
    startCountdown();
    applyLang("en");
  }

  if (document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
