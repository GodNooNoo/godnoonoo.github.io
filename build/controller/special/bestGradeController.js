/*
Functions for calculating the best upgrade and best downgrade items.
*/
import { Currency } from "../../data/buildTypes.js";
import { Trinary } from "../../utility.js";
import { uiSetGradesItems, uiUpdateGradeItem, } from "../../view/bestGradesView.js";
import { modifiedAutoBattle, startSimulation, getDustPs, getClearingTime, } from "../autoBattleController.js";
import { getRing, incrementRing } from "../bonusesController.js";
import { getCurrency, getUpgradePrice } from "../general.js";
import { getItemsInOrder, incrementItem } from "../itemEquipController.js";
import { getItem } from "../itemsController.js";
const STORAGE = {
    increment: 0,
    itemsToRun: [],
    baseDustPs: 0,
    baseClearingTime: 0,
    currentItem: "",
};
export function findBestGrade(increment) {
    STORAGE.increment = increment;
    runAllItems();
}
function updateItemsToRun() {
    const names = getItemsInOrder();
    for (const name of names) {
        const item = getItem(name);
        if (item.state === Trinary.Yes) {
            if (name === "Doppelganger_Signet")
                continue;
            STORAGE.itemsToRun.push(name);
        }
    }
    const ring = getRing();
    if (ring.bonus.owned) {
        STORAGE.itemsToRun.push("Ring");
    }
}
function runAllItems() {
    updateItemsToRun();
    if (STORAGE.itemsToRun.length > 0) {
        modifiedAutoBattle();
        uiSetGradesItems(STORAGE.itemsToRun);
        startSimulation(undefined, baseOnComplete);
    }
}
function onUpdate() {
    const reducedTime = STORAGE.baseClearingTime - getClearingTime();
    let upgradeCost = 0;
    let currency = Currency.dust;
    if (STORAGE.increment > 0) {
        if (STORAGE.currentItem === "Ring") {
            upgradeCost = getUpgradePrice(STORAGE.currentItem, -STORAGE.increment);
            currency = Currency.shards;
        }
        else {
            const item = STORAGE.currentItem;
            upgradeCost = getUpgradePrice(item, -STORAGE.increment);
            currency = getCurrency(item);
        }
    }
    const increaseDust = (getDustPs() - STORAGE.baseDustPs) /
        (currency === Currency.shards ? 1e9 : 1);
    const timeUntilProfit = upgradeCost / increaseDust;
    uiUpdateGradeItem(STORAGE.currentItem, reducedTime, timeUntilProfit);
}
function onComplete() {
    if (STORAGE.currentItem === "Ring")
        incrementRing(-STORAGE.increment);
    else
        incrementItem(STORAGE.currentItem, -STORAGE.increment);
    const item = STORAGE.itemsToRun.shift();
    if (item !== undefined) {
        STORAGE.currentItem = item;
        simulateNextItem();
    }
}
function simulateNextItem() {
    if (STORAGE.currentItem === "Ring") {
        incrementRing(STORAGE.increment);
    }
    else {
        incrementItem(STORAGE.currentItem, STORAGE.increment);
    }
    modifiedAutoBattle();
    startSimulation(onUpdate, onComplete);
}
function baseOnComplete() {
    STORAGE.baseDustPs = getDustPs();
    STORAGE.baseClearingTime = getClearingTime();
    STORAGE.currentItem = STORAGE.itemsToRun.shift();
    simulateNextItem();
}