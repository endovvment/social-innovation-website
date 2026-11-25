"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { YouTubePlayer } from "@/components/media";
import { CaseReveal } from "@/components/motion";

type VideoCard = {
  id: string; title: string; thumbnail: string; fallbackThumbnail?: string; date?: string; displayDate: string; workSlug?: string;
};

function VideoThumbnail({ thumbnail, fallbackThumbnail, sizes }: Pick<VideoCard, "thumbnail" | "fallbackThumbnail"> & { sizes: string }) {
  const [src, setSrc] = useState(thumbnail);
  return <Image src={src} alt="" fill sizes={sizes}
    onError={fallbackThumbnail ? () => setSrc(fallbackThumbnail) : undefined} />;
}

export function VideoGrid({ videos, sizes, showDate = true }: { videos: VideoCard[]; sizes: string; showDate?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [playing, setPlaying] = useState<VideoCard>();

  return <>
    <ul className="video-grid">
      {videos.map((video) => {
        const artwork = <>
          <CaseReveal className="card-reveal">
            <span className="archive-cover" aria-hidden="true"><span className="aperture-media">
              <VideoThumbnail key={video.thumbnail} thumbnail={video.thumbnail} fallbackThumbnail={video.fallbackThumbnail} sizes={sizes} />
              {!video.workSlug && <i className="video-card-play play-icon" />}
            </span></span>
          </CaseReveal>
          <h3>{video.title}</h3>
          {showDate && video.date && <time className="mono" dateTime={video.date}>{video.displayDate}</time>}
        </>;
        return <li key={video.id} data-video-id={video.id}>
          {video.workSlug
            ? <Link className="video-card" href={`/works/${video.workSlug}`}>{artwork}</Link>
            : <button className="video-card" type="button" aria-haspopup="dialog" onClick={() => {
              setPlaying(video);
              dialog.current?.showModal();
            }}>{artwork}</button>}
        </li>;
      })}
    </ul>
    <dialog ref={dialog} className="video-dialog" aria-labelledby="video-dialog-title" data-lenis-prevent
      onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }}
      onClose={() => setPlaying(undefined)}>
      <div className="video-dialog-content">
        <div className="video-dialog-header">
          <h2 id="video-dialog-title">{playing?.title}</h2>
          <button className="button button-outline" type="button" onClick={() => dialog.current?.close()}>關閉</button>
        </div>
        {playing && <div className="video-frame"><YouTubePlayer id={playing.id} title={playing.title} /></div>}
      </div>
    </dialog>
  </>;
}
