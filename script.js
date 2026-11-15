/**
 * Bodo Aronai - Storefront & Checkout Script
 * Pure client-side catalog rendering, bag management, and demo checkout.
 */

const productDialog = document.querySelector("#product-dialog");
const productGrid = document.querySelector(".product-grid");
const filterControls = document.querySelector(".filters");
const catalogNote = document.querySelector(".catalog-note");
const cartDialog = document.querySelector("#cart-dialog");
const bagLink = document.querySelector(".bag-link");
const bagCount = document.querySelector(".bag-count");
const cartItemsElement = document.querySelector("#cart-items");
const cartSummary = document.querySelector("#cart-summary");
const cartView = document.querySelector("#cart-view");
const checkoutView = document.querySelector("#checkout-view");
const orderComplete = document.querySelector("#order-complete");
const checkoutForm = document.querySelector("#checkout-form");
const checkoutStatus = document.querySelector("#checkout-status");

const cartItems = new Map();
let checkoutOutcome = "success";
let activeQuickViewCard = null;

function createProductCard(product) {
  const card = document.createElement("article");
  card.className = "product-card";
  card.dataset.category = product.category;
  card.dataset.productId = String(product.id);
  card.dataset.price = String(product.price);

  const imageContainer = document.createElement("div");
  imageContainer.className = "product-image";
  const image = document.createElement("img");
  image.className = "product-photo";
  image.src = product.image_path;
  image.alt = product.name;
  image.loading = "lazy";

  const tag = document.createElement("span");
  tag.className = "product-tag";
  tag.textContent = categoryLabel(product.category).toUpperCase();

  const quickView = document.createElement("button");
  quickView.className = "quick-view-button";
  quickView.type = "button";
  quickView.dataset.quickView = "";
  quickView.setAttribute("aria-label", `Quick view ${product.name}`);
  quickView.textContent = "Quick view";

  const quickAdd = document.createElement("button");
  quickAdd.className = "quick-add";
  quickAdd.type = "button";
  quickAdd.setAttribute("aria-label", `Add ${product.name} to bag`);
  quickAdd.textContent = "+";

  imageContainer.append(image, tag, quickView, quickAdd);

  const info = document.createElement("div");
  info.className = "product-info";
  const details = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = product.name;
  const description = document.createElement("p");
  description.textContent = product.description;
  const price = document.createElement("strong");
  price.textContent = formatCurrency(Number(product.price));

  details.append(title, description);
  info.append(details, price);
  card.append(imageContainer, info);
  return card;
}

function renderProductFilters(products) {
  if (!filterControls) return;
  const categories = [...new Set(products.map((product) => product.category))];
  filterControls.textContent = "";
  const allCategories = ["all", ...categories];
  allCategories.forEach((category, index) => {
    const button = document.createElement("button");
    button.className = `filter-button${index === 0 ? " active" : ""}`;
    button.type = "button";
    button.dataset.filter = category;
    button.setAttribute("aria-pressed", String(index === 0));
    button.textContent = category === "all" ? "All pieces" : categoryLabel(category);
    filterControls.append(button);
  });
}

function loadProducts() {
  if (!productGrid) return;
  try {
    const products = getActiveProducts();
    productGrid.textContent = "";
    products.forEach((product) => productGrid.append(createProductCard(product)));
    renderProductFilters(products);

    if (catalogNote) {
      catalogNote.textContent =
        products.length > 0
          ? "Handwoven pieces, added by our sellers."
          : "No products are listed yet. Please check back soon.";
    }

    const filterEmpty = document.querySelector(".filter-empty");
    if (filterEmpty) {
      filterEmpty.hidden = products.length > 0;
    }
  } catch (error) {
    if (catalogNote) {
      catalogNote.textContent = error.message || "The collection could not be loaded.";
    }
  }
}

if (filterControls) {
  filterControls.addEventListener("click", (event) => {
    const button = event.target.closest(".filter-button");
    if (!button) return;
    const filter = button.dataset.filter;
    let visibleCount = 0;

    filterControls.querySelectorAll(".filter-button").forEach((filterButton) => {
      const isActive = filterButton === button;
      filterButton.classList.toggle("active", isActive);
      filterButton.setAttribute("aria-pressed", String(isActive));
    });

    productGrid.querySelectorAll(".product-card").forEach((card) => {
      const isVisible = filter === "all" || card.dataset.category === filter;
      card.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    });

    const filterEmpty = document.querySelector(".filter-empty");
    if (filterEmpty) {
      filterEmpty.hidden = visibleCount > 0;
    }
  });
}

if (cartDialog) {
  cartDialog.addEventListener("close", () => {
    if (cartView) cartView.hidden = false;
    if (checkoutView) checkoutView.hidden = true;
    if (orderComplete) orderComplete.hidden = true;
    if (checkoutStatus) {
      checkoutStatus.textContent = "";
      checkoutStatus.classList.remove("is-error");
    }
  });
}

