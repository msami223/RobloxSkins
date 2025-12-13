/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Handle GLB files and other 3D assets
    config.module.rules.push({
      test: /\.(glb|gltf)$/,
      type: 'asset/resource',
    });
    return config;
  },
};

export default nextConfig;
