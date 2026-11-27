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
          ? 'bg-white/90 border border-blue-900/20 shadow-sm shadow-blue-900/10'
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
            ? 'bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 text-white shadow-sm shadow-blue-900/30'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        ポケモンGO（2.56倍 / 1.6倍）
      </button>
    </div>
  )
}
