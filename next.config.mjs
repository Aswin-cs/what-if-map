import { resolve } from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  serverExternalPackages: ['mongoose'],
  turbopack: {
    root: resolve('.'),
  },
};

export default nextConfig;
