if (import.meta.env.PROD) {
  document.addEventListener('contextmenu', e => e.preventDefault())

  document.addEventListener('keydown', e => {
    if (e.key === 'F12' ||
        (e.ctrlKey && ['s', 'u', 'S', 'U'].includes(e.key)) ||
        (e.ctrlKey && e.shiftKey && ['i', 'I', 'j', 'J', 'c', 'C'].includes(e.key))) {
      e.preventDefault()
      return false
    }
  })

  document.addEventListener('selectstart', e => e.preventDefault())
  document.addEventListener('dragstart', e => e.preventDefault())

  setInterval(() => {
    const start = performance.now()
    debugger
    if (performance.now() - start > 100) {
      document.body.innerHTML = ''
      window.location.href = 'about:blank'
    }
  }, 3000)

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
  }
}
