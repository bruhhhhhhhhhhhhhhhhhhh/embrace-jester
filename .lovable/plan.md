

# LOOKSMAX.STORE — Brutalist Streetwear Landing Page

## Overview
A high-conversion streetwear ecommerce landing page that uses a forum-inspired "looksmax" aesthetic as its visual skin, while maintaining clean, proven ecommerce UX patterns underneath.

---

## Design System Setup
- **Color palette:** Deep matte black (`#141414`) background, dark card surfaces (`#1A1A1A`), sharp `#333` borders everywhere
- **Border radius: 0px** on all elements — fully brutalist, no rounding
- **Typography:** `Inter` (tight tracking, bold) for headers; `system-ui` for body text
- **Accent colors:** Blue (`#3E5F97`) for CTAs, Green (`#4CAF50`) for status/reputation, Gold (`#FFD700`) for prices

---

## Page Sections

### 1. Notification Bar
- Thin green top bar mimicking a "New Private Message" alert
- Text: *"FREE SHIPPING on orders over $100 [Click Here]"*
- Subtle pulse or static — forum-style urgency

### 2. Header
- **Left:** `[ LOOKSMAX.STORE ]` logo in monospace bold
- **Right:** Minimalist icon group — Search, User, Cart with item count badge
- Sharp bottom border, dark background — clean and utilitarian

### 3. Hero Section
- Large featured image or split-screen layout with streetwear imagery
- **Headline:** "DROP 001: STAT-CHECK COLLECTION."
- **Subheadline:** "Heavyweight cotton. Optimized fit. Mog or be mogged."
- **CTA Button:** High-contrast blue (`#3E5F97`), text: "ENTER WAREHOUSE"
- Raw, brutalist typography — big, bold, no fluff

### 4. Product Grid
- **3 columns desktop, 1 column mobile**
- Each product card:
  - 1:1 aspect ratio image (raw, no shadows)
  - Product title in white
  - Price in gold (`#FFD700`)
  - **Scarcity badge:** Red "LOCKED SOON" badge when stock < 5 (mimics locked thread icon)
  - **Social proof counter:** "🟢 XX Users Viewing" displayed under the title
  - **Hover state:** Reveals `[ ADD TO CART ]` text button
- ~6 sample products with placeholder images

### 5. Testimonials / Reviews Section
- Styled as "Verified User Posts" — forum thread aesthetic
- Each review card includes:
  - Gray silhouette avatar (default forum avatar)
  - Name: "Verified Purchaser" in green text
  - Badge: "Reputation: 99+"
  - Review text styled like a forum post
  - Timestamp in muted text
- 1px borders separating each "post"

### 6. Footer
- Minimal dark footer with navigation links
- Copyright notice and social icons
- Same sharp border aesthetic

---

## Conversion Features (Built-In)
- **Scarcity indicators** on low-stock items with "LOCKED SOON" red badges
- **Live viewer counts** on each product card for FOMO
- **Authority-styled reviews** with reputation badges to build trust
- **Sticky notification bar** for free shipping threshold

---

## Technical Notes
- Frontend-only — all product data will be hardcoded/mock data for now
- Fully responsive (mobile-first grid adjustments)
- No backend or authentication needed at this stage
- Smooth hover interactions on product cards for the quick-add button

