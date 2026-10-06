import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const html = await fs.readFile("out/index.html", "utf8");
const robots = await fs.readFile("out/robots.txt", "utf8");
const sitemap = await fs.readFile("out/sitemap.xml", "utf8");
const firebase = JSON.parse(await fs.readFile("firebase.json", "utf8"));
const supersededPerformance = /Owner.observed|owner.observed|Owner cruise|owner-cruise|normal family load|roughly 30 mph|about 1\.5 mpg/;
assert.match(html, /<link rel="canonical" href="https:\/\/895forsale\.com\/"/);
assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
assert.match(html, /\$160,000/);
assert.ok(
  /Approximately (?:<!--.*?-->)*400/.test(html),
  "Current hours missing",
);
assert.match(html, /Trailer not included/);
assert.match(html, /Sanimarin 31/);
assert.match(html, /Uninstalled/);
assert.ok(!supersededPerformance.test(html), "Superseded owner performance claim exported");
assert.ok(/interpolate/i.test(html), "Interpolation disclosure missing");
const calculator = html.match(/<section id="performance"[\s\S]*?<\/section>/)?.[0]?.replace(/<!--[\s\S]*?-->/g, "");
assert.ok(calculator, "Performance section missing");
assert.match(calculator, /min="1000"/);
assert.match(calculator, /max="5950"/);
assert.match(calculator, /step="50"/);
assert.match(calculator, /Official Yamaha test/);
assert.ok(calculator.includes("4,500 RPM · Yamaha test"), "Yamaha cruise shortcut missing");
const ownerStory = html.match(/<section id="owner-story"[\s\S]*?<\/section>/)?.[0];
assert.ok(ownerStory, "Owner story missing");
assert.ok(ownerStory.includes("Yamaha’s NC 895 test recorded"), "Story performance attribution missing");
assert.ok(ownerStory.includes("32.0") && ownerStory.includes("1.69") && ownerStory.includes("4,500"), "Story Yamaha cruising figures missing");
for (const label of ["Trolling, 1,000 RPM", "Slow trolling, 1,500 RPM", "Efficient cruise, 4,000 RPM", "WOT, 5,950 RPM"])
  assert.ok(calculator.includes(label), `Slider marker missing: ${label}`);
assert.equal((calculator.match(/<th scope="row"/g) || []).length, 11);
for (const control of ["trip-from", "trip-to", "trip-distance"])
  assert.ok(calculator.includes(`id="${control}"`), `Planner control missing: ${control}`);
for (const place of ["Carolina Beach", "Masonboro Island", "Figure Eight Island", "Southport", "Bald Head Island", "Beaufort", "Ocracoke"])
  assert.ok(calculator.includes(place), `Cruise destination missing: ${place}`);
