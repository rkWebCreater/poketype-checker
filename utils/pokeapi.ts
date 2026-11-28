import { TYPE_MASTER } from '@/constants/pokemonTypes'
import type {
  MainStats,
  PokemonFormOption,
  PokemonInfo,
  PokemonTypeKey,
  RecommendedMove,
} from '@/types/pokemon'
import { calcGoStats } from '@/utils/pokemonCalc'

const POKEAPI_BASE = 'https://pokeapi.co/api/v2'
const POKEAPI_GRAPHQL = 'https://graphql.pokeapi.co/v1beta2'

interface SpeciesVariety {
  is_default: boolean
  pokemon: {
    name: string
    url: string
  }
}

// リージョンフォームの定義（ゲンシカイキ等を追加したい場合もこの構造を参考にできます）
const REGIONAL_FORMS = [
  { prefixJa: 'アローラ', suffix: '-alola', label: 'アローラ' },
  { prefixJa: 'ガラル', suffix: '-galar', label: 'ガラル' },
  { prefixJa: 'ヒスイ', suffix: '-hisui', label: 'ヒスイ' },
  { prefixJa: 'パルデア', suffix: '-paldea', label: 'パルデア' },
] as const

// パルデアケンタロスの3種など、末尾が特殊なリージョンフォーム定義
const SPECIAL_REGIONAL_SUFFIXES = [
  { suffix: '-galar-standard', prefixJa: 'ガラル', label: 'ガラル' },
  {
    suffix: '-paldea-combat-breed',
    prefixJa: 'パルデア',
    suffixJa: '（コンバット）',
    label: 'パルデア(闘)',
  },
  {
    suffix: '-paldea-blaze-breed',
    prefixJa: 'パルデア',
    suffixJa: '（ブレイズ）',
    label: 'パルデア(炎)',
  },
  {
    suffix: '-paldea-aqua-breed',
    prefixJa: 'パルデア',
    suffixJa: '（ウォーター）',
    label: 'パルデア(水)',
  },
] as const

type FormQuery =
  | { kind: 'mega'; baseName: string; variant: 'x' | 'y' | null }
  | { kind: 'regional'; baseName: string; suffix: string }

// 技データのメモリキャッシュ（同じ技への重複リクエストを防止）
const moveCache = new Map<number, RecommendedMove>()

// 全角英数字・ハイフンを半角へ正規化
const toHalfWidthAscii = (str: string): string =>
  str
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
    )
    .replace(/[ー－‐]/g, '-')

// ひらがなをカタカナに変換（ぴかちゅう→ピカチュウでも検索できるように）
const toKatakana = (str: string): string =>
  str.replace(/[\u3041-\u3096]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) + 0x60)
  )

