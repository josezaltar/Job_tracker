import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildProfileMessages, generateProfile, MAX_CVS, parseProfile } from '../src/lib/cv.ts'
import { buildMessages, normalizeCurriculo, parseAnalysis } from '../src/lib/analyze.ts'
import { lacunasOf } from '../src/lib/stats.ts'

const PERFIL = `**Nome e localização:** Ana Souza — Recife, PE
- Nível: Desenvolvedora Front-end Júnior
Formação: Bacharelado em Administração (UFPE, 2019)
Currículos disponíveis: Geral`

test('buildProfileMessages manda a data de hoje e todos os currículos, identificados', () => {
  const m = buildProfileMessages(
    [
      { name: 'cv_geral.pdf', text: 'TEXTO GERAL' },
      { name: 'cv_front.pdf', text: 'TEXTO FRONT' },
    ],
    new Date(2026, 9, 23),
  )
  assert.equal(m[0].role, 'system')
  assert.match(m[0].content, /SOMENTE o que está nos currículos/)
  assert.match(m[0].content, /junte tudo sem repetir/)
  assert.match(m[1].content, /Data de hoje: out\/2026\. Total de currículos: 2/)
  assert.match(m[1].content, /CURRÍCULO 1 \(arquivo: cv_geral\.pdf\):\nTEXTO GERAL[\s\S]*CURRÍCULO 2 \(arquivo: cv_front\.pdf\):\nTEXTO FRONT/)
})

test('buildProfileMessages limita o tamanho e a quantidade de currículos', () => {
  const muitos = Array.from({ length: MAX_CVS + 2 }, (_, i) => ({ name: `cv${i}.pdf`, text: 'x'.repeat(20000) }))
  const content = buildProfileMessages(muitos)[1].content
  assert.equal((content.match(/CURRÍCULO \d/g) ?? []).length, MAX_CVS)
  assert.ok(content.length < MAX_CVS * 12200)
})

test('parseProfile limpa markdown e garante as versões de currículo', () => {
  const p = parseProfile('```\n' + PERFIL + '\n```')
  assert.match(p, /^Nome e localização: Ana Souza/)
  assert.match(p, /^Nível: Desenvolvedora/m)
  assert.equal(p.split('\n').at(-1), 'Currículos disponíveis: Geral')
  assert.equal((p.match(/Currículos disponíveis/g) ?? []).length, 1)
  const tres = parseProfile('Nível: Júnior\nCurrículos disponíveis: Geral, Front-end, Back-end\nDiferenciais: gestão')
  assert.equal(tres.split('\n').at(-1), 'Currículos disponíveis: Geral, Front-end, Back-end')
  assert.equal(parseProfile('Nível: Júnior').split('\n').at(-1), 'Currículos disponíveis: Geral')
  assert.throws(() => parseProfile('Desculpe, não consigo ler.'), /não conseguiu montar/)
})

test('generateProfile aponta o PDF sem texto e explica chave inválida', async () => {
  const ok = { name: 'bom.pdf', text: 'x'.repeat(300) }
  await assert.rejects(generateProfile({ key: 'k', model: 'm', cvs: [ok, { name: 'scan.pdf', text: 'pouco' }] }), /ler o texto de: scan\.pdf.*escaneada/)
  await assert.rejects(generateProfile({ key: 'k', model: 'm', cvs: [] }), /escaneada/)
  await assert.rejects(generateProfile({ key: '', model: 'm', cvs: [ok] }), /chave da Groq/)
  globalThis.fetch = (async () => new Response('{}', { status: 401 })) as typeof fetch
  await assert.rejects(generateProfile({ key: 'k', model: 'm', cvs: [ok] }), /Chave da Groq inválida/)
  globalThis.fetch = (async () => new Response(JSON.stringify({ choices: [{ message: { content: PERFIL } }] }))) as typeof fetch
  assert.match(await generateProfile({ key: 'k', model: 'm', cvs: [ok, ok] }), /Ana Souza/)
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

test('normalizeCurriculo aceita as versões que a pessoa tiver', () => {
  assert.equal(normalizeCurriculo('front-end'), 'Front-end')
  assert.equal(normalizeCurriculo('Back end'), 'Back-end')
  assert.equal(normalizeCurriculo('Full Stack'), 'Geral')
  assert.equal(normalizeCurriculo(''), 'Geral')
  assert.equal(normalizeCurriculo(' Dados '), 'Dados')
  assert.match(buildMessages('p', 'v', 'u', 't')[0].content, /versões listadas em "Currículos disponíveis"/)
})
