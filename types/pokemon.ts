//ポケモンのタイプの型定義
export type PokemonTypeKey =
 'normal' | 'fire' | 'water' | 'electric' | 'grass' | 'ice' 
 | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug' 
 | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy';

//ポケモンのゲームモードの型定義 本家かポケモンGOかを判定するための型
export type GameMode = 'main' | 'go'

// 画面に表示するポケモンの基本データ
export interface PokemonInfo {
  id: number
  nameJa: string
  nameEn: string
  imageUrl: string
  types: PokemonTypeKey[]
  stats: MainStats    // 本家用
  goStats: GoStats    // ポケモンGO用
}
// 本家の種族値（6項目：PokeAPIから直接取得）
export interface MainStats {
  hp: number
  attack: number
  defense: number
  spAttack: number
  spDefense: number
  speed: number
}

// ポケモンGOの種族値（3項目：本家の種族値から計算）
export interface GoStats {
  hp: number
  attack: number
  defense: number
}

// おすすめ技のデータ
export interface RecommendedMove {
  id: number
  nameJa: string
  type: PokemonTypeKey
  power: number | null
  damageClass: '物理' | '特殊' | '変化'
  learnedBy: string[] // この技を覚える代表ポケモン名
}

// 1つの攻撃タイプごとの倍率結果
export interface TypeEffectiveness {
  type: PokemonTypeKey
  multiplier: number // 例: 本家なら 4, 2, 0.5, 0 / GOなら 2.56, 1.6, 0.63, 0.39
}

// ポケモン1体の弱点・耐性の集計結果
export interface WeaknessAnalysis {
  doubleWeak: TypeEffectiveness[] // 4倍（GO: 2.56倍）の二重弱点
  weak: TypeEffectiveness[]       // 2倍（GO: 1.6倍）の弱点
  resistant: TypeEffectiveness[]  // 耐性・無効（1倍未満すべて）
}
