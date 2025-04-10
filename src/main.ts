import './style.css'
import typescriptLogo from './typescript.svg'
import { setupCounter } from '../lib/main'

import initCapture from '../lib'

// console.log('performance', window.performance)
// const observer = new PerformanceObserver((list) => {
//   console.log('list', list.getEntries())
// })
// observer.observe({ entryTypes: ['paint'] })
initCapture({})
// JS
// function test() {
//   new Array(-1)
// }
// setInterval(() => test(), 2000)
// RS
// const script = document.createElement('script')
// script.src = 'https://libs.baidu.com/jquery/3.6.0/jquery.min.js'
// document.head.appendChild(script)
// const img = document.createElement('img')
// img.src =
//   'https://instagram.fhan14-5.fna.fbcdn.net/v/t51.2885-15/489573872_17886932259244881_4792940461439469489_n.jpg?stp=dst-jpg_e35_tt6&cb=30a688f7-fa102a98&efg=eyJ2ZW5jb2RlX3RhZyI6IkZFRUQuaW1hZ2VfdXJsZ2VuLjE0Mzl4MTgxNy5zZHIuZjc1NzYxLmRlZmF1bHRfaW1hZ2UifQ&_nc_ht=instagram.fhan14-5.fna.fbcdn.net&_nc_cat=109&_nc_oc=Q6cZ2QFQdVgptY060KbgvIi1mnb-GEJ1vKpH8oOPHx7ymYrW3fnRxlciFxHqHTbhmqgBLBo&_nc_ohc=g_F1YOAdsCUQ7kNvwHw8pnM&_nc_gid=PaA705y-TjMwePbT_P6Dvw&edm=APs17CUBAAAA&ccb=7-5&ig_cache_key=MzYwNTkzMjA3ODA3NDAzNTQ4OA%3D%3D.3-ccb7-5-cb30a688f7-fa102a98&oh=00_AfEi1FcmvIg1M7Nj857mPcy2wW1kfBtydlDlM90ez8NsuQ&oe=67FA77EE&_nc_sid=10d13b'
// document.body.appendChild(img)

// UJ
// Promise
// function testUj() {
//   Promise.reject(new Error('未捕获的Promise错误'))
// }
// testUj()

// function testXhrError() {
//   const xhr = new XMLHttpRequest()
//   xhr.open('GET', 'https://www.baidu1.com')
//   xhr.send()
// }
// testXhrError()

function testFetchError() {
  const headers = new Headers()
  headers.set('Content-Type', 'application/json')
  fetch('https://67f7443042d6c71cca64842a.mockapi.io/api/v1/delay11', {
    headers,
    method: 'GET',
    signal: AbortSignal.timeout(1)
  })
    .then((res) => {
      console.log('res', res)
    })
    .catch((err) => {
      console.log('err', err)
    })
}
testFetchError()

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
