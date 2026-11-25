import { site } from "@/config/site";

export function contactSettings() {
  return {
    key: process.env.RESEND_API_KEY?.trim() || "",
    to: process.env.CONTACT_TO_EMAIL?.trim() || "",
    from: process.env.CONTACT_FROM_EMAIL?.trim() || `${site.name} <onboarding@resend.dev>`,
  };
}
