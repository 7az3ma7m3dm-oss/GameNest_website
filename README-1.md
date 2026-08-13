# GameNest Shop

A premium, single-page storefront for GameNest — Fortnite Crew subscriptions and V-Bucks, priced in EGP. Black / white / gray only, fully responsive, no JavaScript required.

## Files

```
index.html         Main page — all content lives here
style.css           Full design system and responsive layout
gamenest-logo.png   Store logo (used in navbar, hero, and footer)
README.md           This file
```

That's it — no build step, no dependencies to install, no `script.js`.

## About the logo

You mentioned you'd provide the GameNest logo, but no image file came through with the brief, so this ships with a **placeholder monogram** (a simple "GN" mark) at `gamenest-logo.png` so the site works out of the box.

**To use your real logo:** replace `gamenest-logo.png` with your own file, keeping the exact same filename (`gamenest-logo.png`). A square image (roughly 512×512px, PNG with a transparent or dark background) will look best in the navbar, hero visual, and footer. No HTML or CSS edits needed — every reference already points to that filename.

## Deploying to GitHub Pages

1. Create a new GitHub repository (or use an existing one).
2. Upload all four files to the **root** of the repository — do not put them in a subfolder.
3. Go to **Settings → Pages**.
4. Under "Build and deployment," set **Source** to `Deploy from a branch`, branch `main`, folder `/ (root)`.
5. Save. GitHub will publish the site at `https://<your-username>.github.io/<repo-name>/`.
6. It may take a minute or two for the first deploy to go live.

Because the logo is referenced as a relative path (`gamenest-logo.png`, no leading slash and no subfolder), it will resolve correctly whether the site is served from a project page or a custom domain.

## Editing content

- **Prices / plans:** each pricing tile lives inside `.p-card` blocks in `index.html` under the `CREW` and `V-BUCKS` sections.
- **Contact links:** Discord, WhatsApp, and Instagram URLs are set directly on the `<a>` tags inside the `CONTACT` section and the footer — update the `href` values to change destinations.
- **Colors/spacing:** all design tokens (colors, radii, fonts) are defined once at the top of `style.css` under `:root`, so site-wide adjustments start there.

## Notes

- FAQ accordion and mobile navigation are built with native HTML (`<details>` and a checkbox toggle), so nothing breaks if JavaScript is disabled.
- The page respects `prefers-reduced-motion` for users who've turned off animations at the OS level.
