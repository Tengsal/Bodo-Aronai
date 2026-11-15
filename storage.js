/**
 * Bodo Aronai - Centralized Frontend Storage Management System
 * Uses localStorage to persist users, products, orders, cart and demo transactions.
 */

const STORAGE_KEYS = {
  USERS: "bodo_users",
  PRODUCTS: "bodo_products",
  ORDERS: "bodo_orders",
  ORDER_ITEMS: "bodo_order_items",
  CART: "bodo_cart",
  CURRENT_USER: "bodo_current_user",
  TRANSACTIONS: "bodo_transactions"
};

const WHATSAPP_CONFIG = {
  phone: "918798174261",
  defaultMessage: "Hello Team, I have an inquiry regarding products.",
  getProductMessage: (productName) =>
    `Hello Team, I am interested in the ${productName} product. Could you please share more details?`
};

const DEFAULT_USERS = [
  {
    id: 1,
    name: "Demo Admin",
    email: "admin@bodoaronai.local",
    password: "AdminDemo123!",
    role: "admin",
    status: "active",
    created_at: "2026-01-01T10:00:00Z"
  },
  {
    id: 2,
    name: "Demo Seller",
    email: "seller@bodoaronai.local",
    password: "SellerDemo123!",
    role: "seller",
    status: "active",
    created_at: "2026-01-01T11:00:00Z"
  },
  {
    id: 3,
    name: "Demo Customer",
    email: "customer@bodoaronai.local",
    password: "CustomerDemo123!",
    role: "customer",
    status: "active",
    created_at: "2026-01-01T12:00:00Z"
  }
];

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: "Royal Blue Dokhona",
    category: "dokhona",
    description: "Deep blue cloth with an ornate gold-toned medallion and geometric borders.",
    price: 3200.00,
    image_path: "images/dokona1.jpeg",
    created_by: 2,
    is_active: 1,
    stock: 15,
    created_at: "2026-01-01T12:00:00Z"
  },
  {
    id: 2,
    name: "Golden Bloom Dokhona",
    category: "dokhona",
    description: "Warm mustard yellow with red floral details and decorative woven bands.",
    price: 3000.00,
    image_path: "images/dokona2.jpeg",
    created_by: 2,
    is_active: 1,
    stock: 20,
    created_at: "2026-01-02T12:00:00Z"
  },
  {
    id: 3,
    name: "Meadow Motif Dokhona",
    category: "dokhona",
    description: "Cream fabric with colourful motifs, framed by orange and red woven stripes.",
    price: 3400.00,
    image_path: "images/dokona3.jpeg",
    created_by: 2,
    is_active: 1,
    stock: 12,
    created_at: "2026-01-03T12:00:00Z"
  },
  {
    id: 4,
    name: "Evergreen Dokhona",
    category: "dokhona",
    description: "Bright green cloth with colourful floral bands and a fringed edge.",
    price: 2800.00,
    image_path: "images/dokona4.jpeg",
    created_by: 2,
    is_active: 1,
    stock: 18,
    created_at: "2026-01-04T12:00:00Z"
  },
  {
    id: 5,
    name: "Asan Cuff",
    category: "jewelry",
    description: "Bold silver-tone cuff with raised beaded edges and engraved curved details.",
    price: 2500.00,
    image_path: "images/asan.jpeg",
    created_by: 2,
    is_active: 1,
    stock: 25,
    created_at: "2026-01-05T12:00:00Z"
  },
  {
    id: 6,
    name: "Khera Crescent",
    category: "jewelry",
    description: "Crescent-shaped gold-tone ornament with a scalloped edge and dangling details.",
    price: 1800.00,
    image_path: "images/khera.jpeg",
    created_by: 2,
    is_active: 1,
    stock: 30,
    created_at: "2026-01-06T12:00:00Z"
  },
  {
    id: 7,
    name: "Khoromfula Earrings",
    category: "jewelry",
    description: "Pair of round, dome-shaped earrings with radiating ridges and openwork borders.",
    price: 2200.00,
    image_path: "images/khoromfula.jpeg",
    created_by: 2,
    is_active: 1,
    stock: 22,
    created_at: "2026-01-07T12:00:00Z"
  },
  {
    id: 8,
    name: "Thakhansri Set",
    category: "jewelry",
    description: "Statement necklace with coin-like drops, shown with matching circular earrings.",
    price: 4500.00,
    image_path: "images/thakhansri.jpeg",
    created_by: 2,
    is_active: 1,
    stock: 10,
    created_at: "2026-01-08T12:00:00Z"
  }
];

