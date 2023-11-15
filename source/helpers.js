const fs = require('fs');
const { Collection } = require('discord.js');

/** Convert an amount of time from a starting unit to a different one
 * @param {number} value
 * @param {"w" | "d" | "h" | "m" | "s" | "ms"} startingUnit
 * @param {"w" | "d" | "h" | "m" | "s" | "ms"} resultUnit
 * @returns {number}
 */
function timeConversion(value, startingUnit, resultUnit) {
	const unknownUnits = [];
	let msPerStartUnit = 1;
	switch (startingUnit.toLowerCase()) {
		case "w":
			msPerStartUnit *= 7;
		case "d":
			msPerStartUnit *= 24;
		case "h":
			msPerStartUnit *= 60;
		case "m":
			msPerStartUnit *= 60;
		case "s":
			msPerStartUnit *= 1000;
		case "ms":
			msPerStartUnit *= 1;
			break;
		default:
			unknownUnits.push(startingUnit);
	}

	let msPerResultUnit = 1;
	switch (resultUnit.toLowerCase()) {
		case "w":
			msPerResultUnit *= 7;
		case "d":
			msPerResultUnit *= 24;
		case "h":
			msPerResultUnit *= 60;
		case "m":
			msPerResultUnit *= 60;
		case "s":
			msPerResultUnit *= 1000;
		case "ms":
			msPerResultUnit *= 1;
			break;
		default:
			unknownUnits.push(resultUnit);
	}
	if (!unknownUnits.length) {
		return value * msPerStartUnit / msPerResultUnit;
	} else {
		throw new Error(`Unknown unit used: ${unknownUnits.join(", ")} (allowed units: ms, s, m, h, d, w)`)
	}
}

/** Generate parent directories if necessary, and save a file.
 * Keeps a backup of the fileName that may be replaced, until writing succeeds
 * @param {unknown} entity unserialized data to be written to the file
 * @param {string} fileName name of the file to be saved
 */
async function ensuredPathSave(entity, fileName) {
	const dirPath = "./config/";
	const filePath = dirPath + fileName;
	const backupFilePath = filePath + ".bak";

	let textToSave = '';
	if (entity instanceof Collection) {
		textToSave = [];
		Array.from(entity.values).forEach(value => {
			textToSave.push([entity.findKey(checkedValue => checkedValue === value), value]);
		})
		textToSave = JSON.stringify(textToSave);
	} else if (typeof entity == 'object' || typeof entity == 'number') {
		textToSave = JSON.stringify(entity);
	} else {
		textToSave = entity;
	}

	fs.promises.mkdir(dirPath, { recursive: true }) // (idempotently) establish prerequisite directory, in advance
		.then(() => fs.promises.rename(filePath, backupFilePath)) // save previous file as backup
		.catch((err) => err.code === 'ENOENT' ? undefined : Promise.reject(err)) // ignore ENOENT (file not found) for rename if save didn't already exist
		.then(() => fs.promises.writeFile(filePath, textToSave, { encoding: "utf8" })
			.catch((err) => Promise.reject(new Error("writeFile failed", { cause: err })))) // promote errors (including ENOENT) for writeFile)
		.catch(console.error) // log error, and avoid fatally crashing
}

module.exports = {
	timeConversion,
	ensuredPathSave
};
