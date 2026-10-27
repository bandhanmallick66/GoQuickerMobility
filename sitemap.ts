import type { MetadataRoute } from "next";
import { site } from "@/config/site";

const routes = ["", "/services", "/rides", "/book", "/about", "/safety", "/help", "/contact", "/partners", "/privacy", "/terms", "/cancellation-policy"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((r) => ({ url: `${site.url}${r}`, changeFrequency: "monthly", priority: r === "" ? 1 : 0.7 }));
}
