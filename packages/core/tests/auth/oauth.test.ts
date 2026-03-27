import { describe, it, expect, vi } from 'vitest'
import { OAuthProvider } from '../../src/auth/oauth.js'

describe('OAuthProvider', () => {
  it('generates Google authorization URL', () => {
    const provider = new OAuthProvider({
      provider: 'google', clientId: 'cid', clientSecret: 'cs', redirectUri: 'http://localhost:3000/callback',
    })
    const url = provider.getAuthorizationUrl('state123')
    expect(url).toContain('accounts.google.com')
    expect(url).toContain('client_id=cid')
    expect(url).toContain('state=state123')
  })

  it('generates GitHub authorization URL', () => {
    const provider = new OAuthProvider({
      provider: 'github', clientId: 'cid', clientSecret: 'cs', redirectUri: 'http://localhost:3000/callback',
    })
    const url = provider.getAuthorizationUrl('state456')
    expect(url).toContain('github.com/login/oauth/authorize')
    expect(url).toContain('client_id=cid')
  })

  it('exchanges Google code for user', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'tok' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: '123', email: 'user@gmail.com', name: 'Test User' }) })
    )
    const provider = new OAuthProvider({ provider: 'google', clientId: 'cid', clientSecret: 'cs', redirectUri: 'http://localhost/cb' })
    const user = await provider.exchangeCode('code123')
    expect(user.email).toBe('user@gmail.com')
    expect(user.provider).toBe('google')
    vi.unstubAllGlobals()
  })

  it('exchanges GitHub code for user', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'tok' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 456, login: 'testuser', email: 'user@github.com', name: 'GH User' }) })
    )
    const provider = new OAuthProvider({ provider: 'github', clientId: 'cid', clientSecret: 'cs', redirectUri: 'http://localhost/cb' })
    const user = await provider.exchangeCode('code456')
    expect(user.email).toBe('user@github.com')
    expect(user.provider).toBe('github')
    vi.unstubAllGlobals()
  })
})
