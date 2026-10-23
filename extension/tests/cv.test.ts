import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildProfileMessages, generateProfile, parseProfile, RESUME_VERSIONS_LINE } from '../src/lib/cv.ts'
import { buildMessages, parseAnalysis } from '../src/lib/analyze.ts'
import { lacunasOf } from '../src/lib/stats.ts'

const PERFIL = `**Nome e localização:** Ana Souza — Recife, PE
- Nível: Desenvolvedora Front-end Júnior
Formação: Bacharelado em Administração (UFPE, 2019)
Currículos disponíveis: Geral`

test('buildProfileMessages manda a data de hoje e o texto do currículo', () => {
  const m = buildProfileMessages('TEXTO DO CV', new Date(2026, 9, 23))
  assert.equal(m[0].role, 'system')
  assert.match(m[0].content, /SOMENTE o que está no currículo/)
  assert.match(m[1].content, /Data de hoje: out\/2026/)
  assert.match(m[1].content, /TEXTO DO CV/)
  assert.equal(buildProfileMessages('x'.repeat(30000))[1].content.length < 20100, true)
})

test('parseProfile limpa markdown e garante as versões de currículo', () => {
  const p = parseProfile('```\n' + PERFIL + '\n```')
  assert.match(p, /^Nome e localização: Ana Souza/)
  assert.match(p, /^Nível: Desenvolvedora/m)
  assert.equal(p.split('\n').at(-1), RESUME_VERSIONS_LINE)
  assert.equal((p.match(/Currículos disponíveis/g) ?? []).length, 1)
  assert.throws(() => parseProfile('Desculpe, não consigo ler.'), /não conseguiu montar/)
})

test('generateProfile recusa PDF sem texto e explica chave inválida', async () => {
  await assert.rejects(generateProfile({ key: 'k', model: 'm', cvText: 'pouco' }), /escaneada/)
  await assert.rejects(generateProfile({ key: '', model: 'm', cvText: 'x'.repeat(300) }), /chave da Groq/)
  globalThis.fetch = (async () => new Response('{}', { status: 401 })) as typeof fetch
  await assert.rejects(generateProfile({ key: 'k', model: 'm', cvText: 'x'.repeat(300) }), /Chave da Groq inválida/)
  globalThis.fetch = (async () => new Response(JSON.stringify({ choices: [{ message: { content: PERFIL } }] }))) as typeof fetch
  assert.match(await generateProfile({ key: 'k', model: 'm', cvText: 'x'.repeat(300) }), /Ana Souza/)
})

test('regra de graduação: qualquer graduação vale e não vira lacuna', () => {
  assert.match(buildMessages('p', 'v', 'u', 't')[0].content, /QUALQUER graduação/)
  assert.doesNotMatch(buildMessages('p', 'v', 'u', 't')[0].content, /graduação obrigatória em TI/)
  const a = parseAnalysis(
    '{"nota":50,"eliminatorios":["Graduação em Ciência da Computação"],"falta":["Next.js"],"lacunas":[{"nome":"Graduação em TI","tipo":"formacao","obrigatorio":true},{"nome":"Ensino superior completo","tipo":"formacao"},{"nome":"Next.js","tipo":"tecnologia"}]}',
  )
  assert.deepEqual(lacunasOf(a).map((l) => l.nome), ['Next.js'])
  assert.deepEqual(lacunasOf({ ...a, lacunas: [] }).map((l) => l.nome), ['Next.js'])
})
