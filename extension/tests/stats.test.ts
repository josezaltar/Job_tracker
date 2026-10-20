import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseAnalysis, type Analysis } from '../src/lib/analyze.ts'
import { aggregate, canonicalName, lacunasOf, skillKey, studyProfileLines, toCsv } from '../src/lib/stats.ts'
import type { JobState } from '../src/lib/jobState.ts'

const analysis = (over: Partial<Analysis>): Analysis => ({
  ...parseAnalysis('{"nota":50,"empresa":"X","cargo":"Dev"}'),
  ...over,
})

const entry = (url: string, a: Analysis, saved?: JobState['saved']) => ({ jobUrl: url, state: { analysis: a, saved } as JobState })

test('parseAnalysis lê as lacunas e corrige tipos inválidos', () => {
  const a = parseAnalysis(
    '{"nota":40,"lacunas":[{"nome":" Next.js ","tipo":"tecnologia","obrigatorio":true},{"nome":"Inglês avançado","tipo":"IDIOMA"},{"nome":"x","tipo":"???"},{"tipo":"tecnologia"},"lixo"]}',
  )
  assert.deepEqual(a.lacunas, [
    { nome: 'Next.js', tipo: 'tecnologia', obrigatorio: true },
    { nome: 'Inglês avançado', tipo: 'idioma', obrigatorio: false },
    { nome: 'x', tipo: 'outro', obrigatorio: false },
  ])
  assert.deepEqual(parseAnalysis('{"nota":1}').lacunas, [])
})

test('skillKey e canonicalName juntam grafias diferentes', () => {
  assert.equal(skillKey('Next.js (diferencial)'), skillKey('NextJS'))
  assert.equal(skillKey('next'), skillKey('Next.js'))
  assert.equal(skillKey('Inglês Avançado'), skillKey('ingles avancado'))
  assert.notEqual(skillKey('C#'), skillKey('C'))
  assert.equal(canonicalName('nextjs'), 'Next.js')
  assert.equal(canonicalName('Testes com Jest (diferencial)'), 'Testes com Jest')
})

test('lacunasOf monta lacunas a partir do texto em análises antigas', () => {
  const old = analysis({ lacunas: [], falta: ['Next.js (diferencial)'], eliminatorios: ['Inglês fluente'] })
  assert.deepEqual(lacunasOf(old), [
    { nome: 'Inglês fluente', tipo: 'outro', obrigatorio: true },
    { nome: 'Next.js', tipo: 'outro', obrigatorio: false },
  ])
})

test('aggregate conta em quantas vagas cada lacuna aparece e ordena', () => {
  const stats = aggregate([
    entry('u1', analysis({ nota: 30, veredito: 'BAIXA', lacunas: [{ nome: 'Next.js', tipo: 'tecnologia', obrigatorio: true }, { nome: 'Jest', tipo: 'tecnologia', obrigatorio: false }] })),
    entry('u2', analysis({ nota: 50, veredito: 'MÉDIA', lacunas: [{ nome: 'NextJS', tipo: 'tecnologia', obrigatorio: false }, { nome: 'Next.js', tipo: 'tecnologia', obrigatorio: false }] })),
    entry('u3', analysis({ nota: 70, veredito: 'ALTA', lacunas: [{ nome: 'jest', tipo: 'outro', obrigatorio: false }, { nome: 'Next', tipo: 'tecnologia', obrigatorio: true }] }), {
      id: '1',
      company: 'Salva SA',
      position: 'Dev Jr',
      duplicate: false,
      at: '',
    }),
    { jobUrl: 'u4', state: {} }, // sem análise: não conta
  ])

  assert.equal(stats.total, 3)
  assert.equal(stats.avgScore, 50)
  assert.deepEqual(stats.verdicts, { ALTA: 1, MÉDIA: 1, BAIXA: 1 })
  assert.deepEqual(
    stats.gaps.map((g) => [g.nome, g.count, g.required, g.pct, g.tipo]),
    [
      ['Next.js', 3, 2, 100, 'tecnologia'], // repetido na mesma vaga conta 1 vez
      ['Jest', 2, 0, 67, 'tecnologia'],
    ],
  )
  assert.equal(stats.gaps[0].jobs[2].company, 'Salva SA') // usa o nome salvo no Job Tracker
})

test('aggregate sem vagas não divide por zero', () => {
  assert.deepEqual(aggregate([]), { total: 0, avgScore: 0, verdicts: { ALTA: 0, MÉDIA: 0, BAIXA: 0 }, gaps: [] })
})

test('studyProfileLines descreve o que está estudando e o que aprendeu', () => {
  const lines = studyProfileLines({ nextjs: { status: 'learned', nome: 'Next.js' }, jest: { status: 'studying', nome: 'Jest' } })
  assert.match(lines, /Estudou recentemente .*Next\.js/)
  assert.match(lines, /Estudando agora: Jest/)
  assert.equal(studyProfileLines({}), '')
})

test('toCsv gera planilha com ponto e vírgula e status', () => {
  const stats = aggregate([entry('u1', analysis({ empresa: 'A "B"', lacunas: [{ nome: 'Jest', tipo: 'tecnologia', obrigatorio: true }] }))])
  const csv = toCsv(stats, { jest: { status: 'studying', nome: 'Jest' } })
  const [header, row] = csv.split('\n')
  assert.match(header, /^"Requisito";"Tipo";"Vagas"/)
  assert.equal(row, '"Jest";"Tecnologia";"1";"100%";"1";"Estudando";"A ""B"""')
})
