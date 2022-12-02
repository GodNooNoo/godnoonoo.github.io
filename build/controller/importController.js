import { Build } from "../data/buildTypes.js";
import { LZString } from "./lz-string.js";
import { buildFromSave, buildItems, clearBuilderData, setPresets, } from "./buildController.js";
import { clearItems, getItems } from "./itemsController.js";
import { clearBonuses, setBonuses, equipOneTimer } from "./bonusesController.js";
import { enemyCount, modifiedAutoBattleWithBuild } from "./autoBattleController.js";
import { setSaveData } from "./saveController.js";
import { setEnemyLevel, setMaxEnemyLevel } from "./levelsController.js";
import { autoBattle } from "../data/object.js";
export function stringPaste(paste) {
    clear();
    let savegame;
    try {
        // Wtf do you think the try catch is for you stupid linter
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        savegame = JSON.parse(LZString.decompressFromBase64(paste));
    }
    catch (error) {
        // Do nothing
    }
    if (savegame) {
        //  Import save
        if (savegame.global) {
            importSave(savegame);
        }
        else {
            alert("https://nsheetz.github.io/perks/");
        }
    }
    else if (paste.includes("\t")) {
        // Import spreadsheet line
        importSpreadsheet(paste);
    }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function importSave(savegame) {
    modifiedAutoBattleWithBuild();
    const saveString = {};
    const abData = savegame.global.autoBattleData;
    saveString.items = abData.items;
    const ring = {
        mods: abData.rings.mods,
        level: abData.rings.level,
    };
    if (!("The_Ring" in abData.oneTimers)) {
        // Set ring to unowned through 0 if it isn't owned
        ring.level = 0;
    }
    saveString.ring = ring;
    saveString.oneTimers = abData.oneTimers;
    saveString.mutations = savegame.global.u2MutationData;
    saveString.scruffy = savegame.global.fluffyExp2;
    saveString.currentLevel = abData.enemyLevel;
    saveString.maxEnemyLevel = abData.maxEnemyLevel;
    let remainingEnemies = 0;
    if (saveString.currentLevel === saveString.maxEnemyLevel) {
        remainingEnemies = enemyCount(abData.enemyLevel) - abData.enemiesKilled;
    }
    saveString.remainingEnemies = remainingEnemies;
    saveString.dust = abData.dust;
    saveString.shards = abData.shards;
    setSaveData(saveString);
    setBonuses(abData.bonuses);
    buildFromSave();
    const presets = savegame.global.autoBattleData.presets;
    setPresets(presets);
}
function importSpreadsheet(row) {
    modifiedAutoBattleWithBuild();
    const items = JSON.parse(JSON.stringify(getItems()));
    const itemLevels = row.split("\t");
    itemLevels.forEach((itemLevel, index) => {
        if (itemLevel !== "") {
            if (index >= 3 && index <= 43) {
                const itemName = Object.keys(Build.items)[index];
                items[itemName].equipped = true;
                items[itemName].level = parseInt(itemLevel);
            }
            else if (index == 44) {
                equipOneTimer("Master_of_Arms");
            }
            else if (index == 45) {
                equipOneTimer("Dusty_Tome");
            }
            else if (index == 46) {
                equipOneTimer("Whirlwind_of_Arms");
            }
        }
    });
    buildItems(items);
}
export async function importFromSheet(SALevel, BuildRow) {
    modifiedAutoBattleWithBuild();
    const values = await GetSheetData(SALevel);
    const items = JSON.parse(JSON.stringify(getItems()));
    const headerRow = values.values[1];
    const importRow = values.values[BuildRow - 1]; //Array index from 0, user will enter the row number they see
    //Last column of base items is either one before "Master of Arms" or "Ring" find first occurance of either
    const maxItem = headerRow.findIndex((f) => f.toLowerCase() == "master of arms" || f.toLowerCase() == "ring");
    //Get all indexes of items that have levels assigned between cel 3 and the last item
    const indexes = [];
    for (let i = 2; i < maxItem; i++) {
        if (importRow[i] != "") {
            indexes.push(i);
        }
    }
    //Item names are in header row
    //Item levels are in the import row
    let itemName = "";
    indexes.forEach(function (value) {
        itemName = GetItemName(headerRow[value]);
        items[itemName].equipped = true;
        items[itemName].level = parseInt(importRow[value]);
    });
    //Load one timers
    //If SA >= 50 they are not on sheet, but are assumed purchased
    let oneTimers = [];
    if (SALevel >= 50) {
        oneTimers.push("Master_of_Arms");
        oneTimers.push("Dusty_Tome");
        oneTimers.push("Whirlwind_of_Arms");
    }
    else {
        if (importRow[headerRow.findIndex((f) => f == "Master Of Arms")] != "") {
            oneTimers.push("Master_of_Arms");
        }
        if (importRow[headerRow.findIndex((f) => f == "Dusty Tome")] != "") {
            oneTimers.push("Dusty_Tome");
        }
        if (importRow[headerRow.findIndex((f) => f == "Whirlwind of Arms")] != "") {
            oneTimers.push("Whirlwind_of_Arms");
        }
    }
    oneTimers.forEach(ot => equipOneTimer(ot));
    buildItems(items);
    setEnemyLevel(SALevel);
    if (SALevel > autoBattle.maxEnemyLevel) {
        //Set the max level to at least the level imported
        setMaxEnemyLevel(SALevel);
    }
}
function GetItemName(ColName) {
    //Item name in sheet has space, in array has _
    //Snimp-Fanged Blade is Snimp__Fanged_Blade in the item list (sigh)
    return ColName.replace(/ /gi, "_").replace(/-/gi, "__");
}
async function GetSheetData(SALevel) {
    //This is a google webapp/script that queries the sheet data and returns it in JSON
    //This effectively offloads the oAuth interactions with the sheet that would normally 
    //   be done via the sheets API to this webapp where it can use default credentials to hit
    //   public data and can also be called anonymously via a simple fetch
    const baseUrl = "https://script.google.com/macros/s/AKfycbz7HGY5ykmZjUHAZt1jPphbP1E3gCVmBzHkxu8mBo0LPjZH2YMuvB2H09VmSy6XNW2DCg/exec"; // Please set your Web Apps URL.
    const para = {
        //spreadsheetId: "11BRCfrb8mYAfn7xo1UdDizMnn9KVGSJtx4KNJNvBOKU",  // read only sheet
        spreadsheetId: "17Z3dwnkeAmY2La-LWreybTs4Sm7BAck79EzVF_gkZzs",
        sheetName: SALevel.toString() // Name of page inside google sheet
    };
    const q = new URLSearchParams(para);
    const url = baseUrl + "?" + q;
    return fetch(url)
        .then(res => res.json())
        .then(res => { return res; });
}
export function clear() {
    clearItems();
    clearBonuses();
    clearBuilderData();
}
