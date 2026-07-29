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

// The /AIagent page is a mixed-case filename. macOS is case-insensitive so any
// spelling resolves locally, but production runs on a case-sensitive Linux FS
// where only the exact path would match and there is no 404 fallback. Redirect
// other casings to the canonical one.
app.get(/^\/aiagent(\.html)?$/i, (req, res, next) => {
  if (req.path === "/AIagent") return next();
  res.redirect(301, "/AIagent");
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
      if (isProd && /\.(png|jpg|jpeg|svg|ico|woff2?)$/.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=86400, immutable");
      }
    },
  })
);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Listening on http://0.0.0.0:${PORT}`);
});
