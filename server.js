const compression = require("compression");
const express = require("express");
const helmet = require("helmet");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const root = __dirname;
const isProd = process.env.NODE_ENV === "production";

app.disable("x-powered-by");
app.use(compression());
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Themed pages use mixed-case filenames. macOS is case-insensitive so any
// spelling resolves locally, but production runs on a case-sensitive Linux FS
// where only the exact path would match and there is no 404 fallback. Redirect
// every other casing to the canonical one.
const MIXED_CASE_PAGES = ["/timeTravel"];
const canonicalByLowercase = new Map(
  MIXED_CASE_PAGES.map((p) => [p.toLowerCase(), p])
);

// Pages that have moved. The agent-facing page was promoted to the site root,
// so /AIagent now lives at /, and the portfolio it displaced moved to /human.
// These paths were published, so keep them working rather than 404ing.
const MOVED_PAGES = new Map([["/aiagent", "/"]]);

app.get(/^\/[a-z]+(\.html)?$/i, (req, res, next) => {
  const key = req.path.replace(/\.html$/i, "").toLowerCase();

  const moved = MOVED_PAGES.get(key);
  if (moved) return res.redirect(301, moved);

  const canonical = canonicalByLowercase.get(key);
  if (!canonical || req.path === canonical) return next();
  res.redirect(301, canonical);
});

app.use(
  express.static(root, {
    index: "index.html",
    extensions: ["html"],
    maxAge: isProd ? "1d" : 0,
    etag: true,
    lastModified: true,
    setHeaders(res, filePath) {
      if (filePath.endsWith(".json")) {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
      }
      if (filePath.endsWith(".txt")) {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
      }
      if (filePath.endsWith(".pdf")) {
        res.setHeader("Content-Type", "application/pdf");
      }
      if (filePath.endsWith(".xml")) {
        res.setHeader("Content-Type", "application/xml; charset=utf-8");
      }
      if (filePath.endsWith("security.txt")) {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
      }
      // Documents and code must revalidate on every load. "no-cache" still
      // stores the file, it just forces a conditional request first, which
      // returns a cheap 304 when nothing changed. Without this the 1d maxAge
      // above means a deploy stays invisible to returning visitors for up to
      // a day, since the browser never even asks whether the file changed.
      // profile.json and llms.txt are included because /AIagent tells agents
      // the JSON is canonical, and stale canonical data is worse than a extra
      // conditional request.
      if (/\.(html|css|js|json|txt)$/.test(filePath)) {
        res.setHeader("Cache-Control", "no-cache");
      }

      // Static assets are content-stable, so they keep the long cache.
      if (isProd && /\.(png|jpg|jpeg|svg|ico|woff2?)$/.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=86400, immutable");
      }
    },
  })
);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Listening on http://0.0.0.0:${PORT}`);
});
