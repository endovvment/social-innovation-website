"use client";

import { useEffect, useState } from "react";

const endpoint = "/.netlify/functions/visits";
const sessionKey = "site-visit";
const numberFormat = new Intl.NumberFormat("zh-TW");
let sessionVisit: string | undefined;
let pendingCount: Promise<number> | undefined;

function saveSession(value: string) {
  sessionVisit = value;
  try {
    sessionStorage.setItem(sessionKey, value);
  } catch { /* The current page can still count a visit without session storage. */ }
}

function getSession() {
  if (sessionVisit) return sessionVisit;
  try {
    sessionVisit = sessionStorage.getItem(sessionKey) ?? undefined;
  } catch { /* Fall back to memory. */ }
  if (sessionVisit) return sessionVisit;

  const id = crypto.randomUUID();
  saveSession(id);
  return id;
}

async function requestCount() {
  const visit = getSession();
  const response = visit === "counted"
    ? await fetch(endpoint, { cache: "no-store" })
    : await fetch(endpoint, { method: "POST", headers: { "x-visit-id": visit }, keepalive: true });
  if (!response.ok) throw new Error("Could not load the visit count");
  const { count } = await response.json();
  if (!Number.isSafeInteger(count) || count < 0) throw new Error("Invalid visit count");
  saveSession("counted");
  return count as number;
}

export function VisitCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    pendingCount ??= requestCount().finally(() => { pendingCount = undefined; });
    pendingCount.then((value) => {
      if (active) setCount(value);
    }).catch(() => { /* An unavailable counter keeps its placeholder. */ });
    return () => { active = false; };
  }, []);

  return <p className="visit-count" role="status">造訪人次 <strong>{count === null ? "—" : numberFormat.format(count)}</strong></p>;
}
