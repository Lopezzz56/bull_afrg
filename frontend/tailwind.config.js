export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#FFFBF4',      // Warm Off-White Primary Background
          card: '#FFFFFF',    // Pure White for Cards / Inputs / Panels
          dark: '#11120D',    // Primary Text / Charcoal Accent
          muted: '#565449',   // Secondary Text / Muted Borders
          accent: '#D8CFBC',  // Warm Sand / Soft Highlights / Dividers
          teal: '#00A896',    // Geojit Brand Teal for primary actions
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}