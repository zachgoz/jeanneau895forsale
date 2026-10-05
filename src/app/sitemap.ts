import type { MetadataRoute } from "next";
import { boat, siteUrl } from "@/data/boat";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl + "/",
      priority: 1,
      images: boat.gallery
        .filter((photo) =>
          [
            "port-profile",
            "starboard-profile",
            "stern-twin-yamaha",
            "salon-galley",
            "forward-cabin",
            "helm",
          ].some((id) => photo.id.includes(id)),
        )
        .map((photo) => siteUrl + photo.src),
    },
    { url: siteUrl + "/privacy/", priority: 0.2 },
  ];
}
