import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cleanText, MAX_CHARS, normalizeJobUrl, pickJobText } from '../src/lib/jobText.ts'
import { runningTask } from '../src/lib/jobState.ts'

const longo = (palavra: string, n = 60) => Array(n).fill(palavra).join(' ')

test('normalizeJobUrl: LinkedIn (busca e página da vaga viram o mesmo link)', () => {
  const esperado = 'https://www.linkedin.com/jobs/view/4472813358/'
  assert.equal(normalizeJobUrl('https://www.linkedin.com/jobs/search/?currentJobId=4472813358&keywords=react'), esperado)
  assert.equal(normalizeJobUrl('https://www.linkedin.com/jobs/view/4472813358/?trk=abc&refId=x'), esperado)
  assert.equal(normalizeJobUrl('https://br.linkedin.com/jobs/view/desenvolvedor-react-4472813358'), esperado)
})

test('normalizeJobUrl: Indeed, Glassdoor e Gupy', () => {
  assert.equal(normalizeJobUrl('https://br.indeed.com/jobs?q=react&vjk=abc123'), 'https://br.indeed.com/viewjob?jk=abc123')
  assert.equal(
    normalizeJobUrl('https://www.glassdoor.com.br/job-listing/dev-JV_IC123.htm?jl=999&src=GD'),
    'https://www.glassdoor.com.br/job-listing/dev-JV_IC123.htm?jl=999',
  )
  assert.equal(normalizeJobUrl('https://empresa.gupy.io/jobs/123?jobBoardSource=gupy_public_page'), 'https://empresa.gupy.io/jobs/123')
})

test('normalizeJobUrl: outros sites perdem só rastreamento e âncora', () => {
  assert.equal(
    normalizeJobUrl('https://programathor.com.br/jobs/123-dev?utm_source=x&page=2#topo'),
    'https://programathor.com.br/jobs/123-dev?page=2',
  )
  assert.equal(normalizeJobUrl('não é um link '), 'não é um link')
})

test('pickJobText: prefere a seleção quando ela é grande o bastante', () => {
  const r = pickJobText(longo('react'), [{ selector: '#jobDescriptionText', text: longo('indeed') }], 'pagina')
  assert.equal(r.source, 'selecao')
  assert.match(r.text, /^react/)
})

test('pickJobText: sem seleção, usa o bloco de descrição na ordem de prioridade', () => {
  const r = pickJobText(
    'só um pedaço',
    [
      { selector: '.jobs-description__content', text: longo('descricao') },
      { selector: '.jobs-search__job-details--container', text: longo('painel') },
    ],
    longo('pagina'),
  )
  assert.equal(r.source, 'descricao')
  assert.match(r.text, /^painel/) // o painel do LinkedIn vem antes na lista
})

test('pickJobText: ignora blocos curtos e cai para a página', () => {
  const r = pickJobText('', [{ selector: '#job-details', text: 'curto' }], 'texto da página')
  assert.deepEqual(r, { text: 'texto da página', source: 'pagina' })
})

test('cleanText: junta espaços, limita linhas em branco e o tamanho', () => {
  assert.equal(cleanText('  a \t b\n\n\n\nc  '), 'a b\n\nc')
  assert.equal(cleanText('x'.repeat(MAX_CHARS + 50)).length, MAX_CHARS)
})

test('runningTask: tarefa antiga (navegador fechou no meio) não trava a extensão', () => {
  const agora = 1_000_000_000
  assert.equal(runningTask({ task: 'analyzing', taskStartedAt: agora - 10_000 }, agora), 'analyzing')
  assert.equal(runningTask({ task: 'saving', taskStartedAt: agora - 4 * 60_000 }, agora), undefined)
  assert.equal(runningTask(undefined, agora), undefined)
})
