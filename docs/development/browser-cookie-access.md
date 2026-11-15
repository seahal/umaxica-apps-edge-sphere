# Browser-side cookie access

This policy answers one question: when browser code has to read or write a
cookie, use the Cookie Store API through the global `cookieStore`. Do not
add a cookie library or use `document.cookie`.

## Current boundary

The Core packages currently have no browser cookie feature. On the
application-owned path, the Core Worker removes inbound `Cookie` before
TanStack runs and removes every outgoing `Set-Cookie`. Rails-owned
dispatch paths retain their existing Cookie and CSRF forwarding behavior.
Server-side cookie handling remains separate from this browser API rule.

## Rule for a future feature

Use `cookieStore` directly from browser code. Keep server cookie parsing in
the server layer. Feature-detect browser support and keep server-rendered markup
correct without a cookie read, because Cookie Store operations are asynchronous.

A browser feature must stay package-local. Do not introduce a shared helper
before a real feature needs one. Test supported and unsupported paths in the
Core package, then build and inspect bundle impact when the feature is added.

This is a design policy, not a claim that cookie behavior has been audited in
a browser.
