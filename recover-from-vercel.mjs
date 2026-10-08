#!/usr/bin/env node
// Downloads every source file of a Vercel deployment into ./recovered
//
// Usage:
//   VERCEL_TOKEN=your_token node recover-from-vercel.mjs [deployment-url]
//
// Requires Node 18 or newer.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const TOKEN = process.env.VERCEL_TOKEN;
const TEAM = "humianchen0604-2465s-projects";
const DEPLOYMENT = (process.argv[2] || "cherryhu-nwbrtnngx-humianchen0604-2465s-projects.vercel.app")
  .replace(/^https?:\/\//, "")
  .replace(/\/.*$/, "");
const OUT_DIR = "recovered";
const SKIP = new Set(["node_modules", ".next", ".vercel", ".git"]);

if (typeof fetch !== "function") {
  console.error("Your Node.js is too old. Install the LTS version from https://nodejs.org and try again.");
  process.exit(1);
}
if (!TOKEN) {
  console.error("Missing token. Run it like this:\n  VERCEL_TOKEN=your_token node recover-from-vercel.mjs");
  process.exit(1);
}

async function api(pathname) {
  const url = new URL(pathname, "https://api.vercel.com");
  url.searchParams.set("slug", TEAM);
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (res.status === 429 && attempt <= 5) {
      console.log("  Vercel asked us to slow down, waiting 15s...");
      await new Promise((r) => setTimeout(r, 15000));
      continue;
    }
    if (!res.ok) {
      throw new Error(`Vercel API error ${res.status} on ${url.pathname}: ${await res.text()}`);
    }
    return res;
  }
}

// The contents endpoint may return the raw file or JSON like { data: "<base64>" }.
async function fileBytes(res) {
  const buf = Buffer.from(await res.arrayBuffer());
  if ((res.headers.get("content-type") || "").includes("application/json")) {
    try {
      const body = JSON.parse(buf.toString("utf8"));
      const keys = Object.keys(body ?? {});
      if (typeof body?.data === "string" && keys.every((k) => k === "data" || k === "encoding")) {
        return Buffer.from(body.data, "base64");
      }
    } catch {}
  }
  return buf;
}

let count = 0;

async function walk(deploymentId, nodes, dir) {
  for (const node of nodes) {
    if (SKIP.has(node.name)) continue;
    const target = path.join(dir, node.name);
    if (node.type === "directory") {
      await mkdir(target, { recursive: true });
      await walk(deploymentId, node.children ?? [], target);
    } else if (node.type === "file" && node.uid) {
      const res = await api(`/v8/deployments/${deploymentId}/files/${node.uid}`);
      await mkdir(dir, { recursive: true });
      await writeFile(target, await fileBytes(res));
      count++;
      console.log(`  ${path.relative(OUT_DIR, target)}`);
    }
  }
}

console.log(`Looking up deployment ${DEPLOYMENT}...`);
const deployment = await (await api(`/v13/deployments/${DEPLOYMENT}`)).json();
console.log(`Found ${deployment.id}. Downloading files into ./${OUT_DIR}`);

const tree = await (await api(`/v6/deployments/${deployment.id}/files`)).json();
await mkdir(OUT_DIR, { recursive: true });
await walk(deployment.id, tree, OUT_DIR);

console.log(`\nDone: ${count} files saved in ./${OUT_DIR}`);
