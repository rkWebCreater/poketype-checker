'use client'

import { useState } from 'react'
import { ALL_TYPE_KEYS, TYPE_MASTER } from '@/constants/pokemonTypes'
import type { GameMode, PokemonTypeKey } from '@/types/pokemon'

interface SearchSectionProps {
  mode: GameMode
  onSearchPokemon: (query: string) => void
  onSelectType: (type: PokemonTypeKey) => void
  selectedTypes: PokemonTypeKey[]
  isLoading: boolean
}

export default function SearchSection({
  mode,
  onSearchPokemon,
  onSelectType,
  selectedTypes,
  isLoading,
}: SearchSectionProps) {
  const [keyword, setKeyword] = useState('')
  const isGo = mode === 'go'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyword.trim() || isLoading) return
    onSearchPokemon(keyword.trim())
  }

  return (
    <section
      className={`p-5 transition-all duration-300 ${
        isGo
          ? 'rounded-3xl bg-white/90 backdrop-blur border border-teal-100 shadow-md shadow-sky-100/60'
          : 'rounded-2xl bg-white border border-slate-200 shadow-sm'
      }`}
    >
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="ポケモン名または図鑑番号（例: カイリュー, リザードン, 149）"
          className={`min-w-0 flex-1 border px-3 sm:px-4 py-2 sm:py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${
            isGo
              ? 'rounded-full border-teal-200 bg-sky-50/30 focus:border-teal-400 focus:ring-teal-200/70'
              : 'rounded-xl border-slate-300 bg-slate-50/50 focus:border-rose-500 focus:ring-rose-200/70'
          }`}
        />
        <button
          type="submit"
          disabled={isLoading || !keyword.trim()}
          className={`shrink-0 whitespace-nowrap px-4 sm:px-6 py-2 sm:py-2.5 text-sm font-bold text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            isGo
              ? 'rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 shadow-sm shadow-teal-200 hover:from-emerald-500 hover:to-teal-600'
              : 'rounded-xl bg-rose-600 hover:bg-rose-700'
          }`}
        >
          {isLoading ? '検索中...' : '検索'}
        </button>
      </form>

      <div className="mt-4">
        <p className="mb-2 text-xs font-bold text-slate-500">
          または相手のタイプをタップ（最大2つまで選択可）：
        </p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {ALL_TYPE_KEYS.map((typeKey) => {
            const item = TYPE_MASTER[typeKey]
            const isSelected = selectedTypes.includes(typeKey)
            return (
              <button
                key={typeKey}
                type="button"
                onClick={() => onSelectType(typeKey)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                  item.bgClass
                } ${
                  isSelected
                    ? isGo
                      ? 'ring-2 ring-teal-500 ring-offset-2 scale-105 shadow-sm'
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
