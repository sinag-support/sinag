/** @type {import('next').NextConfig} */
const nextConfig = {
   images: {
      remotePatterns: [
         {
            protocol: 'https',
            hostname: 'msqibpoiztlmckutsilp.supabase.co',
         },
         {
            protocol: 'https',
            hostname: 'images.unsplash.com',
         },
      ],
   },
   reactStrictMode: true,
}

module.exports = nextConfig