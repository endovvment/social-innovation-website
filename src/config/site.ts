export const site = {
  name: "新創會社",
  englishName: "Social Innovation",
  slogan: "以故事理解社會，以創新探索未來。",
  subtitle: "從一個人的遭遇，看見一群人的處境。",
  description: "新創會社是以社會教育與社會創新為核心的原創內容品牌。以繪本、影音敘事與議題解析，將複雜的社會問題說成能理解、感受與思考的故事。",
  founder: "林禀涵",
  founderPortrait: "",
  url: process.env.SITE_URL || "http://localhost:3000",
  ogImage: "/assets/night-sky-share.jpg",
  contact: { email: "endovvment@gmail.com", endpoint: "/api/contact" },
  showSocial: true,
  social: [
    { name: "Facebook", url: "https://www.facebook.com/profile.php?id=61589444075279" },
    { name: "Instagram", url: "https://www.instagram.com/endovvment/" },
    { name: "Threads", url: "https://www.threads.com/@endovvment" },
  ],
  platforms: {
    youtube: "https://www.youtube.com/@新創會社",
    apple: "https://podcasts.apple.com/tw/podcast/id6836434776",
  },
  feeds: {
    youtube: "https://www.youtube.com/feeds/videos.xml?channel_id=UCtuTjwLxkSaisPPNA1PpEYQ",
    podcast: "https://itunes.apple.com/lookup?id=6836434776&media=podcast&entity=podcastEpisode&limit=200&country=tw",
  },
  nav: [
    { label: "首頁", href: "/" },
    { label: "作品", href: "/works" },
    { label: "Podcast", href: "/podcast" },
    { label: "合作", href: "/collaborate" },
    { label: "關於", href: "/about" },
    { label: "商城", href: "/shop" },
  ],
} as const;

export const contactUrl = `mailto:${site.contact.email}?subject=${encodeURIComponent("【合作洽詢】")}`;

export const values = [
  ["理解", "看見現象背後的原因與脈絡。"],
  ["關懷", "理解不同群體的處境與需求。"],
  ["思辨", "培養獨立思考與多元觀點。"],
  ["創新", "探索突破既有框架的可能性。"],
  ["行動", "將知識、理念與想像轉化為實踐。"],
] as const;

export const collaborationTypes = [
  "客製化數位繪本", "企業影音繪本", "社會教育與 ESG", "教育教材",
  "作品與 IP 授權", "企業議題贊助", "其他合作",
] as const;
