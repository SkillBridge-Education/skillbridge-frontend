import { afterEach, describe, expect, it, vi } from 'vitest'
import api, { authApi, matchApi, getApiError } from './api'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('authApi', () => {
  it('login posts credentials and returns the response payload', async () => {
    const payload = { user: { id: '1', email: 'a@b.com' }, token: 'jwt-token' }
    vi.spyOn(api, 'post').mockResolvedValue({ data: payload })

    const result = await authApi.login({ email: 'a@b.com', password: 'secret' })

    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'a@b.com', password: 'secret' })
    expect(result).toEqual(payload)
  })

  it('me unwraps the user object from the response', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: { user: { id: '1', firstName: 'Ada' } } })

    const result = await authApi.me()

    expect(api.get).toHaveBeenCalledWith('/auth/me')
    expect(result).toEqual({ id: '1', firstName: 'Ada' })
  })
})

describe('matchApi', () => {
  it('request posts the receiver id to /matches/request', async () => {
    vi.spyOn(api, 'post').mockResolvedValue({ data: { match: { id: 'm1', status: 'PENDING' } } })

    const result = await matchApi.request({ receiverId: 'user-2' })

    expect(api.post).toHaveBeenCalledWith('/matches/request', { receiverId: 'user-2' })
    expect(result).toEqual({ match: { id: 'm1', status: 'PENDING' } })
  })

  it('update sends the new status via PATCH', async () => {
    vi.spyOn(api, 'patch').mockResolvedValue({ data: { match: { id: 'm1', status: 'ACCEPTED' } } })

    await matchApi.update('m1', 'ACCEPTED')

    expect(api.patch).toHaveBeenCalledWith('/matches/m1', { status: 'ACCEPTED' })
  })
})

describe('getApiError', () => {
  it('extracts the backend message when present', () => {
    const err = { response: { data: { message: 'Invalid email or password' } } }
    expect(getApiError(err)).toBe('Invalid email or password')
  })

  it('falls back to the error message when there is no response body', () => {
    expect(getApiError(new Error('Network Error'))).toBe('Network Error')
  })

  it('falls back to a generic message as a last resort', () => {
    expect(getApiError({})).toBe('Unknown error')
  })
})
