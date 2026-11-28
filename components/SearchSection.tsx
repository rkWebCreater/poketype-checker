'use client'

import { useEffect, useRef, useState } from 'react'
import { ALL_TYPE_KEYS, TYPE_MASTER } from '@/constants/pokemonTypes'
import type { GameMode, PokemonTypeKey } from '@/types/pokemon'

interface SearchSectionProps {
  mode: GameMode
  currentQuery: string
  onSearchPokemon: (query: string) => void
  onSearchTypes: (types: PokemonTypeKey[]) => void
  selectedTypes: PokemonTypeKey[]
  isLoading: boolean
}

function SearchPanelContent({
  initialKeyword,
  initialTypes,
  isGo,
  isLoading,
  onSearchPokemon,
  onSearchTypes,
  onAfterSubmit,
}: {
  initialKeyword: string
  initialTypes: PokemonTypeKey[]
  isGo: boolean
  isLoading: boolean
  onSearchPokemon: (query: string) => void
  onSearchTypes: (types: PokemonTypeKey[]) => void
  onAfterSubmit?: () => void
}) {
  const [keyword, setKeyword] = useState(initialKeyword)
  // タイプ選択はローカルで保持し、検索ボタンを押してから結果を反映する
  const [draftTypes, setDraftTypes] = useState<PokemonTypeKey[]>(initialTypes)

  const handleToggleType = (typeKey: PokemonTypeKey) => {
    setDraftTypes((prev) => {
      if (prev.includes(typeKey)) {
        return prev.filter((t) => t !== typeKey)
      }
      if (prev.length < 2) {
        return [...prev, typeKey]
      }
      return [prev[1], typeKey]
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    const trimmed = keyword.trim()
    if (trimmed) {
      onSearchPokemon(trimmed)
      onAfterSubmit?.()
      return
    }

    if (draftTypes.length > 0) {
      onSearchTypes(draftTypes)
      onAfterSubmit?.()
    }
  }

  const handleExecuteTypeSearch = () => {
    if (draftTypes.length === 0 || isLoading) return
    onSearchTypes(draftTypes)
    onAfterSubmit?.()
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          aria-label="ポケモン名または図鑑番号"
          placeholder="ポケモン名または図鑑番号（例: カイリュー, メガリザードンX, アローラライチュウ）"
          className={`min-w-0 flex-1 border px-3 sm:px-4 py-2 sm:py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${
            isGo
              ? 'rounded-full border-blue-900/20 bg-blue-50/40 focus:border-blue-900 focus:ring-blue-900/20'
              : 'rounded-xl border-slate-300 bg-slate-50/50 focus:border-rose-500 focus:ring-rose-200/70'
          }`}
        />
        <button
          type="submit"
          disabled={isLoading || (!keyword.trim() && draftTypes.length === 0)}
          className={`shrink-0 whitespace-nowrap px-4 sm:px-6 py-2 sm:py-2.5 text-sm font-bold text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            isGo
              ? 'rounded-full bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 shadow-sm shadow-blue-900/30 hover:from-blue-900 hover:to-indigo-800'
              : 'rounded-xl bg-rose-600 shadow-sm hover:bg-rose-700'
          }`}
        >
          {isLoading ? '検索中...' : '検索'}
        </button>
      </form>

      <div className="mt-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold text-slate-500">
            または相手のタイプを選択（最大2つ）して検索：
          </p>
          {draftTypes.length > 0 && (
            <button
              type="button"
              onClick={() => setDraftTypes([])}
              className="text-xs font-bold text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline cursor-pointer"
            >
              選択をクリア
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {ALL_TYPE_KEYS.map((typeKey) => {
            const item = TYPE_MASTER[typeKey]
            const isSelected = draftTypes.includes(typeKey)
            return (
              <button
                key={typeKey}
                type="button"
                aria-pressed={isSelected}
                onClick={() => handleToggleType(typeKey)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                  item.bgClass
                } ${
                  isSelected
                    ? isGo
                      ? 'ring-2 ring-blue-900 ring-offset-2 scale-105 shadow-sm'
                      : 'ring-2 ring-rose-600 ring-offset-2 scale-105 shadow-sm'
                    : 'opacity-85 hover:opacity-100 hover:-translate-y-0.5'
                }`}
              >
                {item.nameJa}
              </button>
            )
          })}
        </div>

        {draftTypes.length > 0 && (
          <div className="mt-3 flex items-center justify-end gap-2">
            <span className="text-xs font-semibold text-slate-500">
              {draftTypes.map((t) => TYPE_MASTER[t].nameJa).join(' / ')}
            </span>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleExecuteTypeSearch}
              className={`shrink-0 px-4 py-1.5 text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-50 ${
                isGo
                  ? 'rounded-full bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 shadow-sm hover:from-blue-900 hover:to-indigo-800'
                  : 'rounded-xl bg-rose-600 shadow-sm hover:bg-rose-700'
              }`}
            >
              このタイプで検索
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default function SearchSection({
  mode,
  currentQuery,
  onSearchPokemon,
  onSearchTypes,
  selectedTypes,
  isLoading,
}: SearchSectionProps) {
  const isGo = mode === 'go'
  const sectionRef = useRef<HTMLElement>(null)
  const [showFloatingButton, setShowFloatingButton] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const syncKey = `${currentQuery}|${selectedTypes.join(',')}`

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const scrolledPast =
          !entry.isIntersecting && entry.boundingClientRect.bottom < 0
        setShowFloatingButton(scrolledPast)
        if (!scrolledPast) {
          setIsDrawerOpen(false)
        }
      },
      { threshold: 0 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* 通常表示（ページ上部では通常どおり表示し、スクロールアウトしたら右下の検索ボタンへ切替） */}
      <section
        ref={sectionRef}
        className={`p-5 transition-all duration-300 ${
          isGo
            ? 'rounded-3xl bg-white/95 backdrop-blur border border-blue-900/15 shadow-md shadow-blue-900/10'
            : 'rounded-2xl bg-white/95 backdrop-blur border border-slate-200 shadow-sm'
        }`}
      >
        <SearchPanelContent
          key={`main-${syncKey}`}
          initialKeyword={currentQuery}
          initialTypes={selectedTypes}
          isGo={isGo}
          isLoading={isLoading}
          onSearchPokemon={onSearchPokemon}
          onSearchTypes={onSearchTypes}
        />
      </section>

      {/* PC・スマホ共通：スクロール時に右下へ追従する検索ボタン & タップで展開する検索エリア */}
      {showFloatingButton && (
        <div>
          {!isDrawerOpen ? (
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              aria-label="検索エリアを開く"
              className={`fixed bottom-5 right-4 md:bottom-6 md:right-6 z-30 inline-flex items-center gap-1.5 rounded-full px-4 py-3 md:px-5 md:py-3.5 text-sm font-extrabold text-white shadow-lg border-[5px] border-white/30 transition active:scale-95 cursor-pointer ${
                isGo
                  ? 'bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 shadow-blue-950/40 ring-1 ring-blue-300/30 hover:from-blue-900 hover:to-indigo-800'
                  : 'bg-rose-600 shadow-rose-600/35 hover:bg-rose-700'
              }`}
            >
              <span aria-hidden="true">🔍</span>
              <span>検索</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                aria-label="検索エリアを閉じる"
                onClick={() => setIsDrawerOpen(false)}
                className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-[1px] md:bg-slate-900/10 md:backdrop-blur-none"
              />

              <div
                className={`fixed inset-x-3 bottom-4 md:inset-x-auto md:bottom-6 md:right-6 md:w-[26rem] z-30 max-h-[80vh] overflow-y-auto p-4 shadow-2xl ${
                  isGo
                    ? 'rounded-3xl bg-white/95 backdrop-blur border border-blue-900/20'
                    : 'rounded-2xl bg-white border border-slate-200'
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-700">
                    🔍 ポケモン・タイプ検索
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="rounded-full px-2.5 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
                  >
                    ✕ 閉じる
                  </button>
                </div>
                <SearchPanelContent
                  key={`floating-${syncKey}`}
                  initialKeyword={currentQuery}
                  initialTypes={selectedTypes}
                  isGo={isGo}
                  isLoading={isLoading}
                  onSearchPokemon={onSearchPokemon}
                  onSearchTypes={onSearchTypes}
                  onAfterSubmit={() => setIsDrawerOpen(false)}
                />
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
