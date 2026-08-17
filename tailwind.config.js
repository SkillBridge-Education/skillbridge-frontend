/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        surface:     '#FFFFFF',
        ink:         '#1A1410',
        card:        '#FFFFFF',
        warm:        '#C8864B',
        'warm-dk':   '#8C5A1E',
        // Variante accessible du orange de marque. #C8864B ne donne que 3,01:1
        // avec du blanc (et 2,74:1 en texte sur cream) : sous le seuil AA de
        // 4,5:1. `warm-strong` monte à 5,05:1 sur blanc et 4,60:1 sur cream.
        // À utiliser dès qu'il porte du texte ou une bordure signifiante ;
        // `warm` reste le orange de marque pour les aplats décoratifs.
        'warm-strong': '#A05F26',
        night:       '#252840',
        // Project brand tokens
        navy:        '#252840',
        orange:      '#C8864B',
        sage:        '#3D5C28',
        cream:       '#F8F4EA',
        'light-cream': '#FDFAF4',
        'navy-dark': '#1A1410',
        // Lovable design system tokens
        'orange-warm':      '#D98E4A',
        'orange-warm-dark': '#B56F31',
        learn:              '#3F6B4C',
        'learn-dark':       '#2E5239',
        peach:              '#F6C9A4',
        lavender:           '#C9BCE6',
        mint:               '#B6DEC5',
        sky:                '#B9D4E8',
        rose:               '#E8B6C0',
        sun:                '#F1D480',
      },
      boxShadow: {
        soft: '0 10px 40px -12px rgba(37,40,64,0.18)',
        card: '0 4px 24px -10px rgba(37,40,64,0.15)',
      },
    },
  },
  plugins: [],
}