function updateBagCount() {
  if (!bagCount || !bagLink) return 0;
  const count = [...cartItems.values()].reduce((total, item) => total + item.quantity, 0);
  bagCount.textContent = String(count);
  bagLink.setAttribute("aria-label", `Shopping bag, ${count} ${count === 1 ? "item" : "items"}`);
  const titleCount = document.querySelector(".cart-title-count");
  if (titleCount) titleCount.textContent = `(${count})`;

  // Persist cart to storage
  const serialized = [...cartItems.values()];
  saveCart(serialized);

  return count;
}

function loadSavedCart() {
  const saved = getCart();
  cartItems.clear();
  if (Array.isArray(saved)) {
    saved.forEach((item) => {
      cartItems.set(String(item.id), item);
    });
  }
  updateBagCount();
}

function renderCart() {
  if (!cartItemsElement || !cartSummary) return;
  cartItemsElement.textContent = "";

  if (cartItems.size === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "cart-empty";
    emptyMessage.textContent = "Your bag is waiting for something lovely.";
    cartItemsElement.append(emptyMessage);
    cartSummary.hidden = true;
    updateBagCount();
    return;
  }

  let subtotal = 0;
  cartItems.forEach((item, id) => {
    subtotal += item.price * item.quantity;

    const row = document.createElement("article");
    row.className = "cart-item";
    const details = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = item.name;
    const price = document.createElement("p");
    price.className = "cart-item-price";
    price.textContent = `${formatCurrency(item.price)} each`;

    const controls = document.createElement("div");
    controls.className = "cart-item-controls";
    const decrease = document.createElement("button");
    decrease.className = "cart-qty-button";
    decrease.type = "button";
    decrease.dataset.cartAction = "decrease";
    decrease.dataset.productId = id;
    decrease.setAttribute("aria-label", `Decrease ${item.name} quantity`);
    decrease.textContent = "−";

    const quantity = document.createElement("span");
    quantity.className = "cart-quantity";
    quantity.textContent = String(item.quantity);

    const increase = document.createElement("button");
    increase.className = "cart-qty-button";
    increase.type = "button";
    increase.dataset.cartAction = "increase";
    increase.dataset.productId = id;
    increase.setAttribute("aria-label", `Increase ${item.name} quantity`);
    increase.textContent = "+";

    const remove = document.createElement("button");
    remove.className = "cart-remove";
    remove.type = "button";
    remove.dataset.cartAction = "remove";
    remove.dataset.productId = id;
    remove.textContent = "Remove";

    controls.append(decrease, quantity, increase, remove);
    details.append(title, price, controls);

    const lineTotal = document.createElement("strong");
    lineTotal.className = "cart-item-total";
    lineTotal.textContent = formatCurrency(item.price * item.quantity);

    row.append(details, lineTotal);
    cartItemsElement.append(row);
  });

  const shipping = subtotal >= 2500 ? 0 : 99;
  const cartSubtotalEl = document.querySelector("#cart-subtotal");
  const cartShippingEl = document.querySelector("#cart-shipping");
  const cartTotalEl = document.querySelector("#cart-total");
  const paymentSuccessEl = document.querySelector("#payment-success");

  if (cartSubtotalEl) cartSubtotalEl.textContent = formatCurrency(subtotal);
  if (cartShippingEl) cartShippingEl.textContent = shipping === 0 ? "Free" : formatCurrency(shipping);
  if (cartTotalEl) cartTotalEl.textContent = formatCurrency(subtotal + shipping);
  if (paymentSuccessEl) paymentSuccessEl.textContent = `Complete demo payment · ${formatCurrency(subtotal + shipping)}`;

  cartSummary.hidden = false;
  updateBagCount();
}

if (cartItemsElement) {
  cartItemsElement.addEventListener("click", (event) => {
    const button = event.target.closest("[data-cart-action]");
    if (!button) return;

    const id = button.dataset.productId;
    const item = cartItems.get(id);
    if (!item) return;

    if (button.dataset.cartAction === "remove" || (button.dataset.cartAction === "decrease" && item.quantity === 1)) {
      cartItems.delete(id);
    } else if (button.dataset.cartAction === "decrease") {
      item.quantity -= 1;
    } else {
      item.quantity += 1;
    }
    renderCart();
  });
}

function addProductToCart(card, button) {
  const id = card.dataset.productId;
  const existing = cartItems.get(id);
  const price = Number(card.dataset.price);
  const title = card.querySelector(".product-info h3")?.textContent || "Product";

  cartItems.set(id, {
    id: Number(id),
    name: title,
    price,
    quantity: existing ? existing.quantity + 1 : 1
  });
  renderCart();

  if (button) {
    button.textContent = "✓";
    button.setAttribute("aria-label", "Added to bag");
    window.setTimeout(() => {
      button.textContent = "+";
      button.setAttribute("aria-label", `Add ${title} to bag`);
    }, 1000);
  }
}

