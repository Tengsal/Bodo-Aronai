/**
 * Bodo Aronai - Frontend Authentication & Session Management
 * Pure client-side authentication using localStorage.
 */

const roleDashboardPaths = {
  admin: "admin.html",
  seller: "seller.html",
  customer: "customer.html"
};

const DEMO_ACCOUNTS = [
  { name: "Demo Admin", email: "admin@bodoaronai.local", password: "AdminDemo123!", role: "admin" },
  { name: "Demo Seller", email: "seller@bodoaronai.local", password: "SellerDemo123!", role: "seller" },
  { name: "Demo Customer", email: "customer@bodoaronai.local", password: "CustomerDemo123!", role: "customer" }
];

let authUser = null;

function showAuthStatus(message, isError = false) {
  const authStatus = document.querySelector("#auth-status");
  if (!authStatus) return;
  authStatus.textContent = message;
  authStatus.classList.toggle("is-error", Boolean(isError));
}

function updateAuthButton(user) {
  authUser = user;
  const authTrigger = document.querySelector(".auth-trigger");
  if (!authTrigger) return;

  if (!user) {
    authTrigger.textContent = "Sign in";
    authTrigger.setAttribute("aria-label", "Sign in");
    return;
  }

  const labels = {
    admin: "Admin dashboard",
    seller: "Seller dashboard",
    customer: "My account"
  };
  authTrigger.textContent = labels[user.role] || "My account";
  authTrigger.setAttribute("aria-label", `Open ${labels[user.role] || "account"} for ${user.name}`);
}

function selectAuthTab(tabName) {
  const isRegister = tabName === "register";
  const loginForm = document.querySelector("#login-form");
  const registerForm = document.querySelector("#register-form");
  if (loginForm) loginForm.hidden = isRegister;
  if (registerForm) registerForm.hidden = !isRegister;

  document.querySelectorAll("[data-auth-tab]").forEach((tab) => {
    const isActive = tab.dataset.authTab === tabName;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-pressed", String(isActive));
  });
  showAuthStatus("");
}

function renderDemoAccounts() {
  const authDialog = document.querySelector("#auth-dialog");
  if (!authDialog) return;

  const existingList = authDialog.querySelector(".demo-account-list");
  if (existingList) existingList.remove();

  const notice = authDialog.querySelector(".demo-notice");
  if (!notice) return;

  notice.textContent = "Demo accounts are ready. Public registration creates customer accounts only.";

  const details = document.createElement("details");
  details.className = "demo-account-list";
  const summary = document.createElement("summary");
  summary.textContent = "Show demo account logins";
  const list = document.createElement("div");
  list.className = "demo-account-options";

  DEMO_ACCOUNTS.forEach((account) => {
    const button = document.createElement("button");
    button.className = "demo-account-option";
    button.type = "button";
    const role = document.createElement("strong");
    role.textContent = `${account.role.charAt(0).toUpperCase()}${account.role.slice(1)} demo`;
    const credentials = document.createElement("small");
    credentials.textContent = `${account.email} · ${account.password}`;
    button.append(role, credentials);
    button.addEventListener("click", () => {
      selectAuthTab("login");
      const loginForm = document.querySelector("#login-form");
      if (loginForm) {
        loginForm.elements.email.value = account.email;
        loginForm.elements.password.value = account.password;
        loginForm.elements.password.focus();
      }
      showAuthStatus("Demo credentials filled. Click Sign in to continue.");
    });
    list.append(button);
  });

  details.append(summary, list);
  notice.after(details);
}

