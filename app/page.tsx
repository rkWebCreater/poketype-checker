'use client'

import { Suspense, useEffect, useState } from 'react'
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

  const [mode, setMode] = useState<GameMode>('main')
  const [pokemon, setPokemon] = useState<PokemonInfo | null>(null)
  const [selectedTypes, setSelectedTypes] = useState<PokemonTypeKey[]>([])
  const [moves, setMoves] = useState<RecommendedMove[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isMovesLoading, setIsMovesLoading] = useState(false)
  const [error, setError] = useState('')

  const isGo = mode === 'go'
  const pokemonParam = searchParams.get('pokemon')
  const typesParam = searchParams.get('types')

  // URL クエリ（?pokemon=... / ?types=...）の変化を監視して検索・復元する
  useEffect(() => {
    let cancelled = false

    const loadBestMoves = async (targetTypes: PokemonTypeKey[]) => {
      // 弱点タイプ自体は本家・GOで共通なので 'main' 基準で優先弱点を抽出
      const analysis = calcWeakness(targetTypes, 'main')
      const priorityTypes =
        analysis.doubleWeak.length > 0
          ? analysis.doubleWeak.map((item) => item.type)
          : analysis.weak.map((item) => item.type)

      setIsMovesLoading(true)
      try {
        const recommended = await fetchRecommendedMoves(priorityTypes)
        if (!cancelled) {
          setMoves(recommended)
        }
      } finally {
        if (!cancelled) {
          setIsMovesLoading(false)
        }
      }
    }

    // パターン1：URL に ?pokemon=... があるとき
    if (pokemonParam) {
      const run = async () => {
        setIsLoading(true)
        setError('')
        setSelectedTypes([])
        setMoves([])
        window.scrollTo({ top: 0, behavior: 'smooth' })

        try {
          const data = await fetchPokemon(pokemonParam)
          if (cancelled) return
          setPokemon(data)
          await loadBestMoves(data.types)
        } catch (err) {
          if (cancelled) return
          setPokemon(null)
          setError(err instanceof Error ? err.message : '検索に失敗しました')
        } finally {
          if (!cancelled) {
            setIsLoading(false)
          }
        }
      }
      run()
      return () => {
        cancelled = true
      }
    }

    // パターン2：URL に ?types=... があるとき
    if (typesParam) {
      const parsedTypes = typesParam
        .split(',')
        .filter((t): t is PokemonTypeKey => t in TYPE_MASTER)
        .slice(0, 2)

      setIsLoading(false)
      setError('')
      setPokemon(null)
      setSelectedTypes(parsedTypes)
      setMoves([])

      if (parsedTypes.length > 0) {
        loadBestMoves(parsedTypes)
      }
      return () => {
        cancelled = true
      }
    }

    // パターン3：URL が /（パラメータなし）のとき → 初期状態に戻す
    setIsLoading(false)
    setIsMovesLoading(false)
    setError('')
    setPokemon(null)
    setSelectedTypes([])
    setMoves([])

    return () => {
      cancelled = true
    }
  }, [pokemonParam, typesParam])

  // ポケモン名・図鑑番号で検索したとき（URL を更新して履歴に残す）
  const handleSearchPokemon = (query: string) => {
    router.push(`/?pokemon=${encodeURIComponent(query)}`)
  }

  // タイプボタンを直接タップしたとき（最大2つまで選択可・URL を更新して履歴に残す）
  const handleSelectType = (typeKey: PokemonTypeKey) => {
    let nextTypes: PokemonTypeKey[]
    if (selectedTypes.includes(typeKey)) {
      nextTypes = selectedTypes.filter((t) => t !== typeKey)
    } else if (selectedTypes.length < 2) {
      nextTypes = [...selectedTypes, typeKey]
    } else {
      nextTypes = [selectedTypes[1], typeKey]
    }

    if (nextTypes.length > 0) {
      router.push(`/?types=${nextTypes.join(',')}`)
    } else {
      router.push('/')
    }
  }

  // 表示対象のタイプ配列
  const activeTypes: PokemonTypeKey[] = pokemon ? pokemon.types : selectedTypes

  // mode が切り替わった瞬間に自動で再計算される
  const weakness = activeTypes.length > 0 ? calcWeakness(activeTypes, mode) : null

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isGo
          ? 'bg-gradient-to-b from-blue-950/[0.06] via-indigo-50/60 to-sky-50/50 text-white-800'
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
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white-900">
                ポケモンタイプ相性検索
              </h1>
              <p className="text-[11px] font-medium text-slate-500">
                {isGo
                  ? 'Pokémon GO ver. (レイド・GBL倍率 & GO種族値）'
                  : '   本家 ver.    (4倍 / 2倍 / 無効 & 6種族値）'}
              </p>
            </div>
          </div>

          <ModeSwitch mode={mode} onChangeMode={setMode} />
        </header>

        {/* 検索フォーム ＆ タイプボタン */}
        <SearchSection
          mode={mode}
          onSearchPokemon={handleSearchPokemon}
          onSelectType={handleSelectType}
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
            isMovesLoading={isMovesLoading}
            onSelectPokemon={handleSearchPokemon}
          />
        ) : (
          !isLoading &&
          !error && (
            <div
              className={`p-8 text-center text-sm text-slate-500 border border-dashed transition-all duration-300 ${
                isGo
                  ? 'rounded-3xl border-teal-200 bg-white/60'
                  : 'rounded-2xl border-slate-300 bg-white/60'
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
