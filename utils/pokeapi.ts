import { TYPE_MASTER } from "@/constants/pokemonTypes";
import type {
    MainStats,
    PokemonInfo,
    PokemonTypeKey,
    RecommendedMove,
} from '@/types/pokemon'
import { calcGoStats } from '@/utils/pokemonCalc'

const POKEAPI_BASE = 'https://pokeapi.co/api/v2'
const POKEAPI_GRAPHQL = 'https://graphql.pokeapi.co/v1beta2'

//ひらがなをカタカナに変換（ぴかちゅう→ピカチュウでも検索できるように）
const toKatakana = (str : string) :string=>{
    return str.replace(/[\u3041-\u3096]/g , (ch) =>
           String.fromCharCode(ch.charCodeAt(0) + 0x60))
}

//日本語名から図鑑番号（ID）を検索する関数
const PokemonIdOrName = async (rawQuery : string) : Promise<string> =>{
    const trimmed = rawQuery.trim()

    // 半角英数字のみ（図鑑番号 "149" や英語名 "pikachu"）ならそのまま使う
    if(/^[a-zA-Z0-9-]+$/.test(trimmed)){
        return trimmed.toLowerCase()
    }

    //日本語の場合はカタカナに統一してPokeAPI GraphQLで図鑑番号を逆引き
    const katakanaName = toKatakana(trimmed)
    const res = await fetch(POKEAPI_GRAPHQL, {
        method : 'POST' ,
        headers : { 'Content-Type' : 'application/json' },
        body : JSON.stringify({
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
        })
    })

    if(!res.ok) throw new Error('ポケモン名の検索に失敗しました')
    const json = await res.json()
    const foundId = json?.data?.pokemonspeciesname?.[0]?.pokemon_species_id

    if(!foundId){
        throw new Error(`「${trimmed}」というポケモンが見つかりませんでした`)
    }
    return String(foundId)
}

//ポケモンの基本情報を取得するメイン関数
export const fetchPokemon = async (query : string ) : Promise<PokemonInfo> => {
    const target = await PokemonIdOrName(query)

    //基本データと日本語名（species）を取得
    const pokemonRes = await fetch(`${POKEAPI_BASE}/pokemon/${target}`)
    if(!pokemonRes.ok){
        throw new Error(`「${query}」が見つかりませんでした`)
    }
    const pokemonData = await pokemonRes.json()

    const speciesRes = await fetch(`${POKEAPI_BASE}/pokemon-species/${pokemonData.id}`)
    const speciesData = speciesRes.ok ? await speciesRes.json() : null

    //日本語名を取り出す
    const nameJa = speciesData?.names?.find(
        (n : {language : {name : string}; name : string})=>
        n.language.name === 'ja-Hrkt' || n.language.name === 'ja'
    )?.name || pokemonData.name

    //タイプ配列を取り出す
    const types : PokemonTypeKey[] = pokemonData.types.map(
    (t: { type: { name: PokemonTypeKey } }) => t.type.name
    );

    //種族値を取り出す
    const getStat = (statName : string ) : number =>
        pokemonData.stats.find(
            (s : {stat : {name : string} ; base_stat : number})=>
            s.stat.name ===statName
        )?.base_stat ?? 0

    const stats : MainStats = {
        hp: getStat('hp'),
        attack: getStat('attack'),
        defense: getStat('defense'),
        spAttack: getStat('special-attack'),
        spDefense: getStat('special-defense'),
        speed: getStat('speed'),
    }
    return {
        id: pokemonData.id ,
        nameJa,
        nameEn: pokemonData.name , 
        imageUrl:
            pokemonData.sprites?.other?.['official-artwork']?.front_default ||
            pokemonData.sprites?.front_default ||
         '',
        types,
        stats,
        goStats: calcGoStats(stats),
    }
}

//弱点タイプ一覧から「おすすめの技と覚えるポケモン」を取得する関数
export const fetchRecommendedMoves = async (
    weakTypes: PokemonTypeKey []
): Promise<RecommendedMove[]> => {

    //弱点タイプ（）の代表技IDを集める
    const moveIds = weakTypes.slice(0 , 3).flatMap((type) => TYPE_MASTER[type].recommendedMoveIds)

    const damageClassMap : Record<string , '物理' | '特殊' | '変化'> = {

        physical : '物理',
        special : '特殊',
        status: '変化'
    }

    const moves = await Promise.all(
        moveIds.map(async (id) : Promise<RecommendedMove | null > => {
            const res = await fetch(`${POKEAPI_BASE}/move/${id}`)
            if(!res.ok) return null
            const data = await res.json()

            const nameJa = data.names?.find(
                (n : {language : {name : string}; name : string}) =>
                    n.language.name === 'ja-Hrkt' || n.language.name === 'ja'
            )?.name || data.name

            //その技を覚える対戦でよく使われる4匹を取得
            const moveType = data.type.name as PokemonTypeKey

            return{
                id : data.id ,
                nameJa,
                type : moveType,
                power : data.power ?? null , 
                damageClass : damageClassMap[data.damage_class?.name] ?? '物理',
                learnedBy: TYPE_MASTER[moveType].recommendedGoPokemon,
            }
        })
    )

    return moves.filter((m): m is RecommendedMove => m !== null)
}