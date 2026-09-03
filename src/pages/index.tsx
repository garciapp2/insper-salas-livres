import axios from 'axios'
import { DateTime } from 'luxon'
import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { SalaLivre, SalasResponse } from '../types'

const REPO_URL = 'https://github.com/garciapp2/insper-salas-livres'

type Tema = 'light' | 'dark'

const predios = [
  {
    nome: 'P1',
    label: 'P1 · Quatá 300',
    apiNames: ['PRÉDIO QUATÁ 300', 'PRÉDIO CLAUDIO HADDAD (QUATÁ,300)'],
    andares: [-1, 1, 2, 3, 4],
  },
  {
    nome: 'P2',
    label: 'P2 · Quatá 200',
    apiNames: ['PRÉDIO QUATÁ 200'],
    andares: [1, 2, 3, 4, 5],
  },
  {
    nome: 'P3',
    label: 'P3 · Quatá 67',
    apiNames: ['PRÉDIO QUATÁ 67'],
    andares: [1, 2, 3, 4, 5, 6],
  },
]

const TODOS = predios.length

async function fetchSalasLivres() {
  return axios.get<SalasResponse>('/api/salas').then((res) => res.data)
}

function getNumeroAndar(stringAndar: string) {
  if (stringAndar === 'TÉRREO') return 0
  if (stringAndar.includes('SUBSOLO')) return -parseInt(stringAndar.split('')[0])
  return parseInt(stringAndar.split('')[0])
}

function formatHora(iso: string) {
  return DateTime.fromISO(iso).toLocaleString({
    timeZone: 'America/Sao_Paulo',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  })
}

/** Quanto tempo ainda falta, em linguagem curta: "2h30", "45min". */
function formatRestante(iso: string, agora: DateTime) {
  const diff = DateTime.fromISO(iso).diff(agora)
  const horas = Math.floor(diff.as('hours'))
  const minutos = Math.floor(diff.as('minutes')) % 60

  if (horas <= 0 && minutos <= 0) return null
  if (horas <= 0) return `${minutos}min`
  if (minutos === 0) return `${horas}h`
  return `${horas}h${String(minutos).padStart(2, '0')}`
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M11 11l3.2 3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function ClearIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="8.5" fill="currentColor" />
      <path
        d="M5.6 5.6l5.8 5.8M11.4 5.6l-5.8 5.8"
        stroke="var(--bg-elevated)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="3.6" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M10 1.6v2M10 16.4v2M18.4 10h-2M3.6 10h-2" />
        <path d="M15.9 4.1l-1.4 1.4M5.5 14.5l-1.4 1.4M15.9 15.9l-1.4-1.4M5.5 5.5L4.1 4.1" />
      </g>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M17 12.3A7.5 7.5 0 017.7 3a7.5 7.5 0 109.3 9.3z"
        fill="currentColor"
      />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 1.4a6.6 6.6 0 100 13.2A6.6 6.6 0 008 1.4zm0 3a.85.85 0 01.85.9l-.2 3.3a.65.65 0 01-1.3 0l-.2-3.3A.85.85 0 018 4.4zm0 7.5a.9.9 0 110-1.8.9.9 0 010 1.8z" />
    </svg>
  )
}

function SkeletonList() {
  return (
    <div className="list" aria-hidden="true">
      {[68, 52, 60, 45, 58, 50].map((largura, i) => (
        <div className="skeleton-row" key={i}>
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ width: `${largura}%` }} />
            <div className="skeleton" style={{ width: '34%', marginTop: 7, height: 9 }} />
          </div>
          <div className="skeleton" style={{ width: 38, height: 13 }} />
        </div>
      ))}
    </div>
  )
}

