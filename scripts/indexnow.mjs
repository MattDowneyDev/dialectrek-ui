// Pings IndexNow (Bing, Yandex, etc.) with URLs from the live sitemap.
// Run after a deploy is live, since the engines fetch the key file from the site.
//
//   npm run indexnow                          -> submit every URL in the sitemap
//   npm run indexnow -- /es/verbs /fr/about   -> submit just these paths
//   npm run indexnow -- --dry-run             -> print what would be sent

const KEY = "adfa115fbc5548ac95078ba7f56b6700";
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://dialectrek.com").replace(/\/$/, "");
const ENDPOINT = "https://api.indexnow.org/indexnow";
const BATCH_SIZE = 10000; // IndexNow's per-request max

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const paths = args.filter((arg) => !arg.startsWith("--"));

const fetchSitemapUrls = async () => {
  const res = await fetch(`${SITE_URL}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap fetch failed: ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1].trim());
};

const urls = paths.length
  ? paths.map((path) => (path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`))
  : await fetchSitemapUrls();

if (!urls.length) {
  console.log("No URLs to submit.");
  process.exit(0);
}

const host = new URL(SITE_URL).host;
console.log(`Submitting ${urls.length} URL(s) for ${host}${dryRun ? " (dry run)" : ""}`);

if (dryRun) {
  urls.forEach((url) => console.log(`  ${url}`));
  process.exit(0);
}

for (let i = 0; i < urls.length; i += BATCH_SIZE) {
  const urlList = urls.slice(i, i + BATCH_SIZE);
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host,
      key: KEY,
      keyLocation: `${SITE_URL}/${KEY}.txt`,
      urlList,
    }),
  });
  // 200 = accepted, 202 = accepted but key not verified yet
  if (res.status !== 200 && res.status !== 202) {
    console.error(`IndexNow rejected batch: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  console.log(`  batch of ${urlList.length}: ${res.status}`);
}
