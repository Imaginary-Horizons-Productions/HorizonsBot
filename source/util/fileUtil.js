const fs = require('fs');
const { Collection } = require("discord.js");

/**
 * @param {string} mainId
 * @param {string[]} fileList
 */
function createSubcommandMappings(mainId, fileList) {
	const mappings = {
		/** @type {import("discord.js").BaseApplicationCommandData[]} */
		slashData: [],
		/** @type {Record<string, (interaction: import("discord.js").Interaction, ...args: unknown[]) => Promise<void>} */
		executeDictionary: {}
	};
	for (const fileName of fileList) {
		const subcommand = require(`../commands/${mainId}/${fileName}`);
		mappings.slashData.push(subcommand.data);
		mappings.executeDictionary[subcommand.data.name] = subcommand.executeSubcommand;
	};
	return mappings;
};

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
	createSubcommandMappings,
	ensuredPathSave
};
