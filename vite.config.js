import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' — 상대 경로 빌드로 Netlify 등 어디에 올려도 빈 화면이 되지 않게 함
export default defineConfig({
  base: './',
  plugins: [react()],
});
