#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");

const scriptParentDir = path.resolve(__dirname, "..");
const isPackagedSite = path.basename(scriptParentDir) === "website-bestanden";
const siteDir = isPackagedSite ? path.resolve(scriptParentDir, "..") : scriptParentDir;
const assetDir = isPackagedSite ? scriptParentDir : siteDir;
const dataPath = path.join(assetDir, "data", "zomerprogramma_data.json");
const beheerDataPath = path.join(assetDir, "data", "beheer_items.js");
const htmlCandidates = [
  path.join(siteDir, "index.html"),
];

async function findHtmlPath() {
  for (const candidate of htmlCandidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try the next supported publication filename.
    }
  }

  throw new Error("Kon de HTML-pagina niet vinden.");
}

async function main() {
  const rawData = await fs.readFile(dataPath, "utf8");
  const parsedData = JSON.parse(rawData);

  const htmlPath = await findHtmlPath();
  const rawHtml = await fs.readFile(htmlPath, "utf8");
  const version = parsedData.sourceCheck?.lastCheckedAt || parsedData.generated || Date.now();
  const dataUrl = `website-bestanden/data/zomerprogramma_data.json?v=${encodeURIComponent(String(version))}`;
  const nextHtml = rawHtml.replace(
    /const SITE_DATA_URL = 'website-bestanden\/data\/zomerprogramma_data\.json\?v=[^']*';/,
    `const SITE_DATA_URL = '${dataUrl}';`,
  );
  if (nextHtml === rawHtml) {
    throw new Error("Kon SITE_DATA_URL in de HTML niet vinden.");
  }
  await fs.writeFile(htmlPath, nextHtml, "utf8");
  console.log("Publieke data-URL in HTML bijgewerkt.");

  const beheerData = {
    generated: parsedData.generated,
    weeks: parsedData.weeks || [],
    external: parsedData.external || [],
    inspiration: parsedData.inspiration || [],
    teamIdeas: parsedData.teamIdeas || [],
    links: parsedData.links || [],
    sourceCheck: parsedData.sourceCheck || {},
    sourceReview: parsedData.sourceReview || {},
  };

  await fs.writeFile(
    beheerDataPath,
    `window.BCJN_BEHEER_BASE = ${JSON.stringify(beheerData, null, 2)};\n`,
    "utf8",
  );
  console.log("Beheerdata bijgewerkt.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
