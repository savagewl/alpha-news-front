import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      proxy: {
        // по умолчанию — стенд: его nginx сам снимает префикс /api перед бэкендом
        '/api': {
          target: env.VITE_PROXY_TARGET || 'https://alfa-news.mooo.com',
          changeOrigin: true,
          // бэкенд без nginx (uvicorn :8000) живёт без префикса
          ...(env.VITE_PROXY_STRIP_API === '1' && {
            rewrite: (path: string) => path.replace(/^\/api/, ''),
          }),
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test-setup.ts'],
      globals: true,
    },
  }
})
