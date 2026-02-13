/**
 * PostCSS 配置文件
 * 
 * 用途：配置 CSS 处理管道
 * 
 * 为什么需要：
 * - Tailwind CSS 是一个 PostCSS 插件
 * - 需要在构建时处理 CSS 文件
 */

module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