// GraphQL で日本語名（カタカナ）から種族IDを逆引きする
const findSpeciesIdByNameJa = async (
  katakanaName: string
): Promise<number | null> => {
  const res = await fetch(POKEAPI_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        query FindPokemon($name: String!) {
          pokemonspeciesname(
            where: { name: { _eq: $name } }
            limit: 1
          ) {
            pokemon_species_id
          }
        }
      `,
      variables: { name: katakanaName },
    }),
  })

  if (!res.ok) throw new Error('ポケモン名の検索に失敗しました')
  const json = await res.json()
  return json?.data?.pokemonspeciesname?.[0]?.pokemon_species_id ?? null
}

// 「メガリザードンX」「アローラライチュウ」などの日本語フォルム名を分解する
const parseFormQuery = (raw: string): FormQuery | null => {
  const normalized = toKatakana(
    raw
      .trim()
      .replace(/[Ａ-Ｚａ-ｚ]/g, (ch) =>
        String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
      )
      .replace(/\s+/g, '')
  )

  // 1. リージョンフォーム（アローラ / ガラル / ヒスイ / パルデア）
  for (const region of REGIONAL_FORMS) {
    if (normalized.startsWith(region.prefixJa)) {
      const baseName = normalized.slice(region.prefixJa.length)
      if (baseName) {
        return { kind: 'regional', baseName, suffix: region.suffix }
      }
    }
  }

  // 2. メガシンカ（メガ〜 / メガ〜X / メガ〜Y）
  if (normalized.startsWith('メガ')) {
    let rest = normalized.slice(2)
    let variant: 'x' | 'y' | null = null

    if (/[xX]$/.test(rest)) {
      variant = 'x'
      rest = rest.slice(0, -1)
    } else if (/[yY]$/.test(rest)) {
      variant = 'y'
      rest = rest.slice(0, -1)
    }

    if (rest) {
      return { kind: 'mega', baseName: rest, variant }
    }
  }

  return null
}

// 種族IDから該当するフォルムの PokeAPI slug（例: raichu-alola, charizard-mega-x）を解決する
const resolveFormSlug = async (
  speciesId: number,
  formQuery: FormQuery
): Promise<string | null> => {
  const res = await fetch(`${POKEAPI_BASE}/pokemon-species/${speciesId}`)
  if (!res.ok) return null
  const speciesData = await res.json()
  const varieties: SpeciesVariety[] = speciesData?.varieties ?? []

  if (formQuery.kind === 'regional') {
    const exact = varieties.find((v) =>
      v.pokemon.name.endsWith(formQuery.suffix)
    )
    if (exact) return exact.pokemon.name

    // ガラルヒヒダルマ (-galar-standard) やパルデアケンタロス (-paldea-combat-breed) へのフォールバック
    const partial = varieties.find((v) =>
      v.pokemon.name.includes(`${formQuery.suffix}-`)
    )
    return partial?.pokemon.name ?? null
  }

  // メガシンカ
  if (formQuery.variant) {
    const exactSuffix = `-mega-${formQuery.variant}`
    const match = varieties.find((v) => v.pokemon.name.endsWith(exactSuffix))
    if (match) return match.pokemon.name
  }

  const exactMega = varieties.find((v) => v.pokemon.name.endsWith('-mega'))
  if (exactMega) return exactMega.pokemon.name

  const anyMega = varieties.find((v) => /-mega(-[xy])?$/.test(v.pokemon.name))
  return anyMega?.pokemon.name ?? null
}

// PokeAPI の slug から日本語表示名を生成する
const formatNameJa = (baseNameJa: string, slug: string): string => {
  if (slug.endsWith('-mega-x')) return `メガ${baseNameJa}X`
  if (slug.endsWith('-mega-y')) return `メガ${baseNameJa}Y`
  if (slug.endsWith('-mega')) return `メガ${baseNameJa}`

  for (const region of REGIONAL_FORMS) {
    if (slug.endsWith(region.suffix)) {
      return `${region.prefixJa}${baseNameJa}`
    }
  }

  for (const special of SPECIAL_REGIONAL_SUFFIXES) {
    if (slug.endsWith(special.suffix)) {
      const suffixJa = 'suffixJa' in special ? special.suffixJa : ''
      return `${special.prefixJa}${baseNameJa}${suffixJa}`
    }
  }

  return baseNameJa
}

// 切替ボタンに表示するラベルを判定する（対応対象外のフォルムは null）
const getFormButtonLabel = (variety: SpeciesVariety): string | null => {
  const slug = variety.pokemon.name
  if (variety.is_default) return '通常'
  if (slug.endsWith('-mega-x')) return 'メガX'
  if (slug.endsWith('-mega-y')) return 'メガY'
  if (slug.endsWith('-mega')) return 'メガシンカ'

  for (const region of REGIONAL_FORMS) {
    if (slug.endsWith(region.suffix)) return region.label
  }
  for (const special of SPECIAL_REGIONAL_SUFFIXES) {
    if (slug.endsWith(special.suffix)) return special.label
  }

  return null
}

// 通常・メガシンカ・リージョンフォームの切替ボタン一覧を生成する
const buildPokemonForms = (
  baseNameJa: string,
  currentSlug: string,
  varieties: SpeciesVariety[]
): PokemonFormOption[] => {
  const options: PokemonFormOption[] = []

  for (const v of varieties) {
    const label = getFormButtonLabel(v)
    if (!label) continue

    const slug = v.pokemon.name
    // 特殊な末尾（パルデアケンタロス3種など）は slug で確実に識別する
    const isSpecialRegional = SPECIAL_REGIONAL_SUFFIXES.some((s) =>
      slug.endsWith(s.suffix)
    )
    options.push({
      slug,
      label,
      query: isSpecialRegional ? slug : formatNameJa(baseNameJa, slug),
      isCurrent: slug === currentSlug,
    })
  }

  // 通常フォルムのみの場合は切替ボタンを出さない
  return options.length > 1 ? options : []
}

// 日本語名・英語名・図鑑番号から PokeAPI 用の識別子を解決する関数
const resolvePokemonIdOrName = async (rawQuery: string): Promise<string> => {
  const trimmed = rawQuery.trim()
  const normalizedAscii = toHalfWidthAscii(trimmed)

  // 半角英数字のみ（図鑑番号 "149" や英語名 "charizard-mega-x"）ならそのまま使う
  if (/^[a-zA-Z0-9-]+$/.test(normalizedAscii)) {
    return normalizedAscii.toLowerCase()
  }

  // 1. まず通常名として完全一致検索（メガニウム・メガヤンマ等を誤判定しないため）
  const katakanaName = toKatakana(trimmed)
  const directId = await findSpeciesIdByNameJa(katakanaName)
  if (directId) {
    return String(directId)
  }

  // 2. 「メガ〜」「アローラ〜」などのフォルム付き検索を逆引き
  const formQuery = parseFormQuery(trimmed)
  if (formQuery) {
    const baseSpeciesId = await findSpeciesIdByNameJa(formQuery.baseName)
    if (baseSpeciesId) {
      const formSlug = await resolveFormSlug(baseSpeciesId, formQuery)
      if (formSlug) {
        return formSlug
      }
      throw new Error(
        `「${trimmed}」に対応するフォルムが見つかりませんでした`
      )
    }
  }

  throw new Error(`「${trimmed}」というポケモンが見つかりませんでした`)
}

// ポケモンの基本情報を取得するメイン関数
export const fetchPokemon = async (query: string): Promise<PokemonInfo> => {
  const target = await resolvePokemonIdOrName(query)

  // 基本データと日本語名（species）を取得
  const pokemonRes = await fetch(`${POKEAPI_BASE}/pokemon/${target}`)
  if (!pokemonRes.ok) {
    throw new Error(`「${query}」が見つかりませんでした`)
  }
  const pokemonData = await pokemonRes.json()

  const speciesUrl =
    pokemonData.species?.url ??
    `${POKEAPI_BASE}/pokemon-species/${pokemonData.id}`
  const speciesRes = await fetch(speciesUrl)
  const speciesData = speciesRes.ok ? await speciesRes.json() : null

  // 日本語名を取り出す（メガシンカ・リージョンフォーム時は接頭辞付きに整形）
  const baseNameJa =
    speciesData?.names?.find(
      (n: { language: { name: string }; name: string }) =>
        n.language.name === 'ja-Hrkt' || n.language.name === 'ja'
    )?.name || pokemonData.name
  const nameJa = formatNameJa(baseNameJa, pokemonData.name)

  // メガシンカ・リージョンフォームを含むフォルム切替一覧
  const forms = buildPokemonForms(
    baseNameJa,
    pokemonData.name,
    speciesData?.varieties ?? []
  )

  // タイプ配列を取り出す
  const types: PokemonTypeKey[] = pokemonData.types.map(
    (t: { type: { name: PokemonTypeKey } }) => t.type.name
  )

  // 種族値を取り出す
  const getStat = (statName: string): number =>
    pokemonData.stats.find(
      (s: { stat: { name: string }; base_stat: number }) =>
        s.stat.name === statName
    )?.base_stat ?? 0

  const stats: MainStats = {
    hp: getStat('hp'),
    attack: getStat('attack'),
    defense: getStat('defense'),
    spAttack: getStat('special-attack'),
    spDefense: getStat('special-defense'),
    speed: getStat('speed'),
  }

  return {
    id: speciesData?.id ?? pokemonData.id,
    nameJa,
    nameEn: pokemonData.name,
    imageUrl:
      pokemonData.sprites?.other?.['official-artwork']?.front_default ||
      pokemonData.sprites?.front_default ||
      '',
    types,
    stats,
    goStats: calcGoStats(stats),
    forms,
  }
}

// 弱点タイプ一覧から「おすすめの技」を取得する関数（キャッシュ付き）
export const fetchRecommendedMoves = async (
  weakTypes: PokemonTypeKey[]
): Promise<RecommendedMove[]> => {
  const moveIds = weakTypes.flatMap(
    (type) => TYPE_MASTER[type].recommendedMoveIds
  )
  if (moveIds.length === 0) return []

  const damageClassMap: Record<string, '物理' | '特殊' | '変化'> = {
    physical: '物理',
    special: '特殊',
    status: '変化',
  }

  const results = await Promise.allSettled(
    moveIds.map(async (id): Promise<RecommendedMove | null> => {
      const cached = moveCache.get(id)
      if (cached) return cached

      const res = await fetch(`${POKEAPI_BASE}/move/${id}`)
      if (!res.ok) return null
      const data = await res.json()

      const nameJa =
        data.names?.find(
          (n: { language: { name: string }; name: string }) =>
            n.language.name === 'ja-Hrkt' || n.language.name === 'ja'
        )?.name || data.name

      const move: RecommendedMove = {
        id: data.id,
        nameJa,
        type: data.type.name as PokemonTypeKey,
        power: data.power ?? null,
        damageClass: damageClassMap[data.damage_class?.name] ?? '物理',
      }
      moveCache.set(id, move)
      return move
    })
  )

  const moves = results
    .filter(
      (r): r is PromiseFulfilledResult<RecommendedMove | null> =>
        r.status === 'fulfilled'
    )
    .map((r) => r.value)
    .filter((m): m is RecommendedMove => m !== null)

  if (moves.length === 0 && results.some((r) => r.status === 'rejected')) {
    throw new Error('おすすめ技の取得に失敗しました')
  }

  return moves
}
