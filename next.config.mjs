import { resolve } from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  turbopack: {
    root: resolve('.'),
  },
};

export default nextConfig;