assert.match(calculator, /Round trip/);
assert.match(calculator, /Cruise planning method/);
assert.match(calculator, /Between places/);
assert.match(calculator, /Manual distance/);
assert.match(calculator, /Route assumptions/);
assert.match(calculator, /Approximate water-route distance/);
assert.match(html, /og:image:width" content="1200"/);
assert.match(html, /og:image:height" content="630"/);
assert.match(html, /summary_large_image/);
assert.match(
  html,
  /property="og:image" content="https:\/\/895forsale.com\/images\/og\//,
);
assert.match(robots, /Allow: \/\n/);
assert.match(robots, /Sitemap: https:\/\/895forsale.com\/sitemap.xml/);
assert.match(
  sitemap,
  /xmlns:image="http:\/\/www.google.com\/schemas\/sitemap-image\/1.1"/,
);
for (const value of [...sitemap.matchAll(/<(?:loc|image:loc)>(.*?)<\//g)].map(
  (match) => match[1],
))
  assert.ok(value.startsWith("https://895forsale.com/"));
const allJsonLd = [
  ...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g),
].map((match) => JSON.parse(match[1]));
const product = allJsonLd.find((item) => item["@type"] === "Product");
assert.ok(product);
assert.equal(product.offers.price, 160000);
assert.equal(product.offers.itemCondition, "https://schema.org/UsedCondition");
assert.equal(
  product.offers.hasMerchantReturnPolicy?.returnPolicyCategory,
  "https://schema.org/MerchantReturnNotPermitted",
);
assert.equal(
  product.offers.shippingDetails?.["@type"],
  "OfferShippingDetails",
);
assert.ok(!product.aggregateRating && !product.review);
const faqPage = allJsonLd.find((item) => item["@type"] === "FAQPage");
assert.ok(faqPage, "FAQPage schema missing");
assert.ok(faqPage.mainEntity.length >= 10, "FAQPage entries missing");
const videoObject = allJsonLd.find((item) => item["@type"] === "VideoObject");
assert.ok(videoObject, "VideoObject schema missing");
assert.ok(videoObject.embedUrl.includes("a7ZMJtGF8CU"), "VideoObject embedUrl mismatch");
assert.match(html, /a7ZMJtGF8CU/);
assert.match(html, /Merry Fisher/);
assert.match(html, /9′ 9″/);
assert.match(html, /USCG Documented/i, "USCG Documented notice missing");
assert.match(html, /Marine Survey/i, "Marine Survey callout missing");
assert.match(html, /forward-cabin-staged/, "Staged forward cabin photo missing");
assert.match(html, /cabin-staging-switch/, "Cabin staging switch missing");
const photosSrc = await fs.readFile("src/data/photos.ts", "utf8");
assert.match(photosSrc, /"id": "forward-cabin-staged"/);
assert.match(photosSrc, /"id": "salon-dinette-staged"/);
assert.match(photosSrc, /"id": "second-cabin-staged"/);
assert.match(photosSrc, /"id": "enclosed-head-staged"/);
assert.equal(firebase.hosting.public, "out");
assert.equal(firebase.hosting.rewrites.length, 1);
assert.equal(firebase.hosting.rewrites[0].source, "/api/contact");
assert.equal(firebase.hosting.rewrites[0].function.functionId, "contact");
assert.ok(
  !firebase.hosting.rewrites.some((rule) => rule.destination === "/index.html"),
);
const inventory = JSON.parse(
  await fs.readFile("docs/photo-inventory.json", "utf8"),
);
const imageFiles = [
  ...new Set(
    [...html.matchAll(/(?:src|srcSet)="(\/images\/[^" ]+)/g)].map(
      (match) => match[1],
    ),
  ),
];
for (const file of imageFiles) await fs.access(path.join("out", file));
for (const file of await fs.readdir("public/images/boat")) {
  const metadata = await sharp(
    path.join("public/images/boat", file),
  ).metadata();
  assert.ok(
    !metadata.exif && !metadata.xmp && !metadata.iptc,
    file + " has private metadata",
  );
}
const og = await sharp(
  "out/images/og/jeanneau-nc895-for-sale-og.jpg",
).metadata();
assert.equal(og.width, 1200);
assert.equal(og.height, 630);
assert.ok(!og.exif);
async function files(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? files(path.join(directory, entry.name))
          : [path.join(directory, entry.name)],
      ),
    )
  ).flat();
}
const allFiles = await files("out");
for (const file of allFiles) {
  assert.ok(
    !/\.(pdf|docx)$|service-account|\/\.env/.test(file),
    "Private file exported: " + file,
  );
  if (/\.(js|html|json|txt)$/.test(file)) {
    const contents = await fs.readFile(file, "utf8");
    assert.ok(!supersededPerformance.test(contents), "Superseded performance reference exported: " + file);
    assert.ok(
      !/-----BEGIN (?:RSA )?PRIVATE KEY-----|"private_key"\s*:|re_[A-Za-z0-9]{24,}/.test(
        contents,
      ),
      "Secret signature: " + file,
    );
  }
}
const bundles = await Promise.all(
  allFiles
    .filter((file) => file.endsWith(".js"))
    .map((file) => fs.readFile(file, "utf8")),
);
assert.ok(
  bundles.some((contents) => contents.includes("G-QES0WL2VQW")),
  "Configured GA ID G-QES0WL2VQW missing from bundles",
);
assert.ok(!html.includes("G-TEST1234"));
console.log(
  `Static export verification passed: metadata, structured data, sitemap/images, robots, rewrite, ${imageFiles.length} initial image references, metadata-free derivatives, 1200×630 OG, secret scan. Photo inventory keys: ${Object.keys(inventory).join(", ")}.`,
);
