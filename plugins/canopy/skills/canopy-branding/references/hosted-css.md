# Custom CSS on the hosted pages

What `custom_css` may name. These names are kept: one may be added, none is renamed or removed. Anything else in the pages' markup is Canopy's own and can change.

## Tokens

A token is a custom property. Set it on `:root` to change every page, or under a page or class to change it there:

```css
:root {
  --hp-field-height: 48px;
  --hp-button-height: 48px;
}
```

Where a token overrides a setting, the CSS wins and the Console marks that setting as overridden. Prefer the setting when one covers the change.

### The page and card

| Token                  | Overrides the setting                                           |
| ---------------------- | --------------------------------------------------------------- |
| `--hp-page-background` | `background_color`, `background_dark_color`, `background_style` |
| `--hp-card-width`      | none: only CSS reaches it                                       |
| `--hp-card-padding`    | none: only CSS reaches it                                       |
| `--hp-card-background` | `surface_color`, `surface_dark_color`                           |
| `--hp-card-border`     | `card_style`                                                    |
| `--hp-card-radius`     | `corner_radius`                                                 |
| `--hp-card-shadow`     | `card_shadow`                                                   |

### Text

| Token                      | Overrides the setting           |
| -------------------------- | ------------------------------- |
| `--hp-font-family`         | `body_font`                     |
| `--hp-heading-font-family` | `heading_font`                  |
| `--hp-font-size`           | none: only CSS reaches it       |
| `--hp-text-color`          | `text_color`, `text_dark_color` |
| `--hp-muted-color`         | `text_color`, `text_dark_color` |
| `--hp-heading-size`        | none: only CSS reaches it       |
| `--hp-heading-weight`      | none: only CSS reaches it       |
| `--hp-heading-color`       | `text_color`, `text_dark_color` |
| `--hp-logo-height`         | none: only CSS reaches it       |

### Fields

| Token                     | Overrides the setting                 |
| ------------------------- | ------------------------------------- |
| `--hp-field-height`       | none: only CSS reaches it             |
| `--hp-field-padding`      | none: only CSS reaches it             |
| `--hp-field-radius`       | `corner_radius`                       |
| `--hp-field-border-width` | none: only CSS reaches it             |
| `--hp-field-border-color` | `text_color`, `text_dark_color`       |
| `--hp-field-background`   | `surface_color`, `surface_dark_color` |
| `--hp-field-color`        | `text_color`, `text_dark_color`       |
| `--hp-field-font-size`    | none: only CSS reaches it             |
| `--hp-field-focus-color`  | `primary_color`, `primary_dark_color` |
| `--hp-field-error-color`  | none: only CSS reaches it             |
| `--hp-field-gap`          | none: only CSS reaches it             |
| `--hp-label-size`         | none: only CSS reaches it             |
| `--hp-label-weight`       | none: only CSS reaches it             |
| `--hp-label-color`        | `text_color`, `text_dark_color`       |
| `--hp-hint-size`          | none: only CSS reaches it             |
| `--hp-hint-color`         | `text_color`, `text_dark_color`       |

### Buttons

| Token                                | Overrides the setting                 |
| ------------------------------------ | ------------------------------------- |
| `--hp-button-height`                 | none: only CSS reaches it             |
| `--hp-button-padding`                | none: only CSS reaches it             |
| `--hp-button-radius`                 | `corner_radius`                       |
| `--hp-button-font-size`              | none: only CSS reaches it             |
| `--hp-button-font-weight`            | none: only CSS reaches it             |
| `--hp-button-background`             | `primary_color`, `primary_dark_color` |
| `--hp-button-color`                  | `primary_color`, `primary_dark_color` |
| `--hp-button-hover-background`       | `primary_color`, `primary_dark_color` |
| `--hp-button-secondary-background`   | `surface_color`, `surface_dark_color` |
| `--hp-button-secondary-color`        | `text_color`, `text_dark_color`       |
| `--hp-button-secondary-border-color` | `text_color`, `text_dark_color`       |