export default function Home() {
  const { data, error, isLoading, mutate } = useSWR('/api/salas', fetchSalasLivres, {
    refreshInterval: 5 * 60 * 1000,
  })

  const [predio, setPredio] = useState(TODOS)
  const [andar, setAndar] = useState<number | null>(null)
  const [busca, setBusca] = useState('')
  // Claro é sempre o padrão; o escuro só vale se a pessoa escolher.
  // O valor real é aplicado antes da pintura pelo script no _document.
  const [tema, setTema] = useState<Tema>('light')
  // O horário só é calculado no cliente, pra não divergir do HTML estático
  const [agora, setAgora] = useState<DateTime | null>(null)

  useEffect(() => {
    setAgora(DateTime.now())
    const id = setInterval(() => setAgora(DateTime.now()), 60 * 1000)
    return () => clearInterval(id)
  }, [])

  // Acompanha o que o script do _document já aplicou no <html>
  useEffect(() => {
    setTema(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light')
  }, [])

  function alternarTema() {
    const novo: Tema = tema === 'dark' ? 'light' : 'dark'
    setTema(novo)
    document.documentElement.setAttribute('data-theme', novo)
    try {
      localStorage.setItem('tema', novo)
    } catch {
      // Navegação privada bloqueia o storage: o tema só não persiste
    }
  }

  function selecionarPredio(index: number) {
    setPredio(index)
    setAndar(null)
  }

  const salas = useMemo(() => {
    if (!data) return []
    const termo = busca.trim().toLowerCase()

    return data
      .filter((sala) => predio === TODOS || predios[predio].apiNames.includes(sala.predio))
      .filter((sala) => andar === null || getNumeroAndar(sala.andar) === andar)
      .filter((sala) => !termo || sala.nome.toLowerCase().includes(termo))
      .sort((a: SalaLivre, b: SalaLivre) => {
        // Salas reservadas para estudo primeiro: são as que dá pra usar sem susto
        if (a.forStudies !== b.forStudies) return a.forStudies ? -1 : 1
        // Depois as que ficam livres por mais tempo
        const tempo = new Date(b.freeUntil).getTime() - new Date(a.freeUntil).getTime()
        if (tempo !== 0) return tempo
        // Desempate: menos aulas no dia, depois ordem alfabética
        if (a.todayEventCount !== b.todayEventCount) return a.todayEventCount - b.todayEventCount
        return a.nome.localeCompare(b.nome, 'pt-BR')
      })
  }, [data, predio, andar, busca])

  const uma = salas.length === 1
  const contagem = `${salas.length} ${uma ? 'sala' : 'salas'}`
  const contagemLonga = `${contagem} ${uma ? 'livre' : 'livres'} agora`

  return (
    <>
      <Head>
        <title>Salas Livres Insper</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta
          name="description"
          content="Encontre salas desocupadas para estudar no Insper agora."
        />
        {/* Segue o tema escolhido, não o do sistema — por isso sem media query */}
        <meta name="theme-color" content={tema === 'dark' ? '#1c1c1e' : '#f5f5f7'} />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#e50505" />
      </Head>

      {/* Título e botão de tema rolam junto com a página */}
      <header className="masthead">
        <div className="masthead__titles">
          <h1 className="masthead__title">
            Salas <span className="masthead__title-accent">Livres</span>
          </h1>
          <p className="masthead__subtitle">
            {agora ? `atualizado às ${agora.toFormat('HH:mm')}` : 'Insper'}
          </p>
        </div>

        <button
          className="theme-toggle"
          onClick={alternarTema}
          aria-label={tema === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
        >
          {tema === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </header>

      {/* Só os filtros ficam presos no topo, com altura fixa */}
      <div className="controls">
        <div className="controls__inner">
          <div className="search">
            <span className="search__icon">
              <SearchIcon />
            </span>
            <input
              className="search__input"
              type="search"
              placeholder="Buscar sala"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              aria-label="Buscar sala pelo nome"
            />
            {busca && (
              <button
                className="search__clear"
                onClick={() => setBusca('')}
                aria-label="Limpar busca"
              >
                <ClearIcon />
              </button>
            )}
          </div>

          <div className="segmented" role="tablist" aria-label="Filtrar por prédio">
            <div
              className="segmented__pill"
              style={{
                left: 2,
                width: `calc((100% - 4px) / ${predios.length + 1})`,
                transform: `translateX(calc(${predio === TODOS ? 0 : predio + 1} * 100%))`,
              }}
            />
            <button
              role="tab"
              aria-selected={predio === TODOS}
              className={`segmented__option${predio === TODOS ? ' segmented__option--active' : ''}`}
              onClick={() => selecionarPredio(TODOS)}
            >
              Todos
            </button>
            {predios.map((p, index) => (
              <button
                key={p.nome}
                role="tab"
                aria-selected={predio === index}
                className={`segmented__option${
                  predio === index ? ' segmented__option--active' : ''
                }`}
                onClick={() => selecionarPredio(index)}
              >
                {p.nome}
              </button>
            ))}
          </div>

          {predio !== TODOS && (
            <div className="chips" role="tablist" aria-label="Filtrar por andar">
              <button
                role="tab"
                aria-selected={andar === null}
                className={`chip${andar === null ? ' chip--active' : ''}`}
                onClick={() => setAndar(null)}
              >
                Todos
              </button>
              {predios[predio].andares.map((numero) => (
                <button
                  key={numero}
                  role="tab"
                  aria-selected={andar === numero}
                  className={`chip${andar === numero ? ' chip--active' : ''}`}
                  onClick={() => setAndar(numero)}
                >
                  {numero < 0
                    ? `${Math.abs(numero)}º subsolo`
                    : numero === 0
                    ? 'Térreo'
                    : `${numero}º`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <main className="shell">

        <div className="notice">
          <span className="notice__icon">
            <WarningIcon />
          </span>
          <span>
            Uma sala listada aqui ainda pode estar ocupada. A agenda não inclui eventos, reuniões
            nem reservas de entidades.
          </span>
        </div>

        {error ? (
          <div className="empty" style={{ marginTop: 24 }}>
            <p className="empty__title">Não deu pra carregar as salas</p>
            <p className="empty__text">A agenda do Insper não respondeu.</p>
            <button className="empty__action" onClick={() => mutate()}>
              Tentar de novo
            </button>
          </div>
        ) : isLoading ? (
          <>
            <p className="section-title">Carregando</p>
            <SkeletonList />
          </>
        ) : salas.length === 0 ? (
          <div className="empty" style={{ marginTop: 24 }}>
            <p className="empty__title">Nenhuma sala por aqui</p>
            <p className="empty__text">
              {busca ? `Nada com "${busca}".` : 'Todas as salas desse filtro estão ocupadas agora.'}
            </p>
          </div>
        ) : (
          <>
            <p className="section-title">{contagemLonga}</p>
            <div className="list">
              {salas.map((sala) => {
                const restante = agora ? formatRestante(sala.freeUntil, agora) : null
                // Algumas salas vêm sem prédio ou sem andar; junta só o que existe
                // pra não sobrar um "·" solto na linha.
                const local = [
                  predios.find((p) => p.apiNames.includes(sala.predio))?.label || sala.predio,
                  sala.andar?.toLowerCase(),
                ]
                  .filter(Boolean)
                  .join(' · ')
                return (
                  <article className="room" key={`${sala.predio}-${sala.andar}-${sala.nome}`}>
                    <div className="room__main">
                      <h2 className="room__name">{sala.nome}</h2>
                      {local && <p className="room__where">{local}</p>}
                      {(sala.forStudies || sala.todayEventCount === 0) && (
                        <div className="room__tags">
                          {sala.forStudies && sala.forStudiesUntil && (
                            <span className="tag tag--study">
                              Sala de estudos até {formatHora(sala.forStudiesUntil)}
                            </span>
                          )}
                          {sala.todayEventCount === 0 && (
                            <span className="tag tag--free">Sem aulas hoje</span>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Quanto tempo ainda dá pra ficar é o que decide a escolha,
                        então vem em destaque; o horário exato fica embaixo. */}
                    <div className="room__time">
                      {restante ? (
                        <>
                          <div className="room__until">{restante}</div>
                          <div className="room__remaining">até {formatHora(sala.freeUntil)}</div>
                        </>
                      ) : (
                        <div className="room__until">{formatHora(sala.freeUntil)}</div>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </>
        )}

        <footer className="footer">
          <p>Dados da agenda pública do Insper. Atualiza sozinho a cada 5 minutos.</p>
          <p>
            Quer ajudar no desenvolvimento? <a href={REPO_URL}>Contribua no GitHub</a>
          </p>
        </footer>
      </main>
    </>
  )
}
