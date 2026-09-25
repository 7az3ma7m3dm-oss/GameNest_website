/* ============================================================
   GAMENEST — script.js
   Cart · Favorites · Search · Checkout · Orders · Reviews
   ============================================================ */

(function () {
  "use strict";

  /* ============================================================
     0. CONFIG
     ============================================================ */
  const CFG = {
    storeName: "GAMENEST",
    currency: "EGP",
    currencySymbol: "EGP",
    orderPrefix: "GN",
    instagramUser: "gamenestshop", // IG username for DM link
    instagramUrl: "https://www.instagram.com/gamenestshop/",
    discordUrl: "https://discord.gg/X3qCVbnW3K",
    /* Weekly drop resets every Friday at 23:59:59 local time */
    weeklyDropDay: 5, // 0=Sun, 5=Fri
    weeklyDropHour: 23,
    weeklyDropMinute: 59,
    /* Discount tiers (by item count) */
    discountTiers: [
      { min: 2, pct: 10, label: "10% OFF" },
      { min: 3, pct: 15, label: "15% OFF" },
      { min: 5, pct: 20, label: "20% OFF" }
    ],
    /* Promo codes */
    promos: {
      GAMENEST10: { pct: 10, label: "10% OFF" },
      DROP15:      { pct: 15, label: "15% OFF" },
      LEVELUP20:   { pct: 20, label: "20% OFF" }
    }
  };

  /* ============================================================
     1. FIREBASE (loaded lazily by index.html module script)
     ============================================================ */
  const firebaseConfig = {
    apiKey: "AIzaSyAHa3wntlgoYqaX3IlNzPzTA5nfxy5WhpM",
    authDomain: "gamenest-reviews.firebaseapp.com",
    projectId: "gamenest-reviews",
    storageBucket: "gamenest-reviews.firebasestorage.app",
    messagingSenderId: "480446593066",
    appId: "1:480446593066:web:97a76d0cf5a1aeb7c7ab53"
  };

  let db = null;

  async function initFirebase() {
    if (db) return db;
    if (window.__gn_db) { db = window.__gn_db; return db; }
    try {
      const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
      const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
      const app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      window.__gn_db = db;
      return db;
    } catch (err) {
      console.warn("Firebase not initialized:", err);
      return null;
    }
  }

  async function fsAdd(collection, data) {
    const database = await initFirebase();
    if (!database) throw new Error("Firebase offline");
    const { collection: c, addDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    return addDoc(c(database, collection), { ...data, createdAt: serverTimestamp() });
  }

  async function fsFindOrder(orderId) {
    const database = await initFirebase();
    if (!database) return null;
    const { collection, query, where, getDocs, limit } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    const q = query(collection(database, "orders"), where("orderId", "==", orderId.trim().toUpperCase()), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data();
  }

  /* ============================================================
     2. PRODUCTS DATA
     ============================================================ */
  /* price: in EGP · v: V-Bucks amount for price-per-1000 calc · stock · delivery */
  const PRODUCTS = [
    /* ---------- V-BUCKS ---------- */
    { id: "vb-800",   kind: "vb",   code: "VB_800",   title: "800 V-Bucks",   desc: "Starter pack — perfect for a skin or emote.",                 price: 199,  v: 800,   img: "vbucks.png", stock: 50, delivery: "5 min",  hot: false },
    { id: "vb-2400",  kind: "vb",   code: "VB_2400",  title: "2,400 V-Bucks", desc: "Most popular — full Battle Pass + extras.",                    price: 479,  v: 2400,  img: "vbucks.png", stock: 40, delivery: "5 min",  hot: true  },
    { id: "vb-4500",  kind: "vb",   code: "VB_4500",  title: "4,500 V-Bucks", desc: "Best mid-tier value for regular players.",                     price: 759,  v: 4500,  img: "vbucks.png", stock: 28, delivery: "10 min", hot: false },
    { id: "vb-12500", kind: "vb",   code: "VB_12500", title: "12,500 V-Bucks",desc: "Mega pack — bundle of legendary skins + Battle Pass.",         price: 1749, v: 12500, img: "vbucks.png", stock: 14, delivery: "15 min", hot: true  },

    /* ---------- FORTNITE CREW ---------- */
    { id: "crew-1",   kind: "crew", code: "CREW_1M",  title: "Crew · 1 Month",  desc: "Monthly V-Bucks + Crew Pack + current Battle Pass.",        price: 210,  v: 1000,  img: "crew.png",   stock: 60, delivery: "10 min", hot: false },
    { id: "crew-2",   kind: "crew", code: "CREW_2M",  title: "Crew · 2 Months", desc: "Two months of Crew benefits at a discount.",                 price: 399,  v: 2000,  img: "crew.png",   stock: 40, delivery: "10 min", hot: false },
    { id: "crew-3",   kind: "crew", code: "CREW_3M",  title: "Crew · 3 Months", desc: "Three months — save more than monthly.",                     price: 569,  v: 3000,  img: "crew.png",   stock: 30, delivery: "10 min", hot: false },
    { id: "crew-6",   kind: "crew", code: "CREW_6M",  title: "Crew · 6 Months", desc: "Half-year bundle — best mid-tier Crew value.",               price: 1049, v: 6000,  img: "crew.png",   stock: 20, delivery: "15 min", hot: true  },
    { id: "crew-12",  kind: "crew", code: "CREW_12M", title: "Crew · 12 Months",desc: "Full year — biggest Crew discount we offer.",                price: 1959, v: 12000, img: "crew.png",   stock: 12, delivery: "20 min", hot: true  },

    /* ---------- FORTNITE GIFTS ---------- */
    { id: "gift-500",  kind: "gift", code: "GIFT_500",  title: "Gift · 500 V-Bucks",  desc: "Send 500 V-Bucks to any Fortnite friend.",              price: 95,  v: 500,  img: "gift.png", stock: 80, delivery: "5 min",  hot: false },
    { id: "gift-2000", kind: "gift", code: "GIFT_2000", title: "Gift · 2,000 V-Bucks",desc: "Send 2,000 V-Bucks — good for a legendary skin.",       price: 375, v: 2000, img: "gift.png", stock: 50, delivery: "5 min",  hot: true  },
    { id: "gift-skin", kind: "gift", code: "GIFT_SKIN", title: "Item Shop Skin",      desc: "Any Item Shop skin gifted directly to your friend.",     price: 420, v: 0,    img: "gift.png", stock: 25, delivery: "15 min", hot: false }
  ];

  /* ============================================================
     3. HELPERS
     ============================================================ */
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function priceOf(p) { return Number(p.price) || 0; }
  function fmt(n) { return Number(n || 0).toLocaleString("en-US"); }
  function fmtPrice(n) { return fmt(n) + " " + CFG.currencySymbol; }
  function fmtPer1k(p) {
    if (!p.v || !p.price) return "";
    const per1k = (p.price / p.v) * 1000;
    return fmt(per1k.toFixed(0)) + " " + CFG.currencySymbol + " / 1K";
  }
  function uid(len = 5) {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }
  function genOrderId() {
    return CFG.orderPrefix + "-" + uid(5) + "-" + uid(5);
  }
  function getProductById(id) { return PRODUCTS.find(p => p.id === id) || null; }

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function stockBadge(stock) {
    if (stock == null) return "";
    if (stock <= 0)  return '<span class="pbadge stock-out">Out of stock</span>';
    if (stock <= 15) return '<span class="pbadge stock-low">Low · ' + stock + ' left</span>';
    return '<span class="pbadge stock-ok">In stock</span>';
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      return false;
    }
  }

  /* ============================================================
     4. TOAST
     ============================================================ */
  const toastEl = $("#toast");
  let toastTimer = null;
  function toast(msg, ms = 2600) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), ms);
  }

  /* ============================================================
     5. STORAGE (cart + favorites)
     ============================================================ */
  const LS = {
    cart: "gn_cart_v1",
    fav:  "gn_fav_v1",
    lastOrder: "gn_last_order_v1"
  };

  const state = {
    cart: loadLS(LS.cart, []),      // [{ id, qty }]
    fav:  loadLS(LS.fav, []),       // [id]
    activeProduct: null,
    activePayment: "vodafone",
    activeOrderId: null,
    promo: null,                    // { code, pct, label }
    proofFile: null
  };

  function loadLS(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  }
  function saveLS(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }
  function saveCart() { saveLS(LS.cart, state.cart); }
  function saveFav()  { saveLS(LS.fav, state.fav); }

  /* ============================================================
     6. PAYMENT METHODS
     ============================================================ */
  const PAYMENTS = {
    vodafone: {
      label: "VODAFONE CASH",
      address: "0104 264 1080",
      name: "ADAM MOHAMED OMAR",
      link: "http://vf.eg/vfcash?id=mt&qrId=wgmEpY"
    },
    instapay: {
      label: "INSTAPAY",
      address: "0115 893 4284",
      name: "ADAM MOHAMED OMAR",
      link: "https://ipn.eg/S/iadqm/instapay/9n2XjE"
    },
    telda: {
      label: "TELDA",
      address: "@itzadam",
      name: "ADAM MOHAMED OMAR",
      link: ""
    }
  };

  /* ============================================================
     7. RENDER PRODUCTS
     ============================================================ */
  function buildCardHTML(p) {
    const faved = state.fav.includes(p.id) ? "active" : "";
    const per1k = fmtPer1k(p);
    return `
      <article class="pcard-prod" data-id="${p.id}">
        <button class="fav-toggle ${faved}" data-fav="${p.id}" type="button" aria-label="Favorite">♥</button>
        <div class="prod-code">// ${escapeHtml(p.code)}</div>
        <img class="prod-img" src="${escapeHtml(p.img)}" alt="" onerror="this.style.display='none'">
        <h3 class="prod-title">${escapeHtml(p.title)}</h3>
        <p class="prod-desc">${escapeHtml(p.desc)}</p>
        <div class="prod-badges">
          ${p.hot ? '<span class="pbadge hot">HOT</span>' : ''}
          ${stockBadge(p.stock)}
        </div>
        <div class="prod-meta">
          <span><span>Delivery</span><b>${escapeHtml(p.delivery || "Instant")}</b></span>
          ${per1k ? `<span><span>Per 1K</span><b>${per1k}</b></span>` : ''}
        </div>
        <div class="prod-price-row">
          <div class="prod-price">${fmtPrice(p.price)}</div>
        </div>
        <div class="prod-actions">
          <button class="btn" data-buy="${p.id}" type="button">Buy Now</button>
          <button class="btn ghost" data-cart="${p.id}" type="button">Add</button>
        </div>
      </article>
    `;
  }

  function sortByPrice(a, b) { return priceOf(a) - priceOf(b); }

  function renderAllProducts() {
    const vb = $("#gridVB");
    const cr = $("#gridCrew");
    const gf = $("#gridGift");
    const best = $("#gridBest");
    const deals = $("#gridDeals");
    const bundles = $("#gridBundles");

    if (vb) vb.innerHTML = PRODUCTS.filter(p => p.kind === "vb").sort(sortByPrice).map(buildCardHTML).join("");
    if (cr) cr.innerHTML = PRODUCTS.filter(p => p.kind === "crew").sort(sortByPrice).map(buildCardHTML).join("");
    if (gf) gf.innerHTML = PRODUCTS.filter(p => p.kind === "gift").sort(sortByPrice).map(buildCardHTML).join("");

    /* Best sellers — hot items, then by price */
    if (best) {
      const bestList = PRODUCTS.filter(p => p.hot).sort(sortByPrice);
      best.innerHTML = bestList.map(buildCardHTML).join("");
    }

    /* Deals — non-hot items with stock >= 20 */
    if (deals && deals.innerHTML.trim() === "") {
      const dealList = PRODUCTS.filter(p => !p.hot && p.stock >= 20).sort(sortByPrice);
      if (dealList.length) {
        const sec = document.getElementById("deals-section");
        if (sec) sec.style.display = "";
        deals.innerHTML = dealList.map(buildCardHTML).join("");
      }
    }

    /* Bundles — crew multi-month + big V-Bucks */
    if (bundles && bundles.innerHTML.trim() === "") {
      const bundleList = PRODUCTS.filter(p => (p.kind === "crew" && /6|12/.test(p.title)) || p.id === "vb-12500").sort(sortByPrice);
      if (bundleList.length) {
        const sec = document.getElementById("bundles-section");
        if (sec) sec.style.display = "";
        bundles.innerHTML = bundleList.map(buildCardHTML).join("");
      }
    }

    bindCardEvents();
    updateCartBadge();
    updateFavBadge();
  }

  function bindCardEvents() {
    $$("[data-buy]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const p = getProductById(btn.dataset.buy);
        if (p) openProductModal(p);
      });
    });
    $$("[data-cart]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        addToCart(btn.dataset.cart);
      });
    });
    $$("[data-fav]").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        toggleFav(btn.dataset.fav);
      });
    });
    $$(".pcard-prod").forEach(card => {
      card.addEventListener("click", () => {
        const p = getProductById(card.dataset.id);
        if (p) openProductModal(p);
      });
    });
  }

  /* ============================================================
     8. CART
     ============================================================ */
  function addToCart(id, qty = 1) {
    const p = getProductById(id);
    if (!p) return;
    if (p.stock <= 0) { toast("Out of stock"); return; }
    const item = state.cart.find(i => i.id === id);
    if (item) item.qty += qty;
    else state.cart.push({ id, qty });
    saveCart();
    updateCartBadge();
    renderCartModal();
    toast("Added to cart");
  }

  function removeFromCart(id) {
    state.cart = state.cart.filter(i => i.id !== id);
    saveCart();
    updateCartBadge();
    renderCartModal();
    updateCheckoutSummary();
  }

  function setCartQty(id, qty) {
    qty = Math.max(1, Math.min(99, qty));
    const item = state.cart.find(i => i.id === id);
    if (!item) return;
    item.qty = qty;
    saveCart();
    renderCartModal();
    updateCheckoutSummary();
  }

  function cartCount() {
    return state.cart.reduce((sum, i) => sum + i.qty, 0);
  }

  function cartSubtotal() {
    return state.cart.reduce((sum, i) => {
      const p = getProductById(i.id);
      return sum + (p ? priceOf(p) * i.qty : 0);
    }, 0);
  }

  function updateCartBadge() {
    const badge = $("#cartCount");
    if (!badge) return;
    const n = cartCount();
    badge.textContent = n;
    badge.hidden = n === 0;
  }

  /* ============================================================
     9. FAVORITES
     ============================================================ */
  function toggleFav(id) {
    const idx = state.fav.indexOf(id);
    if (idx >= 0) state.fav.splice(idx, 1);
    else state.fav.push(id);
    saveFav();
    updateFavBadge();
    renderAllProducts();
    renderFavModal();
    toast(state.fav.includes(id) ? "Added to favorites" : "Removed from favorites");
  }

  function updateFavBadge() {
    const badge = $("#favCount");
    if (!badge) return;
    const n = state.fav.length;
    badge.textContent = n;
    badge.hidden = n === 0;
  }

  function renderFavModal() {
    const wrap = $("#favItems");
    if (!wrap) return;
    if (!state.fav.length) {
      wrap.innerHTML = '<div class="review-empty">No favorites yet.</div>';
      return;
    }
    wrap.innerHTML = state.fav.map(id => {
      const p = getProductById(id);
      if (!p) return "";
      return `
        <div class="cart-item">
          <div class="ci-info">
            <div class="ci-title">${escapeHtml(p.title)}</div>
            <div class="ci-desc">${escapeHtml(p.desc)}</div>
          </div>
          <div style="text-align:right">
            <div class="ci-price">${fmtPrice(p.price)}</div>
            <div class="ci-remove" data-unfav="${p.id}">✕ Remove</div>
          </div>
        </div>
      `;
    }).join("");
    $$("[data-unfav]").forEach(el => {
      el.addEventListener("click", () => toggleFav(el.dataset.unfav));
    });
  }

  /* ============================================================
     10. CART MODAL
     ============================================================ */
  function renderCartModal() {
    const wrap = $("#cartItems");
    const totalEl = $("#cartTotal");
    if (!wrap) return;

    if (!state.cart.length) {
      wrap.innerHTML = '<div class="review-empty">Your cart is empty.</div>';
      if (totalEl) totalEl.textContent = fmtPrice(0);
      return;
    }

    wrap.innerHTML = state.cart.map(item => {
      const p = getProductById(item.id);
      if (!p) return "";
      return `
        <div class="cart-item">
          <div class="ci-info">
            <div class="ci-title">${escapeHtml(p.title)} × ${item.qty}</div>
            <div class="ci-desc">${escapeHtml(p.desc)}</div>
            <div class="ci-remove" data-remove="${p.id}">✕ Remove</div>
          </div>
          <div style="text-align:right">
            <div class="ci-price">${fmtPrice(priceOf(p) * item.qty)}</div>
          </div>
        </div>
      `;
    }).join("");

    if (totalEl) totalEl.textContent = fmtPrice(cartSubtotal());

    $$("[data-remove]").forEach(el => {
      el.addEventListener("click", () => removeFromCart(el.dataset.remove));
    });
  }

  /* ============================================================
     11. MODAL OPEN/CLOSE
     ============================================================ */
  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    if (!document.querySelector(".modal.open")) {
      document.body.style.overflow = "";
    }
  }

  function closeAllModals() {
    $$(".modal.open").forEach(m => {
      m.classList.remove("open");
      m.setAttribute("aria-hidden", "true");
    });
    document.body.style.overflow = "";
  }

  /* ============================================================
     12. PRODUCT DETAIL MODAL
     ============================================================ */
  function openProductModal(p) {
    state.activeProduct = p;

    const img = $("#detailImg");
    const code = $("#detailCode");
    const title = $("#detailTitle");
    const desc = $("#detailDesc");
    const price = $("#detailPrice");
    const delivery = $("#detailDelivery");
    const stock = $("#detailStock");

    if (img) { img.src = p.img; img.style.display = ""; }
    if (code) code.textContent = p.code;
    if (title) title.textContent = p.title;
    if (desc) desc.textContent = p.desc;
    if (price) price.textContent = fmtPrice(p.price);
    if (delivery) delivery.textContent = p.delivery || "Instant";
    if (stock) {
      stock.textContent = p.stock > 0
        ? (p.stock <= 15 ? `${p.stock} left` : "Available")
        : "Out of stock";
    }

    /* Related — same kind, different id */
    const relatedWrap = $("#relatedWrap");
    const relatedGrid = $("#relatedGrid");
    if (relatedWrap && relatedGrid) {
      const related = PRODUCTS.filter(x => x.kind === p.kind && x.id !== p.id).slice(0, 4);
      if (related.length) {
        relatedWrap.style.display = "";
        relatedGrid.innerHTML = related.map(buildCardHTML).join("");
        bindCardEvents();
      } else {
        relatedWrap.style.display = "none";
      }
    }

    openModal("productModal");
  }

  /* ============================================================
     13. CHECKOUT MODAL
     ============================================================ */
  function openCheckout() {
    if (!state.cart.length && !state.activeProduct) {
      toast("Add an item first");
      return;
    }
    if (!state.cart.length && state.activeProduct) {
      addToCart(state.activeProduct.id);
    }
    updateCheckoutSummary();
    updatePaymentUI();
    openModal("checkoutModal");
  }

  function updateCheckoutSummary() {
    const sub = cartSubtotal();
    const subEl = $("#coSubtotal");
    const totEl = $("#coTotal");
    const titleEl = $("#coTitle");
    const count = cartCount();

    if (subEl) subEl.textContent = fmtPrice(sub);

    /* Discount tier */
    let pct = 0;
    let label = "";
    for (const tier of CFG.discountTiers) {
      if (count >= tier.min) { pct = tier.pct; label = tier.label; }
    }
    if (state.promo) { pct = state.promo.pct; label = state.promo.label; }

    const discEl = $("#discountPct");
    const fillEl = $("#discountFill");
    const msgEl = $("#discountMsg");
    if (discEl) discEl.textContent = pct + "%";
    if (fillEl) fillEl.style.width = Math.min(100, (pct / 20) * 100) + "%";
    if (msgEl) {
      if (pct > 0) msgEl.textContent = label + " applied";
      else {
        const next = CFG.discountTiers.find(t => count < t.min);
        msgEl.textContent = next
          ? `Add ${next.min - count} more item(s) to unlock ${next.pct}% off`
          : "Add items to unlock discounts";
      }
    }

    const total = sub - (sub * pct / 100);
    if (totEl) totEl.textContent = fmtPrice(total);

    const refEl = $("#coReference");
    if (refEl && !refEl.dataset.filled) {
      const ref = CFG.orderPrefix + "-REF-" + uid(6);
      refEl.textContent = ref;
      refEl.dataset.filled = "1";
    }
  }

  function updatePaymentUI() {
    const pay = PAYMENTS[state.activePayment];
    const method = $("#coMethod");
    const addr = $("#coAddress");
    if (method) method.textContent = pay.label;
    if (addr) addr.textContent = pay.address;

    $$(".pay-tab").forEach(tab => {
      tab.classList.toggle("active", tab.dataset.pay === state.activePayment);
    });
  }

  /* ============================================================
     14. FORM VALIDATION
     ============================================================ */
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validatePhone(raw, country) {
    const digits = (raw || "").replace(/\D/g, "");
    const opt = document.querySelector(`#coCountry option[value="${country}"]`);
    if (!opt) return digits.length >= 6;
    const len = parseInt(opt.dataset.len, 10) || 10;
    return digits.length === len;
  }

  /* ============================================================
     15. SUBMIT ORDER
     ============================================================ */
  async function submitOrder() {
    const userEl = $("#coUser");
    const emailEl = $("#coEmail");
    const phoneEl = $("#coPhone");
    const countryEl = $("#coCountry");
    const errEmail = $("#emailError");
    const errPhone = $("#phoneError");

    const name = (userEl?.value || "").trim();
    const email = (emailEl?.value || "").trim().toLowerCase();
    const phoneRaw = (phoneEl?.value || "").trim();
    const country = countryEl?.value || "+20";

    if (errEmail) { errEmail.hidden = true; errEmail.textContent = ""; }
    if (errPhone) { errPhone.hidden = true; errPhone.textContent = ""; }

    if (!name) { toast("Enter your name"); userEl?.focus(); return; }
    if (!validateEmail(email)) {
      if (errEmail) { errEmail.textContent = "Invalid email"; errEmail.hidden = false; }
      emailEl?.focus();
      return;
    }
    if (!validatePhone(phoneRaw, country)) {
      if (errPhone) { errPhone.textContent = "Invalid phone number for selected country"; errPhone.hidden = false; }
      phoneEl?.focus();
      return;
    }

    const btn = $("#submitOrder");
    if (btn) { btn.disabled = true; btn.textContent = "SUBMITTING..."; }

    try {
      const orderId = genOrderId();
      const sub = cartSubtotal();
      const count = cartCount();
      let pct = 0;
      for (const tier of CFG.discountTiers) if (count >= tier.min) pct = tier.pct;
      if (state.promo) pct = state.promo.pct;
      const total = sub - (sub * pct / 100);

      const items = state.cart.map(i => {
        const p = getProductById(i.id);
        return { id: i.id, title: p?.title || "", qty: i.qty, price: priceOf(p) };
      });

      const productStr = items.map(i => `${i.title} × ${i.qty}`).join(", ");
      const reference = $("#coReference")?.textContent || "";

      const orderData = {
        orderId,
        name,
        email,
        phone: country + phoneRaw.replace(/\D/g, ""),
        items,
        product: productStr,
        price: total,
        subtotal: sub,
        discountPct: pct,
        promo: state.promo?.code || "",
        payment: state.activePayment,
        paymentLabel: PAYMENTS[state.activePayment].label,
        reference,
        status: "pending",
        hasProof: !!state.proofFile
      };

      await fsAdd("orders", orderData);
      try { localStorage.setItem(LS.lastOrder, JSON.stringify(orderData)); } catch {}

      state.activeOrderId = orderId;

      /* Success modal */
      const codeEl = $("#successOrderCode");
      const gwEl = $("#successGateway");
      const plEl = $("#successPlayer");
      if (codeEl) codeEl.textContent = orderId;
      if (gwEl) gwEl.textContent = PAYMENTS[state.activePayment].label;
      if (plEl) plEl.textContent = name;

      closeModal("checkoutModal");
      openModal("successModal");

      /* Reset cart after successful submit */
      state.cart = [];
      saveCart();
      updateCartBadge();
      renderCartModal();
    } catch (err) {
      console.error("Order submit failed:", err);
      toast("Could not submit — check your connection");
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = "SUBMIT_ORDER"; }
    }
  }

  /* ============================================================
     16. SEARCH
     ============================================================ */
  function runSearch(q) {
    const out = $("#searchResults");
    if (!out) return;
    const query = (q || "").trim().toLowerCase();
    if (!query) {
      out.innerHTML = '<div class="review-empty">Start typing to search products…</div>';
      return;
    }
    const results = PRODUCTS.filter(p =>
      p.title.toLowerCase().includes(query) ||
      p.desc.toLowerCase().includes(query) ||
      p.code.toLowerCase().includes(query)
    );
    if (!results.length) {
      out.innerHTML = '<div class="review-empty">No products match.</div>';
      return;
    }
    out.innerHTML = results.sort(sortByPrice).map(p => `
      <div class="search-result" data-search-open="${p.id}">
        <div>
          <div class="sr-title">${escapeHtml(p.title)}</div>
          <div class="sr-desc">${escapeHtml(p.desc)}</div>
        </div>
        <div class="sr-price">${fmtPrice(p.price)}</div>
      </div>
    `).join("");
    $$("[data-search-open]").forEach(el => {
      el.addEventListener("click", () => {
        const p = getProductById(el.dataset.searchOpen);
        if (p) { closeModal("searchModal"); openProductModal(p); }
      });
    });
  }

  /* ============================================================
     17. COUNTDOWN (Weekly Drop)
     ============================================================ */
  function nextDropEnd() {
    const now = new Date();
    const end = new Date(now);
    end.setHours(CFG.weeklyDropHour, CFG.weeklyDropMinute, 59, 999);
    let diff = CFG.weeklyDropDay - now.getDay();
    if (diff < 0) diff += 7;
    end.setDate(end.getDate() + diff);
    if (end.getTime() <= now.getTime()) end.setDate(end.getDate() + 7);
    return end;
  }

  function startCountdown() {
    const hEl = $("#cdH");
    const mEl = $("#cdM");
    const sEl = $("#cdS");
    if (!hEl || !mEl || !sEl) return;

    function tick() {
      const end = nextDropEnd();
      const diff = Math.max(0, end.getTime() - Date.now());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      hEl.textContent = String(h).padStart(2, "0");
      mEl.textContent = String(m).padStart(2, "0");
      sEl.textContent = String(s).padStart(2, "0");
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ============================================================
     18. ORDER TRACKING
     ============================================================ */
  async function trackOrder() {
    const input = $("#trackInput");
    const out = $("#trackResult");
    if (!input || !out) return;
    const id = input.value.trim().toUpperCase();
    if (!id) { toast("Enter your order code"); return; }

    out.innerHTML = '<div style="color:#8a8a8a;font-family:var(--mono);font-size:12px;text-align:center">Looking up…</div>';
    try {
      const order = await fsFindOrder(id);
      if (!order) {
        out.innerHTML = '<div class="review-empty">No order found for that code.</div>';
        return;
      }
      const d = order.createdAt?.toDate?.();
      const dateStr = d ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
      out.innerHTML = `
        <div style="background:#111;border:1px solid #1f1f1f;padding:22px;font-family:var(--mono);font-size:12.5px">
          <div style="display:flex;justify-content:space-between;padding-bottom:9px;border-bottom:1px dashed #1f1f1f"><span style="color:#4a4a4a;text-transform:uppercase">Order</span><b>${escapeHtml(order.orderId)}</b></div>
          <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px dashed #1f1f1f"><span style="color:#4a4a4a;text-transform:uppercase">Date</span><b>${dateStr}</b></div>
          <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px dashed #1f1f1f"><span style="color:#4a4a4a;text-transform:uppercase">Product</span><b>${escapeHtml(order.product || "—")}</b></div>
          <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px dashed #1f1f1f"><span style="color:#4a4a4a;text-transform:uppercase">Price</span><b>${fmtPrice(order.price)}</b></div>
          <div style="display:flex;justify-content:space-between;padding-top:9px"><span style="color:#4a4a4a;text-transform:uppercase">Status</span><span class="badge ${escapeHtml(order.status || "pending")}">${escapeHtml(order.status || "pending")}</span></div>
        </div>
      `;
    } catch (e) {
      console.error(e);
      out.innerHTML = '<div class="review-empty">Could not load order. Try again later.</div>';
    }
  }

  /* ============================================================
     19. SUPPORT TICKET
     ============================================================ */
  async function submitTicket() {
    const nameEl = $("#ticketName");
    const emailEl = $("#ticketEmail");
    const orderEl = $("#ticketOrder");
    const msgEl = $("#ticketMsg");
    const noteEl = $("#ticketNote");
    const btn = $("#submitTicket");

    const name = (nameEl?.value || "").trim();
    const email = (emailEl?.value || "").trim().toLowerCase();
    const orderId = (orderEl?.value || "").trim().toUpperCase();
    const message = (msgEl?.value || "").trim();

    if (!name || !validateEmail(email) || !message) {
      if (noteEl) noteEl.textContent = "Fill name, valid email and message";
      return;
    }

    if (btn) { btn.disabled = true; btn.textContent = "SENDING..."; }
    if (noteEl) noteEl.textContent = "Sending…";

    try {
      await fsAdd("tickets", { name, email, orderId, message, status: "open" });
      if (noteEl) noteEl.textContent = "✓ Ticket sent — we'll reply within 24h";
      if (nameEl) nameEl.value = "";
      if (emailEl) emailEl.value = "";
      if (orderEl) orderEl.value = "";
      if (msgEl) msgEl.value = "";
    } catch (err) {
      console.error(err);
      if (noteEl) noteEl.textContent = "Could not send — try again";
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = "SUBMIT_TICKET"; }
    }
  }

  /* ============================================================
     20. INSTAGRAM SEND HANDLER
     ============================================================ */
  async function sendToInstagram() {
    const code = state.activeOrderId || "";
    if (!code) { toast("No order yet"); return; }

    const lastOrder = (() => {
      try { return JSON.parse(localStorage.getItem(LS.lastOrder) || "null"); }
      catch { return null; }
    })();

    const msg = [
      "Hi GAMENEST! I just placed an order:",
      "",
      "Order: " + code,
      "Product: " + (lastOrder?.product || "—"),
      "Name: " + (lastOrder?.name || "—"),
      "Email: " + (lastOrder?.email || "—"),
      "Phone: " + (lastOrder?.phone || "—"),
      "Payment: " + (lastOrder?.paymentLabel || PAYMENTS[state.activePayment].label),
      "Total: " + fmtPrice(lastOrder?.price || cartSubtotal()),
      "",
      "Attaching payment screenshot now."
    ].join("\n");

    const ok = await copyText(msg);
    toast(ok ? "✓ Copied — paste in Instagram DM" : "Copy manually");

    setTimeout(() => {
      window.open("https://ig.me/m/" + CFG.instagramUser, "_blank", "noopener");
    }, 350);
  }

  /* ============================================================
     21. BIND EVENTS
     ============================================================ */
  function bindGlobalEvents() {
    /* Mobile menu */
    const menuBtn = $("#menuBtn");
    const navLinks = $("#navLinks");
    if (menuBtn && navLinks) {
      menuBtn.addEventListener("click", () => navLinks.classList.toggle("open"));
    }

    /* Nav icons */
    $("#searchBtn")?.addEventListener("click", () => {
      openModal("searchModal");
      setTimeout(() => $("#searchInput")?.focus(), 100);
      runSearch("");
    });
    $("#favBtn")?.addEventListener("click", () => {
      renderFavModal();
      openModal("favModal");
    });
    $("#cartBtn")?.addEventListener("click", () => {
      renderCartModal();
      openModal("cartModal");
    });

    /* Modal close buttons */
    $$("[data-close]").forEach(el => el.addEventListener("click", () => closeModal("productModal")));
    $$("[data-close-checkout]").forEach(el => el.addEventListener("click", () => closeModal("checkoutModal")));
    $$("[data-close-cart]").forEach(el => el.addEventListener("click", () => closeModal("cartModal")));
    $$("[data-close-fav]").forEach(el => el.addEventListener("click", () => closeModal("favModal")));
    $$("[data-close-search]").forEach(el => el.addEventListener("click", () => closeModal("searchModal")));

    /* ESC closes any modal */
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") closeAllModals();
    });

    /* Product modal actions */
    $("#buyNowBtn")?.addEventListener("click", () => {
      if (state.activeProduct) {
        closeModal("productModal");
        state.cart = [{ id: state.activeProduct.id, qty: 1 }];
        saveCart();
        updateCartBadge();
        openCheckout();
      }
    });
    $("#addCartBtn")?.addEventListener("click", () => {
      if (state.activeProduct) {
        addToCart(state.activeProduct.id);
        closeModal("productModal");
      }
    });

    /* Cart modal → checkout */
    $("#cartCheckout")?.addEventListener("click", () => {
      closeModal("cartModal");
      openCheckout();
    });

    /* Payment tab switch */
    $$(".pay-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        state.activePayment = tab.dataset.pay;
        updatePaymentUI();
      });
    });

    /* Pay now button */
    $("#payNowBtn")?.addEventListener("click", () => {
      const pay = PAYMENTS[state.activePayment];
      if (pay.link) window.open(pay.link, "_blank", "noopener");
      else {
        copyText(pay.address);
        toast("Address copied: " + pay.address);
      }
    });

    /* Payment gateway buttons on home page */
    $$(".gateway .gw-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const gateway = btn.closest(".gateway");
        const link = gateway?.dataset.link;
        const val = gateway?.dataset.value;
        if (link) window.open(link, "_blank", "noopener");
        else if (val) {
          copyText(val);
          toast("Copied: " + val);
        }
      });
    });

    /* Promo apply */
    $("#promoApplyBtn")?.addEventListener("click", () => {
      const input = $("#promoInput");
      const code = (input?.value || "").trim().toUpperCase();
      if (!code) { toast("Enter a code"); return; }
      const promo = CFG.promos[code];
      if (!promo) { toast("Invalid promo code"); return; }
      state.promo = { code, ...promo };
      updateCheckoutSummary();
      toast("✓ " + promo.label + " applied");
    });

    /* Country select → phone placeholder */
    $("#coCountry")?.addEventListener("change", e => {
      const opt = e.target.selectedOptions[0];
      const ph = $("#coPhone");
      if (ph && opt?.dataset.example) ph.placeholder = "e.g. " + opt.dataset.example;
    });

    /* Proof upload */
    const uploadBox = $("#uploadBox");
    const uploadInput = $("#proofUpload");
    const proofPreview = $("#proofPreview");
    const proofRemove = $("#proofRemove");
    const uploadLabel = $("#uploadLabel");

    uploadBox?.addEventListener("click", () => uploadInput?.click());
    uploadBox?.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") uploadInput?.click();
    });
    uploadInput?.addEventListener("change", () => {
      const file = uploadInput.files?.[0];
      if (!file) return;
      if (file.size > 6 * 1024 * 1024) { toast("File too large (max 6MB)"); return; }
      state.proofFile = file;
      if (uploadLabel) uploadLabel.textContent = "[ " + file.name.slice(0, 40) + " ]";
      const reader = new FileReader();
      reader.onload = () => {
        if (proofPreview) {
          proofPreview.src = reader.result;
          proofPreview.hidden = false;
        }
        if (proofRemove) proofRemove.hidden = false;
      };
      reader.readAsDataURL(file);
    });
    proofRemove?.addEventListener("click", e => {
      e.stopPropagation();
      state.proofFile = null;
      if (uploadInput) uploadInput.value = "";
      if (proofPreview) { proofPreview.src = ""; proofPreview.hidden = true; }
      if (proofRemove) proofRemove.hidden = true;
      if (uploadLabel) uploadLabel.textContent = "[ UPLOAD_PAYMENT_RECEIPT ]";
    });

    /* Submit order */
    $("#submitOrder")?.addEventListener("click", submitOrder);

    /* Copy ticket */
    $("#copyTicket")?.addEventListener("click", async () => {
      const lastOrder = (() => {
        try { return JSON.parse(localStorage.getItem(LS.lastOrder) || "null"); }
        catch { return null; }
      })();
      const ticket = [
        "GAMENEST ORDER TICKET",
        "Order: " + (state.activeOrderId || "—"),
        "Product: " + (lastOrder?.product || "—"),
        "Name: " + (lastOrder?.name || "—"),
        "Email: " + (lastOrder?.email || "—"),
        "Total: " + fmtPrice(lastOrder?.price || 0)
      ].join("\n");
      const ok = await copyText(ticket);
      toast(ok ? "Ticket copied" : "Copy failed");
    });

    /* Success modal buttons */
    $("#sendToInsta")?.addEventListener("click", sendToInstagram);
    $("#terminateLink")?.addEventListener("click", () => {
      closeModal("successModal");
      toast("Order submitted — thanks!");
    });

    /* Track */
    $("#trackBtn")?.addEventListener("click", trackOrder);
    $("#trackInput")?.addEventListener("keypress", e => {
      if (e.key === "Enter") trackOrder();
    });

    /* Support ticket */
    $("#submitTicket")?.addEventListener("click", submitTicket);

    /* Search */
    const searchInput = $("#searchInput");
    if (searchInput) {
      let debounce;
      searchInput.addEventListener("input", e => {
        clearTimeout(debounce);
        debounce = setTimeout(() => runSearch(e.target.value), 120);
      });
    }
  }

  /* ============================================================
     22. BOOT
     ============================================================ */
  function boot() {
    renderAllProducts();
    renderCartModal();
    renderFavModal();
    bindGlobalEvents();
    startCountdown();
    updateCheckoutSummary();
    updatePaymentUI();
    initFirebase().catch(() => {});

    /* Default search state */
    runSearch("");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  /* Expose for debugging */
  window.GN = {
    state,
    PRODUCTS,
    PAYMENTS,
    addToCart,
    removeFromCart,
    openProductModal,
    openCheckout,
    toast,
    copyText
  };
})();
