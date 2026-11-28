import Image from 'next/image'
import { TYPE_MASTER } from '@/constants/pokemonTypes'
import type {
  GameMode,
  PokemonInfo,
  PokemonTypeKey,
  RecommendedMove,
  WeaknessAnalysis,
} from '@/types/pokemon'

interface ResultSectionProps {
  mode: GameMode
  pokemon: PokemonInfo | null
  selectedTypes: PokemonTypeKey[]
  weakness: WeaknessAnalysis
  moves: RecommendedMove[]
  movesError?: string
  isMovesLoading: boolean
  onSelectPokemon: (name: string) => void
}

// ステータスゲージ用の小さな部品
function StatBar({
  label,
  value,
  max,
  barClass,
}: {
  label: string
  value: number
  max: number
  barClass: string
}) {
  const percent = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-9 shrink-0 font-bold text-slate-500">{label}</span>
      <span className="w-8 shrink-0 text-right font-extrabold text-slate-800 tabular-nums">
        {value}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

export default function ResultSection({
  mode,
  pokemon,
  selectedTypes,
  weakness,
  moves,
  movesError,
  isMovesLoading,
  onSelectPokemon,
}: ResultSectionProps) {
  const isGo = mode === 'go'
  const priorityWeakTypes =
    weakness.doubleWeak.length > 0
      ? weakness.doubleWeak.map((item) => item.type)
      : weakness.weak.map((item) => item.type)

  const cardClass = isGo
    ? 'rounded-2xl p-3 bg-white/90 backdrop-blur border border-teal-100 shadow-md shadow-sky-100/60 transition-all duration-300'
    : 'rounded-xl p-3 bg-white border border-slate-200 shadow-sm transition-all duration-300'

  const primaryType = pokemon?.types[0] ?? selectedTypes[0] ?? null

  return (
    <div className="space-y-4">
      {/* 上段：基本情報 ＋ 弱点タイプ */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 左：ポケモン基本情報（タイプ直接検索時はタイプ名のみ表示） */}
        <section className={`${cardClass} relative overflow-hidden`}>
          {/* タイプカラーのアクセントライン */}
          {primaryType && (
            <div
              className={`absolute inset-x-0 top-0 h-1.5 ${TYPE_MASTER[primaryType].bgClass}`}
            />
          )}

          {pokemon ? (
            <div className="flex flex-col items-center text-center gap-4 pt-1 sm:flex-row sm:items-start sm:text-left">
              {pokemon.imageUrl && (
                <div
                  className={`relative flex h-32 w-32 shrink-0 items-center justify-center transition-all duration-300 ${
                    isGo
                      ? 'rounded-full bg-gradient-to-br from-sky-100/80 via-teal-50 to-emerald-100/70 p-2'
                      : 'rounded-2xl bg-slate-100/90 p-2 border border-slate-200/70'
                  }`}
                >
                  <Image
                    src={pokemon.imageUrl}
                    alt={pokemon.nameJa}
                    width={112}
                    height={112}
                    className="h-28 w-28 object-contain drop-shadow-sm"
                  />
                </div>
              )}

              <div className="w-full flex-1">
                <div className="flex flex-wrap items-baseline justify-center sm:justify-start gap-2">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                      isGo
                        ? 'bg-teal-50 text-teal-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    No.{String(pokemon.id).padStart(3, '0')}
                  </span>
                  <h2 className="text-2xl font-extrabold text-slate-900">
                    {pokemon.nameJa}
                  </h2>
                </div>

                {/* タイプバッジ */}
                <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-1.5">
                  {pokemon.types.map((t) => (
                    <span
                      key={t}
                      className={`rounded-full px-3 py-0.5 text-xs font-bold shadow-xs ${TYPE_MASTER[t].bgClass}`}
                    >
                      {TYPE_MASTER[t].nameJa}
                    </span>
                  ))}
                </div>

                {/* メガシンカ切替ボタン（対応ポケモンのみ表示） */}
                {pokemon.forms.length > 1 && (
                  <div className="mt-2.5 flex flex-wrap justify-center sm:justify-start gap-1.5">
                    {pokemon.forms.map((form) => (
                      <button
                        key={form.slug}
                        type="button"
                        aria-pressed={form.isCurrent}
                        onClick={() => {
                          if (!form.isCurrent) onSelectPokemon(form.query)
                        }}
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition cursor-pointer ${
                          form.isCurrent
                            ? isGo
                              ? 'bg-blue-900 text-white shadow-xs'
                              : 'bg-rose-600 text-white shadow-xs'
                            : isGo
                              ? 'bg-blue-50 text-blue-900 border border-blue-900/20 hover:bg-blue-100'
                              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {form.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* モード別ステータスゲージ（本家6項目 / GO3項目） */}
                <div className="mt-4 space-y-1.5">
                  {!isGo ? (
                    <>
                      <StatBar label="HP" value={pokemon.stats.hp} max={180} barClass="bg-rose-500" />
                      <StatBar label="攻撃" value={pokemon.stats.attack} max={180} barClass="bg-orange-500" />
                      <StatBar label="防御" value={pokemon.stats.defense} max={180} barClass="bg-amber-500" />
                      <StatBar label="特攻" value={pokemon.stats.spAttack} max={180} barClass="bg-sky-500" />
                      <StatBar label="特防" value={pokemon.stats.spDefense} max={180} barClass="bg-emerald-500" />
                      <StatBar label="素早" value={pokemon.stats.speed} max={180} barClass="bg-violet-500" />
                    </>
                  ) : (
                    <>
                      <StatBar
                        label="HP"
                        value={pokemon.goStats.hp}
                        max={350}
                        barClass="bg-gradient-to-r from-blue-900 to-indigo-700"
                      />
                      <StatBar
                        label="攻撃"
                        value={pokemon.goStats.attack}
                        max={350}
                        barClass="bg-gradient-to-r from-blue-800 to-sky-600"
                      />
                      <StatBar
                        label="防御"
                        value={pokemon.goStats.defense}
                        max={350}
                        barClass="bg-gradient-to-r from-indigo-900 to-blue-700"
                      />
                      <p className="pt-1 text-[10px] text-slate-400">
                        ※ 一部ポケモンのCP調整（9%弱体化）は未反映の概算値です
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : selectedTypes.length > 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-8">
              <div className="flex flex-wrap justify-center gap-2">
                {selectedTypes.map((t) => (
                  <span
                    key={t}
                    className={`rounded-full px-3 py-1.5 text-lg font-bold shadow-sm ${TYPE_MASTER[t].bgClass}`}
                  >
                    {TYPE_MASTER[t].nameJa}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs font-medium text-slate-500">
                {selectedTypes.length === 2
                  ? '複合タイプの相性を表示中'
                  : '単タイプの相性を表示中（もう1つ選べます）'}
              </p>
            </div>
          ) : null}
        </section>

        {/* 右：弱点・耐性まとめ */}
        <section className={`${cardClass} space-y-3.5`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-800">
              弱点タイプ
            </h3>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                isGo
                  ? 'bg-blue-950/10 text-blue-900 border border-blue-900/20'
                  : 'bg-rose-50 text-rose-700 border border-rose-200/80'
              }`}
            >
              {isGo ? 'ポケモンGO倍率' : '本家倍率'}
            </span>
          </div>

          {/* 二重弱点（4倍 / 2.56倍） */}
          {weakness.doubleWeak.length > 0 && (
            <div className="rounded-xl bg-red-50/70 p-3 border border-red-100">
              <p className="mb-1.5 text-xs font-extrabold text-red-600">
                🔥 超おすすめ（{weakness.doubleWeak[0].multiplier}倍）
              </p>
              <div className="flex flex-wrap gap-1.5">
                {weakness.doubleWeak.map((item) => (
                  <span
                    key={item.type}
                    className={`rounded-full px-3 py-1 text-xs font-bold ring-2 ring-red-400 shadow-xs ${TYPE_MASTER[item.type].bgClass}`}
                  >
                    {TYPE_MASTER[item.type].nameJa} ×{item.multiplier}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 通常の弱点（2倍 / 1.6倍） */}
          {weakness.weak.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-bold text-amber-700">
                ⚡ こうかばつぐん（{weakness.weak[0].multiplier}倍）
              </p>
              <div className="flex flex-wrap gap-1.5">
                {weakness.weak.map((item) => (
                  <span
                    key={item.type}
                    className={`rounded-full px-3 py-1 text-xs font-bold shadow-xs ${TYPE_MASTER[item.type].bgClass}`}
                  >
                    {TYPE_MASTER[item.type].nameJa} ×{item.multiplier}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 耐性（半減以下・×0が先頭） */}
          {weakness.resistant.length > 0 && (
            <div className="pt-2.5 border-t border-slate-100">
              <p className="mb-1.5 text-xs font-bold text-slate-500">🛡️ いまひとつ・耐性</p>
              <div className="flex flex-wrap gap-1.5">
                {weakness.resistant.map((item) => {
                  const isImmune = item.multiplier === 0
                  return (
                    <span
                      key={item.type}
                      className={`rounded-full px-2.5 py-0.5 text-xs ${
                        isImmune
                          ? 'bg-red-100 text-red-700 font-bold border border-red-300'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {TYPE_MASTER[item.type].nameJa}{' '}
                      {isImmune ? '×0（無効）' : `×${item.multiplier}`}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* 下段：弱点を突ける定番ポケモン（タイプ別） */}
      {priorityWeakTypes.length > 0 && (
        <section className={cardClass}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-extrabold text-slate-800">
              ⭐ 弱点を突けるタイプ別 定番ポケモン
            </h3>
            <span className="text-[11px] text-slate-400">
              ポケモン名をクリックするとそのポケモンを検索できます
            </span>
          </div>

          <div className="space-y-2.5">
            {priorityWeakTypes.map((typeKey) => {
              const master = TYPE_MASTER[typeKey]
              return (
                <div
                  key={typeKey}
                  className={`flex flex-wrap items-center gap-2 p-2.5 border ${
                    isGo
                      ? 'rounded-2xl border-teal-100 bg-sky-50/40'
                      : 'rounded-xl border-slate-200 bg-slate-50/80'
                  }`}
                >
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold shrink-0 ${master.bgClass}`}
                  >
                    {master.nameJa}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {master.recommendedGoPokemon.map((pokeName) => (
                      <button
                        key={pokeName}
                        type="button"
                        onClick={() => onSelectPokemon(pokeName)}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition cursor-pointer ${
                          isGo
                            ? 'bg-white text-blue-900 border border-blue-900/25 hover:bg-blue-900 hover:text-white'
                            : 'bg-white text-slate-700 border border-slate-300 hover:bg-rose-600 hover:text-white hover:border-rose-600'
                        }`}
                      >
                        {pokeName}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* 最下段：こうかばつぐんのおすすめ技 */}
      <section className={cardClass}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-extrabold text-slate-800">
            💡 こうかばつぐんのおすすめ技
          </h3>
        </div>

        {isMovesLoading ? (
          <p className="text-sm text-slate-500 animate-pulse">おすすめ技を取得中...</p>
        ) : movesError ? (
          <p className="text-sm font-medium text-red-600">{movesError}</p>
        ) : moves.length === 0 ? (
          <p className="text-sm text-slate-500">おすすめの技が見つかりませんでした。</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {moves.map((move) => (
              <div
                key={move.id}
                className={`p-3.5 border transition-all ${
                  isGo
                    ? 'rounded-2xl border-teal-100 bg-sky-50/40'
                    : 'rounded-xl border-slate-200 bg-slate-50/80'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-slate-900">{move.nameJa}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${TYPE_MASTER[move.type].bgClass}`}
                  >
                    {TYPE_MASTER[move.type].nameJa}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  分類: <span className="font-semibold text-slate-700">{move.damageClass}</span> / 威力:{' '}
                  <span className="font-semibold text-slate-700">{move.power ?? '-'}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
