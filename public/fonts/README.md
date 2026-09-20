# Fonts

`Handel Gothic D Bold.otf` is the face used for strategy card names in the
action phase. It's a commercial font, so treat it as a local asset — don't
redistribute the repo with it if that matters to you.

The `@font-face` block at the top of `src/styles.css` points at this exact
filename, percent-encoded because of the spaces:

    url('/fonts/Handel%20Gothic%20D%20Bold.otf') format('opentype')

It also lists `HandelGothicD-Bold.woff2` / `.woff` / `.ttf` and a `local()`
lookup as alternates, so a differently named drop-in or an installed system
copy works too. If none of them resolve, names fall back to Titillium Web.

`index.html` preloads the file so the names don't flash the fallback face on
first paint. If you rename or replace the font, update both places.
