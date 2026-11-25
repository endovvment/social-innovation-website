"use client";

import Image from "next/image";
import { useState } from "react";

export function YouTubePlayer({ id, title }: { id: string; title: string }) {
  return <iframe src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
    title={title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />;
}

export function LiteVideo({ id, cover, title }: { id: string; cover?: string; title: string }) {
  const [active, setActive] = useState(false);
  return <div className="lite-video">
    <div className="video-frame">
      {active
        ? <YouTubePlayer id={id} title={title} />
        : <button type="button" aria-label={`播放《${title}》`} onClick={() => setActive(true)}>
          {cover && <Image src={cover} alt="" fill sizes="(min-width: 1100px) 72vw, 100vw" />}
          <span className="video-action"><i className="play-icon" aria-hidden="true" />播放影音繪本</span>
        </button>}
    </div>
    <a className="under-link" href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener noreferrer">在 YouTube 觀看</a>
  </div>;
}

export function ShareButtons({ title }: { title: string }) {
  const [feedback, setFeedback] = useState("");
  function shareTo(platform: "Facebook" | "LINE" | "X") {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(title);
    const destinations = {
      Facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      LINE: `https://social-plugins.line.me/lineit/share?url=${url}`,
      X: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    };
    window.open(destinations[platform], "_blank", "noopener,noreferrer");
  }
  return <div className="share">
    <button type="button" onClick={async () => {
      try { await navigator.clipboard.writeText(window.location.href); setFeedback("連結已複製"); }
      catch { setFeedback("無法自動複製，請從網址列複製。"); }
    }}>複製連結</button>
    {(["Facebook", "LINE", "X"] as const).map((platform) => <button key={platform} type="button" onClick={() => shareTo(platform)}>{platform}</button>)}
    <span role="status">{feedback}</span>
  </div>;
}
