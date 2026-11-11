import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  // GitHub Pages serves this project below /quran-reader/ rather than at /.
  base: '/quran-reader/',
  plugins: [react()],
});

