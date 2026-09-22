import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://sinag-store.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/profile/",
          "/checkout",
          "/cart",
          "/notifications",
          "/login",
          "/register",
          "/verify-otp",
          "/forgot-password",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