if (productGrid) {
  productGrid.addEventListener("click", (event) => {
    const addButton = event.target.closest(".quick-add");
    if (addButton) {
      addProductToCart(addButton.closest(".product-card"), addButton);
      return;
    }
    const quickViewButton = event.target.closest("[data-quick-view]");
    if (quickViewButton) {
      const card = quickViewButton.closest(".product-card");
      const photo = card.querySelector(".product-photo");
      activeQuickViewCard = card;

      const productName = card.querySelector(".product-info h3").textContent;
      document.querySelector("#quick-view-image").src = photo.src;
      document.querySelector("#quick-view-image").alt = photo.alt;
      document.querySelector("#quick-view-category").textContent = categoryLabel(card.dataset.category).toUpperCase();
      document.querySelector("#quick-view-title").textContent = productName;
      document.querySelector("#quick-view-description").textContent = card.querySelector(".product-info p").textContent;
      document.querySelector("#quick-view-price").textContent = card.querySelector(".product-info strong").textContent;
      document.querySelector("#quick-view-status").textContent = "";

      // WhatsApp product-specific inquiry link
      let waInquiryBtn = document.querySelector("#quick-view-whatsapp");
      if (!waInquiryBtn) {
        waInquiryBtn = document.createElement("a");
        waInquiryBtn.id = "quick-view-whatsapp";
        waInquiryBtn.className = "button button-outline";
        waInquiryBtn.target = "_blank";
        waInquiryBtn.rel = "noopener noreferrer";
        waInquiryBtn.style.marginTop = "10px";
        waInquiryBtn.style.display = "block";
        waInquiryBtn.style.textAlign = "center";
        const quickViewAdd = document.querySelector("#quick-view-add");
        if (quickViewAdd && quickViewAdd.parentNode) {
          quickViewAdd.parentNode.insertBefore(waInquiryBtn, quickViewAdd.nextSibling);
        }
      }
      if (waInquiryBtn) {
        waInquiryBtn.href = getWhatsAppProductUrl(productName);
        waInquiryBtn.textContent = "Inquire on WhatsApp ↗";
      }

      productDialog.showModal();
    }
  });
}

const quickViewAddBtn = document.querySelector("#quick-view-add");
if (quickViewAddBtn) {
  quickViewAddBtn.addEventListener("click", () => {
    if (!activeQuickViewCard) return;
    addProductToCart(activeQuickViewCard);
    document.querySelector("#quick-view-status").textContent = "Added to your bag.";
  });
}

if (bagLink) {
  bagLink.addEventListener("click", () => {
    renderCart();
    if (cartDialog) cartDialog.showModal();
  });
}

const checkoutStartBtn = document.querySelector("#checkout-start");
if (checkoutStartBtn) {
  checkoutStartBtn.addEventListener("click", (event) => {
    const user = getCurrentUser();
    if (!user) {
      if (cartDialog) cartDialog.close();
      const authDialog = document.querySelector("#auth-dialog");
      if (authDialog) {
        const authStatus = document.querySelector("#auth-status");
        if (authStatus) {
          authStatus.textContent = "Sign in with a customer account to place an order.";
          authStatus.classList.remove("is-error");
        }
        authDialog.showModal();
        const firstInput = document.querySelector("#login-form input");
        if (firstInput) firstInput.focus();
      }
      return;
    }

    if (user.role !== "customer") {
      if (checkoutStatus) {
        checkoutStatus.textContent = "Only customer accounts can place orders. Please sign in as a customer.";
        checkoutStatus.classList.add("is-error");
      }
      return;
    }

    if (checkoutForm) {
      if (checkoutForm.elements.name) checkoutForm.elements.name.value = checkoutForm.elements.name.value || user.name;
      if (checkoutForm.elements.email) checkoutForm.elements.email.value = checkoutForm.elements.email.value || user.email;
    }

    if (cartView) cartView.hidden = true;
    if (checkoutView) checkoutView.hidden = false;
    if (checkoutForm && checkoutForm.elements.name) checkoutForm.elements.name.focus();
  });
}

const checkoutBackBtn = document.querySelector("#checkout-back");
if (checkoutBackBtn) {
  checkoutBackBtn.addEventListener("click", () => {
    if (checkoutView) checkoutView.hidden = true;
    if (cartView) cartView.hidden = false;
    if (checkoutStatus) checkoutStatus.textContent = "";
  });
}

