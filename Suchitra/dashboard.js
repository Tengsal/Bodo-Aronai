/**
 * Bodo Aronai - Frontend Dashboards Script
 * Handles rendering and user interactions for Customer, Seller, and Admin dashboards.
 */

// Shared Logout Handlers
document.querySelectorAll("[data-logout]").forEach((button) => {
  button.addEventListener("click", () => {
    logoutUser();
  });
});

function showDashboardStatus(message, isError = false) {
  const statusEl = document.querySelector(".dashboard-status");
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.style.color = isError ? "var(--red)" : "green";
  window.setTimeout(() => {
    if (statusEl.textContent === message) {
      statusEl.textContent = "";
    }
  }, 4000);
}

// Convert image file to Data URL
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error("Images must be no larger than 5 MB."));
      return;
    }
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      reject(new Error("Please upload a JPEG, PNG, or WebP image."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}

// ========================================================
// CUSTOMER DASHBOARD CONTROLLER
// ========================================================
function initCustomerDashboard() {
  const user = requireRole("customer");
  if (!user) return;

  // Header and Welcome info
  const nameHeader = document.querySelector("#customer-name-header");
  const welcomeName = document.querySelector("#customer-welcome-name");
  const profileName = document.querySelector("#customer-profile-name");
  const profileEmail = document.querySelector("#customer-profile-email");

  if (nameHeader) nameHeader.textContent = user.name;
  if (welcomeName) welcomeName.textContent = user.name;
  if (profileName) profileName.textContent = user.name;
  if (profileEmail) profileEmail.textContent = user.email;

  let orderToCancelId = null;
  const cancelDialog = document.querySelector("#cancel-order-dialog");
  const keepBtn = document.querySelector("#btn-keep-order");
  const confirmCancelBtn = document.querySelector("#btn-confirm-cancel");

  if (keepBtn && cancelDialog) {
    keepBtn.addEventListener("click", () => cancelDialog.close());
  }

  if (confirmCancelBtn && cancelDialog) {
    confirmCancelBtn.addEventListener("click", () => {
      if (!orderToCancelId) return;
      try {
        cancelOrder(orderToCancelId);
        showDashboardStatus(`Order BA-${orderToCancelId} has been cancelled successfully.`);
        cancelDialog.close();
        renderCustomerOrders();
      } catch (err) {
        showDashboardStatus(err.message, true);
        cancelDialog.close();
      }
    });
  }

  function renderCustomerOrders() {
    const orders = getOrdersByCustomerId(user.id);
    const orderCountEl = document.querySelector("#customer-order-count");
    const demoSpendEl = document.querySelector("#customer-demo-spend");
    const container = document.querySelector("#customer-orders-container");

    const nonCancelled = orders.filter((o) => o.order_status !== "cancelled" && o.payment_status === "demo_paid");
    const totalSpend = nonCancelled.reduce((sum, o) => sum + Number(o.total_amount), 0);

    if (orderCountEl) orderCountEl.textContent = String(orders.length);
    if (demoSpendEl) demoSpendEl.textContent = formatCurrency(totalSpend);

    if (!container) return;

    if (orders.length === 0) {
      container.innerHTML = '<p class="dashboard-muted">You have not placed any orders yet.</p>';
      return;
    }

    const cancellableStatuses = ["pending", "confirmed", "processing"];

    let html = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Items</th>
              <th>Status</th>
              <th>Order total</th>
              <th>Placed</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
    `;

    orders.forEach((order) => {
      const isCancellable = cancellableStatuses.includes(order.order_status.toLowerCase());
      const isCancelled = order.order_status.toLowerCase() === "cancelled";

      let actionHtml = "—";
      if (isCancellable) {
        actionHtml = `<button class="dashboard-button compact-button secondary" data-cancel-order="${order.id}">Cancel order</button>`;
      } else if (isCancelled) {
        actionHtml = '<span class="dashboard-muted">Cancelled (Refunded)</span>';
      } else {
        actionHtml = `<span class="dashboard-muted">${escapeHtml(order.order_status)}</span>`;
      }

      html += `
        <tr>
          <td><strong>BA-${order.id}</strong></td>
          <td>${escapeHtml(order.item_summary || "No item details")}</td>
          <td>${escapeHtml(order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1))}</td>
          <td>${formatCurrency(order.total_amount)}</td>
          <td>${formatDate(order.created_at)}</td>
          <td>${actionHtml}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = html;

    // Attach cancellation click handlers
    container.querySelectorAll("[data-cancel-order]").forEach((btn) => {
      btn.addEventListener("click", () => {
        orderToCancelId = Number(btn.dataset.cancelOrder);
        if (cancelDialog) cancelDialog.showModal();
      });
    });
  }

  renderCustomerOrders();
}

