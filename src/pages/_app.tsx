import type { AppProps } from 'next/app'
import { Inter } from 'next/font/google'
import '../styles/globals.css'

// Em Apple o sistema já entrega a SF Pro. A Inter cobre os outros aparelhos
// com um desenho parecido, então o layout fica igual em todo lugar.
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* Precisa estar no :root: o font-family do body referencia essa variável */}
      <style jsx global>{`
        :root {
          --font-inter: ${inter.style.fontFamily};
        }
      `}</style>
      <Component {...pageProps} />
    </>
  )
}
