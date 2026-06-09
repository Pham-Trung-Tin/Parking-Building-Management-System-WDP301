import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,       // Khớp với CLIENT_URL=http://localhost:3000 bên backend
    strictPort: true, // Báo lỗi ngay nếu port 3000 đã bị chiếm (không tự nhảy sang port khác)
  },
})
