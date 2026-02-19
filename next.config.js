/**
 * Next.js 配置文件 - Helix Mirror
 * 
 * 用途：
 * - 配置 Next.js 的构建设置
 * - 支持本地开发（SQLite）和云端部署（Vercel + PostgreSQL）
 * 
 * 关键配置项：
 * - output: 'standalone' - 生成独立部署包（Docker/云服务适用）
 * - output: 'export' - 纯静态导出（无服务端渲染，仅前端）
 * - images.unoptimized - 禁用 Vercel 图片优化（使用静态导出时必需）
 * 
 * 环境适配：
 * - 本地开发：保持 standalone，使用 SQLite
 * - Vercel 部署：保持 standalone，使用 PostgreSQL（通过环境变量切换）
 */

/** @type {import('next').NextConfig} */
const deployProfile = process.env.DEPLOY_PROFILE || 'local';
const corsOrigin = process.env.API_CORS_ORIGIN || '*';

const nextConfig = {
  // 生成独立部署包
  // standalone 模式：
  // - 生成 .next/standalone 目录
  // - 包含所有 node_modules 依赖
  // - 适合 Docker 或任何 Node.js 环境部署
  output: 'standalone',
  
  // 禁用图片优化
  // 原因：
  // - Vercel 的图片优化需要额外配置
  // - 本项目图片少，用原生 img 标签即可
  images: {
    unoptimized: true,
  },
  
  // 环境变量（构建时可用）
  // 注意：这些值会被打包到客户端，不要放敏感信息
  env: {
    // 应用名称（用于页面标题等）
    NEXT_PUBLIC_APP_NAME: 'Helix Mirror',
    // 应用版本
    NEXT_PUBLIC_APP_VERSION: '0.5.0',
    // 部署配置（local/cloud）
    NEXT_PUBLIC_DEPLOY_PROFILE: deployProfile,
  },
  
  // 头部配置（安全头等）
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          // API 路由的 CORS 配置
          {
            key: 'Access-Control-Allow-Origin',
            value: corsOrigin,
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
  
  // Webpack 配置（如有需要）
  webpack: (config, { isServer }) => {
    // 服务端不需要打包 native 模块（如 better-sqlite3）
    // 因为 Vercel 环境使用 PostgreSQL
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
