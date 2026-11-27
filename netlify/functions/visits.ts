import { getStore } from "@netlify/blobs";

const key = "total";
const visitIdPattern = /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;
const headers = { "Cache-Control": "no-store" };

type VisitTotals = {
  count: number;
  recentVisits: [id: string, time: number][];
};

export default async function visits(request: Request, context: { deploy: { context: string } }) {
  if (request.method !== "GET" && request.method !== "POST") {
    return new Response(null, { status: 405, headers: { ...headers, Allow: "GET, POST" } });
  }

  const visitId = request.method === "POST" ? request.headers.get("x-visit-id") : null;
  if (request.method === "POST") {
    if (request.headers.get("origin") !== new URL(request.url).origin) {
      return new Response(null, { status: 403, headers });
    }
    if (!visitId || !visitIdPattern.test(visitId)) {
      return new Response(null, { status: 400, headers });
    }
  }

  try {
    const name = context.deploy.context === "production" ? "site-visits" : "site-visits-preview";
    const store = getStore({ name, consistency: "strong" });
    if (!visitId) {
      const totals: VisitTotals | null = await store.get(key, { type: "json" });
      return Response.json({ count: totals?.count ?? 0 }, { headers });
    }

    for (let attempt = 0; attempt < 9; attempt += 1) {
      const current = await store.getWithMetadata(key, { type: "json" });
      const totals: VisitTotals = current?.data ?? { count: 0, recentVisits: [] };
      const now = Date.now();
      const recentVisits = totals.recentVisits.filter(([, time]) => now - time < 30 * 60 * 1000);
      if (recentVisits.some(([id]) => id === visitId)) {
        return Response.json({ count: totals.count }, { headers });
      }

      const next: VisitTotals = { count: totals.count + 1, recentVisits: [...recentVisits.slice(-255), [visitId, now]] };
      // Keep the increment and its retry marker in the same conditional write.
      const { modified } = await store.setJSON(key, next, current ? { onlyIfMatch: current.etag } : { onlyIfNew: true });
      if (modified) return Response.json({ count: next.count }, { headers });
      await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 8 + Math.random() * 24));
    }
  } catch (error) {
    console.error("Visit counter storage unavailable", error instanceof Error ? error.name : "Unknown error");
  }

  return new Response(null, { status: 503, headers });
}
