"use client";

import { useState } from "react";

export function CopyEmail({ email }: { email: string }) {
  const [feedback, setFeedback] = useState("");
  return <>
    <button type="button" className="button button-outline" onClick={async () => {
      try {
        await navigator.clipboard.writeText(email);
        setFeedback("已複製");
      } catch {
        setFeedback("請選取上方信箱後複製。");
      }
    }}>複製信箱</button>
    <span className="email-feedback" role="status">{feedback}</span>
  </>;
}
