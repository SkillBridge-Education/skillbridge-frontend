import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import api from './api'
import useAuthStore from '../store/authStore'

// On force l'adaptateur d'axios à renvoyer la réponse voulue : les
// intercepteurs réels s'exécutent, sans requête réseau.
function respondWith(status, data) {
  api.defaults.adapter = (config) => {
    const response = { status, data, headers: {}, config }
    if (status >= 200 && status < 300) return Promise.resolve(response)
    const error = new Error(`Request failed with status code ${status}`)
    error.response = response
    error.config = config
    return Promise.reject(error)
  }
}

const originalAdapter = api.defaults.adapter

beforeEach(() => {
  useAuthStore.setState({ user: { id: '1' }, token: 'jwt', authReady: true, suspension: null })
})

afterEach(() => {
  api.defaults.adapter = originalAdapter
})

describe('api response interceptor', () => {
  it('switches the app into suspended mode on a 403 carrying an appeal path', async () => {
    respondWith(403, {
      message: 'Votre compte a été suspendu.',
      reason: 'Harcèlement',
      appealPath: '/appeals',
    })

    await expect(api.get('/sessions/mine')).rejects.toBeTruthy()

    expect(useAuthStore.getState().suspension).toEqual({
      message: 'Votre compte a été suspendu.',
      reason: 'Harcèlement',
      appealPath: '/appeals',
    })
    // Une suspension n'est pas une déconnexion : la session reste ouverte pour
    // que la personne puisse déposer un recours.
    expect(useAuthStore.getState().token).toBe('jwt')
  })

  it('leaves an ordinary 403 alone', async () => {
    respondWith(403, { message: 'Forbidden' })

    await expect(api.get('/sessions/mine')).rejects.toBeTruthy()

    expect(useAuthStore.getState().suspension).toBeNull()
  })

  it('logs the user out on a 401', async () => {
    respondWith(401, { message: 'Token expired' })

    await expect(api.get('/auth/me')).rejects.toBeTruthy()

    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
  })
})
