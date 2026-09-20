import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 5175 unless something else already has it, in which case whoever started
  // us hands the port down.
  server: { port: Number(process.env.PORT) || 5175 },
})
