/* =============================================
   TOPPERS CO. — main.js
   ============================================= */

// ─────────────────────────────────────────────
// KLAVIYO CONFIG — SWAP THESE OUT
// ─────────────────────────────────────────────
const KLAVIYO_COMPANY_ID = "YOUR_KLAVIYO_COMPANY_ID"; // e.g. "aBcDeF"
const KLAVIYO_LIST_ID = "YOUR_KLAVIYO_LIST_ID"; // e.g. "Xy1234"
// To find these:
//   Company ID: Klaviyo → Settings → Account → API Keys → Public API Key
//   List ID:    Klaviyo → Lists & Segments → click your list → URL shows the ID
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// SHOPIFY CONFIG — SWAP THESE OUT
// ─────────────────────────────────────────────
// After setting up Shopify Starter ($5/mo):
//   1. Go to Shopify Admin → Sales Channels → Buy Button
//   2. Create a buy button for each product
//   3. Copy the product handle or ID for each
//   4. Replace the data-product-id values in index.html with your real IDs
//   5. Paste your Shopify store domain below
const SHOPIFY_DOMAIN = "your-store.myshopify.com"; // e.g. "toppersco.myshopify.com"
const SHOPIFY_STOREFRONT_TOKEN = "YOUR_STOREFRONT_ACCESS_TOKEN";
// Storefront token: Shopify Admin → Settings → Apps → Develop apps
// → Create app → configure Storefront API → copy Storefront API access token
// ─────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  // ── Nav scroll effect ──────────────────────
  const nav = document.getElementById("nav");
  window.addEventListener(
    "scroll",
    () => {
      nav.classList.toggle("scrolled", window.scrollY > 40);
    },
    { passive: true },
  );

  // ── Mobile menu ────────────────────────────
  const burger = document.getElementById("burger");
  const mobileMenu = document.getElementById("mobile-menu");
  let menuOpen = false;

  burger.addEventListener("click", () => {
    menuOpen = !menuOpen;
    mobileMenu.classList.toggle("open", menuOpen);
    document.body.style.overflow = menuOpen ? "hidden" : "";
    // Animate burger to X
    const spans = burger.querySelectorAll("span");
    if (menuOpen) {
      spans[0].style.transform = "translateY(6.5px) rotate(45deg)";
      spans[1].style.transform = "translateY(-6.5px) rotate(-45deg)";
    } else {
      spans[0].style.transform = "";
      spans[1].style.transform = "";
    }
  });

  // Close mobile menu when a link is clicked
  mobileMenu.querySelectorAll(".mm-link").forEach((link) => {
    link.addEventListener("click", () => {
      menuOpen = false;
      mobileMenu.classList.remove("open");
      document.body.style.overflow = "";
      burger.querySelectorAll("span").forEach((s) => (s.style.transform = ""));
    });
  });

  // ── Scroll reveal ──────────────────────────
  const revealEls = document.querySelectorAll(".reveal");
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
  );
  revealEls.forEach((el) => revealObserver.observe(el));

  // ── Klaviyo email capture ───────────────────
  const form = document.getElementById("klaviyo-form");
  const emailInput = document.getElementById("email-input");
  const submitBtn = document.getElementById("form-submit");
  const btnLabel = submitBtn.querySelector(".btn-label");
  const btnLoading = submitBtn.querySelector(".btn-loading");
  const successMsg = document.getElementById("form-success");
  const errorMsg = document.getElementById("form-error");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();

      // Basic validation
      if (!email || !email.includes("@")) {
        emailInput.style.borderColor = "#C8502A";
        emailInput.focus();
        return;
      }
      emailInput.style.borderColor = "";

      // Loading state
      btnLabel.style.display = "none";
      btnLoading.style.display = "inline";
      submitBtn.disabled = true;
      errorMsg.style.display = "none";

      try {
        const response = await fetch(
          `https://a.klaviyo.com/client/subscriptions/?company_id=${KLAVIYO_COMPANY_ID}`,
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              revision: "2023-02-22",
            },
            body: JSON.stringify({
              data: {
                type: "subscription",
                attributes: {
                  profile: {
                    data: {
                      type: "profile",
                      attributes: { email },
                    },
                  },
                },
                relationships: {
                  list: {
                    data: {
                      type: "list",
                      id: KLAVIYO_LIST_ID,
                    },
                  },
                },
              },
            }),
          },
        );

        if (response.ok || response.status === 202) {
          // Success
          form.querySelector(".form-row").style.display = "none";
          form.querySelector(".form-fine").style.display = "none";
          successMsg.style.display = "flex";
        } else {
          throw new Error(`Status ${response.status}`);
        }
      } catch (err) {
        console.error("Klaviyo error:", err);
        errorMsg.style.display = "block";
        btnLabel.style.display = "inline";
        btnLoading.style.display = "none";
        submitBtn.disabled = false;
      }
    });
  }

  // ── Shopify Buy Buttons ─────────────────────
  // This uses the Shopify Storefront API to add items to a cart
  // and redirect to checkout. Replace SHOPIFY_DOMAIN and
  // SHOPIFY_STOREFRONT_TOKEN at the top of this file.

  let shopifyCart = null;

  async function createCart() {
    const res = await fetch(
      `https://${SHOPIFY_DOMAIN}/api/2024-01/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
        },
        body: JSON.stringify({
          query: `mutation cartCreate {
          cartCreate {
            cart { id checkoutUrl }
          }
        }`,
        }),
      },
    );
    const data = await res.json();
    return data.data.cartCreate.cart;
  }

  async function addToCart(cartId, merchandiseId) {
    const res = await fetch(
      `https://${SHOPIFY_DOMAIN}/api/2024-01/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
        },
        body: JSON.stringify({
          query: `mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
          cartLinesAdd(cartId: $cartId, lines: $lines) {
            cart { id checkoutUrl }
          }
        }`,
          variables: {
            cartId,
            lines: [{ merchandiseId, quantity: 1 }],
          },
        }),
      },
    );
    const data = await res.json();
    return data.data.cartLinesAdd.cart;
  }

  // Attach click handlers to all buy buttons
  document.querySelectorAll(".shopify-buy-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const productId = btn.dataset.productId;

      // Guard: if placeholder IDs haven't been replaced yet, warn in console
      if (!productId || productId.startsWith("SHOPIFY_")) {
        console.warn(
          "Toppers Co: Replace SHOPIFY_PRODUCT_ID placeholders in index.html" +
            " and set SHOPIFY_DOMAIN + SHOPIFY_STOREFRONT_TOKEN in main.js",
        );
        alert("Shop coming soon! Get early access below.");
        document
          .getElementById("early-access")
          .scrollIntoView({ behavior: "smooth" });
        return;
      }

      const originalText = btn.textContent;
      btn.textContent = "Adding...";
      btn.disabled = true;

      try {
        // Create cart if we don't have one yet
        if (!shopifyCart) {
          shopifyCart = await createCart();
        }

        // merchandiseId must be a Shopify GID like:
        // "gid://shopify/ProductVariant/12345678"
        // Your Shopify product IDs from the Buy Button channel will be in this format
        const cart = await addToCart(
          shopifyCart.id,
          `gid://shopify/ProductVariant/${productId}`,
        );
        shopifyCart = cart;

        // Redirect to Shopify checkout
        window.location.href = cart.checkoutUrl;
      } catch (err) {
        console.error("Shopify error:", err);
        btn.textContent = "Try again";
        btn.disabled = false;
        setTimeout(() => {
          btn.textContent = originalText;
        }, 2000);
      }
    });
  });

  // ── Smooth scroll for anchor links ─────────
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const target = document.querySelector(anchor.getAttribute("href"));
      if (target) {
        e.preventDefault();
        const offset = 80; // nav height
        const top =
          target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: "smooth" });
      }
    });
  });
});
