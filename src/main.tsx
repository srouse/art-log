import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { PRINT_PAGE_MARGIN_IN, PRINT_PAGE_SIZE_CSS } from './constants'
import './index.css'

const printPageStyle = document.createElement('style')
printPageStyle.dataset.artlog = 'print-page'
printPageStyle.textContent = `@media print {
  @page {
    size: ${PRINT_PAGE_SIZE_CSS};
    margin: ${PRINT_PAGE_MARGIN_IN}in;
  }
}`
document.head.appendChild(printPageStyle)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
