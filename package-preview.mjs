// Turns the static export in out/ into a self-relative preview bundle in preview/.
// Used only for sharing a hosted preview; production deploys use `next build`.
import { cpSync, readFileSync, writeFileSync, rmSync, readdirSync, statSync, renameSync } from "node:fs";
import { join, extname } from "node:path";

const root = join(import.meta.dirname, "..");
const src = join(root, "out");
const dest = join(root, "preview");
rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });
// Some hosts reserve names starting with "_", so serve Next's assets from gq-static/.
const ASSETS = "gq-static";
renameSync(join(dest, "_next"), join(dest, ASSETS));

const textExt = new Set([".html", ".js", ".css", ".txt", ".json"]);
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (textExt.has(extname(p))) {
      const s = readFileSync(p, "utf8")
        .replaceAll('"/_next/', '"./_next/')
        .replaceAll("'/_next/", "'./_next/")
        .replaceAll("(/_next/", "(./_next/")
        .replaceAll('"/images/', '"./images/')
        .replaceAll('url(/_next/', 'url(./_next/');
      // Next derives its asset prefix at runtime by finding "/_next/" in the script URL.
      const fixed = s
        .replaceAll('indexOf("./_next/")', `indexOf("/${ASSETS}/")`)
        .replaceAll("./_next/", `./${ASSETS}/`)
        // Escape literal U+FFFD (only found inside JS string literals) so hosts don't flag it as corruption.
        .replaceAll("\uFFFD", "\\uFFFD");
      writeFileSync(p, fixed);
    }
  }
}
walk(dest);

// The artifact host supplies <html>/<head>/<body> for the main page, so emit
// its inner content and restore the root classes with a tiny script.
const html = readFileSync(join(dest, "index.html"), "utf8");
const htmlClass = html.match(/<html[^>]*class="([^"]*)"/)?.[1] ?? "";
const bodyClass = html.match(/<body[^>]*class="([^"]*)"/)?.[1] ?? "";
const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? "";
const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/)?.[1] ?? "";
const headClean = head.replace(/<meta charSet="utf-8"\/>/, "").replace(/<meta name="viewport"[^>]*\/>/, "");
const boot = `<script>document.documentElement.className=${JSON.stringify(htmlClass)};document.documentElement.lang="en-IN";</script>`;
writeFileSync(
  join(dest, "page.html"),
  `${headClean}${boot}<script>document.body.className=${JSON.stringify(bodyClass)};</script>${body}`,
);

// Other pages stay full documents. Nested ones get a <base> so the root-relative
// "./" asset and link paths resolve from the preview root.
const pages = [];
function collect(dir, depth) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name !== ASSETS && name !== "images") collect(p, depth + 1);
    } else if (name.endsWith(".html") && !["index.html", "page.html", "404.html", "_not-found.html"].includes(name)) {
      pages.push(p.slice(dest.length + 1));
      if (depth > 0) {
        const doc = readFileSync(p, "utf8").replace("<head>", `<head><base href="${"../".repeat(depth)}">`);
        writeFileSync(p, doc);
      }
    }
  }
}
collect(dest, 0);
writeFileSync(join(dest, "pages.json"), JSON.stringify(pages, null, 2));
console.log("preview ready:", dest, `(${pages.length} extra pages)`);
