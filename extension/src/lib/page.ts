// Lê o texto da vaga na aba atual: o trecho selecionado, o bloco de descrição do site ou a página.
import { JOB_SELECTORS, normalizeJobUrl, pickJobText, type Candidate, type TextSource } from './jobText.ts'

export interface PageContent {
  url: string // link original da aba
  jobUrl: string // link normalizado da vaga (usado para cache e para não duplicar)
  title: string
  text: string
  source: TextSource
}

// Roda dentro da página da vaga. Precisa ser autocontida: não pode usar nada de fora da função.
function collectFromPage(selectors: string[]) {
  const selection = window.getSelection()?.toString() ?? ''
  const candidates: { selector: string; text: string }[] = []
  for (const selector of selectors) {
    try {
      const el = document.querySelector(selector) as HTMLElement | null
      if (el?.innerText) candidates.push({ selector, text: el.innerText })
    } catch {
      // seletor inválido neste navegador: ignora
    }
  }
  const main = document.querySelector('main, article, [role="main"]') as HTMLElement | null
  return { selection, candidates, pageText: (main ?? document.body).innerText }
}

/**
 * Lê a aba ativa. Com `tabId`, lê uma aba específica (ex.: popup aberto como "popup.html?tab=123",
 * útil para abrir o analisador numa janela própria e nos testes automáticos).
 */
export async function getPageContent(tabId?: number): Promise<PageContent> {
  const [tab] = tabId ? [await chrome.tabs.get(tabId)] : await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id || !tab.url || !/^https?:/.test(tab.url)) {
    throw new Error('Abra a página de uma vaga (LinkedIn, Gupy, Indeed etc.) para analisar.')
  }

  let collected: { selection: string; candidates: Candidate[]; pageText: string }
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: collectFromPage,
      args: [JOB_SELECTORS],
    })
    collected = result?.result ?? { selection: '', candidates: [], pageText: '' }
  } catch {
    throw new Error('Não consegui ler esta página. Recarregue a aba (F5) e abra a extensão de novo.')
  }

  const picked = pickJobText(collected.selection, collected.candidates, collected.pageText)

  return {
    url: tab.url,
    jobUrl: normalizeJobUrl(tab.url),
    title: tab.title ?? '',
    text: picked.text,
    source: picked.source,
  }
}
