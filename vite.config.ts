import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 9999, // 指定端口
    host: '0.0.0.0', 
    hmr: {
      overlay: true, // 显示错误覆盖层
    },
    allowedHosts: [
      'iwishweb.sa1.tunnelfrp.com', // 允许的域名
      '.sa1.tunnelfrp.com' // 允许所有子域名
    ]
  },
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
