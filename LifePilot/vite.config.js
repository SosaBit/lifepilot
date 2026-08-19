import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'lifepilot-runtime-fix',
      enforce: 'pre',
      transform(code, id) {
        if (id.endsWith('/src/main.jsx') && !code.includes('import { createRoot } from "react-dom/client"')) {
          return {
            code: 'import { createRoot } from "react-dom/client";\n' + code,
            map: null,
          }
        }
      },
    },
  ],
})