function initAuth() {
  authUser = getCurrentUser();
  updateAuthButton(authUser);
  renderDemoAccounts();

  // Menu toggle mobile handler
  const menuToggle = document.querySelector(".menu-toggle");
  const mainNav = document.querySelector(".main-nav");
  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Open menu" : "Close menu");
      mainNav.classList.toggle("open", !isOpen);
    });

    mainNav.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        mainNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open menu");
      }
    });
  }

  // Dialog close buttons
  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => {
      const dialog = button.closest("dialog");
      if (dialog) dialog.close();
    });
  });

  const authDialog = document.querySelector("#auth-dialog");
  if (authDialog) {
    authDialog.addEventListener("close", () => {
      authDialog.querySelectorAll('input[type="password"]').forEach((input) => {
        input.value = "";
      });
      showAuthStatus("");
    });
  }

  // Auth trigger button
  const authTrigger = document.querySelector(".auth-trigger");
  if (authTrigger) {
    authTrigger.addEventListener("click", () => {
      if (authUser) {
        window.location.assign(roleDashboardPaths[authUser.role] || "customer.html");
        return;
      }
      showAuthStatus("");
      if (authDialog) {
        authDialog.showModal();
        const firstInput = document.querySelector("#login-form input");
        if (firstInput) firstInput.focus();
      }
    });
  }

  // Register trigger button
  document.querySelectorAll("[data-open-register]").forEach((button) => {
    button.addEventListener("click", () => {
      if (authUser) {
        window.location.assign(roleDashboardPaths[authUser.role] || "customer.html");
        return;
      }
      if (authDialog) {
        authDialog.showModal();
        selectAuthTab("register");
        const firstInput = document.querySelector("#register-form input");
        if (firstInput) firstInput.focus();
      }
    });
  });

  // Auth tab switcher
  document.querySelectorAll("[data-auth-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      selectAuthTab(button.dataset.authTab);
      const targetInput = document.querySelector(
        button.dataset.authTab === "register" ? "#register-form input" : "#login-form input"
      );
      if (targetInput) targetInput.focus();
    });
  });

  // Login form submission
  const loginForm = document.querySelector("#login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const formData = new FormData(form);
      const email = formData.get("email").toString().trim();
      const password = formData.get("password").toString();
      form.querySelector('input[type="password"]').value = "";

      const user = getUserByEmail(email);
      if (!user || user.password !== password) {
        showAuthStatus("Email or password is incorrect.", true);
        return;
      }

      if (user.status === "suspended") {
        showAuthStatus("This account has been suspended. Please contact the administrator.", true);
        return;
      }

      setCurrentUser(user);
      updateAuthButton(user);
      showAuthStatus(`Welcome, ${user.name}. Opening your dashboard.`);
      window.setTimeout(() => {
        window.location.assign(roleDashboardPaths[user.role] || "customer.html");
      }, 350);
    });
  }

  // Registration form submission
  const registerForm = document.querySelector("#register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const formData = new FormData(form);
      const name = formData.get("name").toString().trim();
      const email = formData.get("email").toString().trim();
      const password = formData.get("password").toString();
      const confirmPassword = formData.get("confirm-password").toString();

      form.querySelectorAll('input[type="password"]').forEach((input) => {
        input.value = "";
      });

      if (!name || name.length > 100) {
        showAuthStatus("Enter a name between 1 and 100 characters.", true);
        return;
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showAuthStatus("Enter a valid email address.", true);
        return;
      }
      if (password.length < 8) {
        showAuthStatus("Password must be at least 8 characters long.", true);
        return;
      }
      if (password !== confirmPassword) {
        showAuthStatus("The passwords do not match. Please try again.", true);
        return;
      }

      try {
        const newUser = saveUser({
          name,
          email,
          password,
          role: "customer",
          status: "active"
        });
        setCurrentUser(newUser);
        updateAuthButton(newUser);
        showAuthStatus(`Account created. Welcome, ${newUser.name}.`);
        window.setTimeout(() => {
          window.location.assign("customer.html");
        }, 350);
      } catch (err) {
        showAuthStatus(err.message, true);
      }
    });
  }
}

// Role guard for protected dashboard pages
function requireRole(allowedRole) {
  const user = getCurrentUser();
  if (!user) {
    window.location.assign("index.html");
    return null;
  }
  if (user.role !== allowedRole) {
    alert(`Access denied. You are signed in as a ${user.role}.`);
    window.location.assign(roleDashboardPaths[user.role] || "index.html");
    return null;
  }
  if (user.status === "suspended") {
    clearCurrentUser();
    alert("Your account has been suspended.");
    window.location.assign("index.html");
    return null;
  }
  return user;
}

// User logout handler
function logoutUser() {
  clearCurrentUser();
  window.location.assign("index.html");
}

document.addEventListener("DOMContentLoaded", initAuth);
if (document.readyState === "interactive" || document.readyState === "complete") {
  initAuth();
}