if (checkoutForm) {
  checkoutForm.addEventListener("submit", (event) => {
    event.preventDefault();
    checkoutOutcome = event.submitter?.dataset.outcome || "success";

    if (checkoutOutcome === "declined") {
      if (checkoutStatus) {
        checkoutStatus.textContent = "Demo payment declined. No payment was attempted and no money was charged.";
        checkoutStatus.classList.add("is-error");
      }
      return;
    }

    const submitButton = event.submitter;
    if (submitButton) submitButton.disabled = true;
    if (checkoutStatus) {
      checkoutStatus.textContent = "";
      checkoutStatus.classList.remove("is-error");
    }

    const user = getCurrentUser();
    if (!user || user.role !== "customer") {
      if (checkoutStatus) {
        checkoutStatus.textContent = "Sign in with a customer account to place an order.";
        checkoutStatus.classList.add("is-error");
      }
      if (submitButton) submitButton.disabled = false;
      return;
    }

    try {
      const formData = new FormData(checkoutForm);
      const name = formData.get("name").toString().trim();
      const email = formData.get("email").toString().trim();
      const address = formData.get("address").toString().trim();
      const paymentMethod = formData.get("payment_method").toString();

      if (!name || name.length > 100) {
        throw new Error("Enter a delivery name between 1 and 100 characters.");
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Enter a valid email address.");
      }
      if (!address || address.length < 5 || address.length > 1000) {
        throw new Error("Enter a delivery address between 5 and 1,000 characters.");
      }

      const items = [...cartItems.values()].map((i) => ({
        id: Number(i.id),
        name: i.name,
        quantity: Number(i.quantity)
      }));

      const result = createOrder({
        customerId: user.id,
        customerName: name,
        customerEmail: email,
        shippingAddress: address,
        paymentMethod: paymentMethod,
        items
      });

      // Map payment method label
      const paymentLabels = {
        upi_demo: "UPI (simulated)",
        card_demo: "Card (simulated)",
        netbanking_demo: "Net Banking (simulated)",
        cod_demo: "Cash on delivery (demo)"
      };

      // Order confirmation details according to Requirement 10
      const orderTitleEl = document.querySelector("#order-title");
      const orderMsgEl = document.querySelector("#order-message");

      if (orderTitleEl) {
        orderTitleEl.textContent = "Your order has been placed successfully!";
      }

      if (orderMsgEl) {
        orderMsgEl.innerHTML = `
          <div style="text-align: left; background: var(--paper-deep); padding: 16px; margin: 16px 0; border: 1px solid var(--line); font-size: 12px; line-height: 1.8;">
            <p style="margin: 0;"><strong>Order ID:</strong> BA-${result.order.id}</p>
            <p style="margin: 0;"><strong>Order Amount:</strong> ${formatCurrency(result.order.total_amount)}</p>
            <p style="margin: 0;"><strong>Payment Method:</strong> ${paymentLabels[result.order.payment_method] || result.order.payment_method}</p>
            <p style="margin: 0;"><strong>Payment Status:</strong> ${result.order.payment_status === "demo_paid" ? "Demo Paid" : "Pending (COD)"}</p>
            <p style="margin: 0;"><strong>Order Status:</strong> Pending</p>
          </div>
          <p style="font-size: 11px; color: var(--muted);">Thank you, ${escapeHtml(name)}. A demo order confirmation has been recorded.</p>
          <div style="display: flex; gap: 10px; margin-top: 15px;">
            <a class="button button-dark" href="customer.html" style="text-decoration: none; display: inline-flex; align-items: center; justify-content: center; flex: 1;">My Orders ↗</a>
            <button class="button button-outline" id="order-continue-shopping" type="button" style="flex: 1;">Continue Shopping</button>
          </div>
        `;

        const continueBtn = document.querySelector("#order-continue-shopping");
        if (continueBtn) {
          continueBtn.addEventListener("click", () => {
            if (orderComplete) orderComplete.hidden = true;
            if (cartView) cartView.hidden = false;
            if (checkoutView) checkoutView.hidden = true;
            if (cartDialog) cartDialog.close();
          });
        }
      }

      // Hide checkout view, show order complete view
      if (checkoutView) checkoutView.hidden = true;
      if (orderComplete) orderComplete.hidden = false;

      // Clear local cart
      cartItems.clear();
      renderCart();
    } catch (error) {
      if (checkoutStatus) {
        checkoutStatus.textContent = error.message || "Your order could not be recorded. Please try again.";
        checkoutStatus.classList.add("is-error");
      }
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}

const orderDoneBtn = document.querySelector("#order-done");
if (orderDoneBtn) {
  orderDoneBtn.addEventListener("click", () => {
    if (orderComplete) orderComplete.hidden = true;
    if (cartView) cartView.hidden = false;
    if (checkoutView) checkoutView.hidden = true;
    if (cartDialog) cartDialog.close();
  });
}

// Initial bootstrap
loadProducts();
loadSavedCart();
renderCart();
