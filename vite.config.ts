import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

// Self-signed cert (certs/dev.crt + certs/dev.key) để truy cập qua LAN IP vẫn là
// secure context — bắt buộc cho File System Access API (showDirectoryPicker).
const certDir = path.resolve(__dirname, 'certs');
const https =
  fs.existsSync(path.join(certDir, 'dev.crt')) && fs.existsSync(path.join(certDir, 'dev.key'))
    ? {
        key: fs.readFileSync(path.join(certDir, 'dev.key')),
        cert: fs.readFileSync(path.join(certDir, 'dev.crt')),
      }
    : undefined;

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      https,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
