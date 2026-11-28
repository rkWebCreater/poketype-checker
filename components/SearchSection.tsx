'use client'

import { useState } from 'react'
import { ALL_TYPE_KEYS, TYPE_MASTER } from '@/constants/pokemonTypes'
import type { GameMode, PokemonTypeKey } from '@/types/pokemon'

interface SearchSectionProps {
  mode: GameMode
  currentQuery: string
  onSearchPokemon: (query: string) => void
  onSelectType: (type: PokemonTypeKey) => void
  onClearTypes: () => void
  selectedTypes: PokemonTypeKey[]
  isLoading: boolean
}

function SearchForm({
  initialKeyword,
  isGo,
  isLoading,
  onSearchPokemon,
}: {
  initialKeyword: string
  isGo: boolean
  isLoading: boolean
  onSearchPokemon: (query: string) => void
}) {
  const [keyword, setKeyword] = useState(initialKeyword)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyword.trim() || isLoading) return
    onSearchPokemon(keyword.trim())
  }

  return (
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
        disabled={isLoading}
        className={`shrink-0 whitespace-nowrap px-4 sm:px-6 py-2 sm:py-2.5 text-sm font-bold text-white transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
          isGo
            ? 'rounded-full bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 shadow-sm shadow-blue-900/30 hover:from-blue-900 hover:to-indigo-800'
            : 'rounded-xl bg-rose-600 shadow-sm hover:bg-rose-700'
        }`}
      >
        {isLoading ? '検索中...' : '検索'}
      </button>
    </form>
  )
}

export default function SearchSection({
  mode,
  currentQuery,
  onSearchPokemon,
  onSelectType,
  onClearTypes,
  selectedTypes,
  isLoading,
}: SearchSectionProps) {
  const isGo = mode === 'go'

  return (
    <section
      className={`p-5 transition-all duration-300 ${
        isGo
          ? 'rounded-3xl bg-white/90 backdrop-blur border border-blue-900/15 shadow-md shadow-blue-900/10'
          : 'rounded-2xl bg-white border border-slate-200 shadow-sm'
      }`}
    >
      <SearchForm
        key={currentQuery}
        initialKeyword={currentQuery}
        isGo={isGo}
        isLoading={isLoading}
        onSearchPokemon={onSearchPokemon}
      />

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-bold text-slate-500">
            または相手のタイプをタップ（最大2つまで選択可）：
          </p>
          {selectedTypes.length > 0 && (
            <button
              type="button"
              onClick={onClearTypes}
              className="text-xs font-bold text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline cursor-pointer"
            >
              選択をクリア
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_TYPE_KEYS.map((typeKey) => {
            const item = TYPE_MASTER[typeKey]
            const isSelected = selectedTypes.includes(typeKey)
            return (
              <button
                key={typeKey}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelectType(typeKey)}
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
      </div>
    </section>
  )
}
