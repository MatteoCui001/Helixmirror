/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 自定义品牌色
        helix: {
          primary: '#6366f1',    // 靛紫色 - 主色调
          secondary: '#8b5cf6',  // 紫色 - 辅助色
          accent: '#06b6d4',     // 青色 - 强调色
          dark: '#1e1b4b',       // 深蓝紫 - 深色背景
          light: '#f5f3ff',      // 浅紫 - 浅色背景
        }
      }
    },
  },
  plugins: [],
}
