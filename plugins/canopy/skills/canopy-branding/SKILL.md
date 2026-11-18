---
name: canopy-branding
description: Make Canopy's hosted sign-in, sign-up and account pages look like a customer's own website or design, through the Canopy MCP server's branding tools: colors, fonts, corner radius, card style, layout, and custom CSS with the published --hp-* tokens and hp-* classes. Use when the user wants the Canopy login or hosted pages to match their site, brand, screenshots or a design file, or asks to brand, theme or restyle them.
license: MIT
---

# Matching the hosted pages to a design

Canopy draws the sign-in, sign-up, password, MFA and account pages itself (the **hosted pages**). Each Environment has one **branding** that styles them. You change it through the `canopy` MCP server: `ApiBrandingController_getBranding`, `ApiBrandingController_updateBranding`, `ApiBrandingController_previewLink`, `ApiBrandingController_preview`, `ApiBrandingController_getPreviewPages` and `ApiBrandingController_getFonts`. Branding changes the look only: which fields a page has and their order are Canopy's.

## The flow

1. **Read the design.** A URL: fetch the page's HTML and its stylesheets (`curl -sL`, then the `<link rel="stylesheet">` files) and read the CSS, not only the text. Files the user gives (an HTML and CSS export, or screenshots): read them directly; Claude reads images. Look first at the site's own sign-in or sign-up form if it has one, then its buttons and inputs.
2. **Pick out the look.** The brand color (primary buttons and links), the page background, the text color, the card or panel color, the body and heading fonts, the corner radius of buttons and inputs, whether cards have a border or a shadow, and field and button heights. Prefer the site's CSS custom properties (`--brand`, `--color-primary`) over colors that appear once.
3. **Read the current branding** with `ApiBrandingController_getBranding`, so you change only what the design needs and can say what changes.
4. **Map to settings first**, then to tokens, then to class rules. Settings cover most of a design and stay editable in the Console; see the table below. Use `custom_css` only for what no setting reaches, and in it prefer a `--hp-*` token on `:root` over a rule on a class. [references/hosted-css.md](references/hosted-css.md) lists every token, class and page name.
5. **Preview before saving.** Nothing here saves. Call `ApiBrandingController_previewLink` with your changes in `branding`, `page: "login"` and `state: "Password"` (and `page: "register"`, `state: "Empty"` when sign-up matters): it answers a `url` that opens the real page in the new look for two minutes. Open it for the user (`open <url>` on macOS, `xdg-open` on Linux, `start` on Windows); if you cannot run that, give them the link. Never copy a page's HTML into a file. To check a value yourself, `ApiBrandingController_preview` answers the same page as HTML to read. Compare with the design value by value, and adjust.
6. **Save on the user's word**, with `ApiBrandingController_updateBranding`, sending only the fields you change. When the request already says to save the result, that is their word: save once the preview matches, without waiting to be asked again. Otherwise show the link and the changes, setting by setting, and wait. Then say what changed and where it shows: every hosted page of this Environment, on its next load.

## Mapping a design to settings

| In the design                               | Setting                                                                                                                     |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Brand color of buttons and links            | `primary_color` (six-digit hex; hover, focus and link shades are derived)                                                   |
| Page background behind the form             | `background_color`; a two-color fade is `background_style: "gradient"` with `gradient_start_color` and `gradient_end_color` |
| Text color                                  | `text_color` (secondary text, lines and field borders are derived)                                                          |
| The form's card or panel color              | `surface_color`                                                                                                             |
| Fonts                                       | `body_font`, `heading_font`: a font `id` from `ApiBrandingController_getFonts`, or the https URL of a WOFF2 file            |
| Button and input corner radius              | `corner_radius`: about 0 px `none`, 4 to 6 px `small`, 8 to 10 px `medium`, 12 px or more `large`                           |
| Card border                                 | `card_style`: `border` or `flat`                                                                                            |
| Card shadow                                 | `card_shadow`: `none`, `soft` or `strong`                                                                                   |
| A form beside a picture or marketing panel  | `layout: "split"`, with `panel_heading`, `panel_text`, `panel_image_url`                                                    |
| A dark site                                 | `color_scheme: "dark"` with the `*_dark_color` fields, or `"system"` to follow the visitor                                  |
| Product name, logo, favicon                 | `product_name`, `logo_url` (with `logo_kind`), `favicon_url`: https URLs the customer hosts                                 |
| Exact field or button height, padding, size | A token in `custom_css`, such as `:root { --hp-field-height: 48px; --hp-button-height: 48px; }`                             |

Pick the curated font that matches the design's font by name (`Inter` is `inter`, `DM Sans` is `dm-sans`). When the design's font is not in the list, use the closest curated font of the same kind and say so; use a WOFF2 URL only when the user gives one or the site serves one over https.

## Limits

- **No files from CSS.** `custom_css` is refused when it loads anything: `@import`, `@font-face`, `url()`, `src()`, `image()`, `image-set()`. Fonts go in `body_font` and `heading_font`; images in the logo, background and panel image fields.
- **Only published names.** A `--hp-*` token or `hp-*` class not in [references/hosted-css.md](references/hosted-css.md) is Canopy's own and can change; never style it. Names starting with `--_hp-` are refused.
- **Layout is the settings'.** A card or a split page. Fields cannot be moved, added or hidden.
- **Plan.** Everything beyond the product name, logo, favicon, primary and background colors and links needs the `hosted_page_customization` plan feature (Starter and above). A `403` with `plan_feature_unavailable` means the Account's plan lacks it: tell the user rather than retrying.
- **Page templates** (`page_template`) wrap the form in the customer's own HTML page, header and footer included, but apply only on a verified custom auth domain and can run scripts on the sign-in page. Suggest one only when the user wants their site's own header and footer around the form, and never write scripts into it.

## When the user only wants part of it

Change only what they asked for. "Use our colors" is the color fields; "match our fonts" is the font fields. Leave the rest as it is.
