'use client'

import { useState } from 'react'
import ModeSwitch from '@/components/ModeSwitch'
import ResultSection from '@/components/ResultSection'
import SearchSection from '@/components/SearchSection'
import type {
  GameMode,
  PokemonInfo,
  PokemonTypeKey,
  RecommendedMove,
} from '@/types/pokemon'
import { fetchPokemon, fetchRecommendedMoves } from '@/utils/pokeapi'
import { calcWeakness } from '@/utils/pokemonCalc'

export default function Home() {
  const [mode, setMode] = useState<GameMode>('main')
  const [pokemon, setPokemon] = useState<PokemonInfo | null>(null)
  const [selectedTypes, setSelectedTypes] = useState<PokemonTypeKey[]>([])
  const [moves, setMoves] = useState<RecommendedMove[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isMovesLoading, setIsMovesLoading] = useState(false)
  const [error, setError] = useState('')

  const isGo = mode === 'go'

  // 弱点タイプに応じたおすすめ技を取得する共通処理
  const loadBestMoves = async (targetTypes: PokemonTypeKey[]) => {
    const analysis = calcWeakness(targetTypes, mode)
    // 二重弱点があればそれを最優先、なければ通常弱点から選ぶ
    const priorityTypes =
      analysis.doubleWeak.length > 0
        ? analysis.doubleWeak.map((item) => item.type)
        : analysis.weak.map((item) => item.type)

    setIsMovesLoading(true)
    try {
      const recommended = await fetchRecommendedMoves(priorityTypes)
      setMoves(recommended)
    } finally {
      setIsMovesLoading(false)
    }
  }

  // ポケモン名・図鑑番号で検索したとき
  const handleSearchPokemon = async (query: string) => {
    setIsLoading(true)
    setError('')
    setSelectedTypes([])
    setMoves([])

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    try {
      const data = await fetchPokemon(query)
      setPokemon(data)
      await loadBestMoves(data.types)
    } catch (err) {
      setPokemon(null)
      setError(err instanceof Error ? err.message : '検索に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  // タイプボタンを直接タップしたとき（最大2つまで選択可）
  const handleSelectType = async (typeKey: PokemonTypeKey) => {
    setError('')
    setPokemon(null)

    let nextTypes: PokemonTypeKey[]
    if (selectedTypes.includes(typeKey)) {
      // すでに選択中なら解除
      nextTypes = selectedTypes.filter((t) => t !== typeKey)
    } else if (selectedTypes.length < 2) {
      // 2個未満なら追加
      nextTypes = [...selectedTypes, typeKey]
    } else {
      // 2個選択済みなら、1個目を入れ替え
      nextTypes = [selectedTypes[1], typeKey]
    }

    setSelectedTypes(nextTypes)
    setMoves([])

    if (nextTypes.length > 0) {
      await loadBestMoves(nextTypes)
    }
  }

  // 表示対象のタイプ配列
  const activeTypes: PokemonTypeKey[] = pokemon ? pokemon.types : selectedTypes

  // mode が切り替わった瞬間に自動で再計算される（useEffect不要！）
  const weakness = activeTypes.length > 0 ? calcWeakness(activeTypes, mode) : null

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isGo
          ? 'bg-gradient-to-b from-sky-50 via-teal-50/40 to-emerald-50/40 text-slate-800'
          : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* モードごとのトップアクセントバー */}
      <div
        className={`h-1.5 w-full transition-all duration-300 ${
          isGo
            ? 'bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-400'
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
                  ? 'bg-gradient-to-br from-emerald-400 to-teal-500'
                  : 'bg-rose-600'
              }`}
            >
              P
            </span>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900">
                ポケモンタイプ相性検索
              </h1>
              <p className="text-[11px] font-medium text-slate-500">
                {isGo
                  ? 'Pokémon GO モード（レイド・GBL倍率 ＆ GO種族値）'
                  : '本家モード（4倍 / 2倍 / 無効 ＆ 6種族値）'}
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
