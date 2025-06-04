import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    base: mode === 'production' ? '/modul-vocal/' : '/',
    plugins: [react()],
    server: {
      port: 3002,
      host: true,
      cors: true,
      hmr: {
        overlay: true
      }
    },
    build: {
      sourcemap: true
    },
    css: {
      devSourcemap: true
    },
    logLevel: 'info',
    clearScreen: false,
    define: {
      'process.env.NODE_ENV': `"${mode}"`,
      'process.env.DEBUG': mode === 'development' ? 'true' : 'false'
    },
    optimizeDeps: {
      include: ['axios']
    },
    esbuild: {
      jsxInject: `import React from 'react'`,
      define: {
        'process.env.NODE_ENV': `"${mode}"`
      }
    }
  };
});
