import type { PokemonTypeKey } from '@/types/pokemon'

// 1タイプ分のマスターデータの型
export interface TypeMasterItem {
  nameJa: string                   // 日本語表示名
  bgClass: string                  // バッジ用の背景色クラス（Tailwind）
  weakTo: PokemonTypeKey[]         // このタイプが「こうかばつぐん（2倍）」を受ける攻撃タイプ
  resistantTo: PokemonTypeKey[]    // このタイプが「いまひとつ（0.5倍）」に軽減する攻撃タイプ
  immuneTo: PokemonTypeKey[]       // このタイプが「こうかなし（0倍）」にする攻撃タイプ
  representativeMoveIds: number[]  // このタイプで攻めるときの代表的な強技ID（PokeAPIのmove ID）
  recommendedGoPokemon: string[]   // ポケモンGOでよく使われる代表ポケモン（6匹）
}

// 18タイプのマスターデータ
export const TYPE_MASTER: Record<PokemonTypeKey, TypeMasterItem> = {
  normal: {
    nameJa: 'ノーマル',
    bgClass: 'bg-stone-400 text-white',
    weakTo: ['fighting'],
    resistantTo: [],
    immuneTo: ['ghost'],
    representativeMoveIds: [38, 416, 34], // すてみタックル, ギガインパクト, のしかかり
    recommendedGoPokemon: ['カビゴン', 'ヤルキモノ', 'ベロリンガ', 'ハピナス', 'ホルード', 'ミルタンク'],
  },
  fire: {
    nameJa: 'ほのお',
    bgClass: 'bg-orange-500 text-white',
    weakTo: ['water', 'ground', 'rock'],
    resistantTo: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'],
    immuneTo: [],
    representativeMoveIds: [53, 315, 307], // かえんほうしゃ, オーバーヒート, ブラストバーン
    recommendedGoPokemon: ['レシラム', 'リザードン', 'バシャーモ', 'ラウドボーン', 'ファイヤー', 'シャンデラ'],
  },
  water: {
    nameJa: 'みず',
    bgClass: 'bg-blue-500 text-white',
    weakTo: ['electric', 'grass'],
    resistantTo: ['fire', 'water', 'ice', 'steel'],
    immuneTo: [],
    representativeMoveIds: [57, 56, 308], // なみのり, ハイドロポンプ, ハイドロカノン
    recommendedGoPokemon: ['カイオーガ', 'ラグラージ', 'オーダイル', 'ゲッコウガ', 'ギャラドス', 'アシレーヌ'],
  },
  electric: {
    nameJa: 'でんき',
    bgClass: 'bg-yellow-400 text-slate-900',
    weakTo: ['ground'],
    resistantTo: ['electric', 'flying', 'steel'],
    immuneTo: [],
    representativeMoveIds: [85, 87, 528], // 10まんボルト, かみなり, ワイルドボルト
    recommendedGoPokemon: ['ゼクロム', 'デンジュモク', 'ランターン', 'ジバコイル', 'ライコウ', 'エレキブル'],
  },
  grass: {
    nameJa: 'くさ',
    bgClass: 'bg-green-500 text-white',
    weakTo: ['fire', 'ice', 'poison', 'flying', 'bug'],
    resistantTo: ['water', 'electric', 'grass', 'ground'],
    immuneTo: [],
    representativeMoveIds: [76, 437, 338], // ソーラービーム, リーフストーム, ハードプラント
    recommendedGoPokemon: ['カミツルギ', 'フシギバナ', 'ロズレイド', 'オーロット', 'ザルード', 'マスカーニャ'],
  },
  ice: {
    nameJa: 'こおり',
    bgClass: 'bg-cyan-400 text-slate-900',
    weakTo: ['fire', 'fighting', 'rock', 'steel'],
    resistantTo: ['ice'],
    immuneTo: [],
    representativeMoveIds: [58, 59, 419], // れいとうビーム, ふぶき, ゆきなだれ
    recommendedGoPokemon: ['マンムー', 'セグレイブ', 'トドゼルガ', 'ユキメノコ', 'マニューラ', 'グレイシア'],
  },
  fighting: {
    nameJa: 'かくとう',
    bgClass: 'bg-red-700 text-white',
    weakTo: ['flying', 'psychic', 'fairy'],
    resistantTo: ['bug', 'rock', 'dark'],
    immuneTo: [],
    representativeMoveIds: [370, 411, 223], // インファイト, きあいだま, ばくれつパンチ
    recommendedGoPokemon: ['ルカリオ', 'カイリキー', 'コノヨザル', 'テラキオン', 'ローブシン', 'バシャーモ'],
  },
  poison: {
    nameJa: 'どく',
    bgClass: 'bg-purple-600 text-white',
    weakTo: ['ground', 'psychic'],
    resistantTo: ['grass', 'fighting', 'poison', 'bug', 'fairy'],
    immuneTo: [],
    representativeMoveIds: [188, 441, 398], // ヘドロばくだん, ダストシュート, どくづき
    recommendedGoPokemon: ['ウツロイド', 'ドオー', 'ベトベトン', 'ロズレイド', 'ニドクイン', 'ドクロッグ'],
  },
  ground: {
    nameJa: 'じめん',
    bgClass: 'bg-amber-600 text-white',
    weakTo: ['water', 'grass', 'ice'],
    resistantTo: ['poison', 'rock'],
    immuneTo: ['electric'],
    representativeMoveIds: [89, 414, 529], // じしん, だいちのちから, ドリルライナー
    recommendedGoPokemon: ['グラードン', 'ガブリアス', 'ドリュウズ', 'ラグラージ', 'ランドロス', 'マンムー'],
  },
  flying: {
    nameJa: 'ひこう',
    bgClass: 'bg-sky-400 text-white',
    weakTo: ['electric', 'ice', 'rock'],
    resistantTo: ['grass', 'fighting', 'bug'],
    immuneTo: ['ground'],
    representativeMoveIds: [413, 542, 143], // ブレイブバード, ぼうふう, ゴッドバード
    recommendedGoPokemon: ['レックウザ', 'ファイアロー', 'ピジョット', 'エアームド', 'チルタリス', 'ムクホーク'],
  },
  psychic: {
    nameJa: 'エスパー',
    bgClass: 'bg-pink-500 text-white',
    weakTo: ['bug', 'ghost', 'dark'],
    resistantTo: ['fighting', 'psychic'],
    immuneTo: [],
    representativeMoveIds: [94, 473, 248], // サイコキネシス, サイコショック, みらいよち
    recommendedGoPokemon: ['ミュウツー', 'クレセリア', 'サーナイト', 'メタグロス', 'ラティオス', 'エーフィ'],
  },
  bug: {
    nameJa: 'むし',
    bgClass: 'bg-lime-600 text-white',
    weakTo: ['fire', 'flying', 'rock'],
    resistantTo: ['grass', 'fighting', 'ground'],
    immuneTo: [],
    representativeMoveIds: [404, 405, 224], // シザークロス, むしのさざめき, メガホーン
    recommendedGoPokemon: ['ウルガモス', 'ハッサム', 'フェローチェ', 'クワガノン', 'カイロス', 'ヘラクロス'],
  },
  rock: {
    nameJa: 'いわ',
    bgClass: 'bg-yellow-700 text-white',
    weakTo: ['water', 'grass', 'fighting', 'ground', 'steel'],
    resistantTo: ['normal', 'fire', 'poison', 'flying'],
    immuneTo: [],
    representativeMoveIds: [157, 444, 439], // いわなだれ, ストーンエッジ, がんせきほう
    recommendedGoPokemon: ['ドサイドン', 'バンギラス', 'ラムパルド', 'トリデプス', 'テラキオン', 'ギガイアス'],
  },
  ghost: {
    nameJa: 'ゴースト',
    bgClass: 'bg-indigo-800 text-white',
    weakTo: ['ghost', 'dark'],
    resistantTo: ['poison', 'bug'],
    immuneTo: ['normal', 'fighting'],
    representativeMoveIds: [247, 421, 325], // シャドーボール, シャドークロー, シャドーパンチ
    recommendedGoPokemon: ['ギラティナ', 'ゲンガー', 'ラウドボーン', 'ヤミラミ', 'シャンデラ', 'オーロット'],
  },
  dragon: {
    nameJa: 'ドラゴン',
    bgClass: 'bg-indigo-600 text-white',
    weakTo: ['ice', 'dragon', 'fairy'],
    resistantTo: ['fire', 'water', 'electric', 'grass'],
    immuneTo: [],
    representativeMoveIds: [434, 200, 337], // りゅうせいぐん, げきりん, ドラゴンクロー
    recommendedGoPokemon: ['レックウザ', 'カイリュー', 'ディアルガ', 'ガブリアス', 'パルキア', 'ボーマンダ'],
  },
  dark: {
    nameJa: 'あく',
    bgClass: 'bg-zinc-800 text-white',
    weakTo: ['fighting', 'bug', 'fairy'],
    resistantTo: ['ghost', 'dark'],
    immuneTo: ['psychic'],
    representativeMoveIds: [399, 242, 492], // あくのはどう, かみくだく, イカサマ
    recommendedGoPokemon: ['バンギラス', 'サザンドラ', 'ブラッキー', 'アクジキング', 'ダークライ', 'マニューラ'],
  },
  steel: {
    nameJa: 'はがね',
    bgClass: 'bg-slate-500 text-white',
    weakTo: ['fire', 'fighting', 'ground'],
    resistantTo: ['normal', 'grass', 'ice', 'flying', 'psychic', 'bug', 'rock', 'dragon', 'steel', 'fairy'],
    immuneTo: ['poison'],
    representativeMoveIds: [430, 442, 309], // ラスターカノン, アイアンヘッド, コメットパンチ
    recommendedGoPokemon: ['メタグロス', 'ディアルガ', 'レジスチル', 'ドリュウズ', 'ハッサム', 'メルメタル'],
  },
  fairy: {
    nameJa: 'フェアリー',
    bgClass: 'bg-rose-400 text-white',
    weakTo: ['poison', 'steel'],
    resistantTo: ['fighting', 'bug', 'dark'],
    immuneTo: ['dragon'],
    representativeMoveIds: [585, 605, 583], // ムーンフォース, マジカルシャイン, じゃれつく
    recommendedGoPokemon: ['サーナイト', 'トゲキッス', 'マリルリ', 'ニンフィア', 'アシレーヌ', 'グランブル'],
  },
}

// 全18タイプのキー一覧（ループ処理やボタン一覧表示に使う）
export const ALL_TYPE_KEYS = Object.keys(TYPE_MASTER) as PokemonTypeKey[]
