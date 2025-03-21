import './style.css'
import typescriptLogo from './typescript.svg'
import { setupCounter } from '../lib/main'

// 捕获 JS 运行时错误
window.addEventListener(
  'error',
  (event) => {
    console.log('instanceof', event instanceof ErrorEvent)
    console.log(event)
  },
  true
)

const script = document.createElement('script')
script.src = 'https://libs.baidu.com/jquery/3.6.0/jquery.min.js'
document.head.appendChild(script)

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="/vite.svg" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1>Vite + TypeScript</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
  </div>
`

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)