### Everything else

| Token                     | Overrides the setting                                    |
| ------------------------- | -------------------------------------------------------- |
| `--hp-link-color`         | `primary_color`, `primary_dark_color`                    |
| `--hp-focus-color`        | `primary_color`, `primary_dark_color`                    |
| `--hp-line-color`         | `text_color`, `text_dark_color`                          |
| `--hp-alert-radius`       | `corner_radius`                                          |
| `--hp-error-color`        | none: only CSS reaches it                                |
| `--hp-success-color`      | none: only CSS reaches it                                |
| `--hp-footer-color`       | `background_color`, `background_dark_color`              |
| `--hp-footer-size`        | none: only CSS reaches it                                |
| `--hp-panel-background`   | `primary_color`, `primary_dark_color`, `panel_image_url` |
| `--hp-panel-color`        | `primary_color`, `primary_dark_color`                    |
| `--hp-panel-heading-size` | none: only CSS reaches it                                |

## Classes

A class takes any CSS property. The pages' own styles sit in a cascade layer below `custom_css`, so a rule on one of these wins without `!important`.

- **The page:** `.hp-col`, `.hp-card`, `.hp-brand`, `.hp-wordmark`, `.hp-head`, `.hp-sub`, `.hp-context`, `.hp-identity`, `.hp-mark`
- **The split layout:** `.hp-split`, `.hp-side`, `.hp-side-heading`, `.hp-side-text`
- **Fields:** `.hp-body`, `.hp-field`, `.hp-label`, `.hp-optional`, `.hp-hint`, `.hp-input`, `.hp-input--error`, `.hp-input--readonly`, `.hp-show`, `.hp-field-error`, `.hp-check`
- **Buttons and links:** `.hp-button`, `.hp-button--primary`, `.hp-button--secondary`, `.hp-button--social`, `.hp-button--small`, `.hp-social`, `.hp-social__item`, `.hp-link`, `.hp-links`, `.hp-divider`
- **Alerts:** `.hp-alert`, `.hp-alert--error`, `.hp-alert--success`, `.hp-alert--warning`, `.hp-alert-title`
- **Around the card:** `.hp-footer`, `.hp-attribution`, `.hp-custom-header`, `.hp-custom-notice`, `.hp-custom-footer`
- **The multi-factor and security pages:** `.hp-method`, `.hp-choice`, `.hp-codes`, `.hp-qr`, `.hp-copy`, `.hp-rows`, `.hp-row`, `.hp-section`, `.hp-badge`

## Pages and providers

Start a rule with a page's name to style one page: `[data-page="register"] .hp-card { padding: 40px; }`. The pages: `login`, `register`, `verify-first`, `forgot-password`, `reset-password`, `verify-email`, `mfa-challenge`, `mfa-enroll`, `mfa-enrollment-codes`, `security`, `security-account`, `security-add-factor`, `security-remove-factor`, `security-codes-regen`, `accept-invite`, `logout`, `sso-continue`, `sso-error`, `sso-test-result`, `social-test-result`, `form-expired`, `setup-expired`, `broken-sign-in-request`, `email-change-sign-in`.

A social sign-in button's form names its provider: `[data-provider="google"]`; the passkey button's is `[data-provider="passkey"]`.

## Dark look

Write the dark look inside `@media (prefers-color-scheme: dark)`. It follows the `color_scheme` setting: under `dark` the rules always apply, under `light` never, under `system` the visitor's device decides. `not`, `or` and a bare `(prefers-color-scheme)` are refused.

## Refused

`custom_css` is refused, with each problem's line, when it holds: `@import`, `@font-face`, or `url()`, `src()`, `image()`, `image-set()` in any value; a selector on a field's `value`; a name starting with `--_hp-`; the characters `</`; more than 20,000 characters; or CSS that does not parse.
