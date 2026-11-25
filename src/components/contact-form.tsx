"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { collaborationTypes, site } from "@/config/site";

export function ContactForm() {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState(false);
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    setBusy(true);
    setFeedback("");
    setError(false);
    try {
      const body = Object.fromEntries(new FormData(form));
      const response = await fetch(site.contact.endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message || "目前無法送出，請稍後再試。");
      setFeedback("合作洽詢已送出。");
      form.reset();
    } catch (failure) {
      setError(true);
      setFeedback(failure instanceof Error ? failure.message : "目前無法送出，請稍後再試。");
    } finally { setBusy(false); }
  }
  return <form className="contact-form" onSubmit={send}>
    <div className="form-grid">
      <label>姓名<input required name="name" maxLength={100} autoComplete="name" /></label>
      <label>公司或機構名稱<input required name="organisation" maxLength={120} autoComplete="organization" /></label>
      <label>職稱<input required name="role" maxLength={100} autoComplete="organization-title" /></label>
      <label>Email<input required type="email" name="email" maxLength={254} autoComplete="email" /></label>
      <label>電話（選填）<input type="tel" name="phone" maxLength={40} autoComplete="tel" /></label>
      <label>合作類型<select name="type" defaultValue="" required><option value="" disabled>選擇合作類型</option>
        {collaborationTypes.map((item) => <option key={item}>{item}</option>)}
      </select></label>
      <label>想談的議題<input required name="topic" maxLength={150} /></label>
      <label>預計時程（選填）<input name="timeline" maxLength={100} /></label>
    </div>
    <label>需求說明<textarea required name="message" rows={6} maxLength={3500} /></label>
    <div className="honey" aria-hidden="true"><label>網站<input tabIndex={-1} name="website" autoComplete="off" /></label></div>
    <label className="consent"><input name="consent" type="checkbox" value="yes" required />
      <span>我已閱讀<Link href="/privacy">隱私權政策</Link>，同意新創會社將上述資料用於聯繫及處理本次合作洽詢。</span>
    </label>
    <button type="submit" className="button button-ink" disabled={busy}>{busy ? "正在送出…" : "送出合作洽詢"}</button>
    <p className={error ? "form-error" : "form-status"} role={error ? "alert" : "status"}>{feedback}</p>
  </form>;
}
