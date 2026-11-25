"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { DisplayWork, Work } from "@/lib/works";
import { CaseReveal, PinnedGallery, rememberCover } from "@/components/motion";

export function CaseArtwork({ work, sizes }: { work: Work; sizes: string }) {
  return <span className="archive-cover" aria-hidden="true">
    <span className="aperture-media">{work.cover ? <Image src={work.cover} alt="" fill sizes={sizes} />
      : <span className="archive-placeholder" />}</span>
  </span>;
}

export function CaseCard({ work, sizes, listing = false }: {
  work: DisplayWork; sizes: string; listing?: boolean;
}) {
  const Heading = listing ? "h2" : "h3";
  return <Link href={`/works/${work.slug}`} className="case-card" onClick={(event) => rememberCover(event, work.slug)}
    aria-label={`打開案件 ${work.caseNo}：${work.title}`}>
    <CaseReveal number={work.caseNo} className="card-reveal"><CaseArtwork work={work} sizes={sizes} /></CaseReveal>
    <div className="gallery-caption">
      {(listing || work.status === "in-production") && <span className="status"><i />{work.status === "published" ? "已結案" : work.videoOnAir ? "影片已上線" : "調查中"}</span>}
      <Heading>{work.title}</Heading>
      <TopicList topics={work.topics} />
      {listing && <p>{work.tagline}</p>}
    </div>
  </Link>;
}

export function TopicList({ topics }: { topics: string[] }) {
  return <ul className="topic-list" aria-label="議題標籤">{topics.map((topic) => <li key={topic}>{topic}</li>)}</ul>;
}

export function HomeGallery({ works }: { works: DisplayWork[] }) {
  const [topic, setTopic] = useState("");
  const tags = [...new Set(works.flatMap((work) => work.topics))];
  const matching = topic ? works.filter((work) => work.topics.includes(topic)) : works;
  return <>
    <div className="gallery-controls">
      <label>依議題選看<select value={topic} onChange={(event) => setTopic(event.target.value)}>
        <option value="">全部議題</option>
        {tags.map((tag) => <option key={tag}>{tag}</option>)}
      </select></label>
      <span role="status">{matching.length} 份地球案件</span>
    </div>
    <PinnedGallery revision={topic}>
      {matching.map((work) => <article className="gallery-card" key={work.caseNo}>
        <CaseCard work={work} sizes="(min-width: 1000px) 51vw, 75vw" />
      </article>)}
    </PinnedGallery>
  </>;
}

export function WorkFilter({ works }: { works: DisplayWork[] }) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("");
  const [order, setOrder] = useState("asc");
  const tags = [...new Set(works.flatMap((work) => work.topics))];
  const keyword = query.normalize("NFKC").trim().toLowerCase();
  const found = works.filter((work) =>
    (!topic || work.topics.includes(topic)) &&
    `${work.caseNo} ${work.title} ${work.topics.join(" ")} ${work.tagline}`.normalize("NFKC").toLowerCase().includes(keyword),
  ).sort((a, b) => order === "asc" ? a.caseNo.localeCompare(b.caseNo) : b.caseNo.localeCompare(a.caseNo));

  return <>
    <div className="archive-filters" id="archive-filters">
      <label>關鍵字<input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="作品名、案號或議題" /></label>
      <label>議題
        <select value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="">全部議題</option>
          {tags.map((tag) => <option key={tag}>{tag}</option>)}
        </select>
      </label>
      <label>案號排序
        <select value={order} onChange={(e) => setOrder(e.target.value)}>
          <option value="asc">由小到大</option>
          <option value="desc">由大到小</option>
        </select>
      </label>
      <p role="status">{found.length} 部作品</p>
    </div>
    {found.length ? <div className="archive-grid">
      {found.map((work) => <article key={work.caseNo} className="archive-item">
        <CaseCard work={work} sizes="(min-width: 800px) 52vw, 100vw" listing />
      </article>)}
    </div> : <div className="empty-state">
      <h2>找不到符合條件的作品</h2>
      <p>換個關鍵字，或重新看看所有議題。</p>
      <button type="button" className="button button-ink" onClick={() => { setQuery(""); setTopic(""); setOrder("asc"); }}>清除篩選</button>
    </div>}
  </>;
}
