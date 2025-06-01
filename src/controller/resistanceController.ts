/*
Controller for the resistance and chance info.
*/

import { getEnemyLevel } from "./autoBattleController.js";
import { enemy, huffy, shankInfo } from "../data/resistanceData.js";
import { getRing } from "./bonusesController.js";
import { getActiveEffects } from "./levelsController.js";
import { uiUpdateChances, uiUpdateResistances, updateShank } from "../view/levelsView.js";
import { getItem, getItems } from "./itemsController.js";

const modifierFunctions = {
    items: getItems(),
    Rusty_Dagger() {
        const chance = this.items.Rusty_Dagger.bleedChance();
        huffy.bleedMin += chance;
        huffy.bleedMax += chance * 2;
        huffy.canBleed = true;
    },
    Fists_of_Goo() {
        huffy.canPoison = true;
        huffy.poisonMin += 25;
        huffy.poisonMax += 50;
    },
    Battery_Stick() {
        huffy.canShock = true;
        huffy.shockMin += 35;
        huffy.shockMax += 70;
    },
    Chemistry_Set() {
        const chance = this.items.Chemistry_Set.poisonChance();
        huffy.poisonMin += chance;
        huffy.poisonMax += chance + 50;
    },
    Comfy_Boots() {
        huffy.resistAll += this.items.Comfy_Boots.resistance();
    },
    Shock_and_Awl() {
        const chance = this.items.Shock_and_Awl.shockChance();
        huffy.canShock = true;
        huffy.shockMin += chance;
        huffy.shockMax += chance;
    },
    Tame_Snimp() {
        const chance = this.items.Tame_Snimp.poisonChance();
        huffy.canPoison = true;
        huffy.poisonMin += chance;
        huffy.poisonMax += chance;
    },
    Wired_Wristguards() {
        const chance = this.items.Wired_Wristguards.shockChance();
        huffy.shockMin += chance;
        huffy.shockMax += chance;
        huffy.resistAll += 50;
    },
    Sword_and_Board() {
        huffy.resistAll += this.items.Sword_and_Board.resists();
    },
    Bilious_Boots() {
        huffy.resistAll += this.items.Bilious_Boots.resists();
    },
    Bloodstained_Gloves() {
        const chance = this.items.Bloodstained_Gloves.bleedChance();
        huffy.bleedMin += chance;
        huffy.bleedMax += chance;
    },
    Eelimp_in_a_Bottle() {
        const chance = this.items.Eelimp_in_a_Bottle.shockChance();
        huffy.shockMin += chance;
        huffy.shockMax += chance;
        huffy.resistShock += this.items.Eelimp_in_a_Bottle.shockResist();
    },
    Big_Cleaver() {
        huffy.bleedMin += 25;
        huffy.bleedMax += 100;
        huffy.canBleed = true;
    },
    Metal_Suit() {
        huffy.resistBleed += this.items.Metal_Suit.resist();
    },
    Nozzled_Goggles() {
        huffy.resistPoison += this.items.Nozzled_Goggles.resist();
    },
    Very_Large_Slime() {
        const chance = this.items.Very_Large_Slime.poisonChance();
        huffy.canPoison = true;
        huffy.poisonMin += chance;
        huffy.poisonMax += chance;
    },
    Fearsome_Piercer() {
        const chance = this.items.Fearsome_Piercer.bleedChance();
        huffy.bleedMin += chance;
        huffy.bleedMax += chance;
    },
    Bag_of_Nails() {
        huffy.canBleed = true;
    },
    Bad_Medkit() {
        const chance = this.items.Bad_Medkit.bleedChance();
        huffy.bleedMin += chance;
        huffy.bleedMax += chance;
    },
    Putrid_Pouch() {
        const chance = this.items.Putrid_Pouch.poisonChance();
        huffy.poisonMin += chance;
        huffy.poisonMax += chance;
    },
    Aegis() {
        const chance = this.items.Aegis.shockChance();
        if (this.items.Basket_of_Souls.equipped || this.items.Nullifium_Armor.equipped) {
            huffy.shockMin += chance;
            huffy.warningAegis = true;
        }
        huffy.shockMax += chance;
    },
    Doppelganger_Diadem() {
        huffy.canBleed = true;
    },
};

function resetHuffy() {
    for (const [key, value] of Object.entries(huffy)) {
        /* eslint-disable @typescript-eslint/no-explicit-any */ // The typeof handles what eslint and TS thinks are errors.
        if (typeof value === "number") {
            (huffy as any)[key] = 0;
        } else if (typeof value === "boolean") {
            (huffy as any)[key] = false;
        }
        /* eslint-enable @typescript-eslint/no-explicit-any */
    }
}

function resetEnemy() {
    for (const [key, value] of Object.entries(enemy)) {
        /* eslint-disable @typescript-eslint/no-explicit-any */ // The typeof handles what eslint and TS thinks are errors.
        if (typeof value === "number") {
            (enemy as any)[key] = 0;
        } else if (Array.isArray(value)) {
            (enemy as any)[key] = [false, false, false];
        }
        /* eslint-enable @typescript-eslint/no-explicit-any */
    }
}

