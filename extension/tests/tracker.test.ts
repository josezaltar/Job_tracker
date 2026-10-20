import { test } from 'node:test'
import assert from 'node:assert/strict'
import { findJobsByUrl, friendlyNetworkError, login, SessionExpiredError } from '../src/lib/jobTracker.ts'

type Call = { url: string; init?: RequestInit }

function mockFetch(responder: (call: Call) => Response) {
  const calls: Call[] = []
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    const call = { url: String(url), init }
    calls.push(call)
    return responder(call)
  }) as typeof fetch
  return calls
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

test('login troca o token normal pelo token de 90 dias da extensão', async () => {
  const calls = mockFetch(({ url }) =>
    url.endsWith('/auth/login')
      ? json({ token: 'curto', user: { name: 'José', email: 'j@x.com' } })
      : json({ token: 'longo', expiresIn: '90d' }, 201),
  )
  const r = await login('https://api.exemplo.com/api/', 'j@x.com', 'senha')
  assert.equal(r.token, 'longo')
  assert.equal(r.longLived, true)
  assert.equal(calls[1].url, 'https://api.exemplo.com/api/auth/extension-token')
  assert.equal((calls[1].init?.headers as Record<string, string>).Authorization, 'Bearer curto')
})

test('login funciona com API antiga, sem a rota do token da extensão', async () => {
  mockFetch(({ url }) => (url.endsWith('/auth/login') ? json({ token: 'curto', user: { email: 'j@x.com' } }) : json({}, 404)))
  const r = await login('https://api.exemplo.com/api', 'j@x.com', 'senha')
  assert.equal(r.token, 'curto')
  assert.equal(r.longLived, false)
})

test('login com senha errada mostra a mensagem da API', async () => {
  mockFetch(() => json({ message: 'Credenciais inválidas' }, 401))
  await assert.rejects(login('https://api', 'a', 'b'), /Credenciais inválidas/)
})

test('findJobsByUrl filtra pelo link mesmo se a API devolver todas as vagas', async () => {
  const calls = mockFetch(() =>
    json([
      { id: '1', company: 'A', position: 'Dev', url: 'https://www.linkedin.com/jobs/view/1/' },
      { id: '2', company: 'B', position: 'Dev', url: 'https://outra' },
    ]),
  )
  const found = await findJobsByUrl('https://api', 't', 'https://www.linkedin.com/jobs/view/1/')
  assert.deepEqual(found.map((j) => j.id), ['1'])
  assert.equal(calls[0].url, 'https://api/jobs?url=https%3A%2F%2Fwww.linkedin.com%2Fjobs%2Fview%2F1%2F')
})

test('findJobsByUrl avisa quando a sessão expira', async () => {
  mockFetch(() => json({}, 401))
  await assert.rejects(findJobsByUrl('https://api', 't', 'u'), SessionExpiredError)
})

test('friendlyNetworkError explica servidor dormindo', () => {
  assert.match(friendlyNetworkError(new TypeError('Failed to fetch')), /acordando/)
  assert.equal(friendlyNetworkError(new Error('Outro erro')), 'Outro erro')
})