// ========================================================
// SELLER DASHBOARD CONTROLLER
// ========================================================
function initSellerDashboard() {
  const user = requireRole("seller");
  if (!user) return;

  const nameHeader = document.querySelector("#seller-name-header");
  const welcomeName = document.querySelector("#seller-welcome-name");
  if (nameHeader) nameHeader.textContent = user.name;
  if (welcomeName) welcomeName.textContent = user.name;

  function renderSellerStatsAndOrders() {
    const sellerOrders = getOrdersBySellerId(user.id);
    const activeOrders = sellerOrders.filter((o) => o.order_status !== "cancelled" && o.payment_status === "demo_paid");

    const orderCount = activeOrders.length;
    const earnings = activeOrders.reduce((sum, o) => sum + Number(o.line_total), 0);
    const unitsSold = activeOrders.reduce((sum, o) => sum + Number(o.units), 0);

    const orderCountEl = document.querySelector("#seller-order-count");
    const earningsEl = document.querySelector("#seller-earnings");
    const unitsSoldEl = document.querySelector("#seller-units-sold");

    if (orderCountEl) orderCountEl.textContent = String(orderCount);
    if (earningsEl) earningsEl.textContent = formatCurrency(earnings);
    if (unitsSoldEl) unitsSoldEl.textContent = String(unitsSold);

    const ordersContainer = document.querySelector("#seller-orders-container");
    if (ordersContainer) {
      if (sellerOrders.length === 0) {
        ordersContainer.innerHTML = '<p class="dashboard-muted">No orders include your products yet.</p>';
      } else {
        let html = `
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Units</th>
                  <th>Status</th>
                  <th>Demo earnings</th>
                  <th>Placed</th>
                </tr>
              </thead>
              <tbody>
        `;
        sellerOrders.forEach((order) => {
          const isCancelled = order.order_status === "cancelled";
          html += `
            <tr>
              <td><strong>BA-${order.id}</strong></td>
              <td>${escapeHtml(order.customer_name)}</td>
              <td>${escapeHtml(order.item_summary || "No items")}</td>
              <td>${order.units}</td>
              <td>${escapeHtml(order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1))}</td>
              <td>${formatCurrency(isCancelled ? 0 : order.line_total)}</td>
              <td>${formatDate(order.created_at)}</td>
            </tr>
          `;
        });
        html += `
              </tbody>
            </table>
          </div>
        `;
        ordersContainer.innerHTML = html;
      }
    }
  }

  function renderSellerListings() {
    const products = getProducts().filter((p) => p.created_by === user.id);
    const listingsContainer = document.querySelector("#seller-listings-container");
    if (!listingsContainer) return;

    if (products.length === 0) {
      listingsContainer.innerHTML = '<p class="dashboard-muted">You have not added any products yet.</p>';
      return;
    }

    let html = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Visibility</th>
              <th>Added</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
    `;

    products.forEach((p) => {
      const isVisible = p.is_active === 1 || p.is_active === true;
      html += `
        <tr>
          <td><strong>${escapeHtml(p.name)}</strong></td>
          <td>${escapeHtml(categoryLabel(p.category))}</td>
          <td>${formatCurrency(p.price)}</td>
          <td>${isVisible ? '<span style="color: green;">Visible</span>' : '<span style="color: var(--muted);">Hidden</span>'}</td>
          <td>${formatDate(p.created_at)}</td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="dashboard-button compact-button secondary" data-toggle-visibility="${p.id}">
                ${isVisible ? "Hide" : "Show"}
              </button>
              <button class="dashboard-button compact-button secondary" data-delete-product="${p.id}" style="color: var(--red);">
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    listingsContainer.innerHTML = html;

    // Attach listeners for delete and visibility toggle
    listingsContainer.querySelectorAll("[data-delete-product]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.deleteProduct);
        if (confirm("Are you sure you want to delete this product listing?")) {
          deleteProduct(id);
          showDashboardStatus("Product removed from storefront.");
          renderSellerListings();
        }
      });
    });

    listingsContainer.querySelectorAll("[data-toggle-visibility]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.toggleVisibility);
        const prod = getProductById(id);
        if (prod) {
          updateProduct({ id, is_active: prod.is_active ? 0 : 1 });
          showDashboardStatus(`Product is now ${prod.is_active ? "hidden from" : "visible on"} the storefront.`);
          renderSellerListings();
        }
      });
    });
  }

  // Create Product Form
  const createForm = document.querySelector("[data-product-create]");
  if (createForm) {
    createForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submitBtn = createForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      try {
        const formData = new FormData(createForm);
        const name = formData.get("name").toString().trim();
        const category = formData.get("category").toString();
        const price = parseFloat(formData.get("price").toString());
        const description = formData.get("description").toString().trim();
        const imageFile = formData.get("image");

        if (!name || name.length > 120) throw new Error("Enter a product name up to 120 characters.");
        if (isNaN(price) || price <= 0) throw new Error("Enter a valid price greater than zero.");
        if (!description) throw new Error("Please provide a product description.");

        let imagePath = "images/dokona1.jpeg";
        if (imageFile && imageFile.size > 0) {
          const dataUrl = await fileToDataUrl(imageFile);
          if (dataUrl) imagePath = dataUrl;
        }

        saveProduct({
          name,
          category,
          price,
          description,
          image_path: imagePath,
          created_by: user.id,
          is_active: 1,
          stock: 20
        });

        createForm.reset();
        showDashboardStatus("Product added to the storefront successfully.");
        renderSellerListings();
      } catch (err) {
        showDashboardStatus(err.message, true);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  renderSellerStatsAndOrders();
  renderSellerListings();
}

// ========================================================
// ADMIN DASHBOARD CONTROLLER
// ========================================================
function initAdminDashboard() {
  const user = requireRole("admin");
  if (!user) return;

  const nameHeader = document.querySelector("#admin-name-header");
  if (nameHeader) nameHeader.textContent = user.name;

  function renderAdminOverview() {
    const orders = getAllOrdersWithSummary();
    const users = getUsers();

    // Store Performance Stats
    const activeOrders = orders.filter((o) => o.order_status !== "cancelled" && o.payment_status === "demo_paid");
    const cancelledCount = orders.filter((o) => o.order_status === "cancelled").length;

    const catalogSales = activeOrders.reduce((sum, o) => sum + Number(o.subtotal), 0);
    const shippingFees = activeOrders.reduce((sum, o) => sum + Number(o.shipping_fee), 0);

    const orderCountEl = document.querySelector("#admin-order-count");
    const catalogSalesEl = document.querySelector("#admin-catalog-sales");
    const shippingFeesEl = document.querySelector("#admin-shipping-fees");
    const cancelledOrdersEl = document.querySelector("#admin-cancelled-orders");

    if (orderCountEl) orderCountEl.textContent = String(orders.length);
    if (catalogSalesEl) catalogSalesEl.textContent = formatCurrency(catalogSales);
    if (shippingFeesEl) shippingFeesEl.textContent = formatCurrency(shippingFees);
    if (cancelledOrdersEl) cancelledOrdersEl.textContent = String(cancelledCount);

    // Account Totals
    const totalAccountsEl = document.querySelector("#admin-total-accounts");
    const countAdminEl = document.querySelector("#admin-count-admin");
    const countSellerEl = document.querySelector("#admin-count-seller");
    const countCustomerEl = document.querySelector("#admin-count-customer");

    if (totalAccountsEl) totalAccountsEl.textContent = String(users.length);
    if (countAdminEl) countAdminEl.textContent = String(users.filter((u) => u.role === "admin").length);
    if (countSellerEl) countSellerEl.textContent = String(users.filter((u) => u.role === "seller").length);
    if (countCustomerEl) countCustomerEl.textContent = String(users.filter((u) => u.role === "customer").length);
  }

  function renderAdminOrders() {
    const orders = getAllOrdersWithSummary();
    const container = document.querySelector("#admin-orders-container");
    if (!container) return;

    if (orders.length === 0) {
      container.innerHTML = '<p class="dashboard-muted">No customer orders have been placed yet.</p>';
      return;
    }

    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];

    let html = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Subtotal</th>
              <th>Shipping</th>
              <th>Total</th>
              <th>Status</th>
              <th>Placed</th>
              <th>Update status</th>
            </tr>
          </thead>
          <tbody>
    `;

    orders.forEach((order) => {
      let optionsHtml = "";
      validStatuses.forEach((st) => {
        const isSelected = order.order_status === st ? "selected" : "";
        optionsHtml += `<option value="${st}" ${isSelected}>${st.charAt(0).toUpperCase() + st.slice(1)}</option>`;
      });

      html += `
        <tr>
          <td><strong>BA-${order.id}</strong></td>
          <td>
            <strong>${escapeHtml(order.customer_name)}</strong><br>
            <span class="dashboard-muted">${escapeHtml(order.customer_email)}</span><br>
            <span class="dashboard-muted order-address">Delivery: ${escapeHtml(order.shipping_address)}</span><br>
            <span class="dashboard-muted">Method: ${escapeHtml(order.payment_method)}</span>
          </td>
          <td>${escapeHtml(order.item_summary || "No items")}</td>
          <td>${formatCurrency(order.subtotal)}</td>
          <td>${formatCurrency(order.shipping_fee)}</td>
          <td><strong>${formatCurrency(order.total_amount)}</strong></td>
          <td><span class="role-badge">${escapeHtml(order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1))}</span></td>
          <td>${formatDate(order.created_at)}</td>
          <td>
            <form data-admin-order-status="${order.id}" style="display: flex; gap: 6px; align-items: center;">
              <select class="table-input" name="status" style="width: auto;">
                ${optionsHtml}
              </select>
              <button class="dashboard-button compact-button" type="submit">Save</button>
            </form>
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = html;

    // Attach order status update handlers
    container.querySelectorAll("[data-admin-order-status]").forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const orderId = Number(form.dataset.adminOrderStatus);
        const newStatus = form.elements.status.value;
        try {
          updateOrderStatus(orderId, newStatus);
          showDashboardStatus(`Order BA-${orderId} status changed to ${newStatus}.`);
          renderAdminOverview();
          renderAdminOrders();
        } catch (err) {
          showDashboardStatus(err.message, true);
        }
      });
    });
  }

  function renderAdminAccounts() {
    const users = getUsers();
    const container = document.querySelector("#admin-accounts-container");
    if (!container) return;

    let html = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>New password</th>
              <th>Created</th>
              <th>Save</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
    `;

    users.forEach((acc) => {
      const isSelf = acc.id === user.id;
      const isSuspended = acc.status === "suspended";

      html += `
        <tr>
          <td><input class="table-input" id="acc-name-${acc.id}" value="${escapeHtml(acc.name)}" maxlength="100" required></td>
          <td><input class="table-input" id="acc-email-${acc.id}" type="email" value="${escapeHtml(acc.email)}" maxlength="254" required></td>
          <td>
            <select class="table-input" id="acc-role-${acc.id}" ${isSelf ? 'title="You cannot change your own role"' : ""}>
              <option value="customer" ${acc.role === "customer" ? "selected" : ""}>Customer</option>
              <option value="seller" ${acc.role === "seller" ? "selected" : ""}>Seller</option>
              <option value="admin" ${acc.role === "admin" ? "selected" : ""}>Admin</option>
            </select>
          </td>
          <td>
            <span style="font-size: 10px; font-weight: 600; color: ${isSuspended ? "var(--red)" : "green"};">
              ${isSuspended ? "Suspended" : "Active"}
            </span>
          </td>
          <td><input class="table-input" id="acc-pass-${acc.id}" type="password" placeholder="Leave blank to keep"></td>
          <td>${formatDate(acc.created_at)}</td>
          <td><button class="dashboard-button compact-button" data-save-user="${acc.id}">Save</button></td>
          <td>
            <div style="display: flex; gap: 4px;">
              <button class="dashboard-button compact-button secondary" data-toggle-suspend="${acc.id}" ${isSelf ? "disabled" : ""}>
                ${isSuspended ? "Activate" : "Suspend"}
              </button>
              <button class="dashboard-button compact-button secondary" data-delete-user="${acc.id}" style="color: var(--red);" ${isSelf ? "disabled" : ""}>
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = html;

    // Attach save user handlers
    container.querySelectorAll("[data-save-user]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.saveUser);
        const nameInput = document.querySelector(`#acc-name-${id}`);
        const emailInput = document.querySelector(`#acc-email-${id}`);
        const roleSelect = document.querySelector(`#acc-role-${id}`);
        const passInput = document.querySelector(`#acc-pass-${id}`);

        try {
          const updateData = {
            id,
            name: nameInput.value,
            email: emailInput.value,
            role: roleSelect.value
          };
          if (passInput.value && passInput.value.trim().length >= 8) {
            updateData.password = passInput.value.trim();
          }

          // Check last admin safeguard if demoting
          const target = getUserById(id);
          if (target && target.role === "admin" && updateData.role !== "admin") {
            const adminCount = getUsers().filter((u) => u.role === "admin" && u.status === "active").length;
            if (adminCount <= 1) {
              throw new Error("The last active administrator account cannot be demoted.");
            }
          }

          updateUser(updateData);
          showDashboardStatus("Account information updated.");
          renderAdminOverview();
          renderAdminAccounts();
        } catch (err) {
          showDashboardStatus(err.message, true);
        }
      });
    });

    // Attach suspend / activate handler
    container.querySelectorAll("[data-toggle-suspend]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.toggleSuspend);
        const target = getUserById(id);
        if (!target) return;

        if (target.role === "admin" && target.status === "active") {
          const adminCount = getUsers().filter((u) => u.role === "admin" && u.status === "active").length;
          if (adminCount <= 1) {
            alert("The last active administrator account cannot be suspended.");
            return;
          }
        }

        const newStatus = target.status === "suspended" ? "active" : "suspended";
        updateUser({ id, status: newStatus });
        showDashboardStatus(`Account has been ${newStatus}.`);
        renderAdminOverview();
        renderAdminAccounts();
      });
    });

    // Attach delete user handler
    container.querySelectorAll("[data-delete-user]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.deleteUser);
        const target = getUserById(id);
        if (!target) return;

        if (confirm(`Are you sure you want to delete user account "${target.name}"?`)) {
          try {
            deleteUser(id);
            showDashboardStatus("Account deleted.");
            renderAdminOverview();
            renderAdminAccounts();
          } catch (err) {
            showDashboardStatus(err.message, true);
          }
        }
      });
    });
  }

  // Register New User Form
  const userCreateForm = document.querySelector("[data-user-create]");
  if (userCreateForm) {
    userCreateForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(userCreateForm);
      const name = formData.get("name").toString().trim();
      const email = formData.get("email").toString().trim();
      const role = formData.get("role").toString();
      const password = formData.get("password").toString();

      try {
        if (!name || name.length > 100) throw new Error("Enter a name up to 100 characters.");
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
        if (password.length < 8) throw new Error("Password must be at least 8 characters.");

        saveUser({ name, email, role, password, status: "active" });
        userCreateForm.reset();
        showDashboardStatus(`${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully.`);
        renderAdminOverview();
        renderAdminAccounts();
      } catch (err) {
        showDashboardStatus(err.message, true);
      }
    });
  }

  function renderAdminCatalog() {
    const products = getProducts();
    const users = getUsers();
    const container = document.querySelector("#admin-catalog-container");
    if (!container) return;

    if (products.length === 0) {
      container.innerHTML = '<p class="dashboard-muted">No products have been added yet.</p>';
      return;
    }

    let html = '<div class="managed-products">';
    products.forEach((p) => {
      const seller = users.find((u) => u.id === p.created_by);
      const sellerName = seller ? seller.name : "Admin";
      const isVisible = p.is_active === 1 || p.is_active === true;

      html += `
        <article class="managed-product" id="admin-prod-card-${p.id}">
          <img src="${escapeHtml(p.image_path)}" alt="${escapeHtml(p.name)}">
          <form class="dashboard-form" data-admin-product-edit="${p.id}">
            <label>Product name
              <input name="name" value="${escapeHtml(p.name)}" maxlength="120" required>
            </label>
            <label>Category
              <select name="category" required>
                <option value="dokhona" ${p.category === "dokhona" ? "selected" : ""}>Dokhona</option>
                <option value="jewelry" ${p.category === "jewelry" ? "selected" : ""}>Jewellery</option>
                <option value="aronai" ${p.category === "aronai" ? "selected" : ""}>Aronai</option>
                <option value="jwmgra" ${p.category === "jwmgra" ? "selected" : ""}>Jwmgra</option>
                <option value="other" ${p.category === "other" ? "selected" : ""}>Other</option>
              </select>
            </label>
            <label>Price (₹)
              <input name="price" type="number" min="0.01" max="99999999.99" step="0.01" value="${p.price}" required>
            </label>
            <label class="form-wide">Description
              <textarea name="description" rows="3" maxlength="2000" required>${escapeHtml(p.description)}</textarea>
            </label>
            <label class="form-wide">Replace image <span class="field-hint">(optional; JPEG, PNG or WebP up to 5 MB)</span>
              <input name="image" type="file" accept="image/jpeg,image/png,image/webp">
            </label>
            <label class="checkbox-label form-wide">
              <input name="is_active" type="checkbox" value="1" ${isVisible ? "checked" : ""}> Visible on the storefront
            </label>
            <p class="dashboard-muted form-wide">Added by ${escapeHtml(sellerName)}</p>
            <div style="display: flex; gap: 10px;" class="form-wide">
              <button class="dashboard-button" type="submit">Save product</button>
              <button class="dashboard-button secondary" type="button" data-admin-delete-prod="${p.id}" style="color: var(--red);">Delete product</button>
            </div>
          </form>
        </article>
      `;
    });
    html += "</div>";

    container.innerHTML = html;

    // Attach product edit submission handlers
    container.querySelectorAll("[data-admin-product-edit]").forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const id = Number(form.dataset.adminProductEdit);
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        try {
          const formData = new FormData(form);
          const name = formData.get("name").toString().trim();
          const category = formData.get("category").toString();
          const price = parseFloat(formData.get("price").toString());
          const description = formData.get("description").toString().trim();
          const is_active = formData.get("is_active") === "1" ? 1 : 0;
          const imageFile = formData.get("image");

          const updatePayload = {
            id,
            name,
            category,
            price,
            description,
            is_active
          };

          if (imageFile && imageFile.size > 0) {
            const dataUrl = await fileToDataUrl(imageFile);
            if (dataUrl) updatePayload.image_path = dataUrl;
          }

          updateProduct(updatePayload);
          showDashboardStatus("Product information updated.");
          renderAdminCatalog();
        } catch (err) {
          showDashboardStatus(err.message, true);
        } finally {
          if (submitBtn) submitBtn.disabled = false;
        }
      });
    });

    // Attach product deletion handlers
    container.querySelectorAll("[data-admin-delete-prod]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.adminDeleteProd);
        if (confirm("Are you sure you want to permanently delete this product?")) {
          deleteProduct(id);
          showDashboardStatus("Product deleted.");
          renderAdminCatalog();
        }
      });
    });
  }

  renderAdminOverview();
  renderAdminOrders();
  renderAdminAccounts();
  renderAdminCatalog();
}

// Auto-run dashboard controller based on page
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname.toLowerCase();
  if (path.endsWith("customer.html")) {
    initCustomerDashboard();
  } else if (path.endsWith("seller.html")) {
    initSellerDashboard();
  } else if (path.endsWith("admin.html")) {
    initAdminDashboard();
  }
});

if (document.readyState === "interactive" || document.readyState === "complete") {
  const path = window.location.pathname.toLowerCase();
  if (path.endsWith("customer.html")) {
    initCustomerDashboard();
  } else if (path.endsWith("seller.html")) {
    initSellerDashboard();
  } else if (path.endsWith("admin.html")) {
    initAdminDashboard();
  }
}
