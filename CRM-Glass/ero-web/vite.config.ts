/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    // A API roda na 8080. O cookie de refresh tem Path=/api/auth: pelo proxy ele fica na mesma origem do front.
    proxy: {
      '/api': { target: 'http://localhost:8080' },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // As telas já são pedaços próprios (rotas lazy). As bibliotecas que toda tela usa vão em pedaços por
        // família, para nenhum passar de 500 kB e o cache do navegador sobreviver às trocas do código do app.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react';
          if (/[\\/]node_modules[\\/](react-router|react-router-dom|cookie|set-cookie-parser)[\\/]/.test(id)) return 'roteador';
          if (/[\\/]node_modules[\\/](motion|framer-motion|motion-dom|motion-utils)[\\/]/.test(id)) return 'movimento';
          if (/[\\/]node_modules[\\/]zod[\\/]/.test(id)) return 'zod';
          if (/[\\/]node_modules[\\/]@tanstack[\\/]/.test(id)) return 'consulta';
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
