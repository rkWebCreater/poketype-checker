import type {MainStats, GoStats, PokemonTypeKey, TypeEffectiveness,
  WeaknessAnalysis, GameMode} from '../types/pokemon'
import { ALL_TYPE_KEYS , TYPE_MASTER } from '@/constants/pokemonTypes'

//PokeAPI から一回データを取得すると本家とポケモンGoでのステータス両方がそろう
export const calcGoStats = (s :MainStats): GoStats => {
  //素早さ補正
  const speedMod = 1 + (s.speed - 75) / 500

  // 攻撃：攻撃と特攻の高い方を7/8、低い方を1/8で合算
  const higherAtk = Math.max(s.attack , s.spAttack)
  const lowerAtk = Math.min(s.attack , s.spAttack)
  const scaledAtk = Math.round(2 * ((7 / 8 ) * higherAtk + (1 / 8)* lowerAtk))

  // 防御：防御と特防の高い方を5/8、低い方を3/8で合算
  const higherDef = Math.max(s.defense, s.spDefense)
  const lowerDef = Math.min(s.defense, s.spDefense)
  const scaledDef = Math.round(2 * ((5 / 8) * higherDef + (3 / 8) * lowerDef))

  return{
    hp : Math.floor(s.hp * 1.75 + 50),
    attack : Math.floor(scaledAtk * speedMod),
    defense : Math.floor(scaledDef * speedMod)
  }
}

// 防御側のタイプ配列（1〜2個）とゲームモードから、弱点・耐性を計算する関数
export const calcWeakness = (
    defendingTypes : PokemonTypeKey[] ,
    mode : GameMode
): WeaknessAnalysis =>{
    const doubleWeak : TypeEffectiveness[] = []
    const weak : TypeEffectiveness[] = []
    const resistant : TypeEffectiveness[] = []

    //モードごとの倍率
    const rates =
      mode === 'main'
       ? { weak : 2 , resist : 0.5 , immune : 0}
       : { weak : 1.6 , resist : 0.625 , immune : 0.390625 }

    //18タイプの攻撃技それぞれについて倍率を計算
    for(const attackType of ALL_TYPE_KEYS){
        let multiplier = 1
    
        for(const defType of defendingTypes){
            const master = TYPE_MASTER[defType]
            if (master.weakTo.includes(attackType)){
                multiplier *= rates.weak
            }else if(master.resistantTo.includes(attackType)){
                multiplier *= rates.resist
            }else if(master.immuneTo.includes(attackType)){
                multiplier *=rates.immune
            }
        }

        //小数第2位に丸める（1.6 * 0.625 = 1.0000000002 などの誤差を防ぐ）
        const rounded = Math.round(multiplier * 100) / 100

        if(rounded > 2){
            // 4倍（GO: 2.56倍）
            doubleWeak.push({type : attackType , multiplier : rounded})
        }else if(rounded > 1){
            // 2倍（GO: 1.6倍）
            weak.push({ type: attackType, multiplier: rounded })
        }else if (rounded < 1) {
            // 1倍未満（半減・1/4・無効）
            resistant.push({ type: attackType, multiplier: rounded })
        }
    
    }
    // 倍率が低い順（×0 → ×0.25 → ×0.5）に並べ替える
    resistant.sort((a, b) => a.multiplier - b.multiplier)

    return {doubleWeak , weak , resistant}
}
