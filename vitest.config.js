import { mergeConfig } from 'vite'
import { defineConfig as defineVitestConfig } from 'vitest/config'
import viteConfig from './vite.config.js'

export default mergeConfig(
  viteConfig,
  defineVitestConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/setupTests.js'],
      // Les machines de dev (Windows) sont lentes quand plusieurs fichiers de
      // test tournent en parallèle : 5 s par défaut rendait la suite instable.
      testTimeout: 15000,
      // Chaque fichier monte un environnement jsdom complet : au-delà de
      // quelques workers la mémoire sature et userEvent (qui attend entre
      // chaque frappe) part en timeout. On plafonne pour rester déterministe.
      maxWorkers: 4,
    },
  })
)
