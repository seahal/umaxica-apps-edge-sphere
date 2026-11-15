# Core UI shell contract

**Status: normative for `app/core` and `org/core`.** This contract describes
the current Core HTML shell. It does not define the appearance of Apex or
public content packages now owned by other repositories.

Both Core packages keep their own shell, stylesheet, theme and localization
files. Their implementations remain standalone. Read this contract alongside
the [keyboard guidelines](keyboard-guidelines.md) and the package's
`test/ui-shell-contract.test.tsx`.

## Document structure

The root route owns `<html>`, `<head>` and `<body>`. Each document-producing
route owns exactly one `<title>`. The pathless application layout supplies the skip
link, header, primary navigation and footer. The page route supplies its own
single `<main id="main-content">`; do not add a second main around the route outlet.

The navigation is a sibling of the header. The header contains the brand link
and the narrow-screen menu button. The menu is a real button with
`aria-expanded` and `aria-controls`. Primary navigation links identify the
exact current page with `aria-current="page"`; the visual current state must come
from that same attribute.

The skip link is the first focusable element and moves focus to the main
content. Route changes announce the resolved document title through the
existing live region. Status documents remain outside the application chrome
and retain their own title.

## Responsive layout and styling

Tailwind CSS v4 utilities express layout and component styling. Each Core owns
its stylesheet and `@theme`; do not add a shared preset or a second styling
system. The `wide` breakpoint is a local theme token used to move from a
single-column layout to the navigation rail layout.

Use semantic HTML and visible keyboard focus. Color alone must not identify
the selected navigation item or another state. Preserve the existing brand
color token and focus ring rules in each Core stylesheet.

## Localization and metadata

Core display locale comes from the validated last scalar `lx` URL parameter,
or the existing Japanese default. The document `lang` follows the resolved
locale. See [Core display locale](../development/core-display-locale.md).

Each route owns its title and metadata. The root document must not add a second
title, and failure documents keep their own title.

The package shell tests are the conformance checks for emitted markup and
keyboard behavior. This policy does not claim that every rendered page has
been reviewed in a browser.
