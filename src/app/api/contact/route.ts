import { Resend } from "resend";
import { collaborationTypes, site } from "@/config/site";
import { contactSettings } from "@/lib/contact";

const maxBody = 20_000;
const interval = 10 * 60_000;
const limit = 5;
const attempts = new Map<string, { count: number; until: number }>();

function error(message: string, status: number, headers?: HeadersInit) {
  return Response.json({ ok: false, message }, { status, headers });
}

async function readPayload(request: Request) {
  if (Number(request.headers.get("content-length")) > maxBody || !request.body) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let body = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBody) {
      await reader.cancel();
      return null;
    }
    body += decoder.decode(value, { stream: true });
  }
  return JSON.parse(body + decoder.decode()) as unknown;
}

function payloadFields(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const field = (name: string) => typeof input[name] === "string" ? input[name].trim() : "";
  const name = field("name");
  const organisation = field("organisation");
  const role = field("role");
  const email = field("email");
  const phone = field("phone");
  const type = field("type");
  const topic = field("topic");
  const timeline = field("timeline");
  const message = field("message");
  const types: readonly string[] = collaborationTypes;
  if (!name || name.length > 100 || !organisation || organisation.length > 120 ||
      !role || role.length > 100 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      phone.length > 40 || !types.includes(type) || !topic || topic.length > 150 ||
      timeline.length > 100 || !message || message.length > 3500 || input.consent !== "yes" || field("website")) return null;
  return { name, organisation, role, email, phone, type, topic, timeline, message };
}

export async function POST(request: Request) {
  const { key, to, from } = contactSettings();
  if (!key || !to) return error("合作表單尚未啟用，請使用官方聯絡入口。", 503);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin && origin !== new URL(site.url).origin) {
    return error("無法驗證請求來源。", 403);
  }
  if (!request.headers.get("content-type")?.includes("application/json")) return error("請使用網站表單提交。", 415);

  const now = Date.now();
  if (attempts.size >= 1024) {
    for (const [address, record] of attempts) if (record.until <= now) attempts.delete(address);
    if (attempts.size >= 10000) return error("目前洽詢過多，請稍後再試。", 429);
  }
  const ip = request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "local";
  let recent = attempts.get(ip);
  if (!recent || recent.until <= now) {
    recent = { count: 0, until: now + interval };
    attempts.set(ip, recent);
  }
  if (++recent.count > limit) return error("送出次數過多，請稍後再試。", 429, { "Retry-After": String(Math.ceil((recent.until - now) / 1000)) });

  let data;
  try { data = payloadFields(await readPayload(request)); }
  catch { return error("無法讀取表單內容。", 400); }
  if (!data) return error("資料格式有誤，請檢查必填欄位及個資同意。", 400);
  try {
    const { data: result, error: sendError } = await new Resend(key).emails.send({
      from, to, replyTo: data.email,
      subject: `新創會社合作洽詢｜${data.type}`,
      text: [
        `姓名：${data.name}`, `單位：${data.organisation}`, `職稱：${data.role}`, `Email：${data.email}`,
        ...(data.phone ? [`電話：${data.phone}`] : []), `合作類型：${data.type}`, `議題：${data.topic}`,
        ...(data.timeline ? [`預計時程：${data.timeline}`] : []), "", data.message, "", "填寫者已勾選個資使用同意。",
      ].join("\n"),
    });
    if (sendError || !result?.id) return error("這次送出未成功，請保留內容並稍後重試。", 502);
    return Response.json({ ok: true });
  } catch {
    return error("目前無法寄送，請稍後再試。", 502);
  }
}
