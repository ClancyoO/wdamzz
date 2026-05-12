export function goHome() {
  window.location.href = './index.html'
}

export function showToast(message, type = 'success') {
  const toast = document.getElementById('toast')
  const toastMessage = document.getElementById('toastMessage')
  if (!toast || !toastMessage) return
  toastMessage.textContent = message
  const base = 'fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 flex items-center z-50 border'
  if (type === 'success') {
    toast.className = `${base} bg-bg-card border-green-500/50 text-green-400 translate-y-0 opacity-100`
  } else if (type === 'error') {
    toast.className = `${base} bg-bg-card border-red-500/50 text-red-400 translate-y-0 opacity-100`
  } else {
    toast.className = `${base} bg-bg-card border-primary/50 text-primary translate-y-0 opacity-100`
  }
  setTimeout(() => {
    toast.className = `${base} bg-bg-card border-border-color text-text-primary translate-y-20 opacity-0`
  }, 3000)
}
