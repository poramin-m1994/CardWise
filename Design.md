# Design System Document

## 1. Overview & Creative North Star

The Creative North Star for this design system is **"The Luminescent Ledger."**

In an industry often defined by cold, rigid spreadsheets, this system prioritizes a high-end editorial feel that balances professional authority with an approachable, organic glow. We break the "template" look by eschewing traditional lines in favor of **Tonal Layering**. The experience is designed to feel like a high-performance cockpit—dark, focused, and immersive—where vibrant green accents act as luminous beacons for action and success. We use intentional negative space and a sophisticated typography scale to transform financial data into a curated narrative.

## 2. Colors

Our palette is built on a foundation of deep atmospheric navies, punctuated by a hyper-vibrant "Success Green."

* **Primary (#4ade80 / #6bfb9a):** Reserved exclusively for high-priority actions, success states, and growth indicators. Use the vibrant `primary` for text/icons on dark surfaces and `primary_container` for large interactive blocks.
* **Surface Hierarchy:** Our "Background" (`#0b1326`) is the void. We build upward using `surface_container_low` for sections and `surface_container_high` for interactive cards.
* **The "No-Line" Rule:** 1px solid borders are strictly prohibited for sectioning. Boundaries must be defined solely through background color shifts. If you need to separate the header from the body, shift from `surface` to `surface_container_low`.
* **The "Glass & Gradient" Rule:** To provide "soul" to the UI, main CTAs should utilize a subtle linear gradient from `primary` to `primary_container`. Floating modals or navigation bars should use Glassmorphism: a semi-transparent `surface_container` color with a `blur(20px)` backdrop filter.

## 3. Typography

We utilize a dual-font strategy to balance editorial sophistication with functional clarity.

* **Display & Headlines (Manrope):** Chosen for its modern, geometric structure. Large `display-lg` and `headline` styles should use tighter letter-spacing (-0.02em) to create a "locked-in" editorial look.
* **Body & Labels (Inter):** The workhorse for financial data. Inter provides maximum legibility at small sizes (`body-sm`, `label-md`).
* **Hierarchy as Identity:** Use `title-lg` in `primary` color to highlight key financial totals, creating a clear visual anchor for the user’s eye. Labels should remain in `on_surface_variant` to keep the UI from feeling cluttered.

## 4. Elevation & Depth

In this design system, depth is felt, not seen. We move away from the "pasted on" look of traditional shadows.

* **The Layering Principle:** Stacking determines importance.
* *Level 0:* `surface` (The base canvas)
* *Level 1:* `surface_container_low` (Large content areas)
* *Level 2:* `surface_container_highest` (Interactive cards/inputs)
* **Ambient Shadows:** For floating elements like dropdowns or tooltips, use an ultra-diffused shadow: `box-shadow: 0 20px 40px rgba(6, 14, 32, 0.6)`. The shadow is a deeper tint of our background, not black.
* **The "Ghost Border" Fallback:** If accessibility requires a container definition (e.g., input fields), use a "Ghost Border": `outline_variant` at 15% opacity. This provides a hint of structure without breaking the organic flow.

## 5. Components

### Buttons

* **Primary:** Solid `primary_container` with `on_primary_container` text. Radius: `md` (0.75rem). Use a subtle inner-glow on hover.
* **Secondary:** Glassmorphic. Semi-transparent `secondary_container` with a `ghost border`.
* **Tertiary:** Ghost style. No background, `primary` text. Used for "Cancel" or "Go Back."

### Cards & Lists

* **Rule:** Forbid the use of divider lines.
* **Implementation:** Use `spacing-4` (1rem) to separate list items. For tabular data, use alternating tonal shifts (zebra striping) with `surface_container_low` and `surface_container_lowest` rather than borders.

### Input Fields

* **Styling:** Inputs use `surface_container_highest` backgrounds. The "active" state is indicated by a `primary` ghost border and a soft glow effect. Labels should sit above the field in `label-md`.

### Chips

* **Usage:** For categories (e.g., "Food," "Travel"). Use `secondary_container` with a `sm` (0.25rem) radius. Active states should switch to the `primary` colorway.

### Financial Progress (Specific to App)

* **The "Luminous Bar":** Progress bars should never be flat. Use a gradient from `primary` to `primary_fixed` with a subtle outer glow (drop-shadow) to make the "wealth" or "limit" feel tangible.

## 6. Do's and Don'ts

### Do

* **Do** use vertical white space (from the `8` or `10` spacing scale) to separate major modules.
* **Do** use `primary` sparingly. It is a highlighter, not a primary paint.
* **Do** ensure all text on `surface` backgrounds meets a 4.5:1 contrast ratio using the `on_surface` tokens.

### Don't

* **Don't** use 100% white (#FFFFFF) for body text. Use `on_surface_variant` (#bccabb) to reduce eye strain in the dark theme.
* **Don't** use sharp 90-degree corners. Everything must feel approachable through the `md` or `lg` roundedness scale.
* **Don't** stack more than three layers of surfaces, or the UI will lose its "Luminescent" quality and feel heavy.