// Utility: Read JSON from localStorage
function getStoredItem(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return defaultValue;
  }
}

// Utility: Save JSON to localStorage
function setStoredItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to localStorage:`, err);
  }
}

// Storage Initialization
function initializeStorage() {
  if (localStorage.getItem(STORAGE_KEYS.USERS) === null) {
    setStoredItem(STORAGE_KEYS.USERS, DEFAULT_USERS);
  }
  if (localStorage.getItem(STORAGE_KEYS.PRODUCTS) === null) {
    setStoredItem(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS);
  }
  if (localStorage.getItem(STORAGE_KEYS.ORDERS) === null) {
    setStoredItem(STORAGE_KEYS.ORDERS, []);
  }
  if (localStorage.getItem(STORAGE_KEYS.ORDER_ITEMS) === null) {
    setStoredItem(STORAGE_KEYS.ORDER_ITEMS, []);
  }
  if (localStorage.getItem(STORAGE_KEYS.CART) === null) {
    setStoredItem(STORAGE_KEYS.CART, []);
  }
  if (localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) === null) {
    setStoredItem(STORAGE_KEYS.TRANSACTIONS, []);
  }
}

// Format currency in Indian Rupees
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(Number(amount) || 0);
}

// Format category string for display
function categoryLabel(category) {
  const labels = {
    dokhona: "Dokhona",
    jewelry: "Jewellery",
    aronai: "Aronai",
    jwmgra: "Jwmgra",
    other: "Other"
  };
  return labels[category] || (category ? category.charAt(0).toUpperCase() + category.slice(1) : "Other");
}

// Format ISO date string
function formatDate(isoString) {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch {
    return isoString;
  }
}

// Escape HTML characters for safe rendering
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  const div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
}

// ================= USER OPERATIONS =================
function getUsers() {
  return getStoredItem(STORAGE_KEYS.USERS, []);
}

function getUserById(id) {
  const users = getUsers();
  return users.find((u) => u.id === Number(id)) || null;
}

function getUserByEmail(email) {
  if (!email) return null;
  const users = getUsers();
  const normalized = email.toLowerCase().trim();
  return users.find((u) => u.email.toLowerCase() === normalized) || null;
}

function saveUser(userData) {
  const users = getUsers();
  const existing = getUserByEmail(userData.email);
  if (existing) {
    throw new Error("An account with that email already exists.");
  }
  const nextId = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;
  const newUser = {
    id: nextId,
    name: userData.name.trim(),
    email: userData.email.toLowerCase().trim(),
    password: userData.password,
    role: userData.role || "customer",
    status: userData.status || "active",
    created_at: userData.created_at || new Date().toISOString()
  };
  users.push(newUser);
  setStoredItem(STORAGE_KEYS.USERS, users);
  return newUser;
}

function updateUser(userData) {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === Number(userData.id));
  if (index === -1) {
    throw new Error("Account not found.");
  }

  const existingEmail = getUserByEmail(userData.email);
  if (existingEmail && existingEmail.id !== Number(userData.id)) {
    throw new Error("Another account is already using that email address.");
  }

  const current = users[index];
  const updatedUser = {
    ...current,
    name: userData.name !== undefined ? userData.name.trim() : current.name,
    email: userData.email !== undefined ? userData.email.toLowerCase().trim() : current.email,
    role: userData.role !== undefined ? userData.role : current.role,
    status: userData.status !== undefined ? userData.status : current.status
  };

  if (userData.password && userData.password.trim() !== "") {
    updatedUser.password = userData.password;
  }

  users[index] = updatedUser;
  setStoredItem(STORAGE_KEYS.USERS, users);

  // If updating current logged in user, keep session updated
  const currentAuth = getCurrentUser();
  if (currentAuth && currentAuth.id === updatedUser.id) {
    setCurrentUser(updatedUser);
  }

  return updatedUser;
}

function deleteUser(id) {
  const users = getUsers();
  const user = users.find((u) => u.id === Number(id));
  if (!user) throw new Error("Account not found.");

  // Check last admin safeguard
  if (user.role === "admin") {
    const adminCount = users.filter((u) => u.role === "admin" && u.status === "active").length;
    if (adminCount <= 1) {
      throw new Error("The last active administrator account cannot be deleted.");
    }
  }

  const filtered = users.filter((u) => u.id !== Number(id));
  setStoredItem(STORAGE_KEYS.USERS, filtered);
  return true;
}

// Current User Session
function getCurrentUser() {
  return getStoredItem(STORAGE_KEYS.CURRENT_USER, null);
}

function setCurrentUser(user) {
  if (!user) {
    setStoredItem(STORAGE_KEYS.CURRENT_USER, null);
    return;
  }
  const sessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status || "active"
  };
  setStoredItem(STORAGE_KEYS.CURRENT_USER, sessionUser);
}

function clearCurrentUser() {
  setStoredItem(STORAGE_KEYS.CURRENT_USER, null);
}

// ================= PRODUCT OPERATIONS =================
function getProducts() {
  return getStoredItem(STORAGE_KEYS.PRODUCTS, []);
}

function getActiveProducts() {
  return getProducts().filter((p) => p.is_active === 1 || p.is_active === true);
}

function getProductById(id) {
  const products = getProducts();
  return products.find((p) => p.id === Number(id)) || null;
}

function saveProduct(productData) {
  const products = getProducts();
  const existingName = products.find(
    (p) => p.name.toLowerCase().trim() === productData.name.toLowerCase().trim()
  );
  if (existingName) {
    throw new Error("A product with that name already exists.");
  }

  const nextId = products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1;
  const newProduct = {
    id: nextId,
    name: productData.name.trim(),
    category: productData.category,
    description: productData.description.trim(),
    price: Number(productData.price),
    image_path: productData.image_path || "images/dokona1.jpeg",
    created_by: productData.created_by ? Number(productData.created_by) : null,
    is_active: productData.is_active !== undefined ? (productData.is_active ? 1 : 0) : 1,
    stock: productData.stock !== undefined ? Number(productData.stock) : 15,
    created_at: productData.created_at || new Date().toISOString()
  };

  products.push(newProduct);
  setStoredItem(STORAGE_KEYS.PRODUCTS, products);
  return newProduct;
}

function updateProduct(productData) {
  const products = getProducts();
  const index = products.findIndex((p) => p.id === Number(productData.id));
  if (index === -1) {
    throw new Error("Product not found.");
  }

  const existingName = products.find(
    (p) => p.name.toLowerCase().trim() === productData.name.toLowerCase().trim() && p.id !== Number(productData.id)
  );
  if (existingName) {
    throw new Error("A product with that name already exists.");
  }

  const current = products[index];
  const updatedProduct = {
    ...current,
    name: productData.name !== undefined ? productData.name.trim() : current.name,
    category: productData.category !== undefined ? productData.category : current.category,
    description: productData.description !== undefined ? productData.description.trim() : current.description,
    price: productData.price !== undefined ? Number(productData.price) : current.price,
    image_path: productData.image_path !== undefined ? productData.image_path : current.image_path,
    is_active: productData.is_active !== undefined ? (productData.is_active ? 1 : 0) : current.is_active,
    stock: productData.stock !== undefined ? Number(productData.stock) : (current.stock || 0)
  };

  products[index] = updatedProduct;
  setStoredItem(STORAGE_KEYS.PRODUCTS, products);
  return updatedProduct;
}

function deleteProduct(id) {
  const products = getProducts();
  const filtered = products.filter((p) => p.id !== Number(id));
  setStoredItem(STORAGE_KEYS.PRODUCTS, filtered);
  return true;
}

// ================= CART OPERATIONS =================
function getCart() {
  return getStoredItem(STORAGE_KEYS.CART, []);
}

function saveCart(cartItems) {
  setStoredItem(STORAGE_KEYS.CART, cartItems);
}

function clearCart() {
  setStoredItem(STORAGE_KEYS.CART, []);
}

// ================= ORDER & TRANSACTION OPERATIONS =================
function getOrders() {
  return getStoredItem(STORAGE_KEYS.ORDERS, []);
}

function getOrderItems() {
  return getStoredItem(STORAGE_KEYS.ORDER_ITEMS, []);
}

function getOrderById(id) {
  const orders = getOrders();
  return orders.find((o) => o.id === Number(id)) || null;
}

function getOrdersByCustomerId(customerId) {
  const orders = getOrders();
  const items = getOrderItems();
  return orders
    .filter((o) => o.customer_id === Number(customerId))
    .map((order) => {
      const orderItems = items.filter((i) => i.order_id === order.id);
      const item_summary = orderItems.map((i) => `${i.product_name} × ${i.quantity}`).join(", ");
      return { ...order, items: orderItems, item_summary };
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function getOrdersBySellerId(sellerId) {
  const orders = getOrders();
  const items = getOrderItems();
  const sellerItems = items.filter((i) => i.seller_id === Number(sellerId));
  const sellerOrderIds = [...new Set(sellerItems.map((i) => i.order_id))];

  return orders
    .filter((o) => sellerOrderIds.includes(o.id))
    .map((order) => {
      const matchedItems = sellerItems.filter((i) => i.order_id === order.id);
      const units = matchedItems.reduce((acc, curr) => acc + curr.quantity, 0);
      const line_total = matchedItems.reduce((acc, curr) => acc + curr.unit_price * curr.quantity, 0);
      const item_summary = matchedItems.map((i) => `${i.product_name} × ${i.quantity}`).join(", ");
      return {
        ...order,
        units,
        line_total,
        item_summary,
        items: matchedItems
      };
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function getAllOrdersWithSummary() {
  const orders = getOrders();
  const items = getOrderItems();
  return orders
    .map((order) => {
      const matchedItems = items.filter((i) => i.order_id === order.id);
      const item_summary = matchedItems.map((i) => `${i.product_name} × ${i.quantity}`).join(", ");
      return { ...order, items: matchedItems, item_summary };
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function createOrder({ customerId, customerName, customerEmail, shippingAddress, paymentMethod, items }) {
  const allOrders = getOrders();
  const allOrderItems = getOrderItems();
  const allProducts = getProducts();
  const allTransactions = getStoredItem(STORAGE_KEYS.TRANSACTIONS, []);

  // Validate items and calculate subtotal
  if (!items || items.length === 0) {
    throw new Error("Your bag is empty.");
  }

  let subtotal = 0;
  const processedItems = [];

  for (const item of items) {
    const product = allProducts.find((p) => p.id === Number(item.id));
    if (!product || !product.is_active) {
      throw new Error(`The product "${item.name || item.id}" is no longer available.`);
    }
    const qty = Number(item.quantity) || 1;
    const price = Number(product.price);
    subtotal += price * qty;

    // Deduct stock if available
    if (typeof product.stock === "number") {
      product.stock = Math.max(0, product.stock - qty);
    }

    processedItems.push({
      product_id: product.id,
      seller_id: product.created_by,
      product_name: product.name,
      unit_price: price,
      quantity: qty
    });
  }

  const shippingFee = subtotal >= 2500 ? 0 : 99;
  const totalAmount = subtotal + shippingFee;
  const nextOrderId = allOrders.length > 0 ? Math.max(...allOrders.map((o) => o.id)) + 1 : 1001;

  const isCod = paymentMethod === "cod_demo";
  const paymentStatus = isCod ? "pending" : "demo_paid";
  const initialOrderStatus = "pending";

  const orderRecord = {
    id: nextOrderId,
    customer_id: Number(customerId),
    customer_name: customerName.trim(),
    customer_email: customerEmail.toLowerCase().trim(),
    shipping_address: shippingAddress.trim(),
    payment_method: paymentMethod,
    payment_status: paymentStatus,
    order_status: initialOrderStatus,
    subtotal: subtotal,
    shipping_fee: shippingFee,
    total_amount: totalAmount,
    inventory_restored: false,
    created_at: new Date().toISOString()
  };

  const nextItemId = allOrderItems.length > 0 ? Math.max(...allOrderItems.map((i) => i.id)) + 1 : 1;
  const newOrderItems = processedItems.map((pi, idx) => ({
    id: nextItemId + idx,
    order_id: nextOrderId,
    ...pi
  }));

  // Create simulated transaction
  const txnId = "TXN-" + Date.now().toString(36).toUpperCase() + "-" + Math.floor(1000 + Math.random() * 9000);
  const transactionRecord = {
    id: txnId,
    order_id: nextOrderId,
    customer_id: Number(customerId),
    amount: totalAmount,
    payment_method: paymentMethod,
    payment_status: paymentStatus,
    transaction_type: "payment",
    created_at: new Date().toISOString()
  };

  // Commit updates to localStorage
  allOrders.push(orderRecord);
  setStoredItem(STORAGE_KEYS.ORDERS, allOrders);
  setStoredItem(STORAGE_KEYS.ORDER_ITEMS, [...allOrderItems, ...newOrderItems]);
  setStoredItem(STORAGE_KEYS.PRODUCTS, allProducts);

  allTransactions.push(transactionRecord);
  setStoredItem(STORAGE_KEYS.TRANSACTIONS, allTransactions);

  // Clear cart
  clearCart();

  return {
    order: orderRecord,
    items: newOrderItems,
    transaction: transactionRecord
  };
}

function updateOrderStatus(orderId, newStatus) {
  const orders = getOrders();
  const index = orders.findIndex((o) => o.id === Number(orderId));
  if (index === -1) throw new Error("Order not found.");

  const order = orders[index];
  if (newStatus === "cancelled" && order.order_status !== "cancelled") {
    return cancelOrder(orderId);
  }

  order.order_status = newStatus;
  order.updated_at = new Date().toISOString();
  orders[index] = order;
  setStoredItem(STORAGE_KEYS.ORDERS, orders);
  return order;
}

function cancelOrder(orderId) {
  const orders = getOrders();
  const index = orders.findIndex((o) => o.id === Number(orderId));
  if (index === -1) throw new Error("Order not found.");

  const order = orders[index];
  const cancellableStatuses = ["pending", "confirmed", "processing"];

  if (order.order_status === "cancelled") {
    throw new Error("This order has already been cancelled.");
  }
  if (!cancellableStatuses.includes(order.order_status.toLowerCase())) {
    throw new Error(`Orders with status "${order.order_status}" cannot be cancelled.`);
  }

  // Restore inventory exactly once
  if (!order.inventory_restored) {
    const allProducts = getProducts();
    const allItems = getOrderItems().filter((i) => i.order_id === order.id);

    for (const item of allItems) {
      const prod = allProducts.find((p) => p.id === item.product_id);
      if (prod && typeof prod.stock === "number") {
        prod.stock += item.quantity;
      }
    }
    setStoredItem(STORAGE_KEYS.PRODUCTS, allProducts);
    order.inventory_restored = true;
  }

  // Handle simulated refund / cancellation status
  if (order.payment_status === "demo_paid") {
    order.payment_status = "refunded"; // Simulated Refunded
  } else {
    order.payment_status = "cancelled";
  }

  order.order_status = "cancelled";
  order.cancelled_at = new Date().toISOString();
  orders[index] = order;
  setStoredItem(STORAGE_KEYS.ORDERS, orders);

  // Record refund transaction
  const allTransactions = getStoredItem(STORAGE_KEYS.TRANSACTIONS, []);
  allTransactions.push({
    id: "TXN-REFUND-" + Date.now().toString(36).toUpperCase(),
    order_id: order.id,
    customer_id: order.customer_id,
    amount: order.total_amount,
    payment_method: order.payment_method,
    payment_status: order.payment_status,
    transaction_type: "refund",
    created_at: new Date().toISOString()
  });
  setStoredItem(STORAGE_KEYS.TRANSACTIONS, allTransactions);

  return order;
}

// Auto-run storage initialization on script load
initializeStorage();
