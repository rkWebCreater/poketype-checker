'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ModeSwitch from '@/components/ModeSwitch'
import ResultSection from '@/components/ResultSection'
import SearchSection from '@/components/SearchSection'
import { TYPE_MASTER } from '@/constants/pokemonTypes'
import type {
  GameMode,
  PokemonInfo,
  PokemonTypeKey,
  RecommendedMove,
} from '@/types/pokemon'
import { fetchPokemon, fetchRecommendedMoves } from '@/utils/pokeapi'
import { calcWeakness } from '@/utils/pokemonCalc'

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [retryCount, setRetryCount] = useState(0)
  const [fetchedPokemon, setFetchedPokemon] = useState<{
    requestKey: string
    data: PokemonInfo | null
    error: string
  } | null>(null)
  const [fetchedMoves, setFetchedMoves] = useState<{
    key: string
    items: RecommendedMove[]
    error: string
  } | null>(null)

  const mode: GameMode = searchParams.get('mode') === 'go' ? 'go' : 'main'
  const isGo = mode === 'go'
  const pokemonParam = searchParams.get('pokemon')
  const typesParam = searchParams.get('types')
  const pokemonRequestKey = pokemonParam ? `${pokemonParam}#${retryCount}` : ''

  // ?types=... から選択タイプを直接導出（pokemonParam がある場合は空）
  const selectedTypes = useMemo<PokemonTypeKey[]>(() => {
    if (pokemonParam || !typesParam) return []
    return typesParam
      .split(',')
      .filter((t): t is PokemonTypeKey => t in TYPE_MASTER)
      .slice(0, 2)
  }, [pokemonParam, typesParam])

  const pokemon =
    pokemonRequestKey && fetchedPokemon?.requestKey === pokemonRequestKey
      ? fetchedPokemon.data
      : null
  const error =
    pokemonRequestKey && fetchedPokemon?.requestKey === pokemonRequestKey
      ? fetchedPokemon.error
      : ''
  const isLoading = Boolean(
    pokemonRequestKey && fetchedPokemon?.requestKey !== pokemonRequestKey
  )

  // 表示対象のタイプ配列
  const activeTypes = useMemo<PokemonTypeKey[]>(
    () => (pokemon ? pokemon.types : selectedTypes),
    [pokemon, selectedTypes]
  )
  const activeTypesKey = activeTypes.join(',')

  const moves =
    activeTypesKey && fetchedMoves?.key === activeTypesKey
      ? fetchedMoves.items
      : []
  const movesError =
    activeTypesKey && fetchedMoves?.key === activeTypesKey
      ? fetchedMoves.error
      : ''
  const isMovesLoading = Boolean(
    activeTypesKey && fetchedMoves?.key !== activeTypesKey
  )

  // URL クエリ（?pokemon=...）の変化を監視してポケモン情報を取得
  useEffect(() => {
    if (!pokemonParam || !pokemonRequestKey) return
    let cancelled = false
    window.scrollTo({ top: 0, behavior: 'smooth' })

    fetchPokemon(pokemonParam)
      .then((data) => {
        if (!cancelled) {
          setFetchedPokemon({ requestKey: pokemonRequestKey, data, error: '' })
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setFetchedPokemon({
            requestKey: pokemonRequestKey,
            data: null,
            error: err instanceof Error ? err.message : '検索に失敗しました',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [pokemonParam, pokemonRequestKey])

  // 表示対象のタイプが変わったらおすすめ技を取得
  useEffect(() => {
    if (!activeTypesKey) return
    let cancelled = false
    const targetTypes = activeTypesKey.split(',') as PokemonTypeKey[]
    // 弱点タイプ自体は本家・GOで共通なので 'main' 基準で優先弱点を抽出
    const analysis = calcWeakness(targetTypes, 'main')
    const priorityTypes =
      analysis.doubleWeak.length > 0
        ? analysis.doubleWeak.map((item) => item.type)
        : analysis.weak.map((item) => item.type)

    fetchRecommendedMoves(priorityTypes)
      .then((recommended) => {
        if (!cancelled) {
          setFetchedMoves({ key: activeTypesKey, items: recommended, error: '' })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFetchedMoves({
            key: activeTypesKey,
            items: [],
            error: 'おすすめ技の取得に失敗しました。時間をおいて再度お試しください。',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [activeTypesKey])

  const buildUrl = (next: {
    mode?: GameMode
    pokemon?: string | null
    types?: PokemonTypeKey[]
  }) => {
    const params = new URLSearchParams()
    const targetMode = next.mode ?? mode
    if (targetMode === 'go') {
      params.set('mode', 'go')
    }
    if (next.pokemon) {
      params.set('pokemon', next.pokemon)
    } else if (next.types && next.types.length > 0) {
      params.set('types', next.types.join(','))
    }
    const qs = params.toString()
    return qs ? `/?${qs}` : '/'
  }

  // 本家 / ポケモンGO モード切替（履歴を増やさず URL に反映）
  const handleChangeMode = (newMode: GameMode) => {
    router.replace(
      buildUrl({
        mode: newMode,
        pokemon: pokemonParam,
        types: pokemonParam ? undefined : selectedTypes,
      })
    )
  }

  // ポケモン名・図鑑番号で検索したとき（URL を更新して履歴に残す）
  const handleSearchPokemon = (query: string) => {
    if (query === pokemonParam) {
      setRetryCount((c) => c + 1)
      return
    }
    router.push(buildUrl({ pokemon: query }))
  }

  // 選択したタイプ（1〜2つ）で検索を実行したとき（URL を更新して履歴に残す）
  const handleSearchTypes = (types: PokemonTypeKey[]) => {
    router.push(buildUrl({ types }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // mode が切り替わった瞬間に自動で再計算される
  const weakness = activeTypes.length > 0 ? calcWeakness(activeTypes, mode) : null

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isGo
          ? 'bg-gradient-to-b from-slate-950 via-blue-950 to-indigo-950 text-slate-900'
          : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* モードごとのトップアクセントバー */}
      <div
        className={`h-1.5 w-full transition-all duration-300 ${
          isGo
            ? 'bg-gradient-to-r from-blue-950 via-blue-800 to-indigo-900'
            : 'bg-gradient-to-r from-rose-600 via-red-500 to-rose-600'
        }`}
      />

      <div className="mx-auto max-w-4xl px-4 py-6 space-y-5">
        {/* ヘッダー（タイトル ＋ 右上の本家/GO切替スイッチ） */}
        <header className="flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-black text-white shadow-sm transition-all duration-300 ${
                isGo
                  ? 'bg-gradient-to-br from-blue-950 to-indigo-800'
                  : 'bg-rose-600'
              }`}
            >
              P
            </span>
            <div>
              <h1
                className={`text-lg sm:text-xl font-extrabold tracking-tight transition-colors duration-300 ${
                  isGo ? 'text-white' : 'text-slate-900'
                }`}
              >
                ポケモンタイプ相性検索
              </h1>
              <p
                className={`grid text-[11px] font-medium transition-colors duration-300 ${
                  isGo ? 'text-slate-200' : 'text-slate-500'
                }`}
              >
                <span
                  aria-hidden={!isGo}
                  className={`col-start-1 row-start-1 ${isGo ? 'visible' : 'invisible'}`}
                >
                  Pokémon GO ver.（レイド・GBL倍率 &amp; GO種族値）
                </span>
                <span
                  aria-hidden={isGo}
                  className={`col-start-1 row-start-1 ${!isGo ? 'visible' : 'invisible'}`}
                >
                  本家 ver.（4倍 / 2倍 / 無効 &amp; 6種族値）
                </span>
              </p>
            </div>
          </div>

          <ModeSwitch mode={mode} onChangeMode={handleChangeMode} />
        </header>

        {/* 検索フォーム ＆ タイプボタン */}
        <SearchSection
          mode={mode}
          currentQuery={pokemonParam ?? ''}
          onSearchPokemon={handleSearchPokemon}
          onSearchTypes={handleSearchTypes}
          selectedTypes={selectedTypes}
          isLoading={isLoading}
        />

        {/* エラーメッセージ */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* ローディング表示 */}
        {isLoading && (
          <div
            className={`p-6 text-center text-sm font-bold animate-pulse border ${
              isGo
                ? 'rounded-3xl border-teal-200 bg-white/80 text-teal-700'
                : 'rounded-2xl border-rose-200 bg-white text-rose-700'
            }`}
          >
            🔍 ポケモンデータを取得しています...
          </div>
        )}

        {/* 検索結果 */}
        {!isLoading && weakness ? (
          <ResultSection
            mode={mode}
            pokemon={pokemon}
            selectedTypes={selectedTypes}
            weakness={weakness}
            moves={moves}
            movesError={movesError}
            isMovesLoading={isMovesLoading}
            onSelectPokemon={handleSearchPokemon}
          />
        ) : (
          !isLoading &&
          !error && (
            <div
              className={`p-8 text-center text-sm border border-dashed transition-all duration-300 ${
                isGo
                  ? 'rounded-3xl border-blue-400/30 bg-white/10 text-slate-200'
                  : 'rounded-2xl border-slate-300 bg-white/60 text-slate-500'
              }`}
            >
              ポケモン名を入力するか、上のタイプボタン（最大2つ）をタップすると弱点とおすすめ技が表示されます。
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 p-8 text-center text-sm text-slate-500">
          読み込み中...
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  )
}
