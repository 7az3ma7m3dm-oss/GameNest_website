(() => {
  "use strict";

  const PRODUCTS = [
    { id:"vb-800",   kind:"vb",   img:"vbucks.png", product:"800 V-Bucks",               price:199  },
    { id:"vb-2400",  kind:"vb",   img:"vbucks.png", product:"2400 V-Bucks",              price:479  },
    { id:"vb-4500",  kind:"vb",   img:"vbucks.png", product:"4500 V-Bucks",              price:759  },
    { id:"vb-12500", kind:"vb",   img:"vbucks.png", product:"12500 V-Bucks",             price:1749 },
    { id:"cr-1",     kind:"crew", img:"crew.png",   product:"Fortnite Crew - 1 Month",   price:210  },
    { id:"cr-2",     kind:"crew", img:"crew.png",   product:"Fortnite Crew - 2 Months",  price:379  },
    { id:"cr-3",     kind:"crew", img:"crew.png",   product:"Fortnite Crew - 3 Months",  price:559  },
    { id:"cr-6",     kind:"crew", img:"crew.png",   product:"Fortnite Crew - 6 Months",  price:1049 },
    { id:"cr-12",    kind:"crew", img:"crew.png",   product:"Fortnite Crew - 12 Months", price:1959 },
    { id:"gf-500",   kind:"gift", img:"gift.png",   product:"500 V-Bucks Gift",           price:95   },
    { id:"gf-800",   kind:"gift", img:"gift.png",   product:"800 V-Bucks Gift",           price:150  },
    { id:"gf-1200",  kind:"gift", img:"gift.png",   product:"1200 V-Bucks Gift",          price:225  },
    { id:"gf-1500",  kind:"gift", img:"gift.png",   product:"1500 V-Bucks Gift",          price:280  },
    { id:"gf-1800",  kind:"gift", img:"gift.png",   product:"1800 V-Bucks Gift",          price:330  },
    { id:"gf-2000",  kind:"gift", img:"gift.png",   product:"2000 V-Bucks Gift",          price:375  }
  ];

  const DESC = {
    vb:   { en:"Top up your Fortnite wallet with pure V-Bucks. Delivered straight to your Epic Games account in minutes." },
    crew: { en:"Fortnite Crew subscription - monthly V-Bucks, a Crew Pack, and the current Battle Pass included." },
    gift: { en:"Send a gift directly to any Fortnite friend's account. Perfect for birthdays and surprises." }
  };

  const PAYMENTS = {
    vodafone: { label:"VODAFONE CASH", value:"0104 264 1080", link:"http://vf.eg/vfcash?id=mt&qrId=wgmEpY" },
    instapay: { label:"INSTAPAY",      value:"0115 893 4284", link:"https://ipn.eg/S/iadqm/instapay/9n2XjE" },
    telda:    { label:"TELDA",         value:"@itzadam",       link:"" }
  };

  const HOLDER = "Adam Mohamed Omar";
  const HANDLE = "@GamenestGifts";

  let activeProduct = null;
  let activePayment = "vodafone";
  let activeOrderId = null;
  let toastTimer = null;
  let proofFile = null;

  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const fmt = (n) => Number(n).toLocaleString("en-US");

  const Storage = {
    get(k, f){ try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : f; } catch { return f; } },
    set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };
  const getCart = () => Storage.get("gn_cart", []);
  const setCart = (c) => { Storage.set("gn_cart", c); updateBadges(); renderCart(); };
  const getFavs = () => Storage.get("gn_favs", []);
  const setFavs = (f) => { Storage.set("gn_favs", f); updateBadges(); renderFavs(); };

  function makeOrderId(){
    const n = new Date();
    const s = n.getFullYear().toString().slice(-2) +
      String(n.getMonth()+1).padStart(2,"0") +
      String(n.getDate()).padStart(2,"0");
    return "GN-" + s + "-" + Math.random().toString(36).slice(2,7).toUpperCase();
  }

  async function copyText(text){
    try { await navigator.clipboard.writeText(text); return true; }
    catch {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch {}
      document.body.removeChild(ta);
      return ok;
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

  function buildCardHTML(p){
    const isFav = getFavs().some(f => f.id === p.id);
    const tag = p.kind === "vb" ? "// FORTNITE | V-BUCKS" : p.kind === "crew" ? "// FORTNITE | CREW" : "// FORTNITE | GIFTS";
    return '<article class="pcard-prod" data-id="' + p.id + '" data-product="' + p.product + '" data-price="' + p.price + '" data-kind="' + p.kind + '" data-img="' + p.img + '">' +
      '<div class="pcard-media">' +
        '<img src="' + p.img + '" alt="' + p.product + '" loading="lazy" onerror="this.style.display=\'none\'">' +
        '<button class="fav-btn' + (isFav ? " active" : "") + '" type="button" aria-label="Favorite" data-fav="' + p.id + '">' +
          '<svg viewBox="0 0 24 24" fill="' + (isFav ? "currentColor" : "none") + '" stroke="currentColor" stroke-width="2">' +
            '<path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/>' +
          '</svg>' +
        '</button>' +
      '</div>' +
      '<div class="pcard-info">' +
        '<div class="pcard-tag">' + tag + '</div>' +
        '<h3 class="pcard-title">' + p.product + '</h3>' +
        '<div class="pcard-price">From <b>' + fmt(p.price) + '</b> EGP</div>' +
        '<div class="pcard-actions">' +
          '<button class="pcard-btn ghost" type="button" data-action="cart">ADD_TO_CART</button>' +
          '<button class="pcard-btn fill"  type="button" data-action="buy">PURCHASE</button>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function renderAllProducts(){
    const vb = $("#gridVB"), cr = $("#gridCrew"), gf = $("#gridGift");
    if (vb) vb.innerHTML = PRODUCTS.filter(p => p.kind === "vb").map(buildCardHTML).join("");
    if (cr) cr.innerHTML = PRODUCTS.filter(p => p.kind === "crew").map(buildCardHTML).join("");
    if (gf) gf.innerHTML = PRODUCTS.filter(p => p.kind === "gift").map(buildCardHTML).join("");
    bindCards();
  }

  function bindCards(){
    $$(".pcard-prod").forEach(card => {
      $$(".pcard-btn", card).forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const a = btn.dataset.action;
          if (a === "cart") addToCartById(card.dataset.id);
          else if (a === "buy") openProductModal(card);
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

  function updateBadges(){
    const cc = getCart().reduce((s,i) => s + (i.qty||1), 0);
    const fc = getFavs().length;
    const ccEl = $("#cartCount"), fcEl = $("#favCount");
    if (ccEl){ ccEl.textContent = cc; ccEl.hidden = cc === 0; }
    if (fcEl){ fcEl.textContent = fc; fcEl.hidden = fc === 0; }
  }

  const findProduct = (id) => PRODUCTS.find(p => p.id === id);

  function addToCartById(id){
    const p = findProduct(id);
    if (!p) return;
    const cart = getCart();
    const f = cart.find(i => i.id === id);
    if (f) f.qty = (f.qty||1) + 1;
    else cart.push({ id:p.id, product:p.product, price:p.price, kind:p.kind, img:p.img, qty:1 });
    setCart(cart);
    toast("Added to cart");
  }

  function renderCart(){
    const box = $("#cartItems"), total = $("#cartTotal");
    if (!box) return;
    const cart = getCart();
    if (cart.length === 0){
      box.innerHTML = '<div class="empty-msg">Your cart is empty.</div>';
      if (total) total.textContent = "0 EGP";
      return;
    }
    box.innerHTML = cart.map((it,i) =>
      '<div class="cart-item">' +
        '<img src="' + it.img + '" alt="" onerror="this.style.display=\'none\'">' +
        '<div class="ci-info">' +
          '<div class="ci-title">' + it.product + '</div>' +
          '<div class="ci-price">' + fmt(it.price) + ' EGP x ' + (it.qty||1) + '</div>' +
        '</div>' +
        '<button class="ci-remove" type="button" data-remove="' + i + '">x</button>' +
      '</div>'
    ).join("");
    const sum = cart.reduce((s,i) => s + i.price * (i.qty||1), 0);
    if (total) total.textContent = fmt(sum) + " EGP";
    $$("[data-remove]", box).forEach(btn => {
      btn.addEventListener("click", () => {
        const c = getCart();
        c.splice(Number(btn.dataset.remove), 1);
        setCart(c);
      });
    });
  }

  function toggleFavorite(id){
    const favs = getFavs();
    const idx = favs.findIndex(f => f.id === id);
    const p = findProduct(id);
    if (!p) return;
    if (idx > -1){ favs.splice(idx, 1); toast("Removed from favorites"); }
    else { favs.push({ id:p.id, product:p.product, price:p.price, kind:p.kind, img:p.img }); toast("Added to favorites"); }
    setFavs(favs);
    renderAllProducts();
  }

  function renderFavs(){
    const box = $("#favItems");
    if (!box) return;
    const favs = getFavs();
    if (favs.length === 0){
      box.innerHTML = '<div class="empty-msg">No favorites yet.</div>';
      return;
    }
    box.innerHTML = favs.map((it,i) =>
      '<div class="cart-item">' +
        '<img src="' + it.img + '" alt="" onerror="this.style.display=\'none\'">' +
        '<div class="ci-info">' +
          '<div class="ci-title">' + it.product + '</div>' +
          '<div class="ci-price">' + fmt(it.price) + ' EGP</div>' +
        '</div>' +
        '<button class="ci-remove" type="button" data-fav-remove="' + i + '">x</button>' +
      '</div>'
    ).join("");
    $$("[data-fav-remove]", box).forEach(btn => {
      btn.addEventListener("click", () => {
        const f = getFavs();
        f.splice(Number(btn.dataset.favRemove), 1);
        setFavs(f);
        renderAllProducts();
      });
    });
  }

  function openModal(m){
    if (!m) return;
    m.classList.add("open");
    m.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeModal(m){
    if (!m) return;
    m.classList.remove("open");
    m.setAttribute("aria-hidden", "true");
    if ($$(".modal.open").length === 0) document.body.style.overflow = "";
  }

  const productModal = $("#productModal");
  const detailTitle = $("#detailTitle"), detailDesc = $("#detailDesc"),
        detailPrice = $("#detailPrice"), detailCode = $("#detailCode"),
        detailImg = $("#detailImg");

  function openProductModal(card){
    if (!productModal || !card) return;
    activeProduct = {
      id: card.dataset.id,
      product: card.dataset.product,
      price: Number(card.dataset.price),
      kind: card.dataset.kind,
      img: card.dataset.img
    };
    activeOrderId = makeOrderId();
    if (detailTitle) detailTitle.textContent = activeProduct.product;
    if (detailDesc)  detailDesc.textContent  = (DESC[activeProduct.kind]||DESC.vb).en;
    if (detailPrice) detailPrice.textContent = fmt(activeProduct.price) + " ";
    if (detailCode)  detailCode.textContent  = activeProduct.kind.toUpperCase() + " // " + activeOrderId;
    if (detailImg)   detailImg.src = activeProduct.img;
    openModal(productModal);
  }

  if (productModal){
    $$("[data-close]", productModal).forEach(el => el.addEventListener("click", () => closeModal(productModal)));
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

  const checkoutModal = $("#checkoutModal");
  const coTitle = $("#coTitle"), coSubtotal = $("#coSubtotal"), coTotal = $("#coTotal"),
        coUser = $("#coUser"), coEmail = $("#coEmail"),
        coPhone = $("#coPhone"), coCountry = $("#coCountry"),
        coReference = $("#coReference"), coMethod = $("#coMethod"), coAddress = $("#coAddress"),
        emailError = $("#emailError"), phoneError = $("#phoneError");

  function openCheckoutModal(){
    if (!checkoutModal || !activeProduct) return;
    closeModal(productModal);
    if (coTitle) coTitle.textContent = activeProduct.product;
    updateDiscountBar();
    updateTotals();
    updatePaymentUI();
    updateCheckoutPreview();
    openModal(checkoutModal);
    setTimeout(() => coUser && coUser.focus(), 220);
  }

  function updateTotals(){
    if (!activeProduct) return;
    const base = activeProduct.price;
    const pct = getDiscountPct();
    const finalPrice = base - (base * pct / 100);
    if (coSubtotal) coSubtotal.textContent = fmt(base) + " EGP";
    if (coTotal) coTotal.textContent = fmt(Math.round(finalPrice)) + " EGP";
  }

  function getCartCount(){
    const cart = getCart();
    const inCart = cart.reduce((s,i) => s + (i.qty||1), 0);
    return inCart + 1;
  }

  function getDiscountPct(){
    const count = getCartCount();
    if (count >= 5) return 20;
    if (count >= 4) return 15;
    if (count >= 3) return 10;
    if (count >= 2) return 5;
    return 0;
  }

  function updateDiscountBar(){
    const fill = $("#discountFill");
    const pctEl = $("#discountPct");
    const msgEl = $("#discountMsg");
    if (!fill || !pctEl || !msgEl) return;
    const count = getCartCount();
    const pct = getDiscountPct();
    const target = 5;
    const fillPct = Math.min((count / target) * 100, 100);
    fill.style.width = fillPct + "%";
    pctEl.textContent = pct + "%";
    if (pct === 0){
      msgEl.textContent = "Add 1 more item to unlock a 5% discount";
      msgEl.classList.remove("unlocked");
    } else if (pct === 5){
      msgEl.textContent = "5% discount unlocked! Add 1 more for 10%";
      msgEl.classList.add("unlocked");
    } else if (pct === 10){
      msgEl.textContent = "10% discount unlocked! Add 1 more for 15%";
      msgEl.classList.add("unlocked");
    } else if (pct === 15){
      msgEl.textContent = "15% discount unlocked! Add 1 more for 20%";
      msgEl.classList.add("unlocked");
    } else {
      msgEl.textContent = "20% MAX DISCOUNT UNLOCKED!";
      msgEl.classList.add("unlocked");
    }
  }

  function updatePaymentUI(){
    const pay = PAYMENTS[activePayment];
    if (coMethod) coMethod.textContent = pay.label;
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
    const user = (coUser && coUser.value.trim()) || "-";
    const email = (coEmail && coEmail.value.trim()) || "-";
    const phone = (coPhone && coPhone.value.trim()) || "-";
    const country = (coCountry && coCountry.value) || "+20";
    const pay = PAYMENTS[activePayment];
    const pct = getDiscountPct();
    const base = activeProduct.price;
    const finalPrice = Math.round(base - (base * pct / 100));
    const proof = proofFile ? proofFile.name : "to attach in DM";

    return [
      "GAMENEST Ticket",
      "",
      "Ticket No: " + activeOrderId,
      "Full Name: " + user,
      "Email: " + email,
      "Phone: " + country + " " + phone,
      "Product: " + activeProduct.product,
      "Price: " + fmt(finalPrice) + " EGP" + (pct ? " (" + pct + "% off applied)" : ""),
      "",
      "Payment Method: " + pay.label,
      "Pay to: " + pay.value,
      "Account Holder: " + HOLDER,
      "Payment Proof: " + proof,
      "",
      "Sending this ticket + payment screenshot to " + HANDLE + "."
    ].join("\n");
  }

  function updateCheckoutPreview(){
    if (coReference) coReference.textContent = buildTicket();
  }

  if (coUser) coUser.addEventListener("input", updateCheckoutPreview);
  if (coEmail) coEmail.addEventListener("input", () => { validateEmail(); updateCheckoutPreview(); });
  if (coPhone) coPhone.addEventListener("input", () => { validatePhone(); updateCheckoutPreview(); });
  if (coCountry) coCountry.addEventListener("change", () => {
    const opt = coCountry.options[coCountry.selectedIndex];
    if (coPhone) coPhone.placeholder = "e.g. " + (opt.dataset.example || "");
    validatePhone();
    updateCheckoutPreview();
  });

  if (checkoutModal){
    $$("[data-close-checkout]", checkoutModal).forEach(el => el.addEventListener("click", () => closeModal(checkoutModal)));
  }

  function validateEmail(){
    if (!coEmail || !emailError) return true;
    const v = coEmail.value.trim();
    if (!v) { coEmail.classList.remove("error"); emailError.hidden = true; return false; }
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    if (ok) {
      coEmail.classList.remove("error");
      emailError.hidden = true;
      return true;
    }
    coEmail.classList.add("error");
    emailError.textContent = "! INVALID EMAIL - MUST CONTAIN @ AND A DOMAIN";
    emailError.hidden = false;
    return false;
  }

  function validatePhone(){
    if (!coPhone || !phoneError || !coCountry) return true;
    const v = coPhone.value.replace(/\D/g, "");
    if (!v) { coPhone.classList.remove("error"); phoneError.hidden = true; return false; }
    const opt = coCountry.options[coCountry.selectedIndex];
    const expected = parseInt(opt.dataset.len || "0", 10);
    const country = opt.textContent.trim();
    if (expected && v.length !== expected){
      coPhone.classList.add("error");
      phoneError.textContent = "! INCOMPLETE PHONE NUMBER - MUST BE EXACTLY " + expected + " DIGITS FOR " + country.toUpperCase();
      phoneError.hidden = false;
      return false;
    }
    coPhone.classList.remove("error");
    phoneError.hidden = true;
    return true;
  }

  const payNowBtn = $("#payNowBtn");
  if (payNowBtn){
    payNowBtn.addEventListener("click", () => {
      const pay = PAYMENTS[activePayment];
      if (pay.link){
        window.open(pay.link, "_blank", "noopener");
        toast("Opening " + pay.label + "...");
      } else {
        copyText(pay.value);
        toast("Telda handle copied");
      }
    });
  }

  const proofUpload  = $("#proofUpload");
  const proofPreview = $("#proofPreview");
  const proofRemove  = $("#proofRemove");
  const uploadLabel  = $("#uploadLabel");
  const uploadBox    = $("#uploadBox");

  if (uploadBox && proofUpload){
    uploadBox.addEventListener("click", (e) => {
      if (e.target.closest(".proof-remove")) return;
      proofUpload.click();
    });
    uploadBox.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " "){
        e.preventDefault();
        proofUpload.click();
      }
    });
    proofUpload.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/")){
        toast("Please pick an image file");
        return;
      }
      if (file.size > 8 * 1024 * 1024){
        toast("Max file size is 8 MB");
        return;
      }
      proofFile = file;
      if (proofPreview){
        const reader = new FileReader();
        reader.onload = (ev) => {
          proofPreview.src = ev.target.result;
          proofPreview.hidden = false;
        };
        reader.readAsDataURL(file);
      }
      if (uploadLabel){
        uploadLabel.textContent = file.name.length > 26
          ? file.name.slice(0, 23) + "..."
          : file.name;
      }
      if (uploadBox)   uploadBox.classList.add("has-file");
      if (proofRemove) proofRemove.hidden = false;
      updateCheckoutPreview();
      toast("Screenshot attached");
    });
  }

  if (proofRemove){
    proofRemove.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      proofFile = null;
      if (proofUpload) proofUpload.value = "";
      if (proofPreview){
        proofPreview.src = "";
        proofPreview.hidden = true;
      }
      if (uploadBox) uploadBox.classList.remove("has-file");
      if (proofRemove) proofRemove.hidden = true;
      if (uploadLabel) uploadLabel.textContent = "[ UPLOAD_PAYMENT_RECEIPT ]";
      updateCheckoutPreview();
    });
  }

  const submitOrderBtn = $("#submitOrder");
  const successModal = $("#successModal");

  if (submitOrderBtn){
    submitOrderBtn.addEventListener("click", () => {
      if (!coUser || !coUser.value.trim()){
        toast("Enter your full name first");
        if (coUser) coUser.focus();
        return;
      }
      if (!validateEmail() || !coEmail.value.trim()){
        toast("Enter a valid email");
        if (coEmail) coEmail.focus();
        return;
      }
      if (!validatePhone() || !coPhone.value.trim()){
        toast("Enter a valid phone number");
        if (coPhone) coPhone.focus();
        return;
      }
      if (!proofFile){
        toast("Upload your payment screenshot first");
        return;
      }
      const code = $("#successOrderCode");
      const gateway = $("#successGateway");
      const player = $("#successPlayer");
      if (code)    code.textContent = activeOrderId || "-";
      if (gateway) gateway.textContent = PAYMENTS[activePayment].label;
      if (player)  player.textContent = coUser.value.trim() || "-";

      /* SAVE ORDER TO FIREBASE */
      saveOrderToFirebase().then(() => {
        closeModal(checkoutModal);
        if (successModal) openModal(successModal);
        toast("Order submitted");
      }).catch(err => {
        console.error("Save failed:", err);
        closeModal(checkoutModal);
        if (successModal) openModal(successModal);
        toast("Order submitted (offline)");
      });
    });
  }

  const terminateLink = $("#terminateLink");
  if (terminateLink){
    terminateLink.addEventListener("click", () => {
      closeModal(successModal);
      if (coUser) coUser.value = "";
      if (coEmail) coEmail.value = "";
      if (coPhone) coPhone.value = "";
      if (coReference) coReference.textContent = "-";
      proofFile = null;
      if (proofUpload) proofUpload.value = "";
      if (proofPreview){ proofPreview.src = ""; proofPreview.hidden = true; }
      if (proofRemove) proofRemove.hidden = true;
      if (uploadBox) uploadBox.classList.remove("has-file");
      if (uploadLabel) uploadLabel.textContent = "[ UPLOAD_PAYMENT_RECEIPT ]";
      if (coEmail){ coEmail.classList.remove("error"); if (emailError) emailError.hidden = true; }
      if (coPhone){ coPhone.classList.remove("error"); if (phoneError) phoneError.hidden = true; }
    });
  }

  const copyTicketBtn = $("#copyTicket");
  if (copyTicketBtn){
    copyTicketBtn.addEventListener("click", async () => {
      updateCheckoutPreview();
      const text = (coReference && coReference.textContent) || "";
      const ok = await copyText(text);
      toast(ok ? "Ticket copied" : "Copy failed");
    });
  }

  const cartModal = $("#cartModal"), favModal = $("#favModal"), searchModal = $("#searchModal");

  const cartBtn = $("#cartBtn");
  if (cartBtn && cartModal) cartBtn.addEventListener("click", () => openModal(cartModal));

  const favBtn = $("#favBtn");
  if (favBtn && favModal) favBtn.addEventListener("click", () => openModal(favModal));

  const searchBtn = $("#searchBtn");
  if (searchBtn && searchModal){
    searchBtn.addEventListener("click", () => {
      openModal(searchModal);
      setTimeout(() => { const si = $("#searchInput"); if (si) si.focus(); }, 220);
    });
  }

  if (cartModal) $$("[data-close-cart]", cartModal).forEach(el => el.addEventListener("click", () => closeModal(cartModal)));
  if (favModal)  $$("[data-close-fav]",  favModal).forEach(el => el.addEventListener("click", () => closeModal(favModal)));
  if (searchModal) $$("[data-close-search]", searchModal).forEach(el => el.addEventListener("click", () => closeModal(searchModal)));

  const cartCheckout = $("#cartCheckout");
  if (cartCheckout){
    cartCheckout.addEventListener("click", () => {
      const cart = getCart();
      if (cart.length === 0){ toast("Cart is empty"); return; }
      const first = cart[0];
      activeProduct = { id:first.id, product:first.product, price:first.price, kind:first.kind, img:first.img };
      activeOrderId = makeOrderId();
      closeModal(cartModal);
      openCheckoutModal();
    });
  }

  const searchInput = $("#searchInput"), searchResults = $("#searchResults");
  function updateSearchResults(){
    if (!searchResults) return;
    const q = (searchInput && searchInput.value || "").trim().toLowerCase();
    if (!q){
      searchResults.innerHTML = '<div class="empty-msg">Type to search the catalog.</div>';
      return;
    }
    const results = PRODUCTS.filter(p => p.product.toLowerCase().indexOf(q) > -1 || p.kind.toLowerCase().indexOf(q) > -1);
    if (results.length === 0){
      searchResults.innerHTML = '<div class="empty-msg">No matches found.</div>';
      return;
    }
    searchResults.innerHTML = results.map(p =>
      '<div class="search-result" data-id="' + p.id + '">' +
        '<img src="' + p.img + '" alt="" onerror="this.style.display=\'none\'">' +
        '<div>' +
          '<div class="sr-title">' + p.product + '</div>' +
          '<div class="sr-price">' + fmt(p.price) + ' EGP</div>' +
        '</div>' +
        '<div class="sr-go">VIEW &gt;</div>' +
      '</div>'
    ).join("");
    $$(".search-result", searchResults).forEach(row => {
      row.addEventListener("click", () => {
        const p = findProduct(row.dataset.id);
        if (!p) return;
        closeModal(searchModal);
        openProductModal({ dataset:{ id:p.id, product:p.product, price:p.price, kind:p.kind, img:p.img } });
      });
    });
  }
  if (searchInput) searchInput.addEventListener("input", updateSearchResults);

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
        toast("Copied: " + value);
      } else {
        window.open(link, "_blank", "noopener");
        toast("Opening " + name + "...");
      }
      if (!activeProduct){
        activeProduct = { id:"custom", product:"Custom Order", price:0, kind:"vb", img:"vbucks.png" };
        activeOrderId = makeOrderId();
      }
      openCheckoutModal();
    });
  });

  function startCountdown(){
    const hEl = $("#cdH"), mEl = $("#cdM"), sEl = $("#cdS");
    if (!hEl || !mEl || !sEl) return;
    const now = new Date();
    const target = new Date(now);
    const day = target.getDay();
    const daysUntilEnd = (7 - day) % 7;
    target.setDate(target.getDate() + daysUntilEnd);
    target.setHours(23, 59, 59, 0);
    if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 7);
    function tick(){
      const diff = target.getTime() - Date.now();
      if (diff <= 0){ hEl.textContent = "00"; mEl.textContent = "00"; sEl.textContent = "00"; return; }
      const totalSec = Math.floor(diff / 1000);
      hEl.textContent = String(Math.floor(totalSec/3600)).padStart(2,"0");
      mEl.textContent = String(Math.floor((totalSec%3600)/60)).padStart(2,"0");
      sEl.textContent = String(totalSec%60).padStart(2,"0");
    }
    tick();
    setInterval(tick, 1000);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const openEl = $(".modal.open");
    if (openEl) closeModal(openEl);
  });

  /* ============================================================
     SAVE ORDER TO FIREBASE
     ============================================================ */
  async function saveOrderToFirebase(){
    if (!window.__gn_db){
      throw new Error("Firebase not ready");
    }
    const { collection, addDoc, serverTimestamp } = window.__gn_fs;
    const pct = getDiscountPct();
    const base = activeProduct.price;
    const finalPrice = Math.round(base - (base * pct / 100));

    await addDoc(collection(window.__gn_db, "orders"), {
      orderId: activeOrderId,
      name: coUser?.value.trim() || "—",
      email: coEmail?.value.trim() || "—",
      phone: coPhone?.value.trim() || "—",
      country: coCountry?.value || "+20",
      product: activeProduct.product,
      price: finalPrice,
      discount: pct,
      payment: PAYMENTS[activePayment].label,
      proofName: proofFile ? proofFile.name : "",
      status: "pending",
      createdAt: serverTimestamp()
    });
  }

  function init(){
    renderAllProducts();
    updateBadges();
    renderCart();
    renderFavs();
    startCountdown();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

})();