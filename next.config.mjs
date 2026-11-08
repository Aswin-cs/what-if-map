import { resolve } from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  serverExternalPackages: ['next-auth', 'mongoose'],
  turbopack: {
    root: resolve('.'),
  },
};

export default nextConfig;
