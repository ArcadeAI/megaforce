import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import { resolve } from 'node:path'

// https://vitejs.dev/config/
/** @type {import('vite').UserConfig} */
export default defineConfig(async ({ mode }) => {
  let reactPlugin: any = null
  try {
    const mod = await import('@vitejs/plugin-react')
    // @ts-ignore - default export exists at runtime
    reactPlugin = mod.default()
  } catch {
    // Optional: plugin not installed; proceed without it (production-safe)
  }

  return {
    plugins: [
      TanStackRouterVite({ autoCodeSplitting: true }),
      ...(reactPlugin ? [reactPlugin] : []),
      tailwindcss(),
    ],
  server: {
    port: 3000,
    allowedHosts: ['megaforce.tech'],
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    allowedHosts: ['megaforce.tech'],
  },
  resolve: {
    alias: [
      // Ensure extensionless imports like "@/lib/utils" resolve correctly in all environments
      { find: /^@\/lib\/utils$/, replacement: resolve(__dirname, './src/lib/utils.ts') },
      { find: '@', replacement: resolve(__dirname, './src') },
    ],
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(
      process.env.NODE_ENV || (mode === 'production' ? 'production' : 'development')
    ),
  },
  }
})
