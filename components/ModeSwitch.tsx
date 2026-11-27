import type { GameMode } from '@/types/pokemon'

interface ModeSwitchProps {
  mode: GameMode
  onChangeMode: (newMode: GameMode) => void
}

export default function ModeSwitch({ mode, onChangeMode }: ModeSwitchProps) {
  const isGo = mode === 'go'

  return (
    <div
      className={`inline-flex rounded-full p-1 text-xs sm:text-sm font-bold transition-all duration-300 ${
        isGo
          ? 'bg-white/90 border border-teal-200 shadow-sm shadow-teal-100/70'
          : 'bg-slate-200/90 border border-slate-300/60'
      }`}
    >
      <button
        type="button"
        onClick={() => onChangeMode('main')}
        className={`rounded-full px-3.5 sm:px-4 py-1.5 transition-all duration-300 cursor-pointer ${
          !isGo
            ? 'bg-rose-600 text-white shadow-sm'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        本家（4倍 / 2倍）
      </button>
      <button
        type="button"
        onClick={() => onChangeMode('go')}
        className={`rounded-full px-3.5 sm:px-4 py-1.5 transition-all duration-300 cursor-pointer ${
          isGo
            ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-sm shadow-teal-200'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        ポケモンGO（2.56倍 / 1.6倍）
      </button>
    </div>
  )
}
