// Lê o texto da vaga na aba atual: o trecho selecionado ou, se não houver, o texto da página.

export interface PageContent {
  url: string
  title: string
  text: string
  source: 'selecao' | 'pagina'
}

const MAX_CHARS = 15000

export async function getPageContent(): Promise<PageContent> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id || !tab.url || !/^https?:/.test(tab.url)) {
    throw new Error('Abra a página de uma vaga (LinkedIn, Gupy, etc.) para analisar.')
  }

  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const selection = window.getSelection()?.toString().trim() ?? ''
      // Sem seleção: usa o conteúdo principal da página
      const main = document.querySelector('main, article, [role="main"]') as HTMLElement | null
      const pageText = (main ?? document.body).innerText
      return { selection, pageText }
    },
  })

  const { selection, pageText } = (result?.result ?? { selection: '', pageText: '' }) as {
    selection: string
    pageText: string
  }
  const useSelection = selection.length >= 80
  const text = (useSelection ? selection : pageText).replace(/\n{3,}/g, '\n\n').slice(0, MAX_CHARS)

  return {
    url: tab.url,
    title: tab.title ?? '',
    text,
    source: useSelection ? 'selecao' : 'pagina',
  }
}
