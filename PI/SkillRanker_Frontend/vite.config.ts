import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    allowedHosts: true,     // يسمح بكل الـ hosts (أسهل للتطوير + localtunnel)
    // أو لو حابب تكون أكثر أمان:
    // allowedHosts: ['.loca.lt', 'localhost']
  }
});