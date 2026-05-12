import { defineConfig } from 'vite'
import { resolve } from 'path'
import obfuscator from 'vite-plugin-javascript-obfuscator'

export default defineConfig({
  root: 'src/pages',
  publicDir: resolve(__dirname, 'public'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'src/pages/index.html'),
        '投产核算': resolve(__dirname, 'src/pages/投产核算.html'),
        '广告分析': resolve(__dirname, 'src/pages/广告分析.html'),
        '词根拆解': resolve(__dirname, 'src/pages/词根拆解.html'),
        '任务清单': resolve(__dirname, 'src/pages/任务清单.html'),
        '写文案': resolve(__dirname, 'src/pages/写文案.html'),
        '单位换算': resolve(__dirname, 'src/pages/单位换算.html'),
        '合并表格': resolve(__dirname, 'src/pages/合并表格.html'),
        '图表生成': resolve(__dirname, 'src/pages/图表生成.html'),
        '批量打开': resolve(__dirname, 'src/pages/批量打开.html'),
        '文本格式': resolve(__dirname, 'src/pages/文本格式.html'),
        '标记ASIN': resolve(__dirname, 'src/pages/标记ASIN.html'),
        '标记关键词': resolve(__dirname, 'src/pages/标记关键词.html'),
        '网页翻译': resolve(__dirname, 'src/pages/网页翻译.html'),
        '重复检测': resolve(__dirname, 'src/pages/重复检测.html'),
      }
    }
  },
  plugins: [
    obfuscator({
      include: ['src/js/**/*.js', 'src/utils/**/*.js'],
      apply: 'build',
      options: {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        stringArray: true,
        stringArrayThreshold: 0.75,
        stringArrayEncoding: ['rc4'],
        splitStrings: true,
        splitStringsChunkLength: 10,
        selfDefending: true,
        disableConsoleOutput: true,
        debugProtection: true,
        debugProtectionInterval: 4000,
        domainLock: ['wdamz.top'],
        domainLockRedirectUrl: 'about:blank',
      }
    })
  ]
})
