const fs = require('fs');
const { commandSets } = require('../commands/_commandDictionary.js');
const Command = require('../classes/Command.js');

require("./initialize.js");

let text = "";

commandSets.forEach(commandSet => {
	text += `## ${commandSet.name}\n${commandSet.description}\n`;
	commandSet.fileNames.forEach(filename => {
		/** @type {Command} */
		const command = require(`./../commands/${filename}`);
		text += `### /${command.customId}\n${command.description}\n`;
		for (const optionData of command.data.options) {
			text += `#### ${optionData.name}${optionData.required ? "" : " (optional)"}\n${optionData.description}\n`;
		}
	})
})

fs.writeFile('wiki/Commands.md', text, (error) => {
	if (error) {
		console.error(error);
	}
});
