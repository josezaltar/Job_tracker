import { test } from 'node:test'
import assert from 'node:assert/strict'
import { effectiveGroqKey } from '../src/lib/settings.ts'

test('effectiveGroqKey: a chave própria tem prioridade sobre a chave padrão do teste', () => {
  assert.equal(effectiveGroqKey({ groqKey: '', defaultGroqKey: 'gsk_padrao' }), 'gsk_padrao')
  assert.equal(effectiveGroqKey({ groqKey: '  gsk_minha ', defaultGroqKey: 'gsk_padrao' }), 'gsk_minha')
  assert.equal(effectiveGroqKey({ groqKey: '', defaultGroqKey: '' }), '')
})
