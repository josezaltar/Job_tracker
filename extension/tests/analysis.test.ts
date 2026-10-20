import { test } from 'node:test'
import assert from 'node:assert/strict'
import { analyzeJob, buildMessages, parseAnalysis } from '../src/lib/analyze.ts'
import { buildPayload, formatNotes } from '../src/lib/jobTracker.ts'

const RAW = '```json\n{"empresa":"Acme","cargo":"Dev Front-end Jr","local":"Remoto","modalidade":"Remoto","contrato":"CLT","salario":"","nivel_vaga":"Júnior","nota":"78.6","veredito":"alta","bate":["React","TypeScript"],"falta":"Testes","eliminatorios":[],"curriculo":"front-end","resumo":"Boa vaga.","dica":"Destaque o Job Tracker."}\n```'

test('parseAnalysis limpa cercas de código e normaliza campos', () => {
  const a = parseAnalysis(RAW)
  assert.equal(a.empresa, 'Acme')
  assert.equal(a.nota, 79)
  assert.equal(a.veredito, 'ALTA')
  assert.equal(a.curriculo, 'Front-end')
  assert.deepEqual(a.falta, ['Testes'])
  assert.equal(a.salario, 'Não informado')
})

test('parseAnalysis limita a nota e deduz o veredito', () => {
  assert.equal(parseAnalysis('{"nota":150}').nota, 100)
  const a = parseAnalysis('texto antes {"nota":30,"veredito":"x"} depois')
  assert.equal(a.veredito, 'BAIXA')
  assert.equal(a.curriculo, 'Geral')
})

test('parseAnalysis rejeita resposta sem JSON', () => {
  assert.throws(() => parseAnalysis('desculpe, não consigo'))
  assert.throws(() => parseAnalysis('{quebrado'))
})

test('buildMessages inclui perfil, vaga e link', () => {
  const m = buildMessages('PERFIL X', 'VAGA Y', 'https://vaga', 'Título')
  assert.equal(m[0].role, 'system')
  assert.match(m[1].content, /PERFIL X[\s\S]*VAGA Y/)
  assert.match(m[1].content, /https:\/\/vaga/)
})

test('buildPayload monta a vaga para o Job Tracker', () => {
  const a = parseAnalysis(RAW)
  const p = buildPayload({ empresa: ' Acme ', cargo: 'Dev', local: '', salario: '', status: 'applied' }, a, 'https://vaga', 'desc')
  assert.equal(p.company, 'Acme')
  assert.equal(p.location, 'Remoto')
  assert.equal(p.status, 'applied')
  assert.equal(p.url, 'https://vaga')
  assert.equal('salary' in p, false)
  assert.match(p.appliedAt!, /^\d{4}-\d{2}-\d{2}$/)
  assert.match(p.notes!, /79\/100 — chance ALTA/)
  assert.match(formatNotes(a), /\+ React/)
})

test('analyzeJob repete sem json_object quando a Groq responde 400', async () => {
  const bodies: Record<string, unknown>[] = []
  globalThis.fetch = (async (_url: string, init: RequestInit) => {
    bodies.push(JSON.parse(String(init.body)))
    if (bodies.length === 1) return new Response('{}', { status: 400 })
    return new Response(JSON.stringify({ choices: [{ message: { content: '{"nota":50,"empresa":"Beta"}' } }] }), { status: 200 })
  }) as typeof fetch

  const a = await analyzeJob({ key: 'k', model: 'm', profile: 'p', text: 'x'.repeat(100), url: 'u', title: 't' })
  assert.equal(bodies.length, 2)
  assert.ok('response_format' in bodies[0])
  assert.ok(!('response_format' in bodies[1]))
  assert.equal(a.veredito, 'MÉDIA')
  assert.equal(a.empresa, 'Beta')
})

test('analyzeJob explica chave inválida', async () => {
  globalThis.fetch = (async () => new Response('{}', { status: 401 })) as typeof fetch
  await assert.rejects(analyzeJob({ key: 'k', model: 'm', profile: 'p', text: 'x'.repeat(100), url: '', title: '' }), /Chave da Groq inválida/)
})
