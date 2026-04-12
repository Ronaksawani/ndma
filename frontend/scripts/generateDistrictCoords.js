import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATASET_PATH = path.resolve(
  __dirname,
  "../src/data/disaster_risk_dataset_india.json",
);
const OUTPUT_PATH = path.resolve(
  __dirname,
  "../src/data/district_coords_india.json",
);

const STATE_CENTERS = {
  Assam: [26.2006, 92.9376],
  Bihar: [25.0961, 85.3131],
  "Uttar Pradesh": [26.8467, 80.9462],
  "West Bengal": [22.9868, 87.855],
  Maharashtra: [19.7515, 75.7139],
  Kerala: [10.8505, 76.2711],
  Odisha: [20.9517, 85.0985],
  "Andhra Pradesh": [15.9129, 79.74],
  "Tamil Nadu": [11.1271, 78.6569],
  Gujarat: [22.2587, 71.1924],
  "Jammu & Kashmir / Ladakh": [34.1526, 77.577],
  "Himachal Pradesh": [31.1048, 77.1734],
  Uttarakhand: [30.0668, 79.0193],
  "North-East": [25.467, 91.3662],
  "Delhi NCR": [28.6139, 77.209],
  Delhi: [28.6139, 77.209],
  Rajasthan: [27.0238, 74.2179],
  Karnataka: [15.3173, 75.7139],
  Telangana: [18.1124, 79.0193],
  "Madhya Pradesh": [23.4733, 77.947],
};

function parseArgs(argv) {
  const options = {
    mode: "api",
    delayMs: 1200,
    limit: Number.POSITIVE_INFINITY,
  };

  argv.forEach((arg) => {
    if (arg.startsWith("--mode=")) {
      options.mode = arg.split("=")[1];
    }
    if (arg.startsWith("--delay=")) {
      options.delayMs = Number(arg.split("=")[1]) || options.delayMs;
    }
    if (arg.startsWith("--limit=")) {
      const parsed = Number(arg.split("=")[1]);
      if (Number.isFinite(parsed) && parsed > 0) {
        options.limit = parsed;
      }
    }
  });

  return options;
}

function normalizeText(value = "") {
  return value
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getDummyCoordinate(state, district, index) {
  const anchor = STATE_CENTERS[state] || [22.5937, 78.9629];
  const hash = normalizeText(`${state}${district}`)
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  const angle = (hash % 360) * (Math.PI / 180);
  const ring = 0.3 + (index % 5) * 0.2;

  return {
    latitude: Number((anchor[0] + Math.sin(angle) * ring).toFixed(6)),
    longitude: Number((anchor[1] + Math.cos(angle) * ring).toFixed(6)),
    source: "dummy",
  };
}

async function getApiCoordinate(state, district) {
  const query = encodeURIComponent(`${district}, ${state}, India`);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "ndma-district-coords-script/1.0 (training-portal)",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  return {
    latitude: Number(Number(data[0].lat).toFixed(6)),
    longitude: Number(Number(data[0].lon).toFixed(6)),
    source: "api",
    displayName: data[0].display_name,
  };
}

async function loadDistrictsFromDataset() {
  const raw = await fs.readFile(DATASET_PATH, "utf-8");
  const dataset = JSON.parse(raw);
  const pairs = [];
  const seen = new Set();

  Object.entries(dataset).forEach(([, stateGroups]) => {
    Object.entries(stateGroups).forEach(([state, riskBands]) => {
      const districts = [
        ...(riskBands.high || []),
        ...(riskBands.moderate || []),
      ];
      districts.forEach((district) => {
        const key = `${normalizeText(state)}::${normalizeText(district)}`;
        if (!seen.has(key)) {
          seen.add(key);
          pairs.push({ state, district });
        }
      });
    });
  });

  return pairs;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const districts = await loadDistrictsFromDataset();
  const targetDistricts = districts.slice(0, options.limit);
  const entries = [];

  console.log(`Mode: ${options.mode}`);
  console.log(`Districts to process: ${targetDistricts.length}`);

  for (let i = 0; i < targetDistricts.length; i += 1) {
    const { state, district } = targetDistricts[i];
    let result = null;

    if (options.mode === "api") {
      try {
        result = await getApiCoordinate(state, district);
      } catch (error) {
        console.warn(
          `API failed for ${district}, ${state}. Falling back to dummy.`,
          error.message,
        );
      }

      if (!result) {
        result = getDummyCoordinate(state, district, i);
      }

      await wait(options.delayMs);
    } else {
      result = getDummyCoordinate(state, district, i);
    }

    entries.push({
      state,
      district,
      latitude: result.latitude,
      longitude: result.longitude,
      source: result.source,
      ...(result.displayName ? { displayName: result.displayName } : {}),
    });

    if ((i + 1) % 10 === 0 || i === targetDistricts.length - 1) {
      console.log(`Processed ${i + 1}/${targetDistricts.length}`);
    }
  }

  const output = {
    generatedAt: new Date().toISOString(),
    mode: options.mode,
    totalDistricts: entries.length,
    entries,
  };

  await fs.writeFile(
    OUTPUT_PATH,
    `${JSON.stringify(output, null, 2)}\n`,
    "utf-8",
  );

  console.log(`Saved coordinates to: ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error("Failed to generate district coordinates:", error);
  process.exit(1);
});
