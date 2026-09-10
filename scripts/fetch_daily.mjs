// scripts/fetch_daily.mjs
// Runs once a day via GitHub Actions (see .github/workflows/daily-fetch.yml).
// Calls three public, key-less APIs for 3 assets (BTC/ETH/XRP), computes the
// "kimchi premium" against four financial-hub currencies for each, and
// appends exactly one record per real Asia/Seoul calendar date to
// data/records.json (re-running on the same day updates that day's row
// instead of adding a second one — T04-C20/C21).

import { readFile, writeFile } from "node:fs/promises";

const RECORDS_PATH = new URL("../data/records.json", import.meta.url);
const TIMEZONE = "Asia/Seoul";

const ASSETS = [
  { id: "bitcoin", market: "KRW-BTC", label: "비트코인" },
  { id: "ethereum", market: "KRW-ETH", label: "이더리움" },
  { id: "ripple", market: "KRW-XRP", label: "리플" },
];
const UPBIT_MARKETS = ASSETS.map((a) => a.market).join(",");
const CG_IDS = ASSETS.map((a) => a.id).join(",");

const HUBS = [
  { key: "usd", label: "뉴욕", currency: "USD" },
  { key: "eur", label: "프랑크푸르트", currency: "EUR" },
  { key: "gbp", label: "런던", currency: "GBP" },
  { key: "jpy", label: "도쿄", currency: "JPY" },
];
const PRIMARY_HUB = "usd"; // "김치 프리미엄"의 표준 기준 통화

function seoulDateString(date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(date);
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`${url} -> HTTP ${res.status}`);
  }
  return res.json();
}

async function getDomestic() {
  const url = `https://api.upbit.com/v1/ticker?markets=${UPBIT_MARKETS}`;
  const tickers = await fetchJson(url);
  const byMarket = Object.fromEntries(tickers.map((t) => [t.market, t]));
  return { url, byMarket };
}

async function getGlobalMultiCurrency() {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${CG_IDS}&vs_currencies=usd,eur,gbp,jpy&include_last_updated_at=true`;
  const json = await fetchJson(url);
  return { url, byAsset: json };
}

async function getFx() {
  const url = "https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD,GBP,JPY,KRW";
  const json = await fetchJson(url);
  return {
    source: "Frankfurter (ECB reference rate)",
    source_url: url,
    rates: json.rates,
    source_observed_at: json.date, // ECB publishes one reference rate per day, not intraday
  };
}

function buildHubs(prices, rates) {
  return HUBS.map((hub) => {
    const price = prices[hub.key];
    const krwPerUnit = hub.currency === "EUR" ? rates.KRW : rates.KRW / rates[hub.currency];
    const impliedKrw = price * krwPerUnit;
    return { ...hub, price, impliedKrw };
  });
}

function premiumVsHub(domesticKrw, hub) {
  return ((domesticKrw - hub.impliedKrw) / hub.impliedKrw) * 100;
}

async function loadRecords() {
  try {
    const raw = await readFile(RECORDS_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function main() {
  const now = new Date();
  const date = seoulDateString(now);

  const [domestic, global_, fx] = await Promise.all([
    getDomestic(),
    getGlobalMultiCurrency(),
    getFx(),
  ]);

  const assets = {};
  for (const a of ASSETS) {
    const ticker = domestic.byMarket[a.market];
    const cgPrices = global_.byAsset[a.id];
    const cgObservedAt = new Date(cgPrices.last_updated_at * 1000).toISOString();
    const domesticKrw = ticker.trade_price;
    const hubs = buildHubs(cgPrices, fx.rates);
    const primary = hubs.find((h) => h.key === PRIMARY_HUB);

    assets[a.id] = {
      label: a.label,
      domestic: {
        source: "Upbit",
        source_url: domestic.url,
        price_krw: domesticKrw,
        unit: "KRW",
        source_observed_at: new Date(ticker.trade_timestamp).toISOString(),
      },
      global: {
        source: "CoinGecko",
        source_url: global_.url,
        unit: "USD (외 3개 통화)",
        source_observed_at: cgObservedAt,
      },
      hubs: hubs.map((h) => ({
        key: h.key,
        label: h.label,
        currency: h.currency,
        price: h.price,
        implied_krw: Number(h.impliedKrw.toFixed(2)),
        premium_pct: Number(premiumVsHub(domesticKrw, h).toFixed(4)),
      })),
      premium_pct: Number(premiumVsHub(domesticKrw, primary).toFixed(4)), // USD-hub premium (headline figure)
    };
  }

  const record = {
    date, // Asia/Seoul calendar date this record belongs to
    retrieved_at: now.toISOString(),
    timezone: TIMEZONE,
    fx,
    assets,
  };

  const records = await loadRecords();
  const idx = records.findIndex((r) => r.date === date);
  if (idx >= 0) {
    records[idx] = record; // same real day -> update in place, not a new row
  } else {
    records.push(record); // new real day -> new row
  }
  records.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  await writeFile(RECORDS_PATH, JSON.stringify(records, null, 2) + "\n", "utf8");
  const summary = ASSETS.map((a) => `${a.label}=${assets[a.id].premium_pct}%`).join(", ");
  console.log(`Wrote record for ${date}: ${summary}`);
}

main().catch((err) => {
  console.error("daily fetch failed:", err);
  process.exit(1);
});