export function readEnemy() {
    const effects = getActiveEffects();
    if (effects) {
        const level = getEnemyLevel();

        // Chances
        enemy.bleed = effects.has("Bloodletting") ? level * 3 * (2 - Math.pow(0.5, effects.get("Bloodletting") - 1)) : 0;
        enemy.poison = effects.has("Poisoning") ? level * 3 * (2 - Math.pow(0.5, effects.get("Poisoning") - 1)) : 0;
        enemy.shock = effects.has("Shocking") ? level * 3 * (2 - Math.pow(0.5, effects.get("Shocking") - 1)) : 0;

        // Resistances
        enemy.resistBleed = level * (effects.get("Bleed Resistant") ? 11 : 1);
        enemy.resistPoison = level * (effects.get("Poison Resistant") ? 11 : 1);
        enemy.resistShock = level * (effects.get("Shock Resistant") ? 11 : 1);
    }

    // Which chance is shanked
    const shank = Math.max(enemy.bleed, enemy.poison, enemy.shock);
    if (shank > 0) {
        enemy.shank = shank * 0.25;
        if (enemy.poison === shank) {
            enemy.shankedEffect = "poison";
        } else if (enemy.bleed === shank) {
            enemy.shankedEffect = "bleed";
        } else if (enemy.shock === shank) {
            enemy.shankedEffect = "shock";
        }
    }
}

export function readHuffy() {
    for (const [itemName, item] of Object.entries(getItems())) {
        if (item.equipped) {
            const functions = Object.keys(modifierFunctions);
            if (functions.includes(itemName)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (modifierFunctions as any)[itemName]();
            }
        }
    }

    const ring = getRing();
    if (ring.bonus.owned) {
        huffy.bleedMax += ring.chances;
        huffy.bleedMin += ring.chances;
        huffy.poisonMax += ring.chances;
        huffy.poisonMin += ring.chances;
        huffy.shockMax += ring.chances;
        huffy.shockMin += ring.chances;
    }

    if (getItem("Sacrificial_Shank").equipped) {
        calculateShank();
    } else {
        shankInfo.shanked = false;
    }
}

function calculateShank() {
    // don't even...
    let shankedBleed = false;
    let shankedPoison = false;
    let shankedShock = false;
    shankInfo.bleed[0] = huffy.bleedMin;
    shankInfo.bleed[1] = 0;
    shankInfo.poison[0] = huffy.poisonMin;
    shankInfo.poison[1] = 0;
    shankInfo.reductionMax = 0;
    shankInfo.reductionMin = Infinity;
    shankInfo.shock[0] = huffy.shockMin;
    shankInfo.shock[1] = 0;
    for (const bleed of [huffy.bleedMin, huffy.bleedMax]) {
        for (const poison of [huffy.poisonMin, huffy.poisonMax]) {
            for (const shock of [huffy.shockMin, huffy.shockMax]) {
                const max = Math.max(bleed, poison, shock);
                const reduction = 0.25 * max;
                shankInfo.reductionMin = Math.min(shankInfo.reductionMin, reduction);
                shankInfo.reductionMax = Math.max(reduction, shankInfo.reductionMax);
                if (poison >= bleed && poison >= shock) {
                    shankedPoison = true;
                    if (poison - reduction < shankInfo.poison[0]) {
                        shankInfo.poison[0] = poison - reduction;
                    }
                    if (poison - reduction > shankInfo.poison[1]) {
                        shankInfo.poison[1] = poison - reduction;
                    }
                } else if (bleed >= shock) {
                    shankedBleed = true;
                    if (bleed - reduction < shankInfo.bleed[0]) {
                        shankInfo.bleed[0] = bleed - reduction;
                    }
                    if (bleed - reduction > shankInfo.bleed[1]) {
                        shankInfo.bleed[1] = bleed - reduction;
                    }
                } else {
                    shankedShock = true;
                    if (shock - reduction < shankInfo.shock[0]) {
                        shankInfo.shock[0] = shock - reduction;
                    }
                    if (shock > shankInfo.shock[1]) {
                        shankInfo.shock[1] = shock - reduction;
                    }
                }
            }
        }
    }
    shankInfo.poison[1] = shankedPoison ? shankInfo.poison[1] : huffy.poisonMax;
    shankInfo.bleed[1] = shankedBleed ? shankInfo.bleed[1] : huffy.bleedMax;
    shankInfo.shock[1] = shankedShock ? shankInfo.shock[1] : huffy.shockMax;
    shankInfo.shanked = true;
    huffy.shankedEffect = shankedPoison ? "poison" : shankedBleed ? "bleed" : "shock";
}

export function updateResistances() {
    resetEnemy();
    readEnemy();
    resetHuffy();
    readHuffy();
    uiUpdateResistances(enemy);
    uiUpdateChances(huffy, enemy, shankInfo);
    updateShank(shankInfo, huffy.shankedEffect, enemy.shankedEffect);
}
