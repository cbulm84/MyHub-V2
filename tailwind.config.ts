import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'alliance-blue': '#009FDB',
        'alliance-navy': '#1B4278',
        'alliance-green': '#94C83D',
        'alliance-sky': '#6EC1E4',
        'alliance-alert': '#CC4B37',
        'alliance-gray': '#CCCCCC',
        'alliance-light-gray': '#FAFAFA',
      },
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
      },
      backgroundImage: {
        'alliance-gradient': 'linear-gradient(90deg, #009FDB 0%, #1B4278 100%)',
      },
      boxShadow: {
        'alliance': 'rgba(0, 0, 0, 0.16) 0px 3px 6px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
export default config