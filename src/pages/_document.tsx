import { Html, Head, Main, NextScript } from 'next/document'

// Aplica o tema antes da primeira pintura, senão a página pisca em branco
// quando alguém escolheu o escuro. Sem escolha salva, o padrão é o claro.
const aplicarTema = `
(function () {
  try {
    var t = localStorage.getItem('tema');
    document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : 'light');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`

export default function Document() {
  return (
    <Html lang="pt-BR" data-theme="light">
      <Head />
      <body>
        <script dangerouslySetInnerHTML={{ __html: aplicarTema }} />
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
