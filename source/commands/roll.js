const Command = require('../classes/Command.js');
const { getRollString } = require('../engines/rollEngine.js');

const options = [
	{ type: "String", name: "dice", description: "The dice to roll in #d# format", required: true, choices: [] },
	{
		type: "String", name: "display", description: "Choose output display option", required: false, choices: [
			{ name: "Result only", value: "simple" },
			{ name: "Compare to max total roll", value: "max" },
			{ name: "Result for each die", value: "individual" },
			{ name: "Compare each die to max roll", value: "verbose" }
		]
	},
	{ type: "String", name: "label", description: "Text after the roll", required: false, choices: [] },
];
const subcomands = [];
module.exports = new Command("roll", "Roll any number of dice with any number of sides", false, options, subcomands);

/** Roll the specified dice
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = (interaction) => {
	var rollInput = interaction.options.getString('dice');
	var label = interaction.options.getString('label');
	if (label) {
		rollInput = rollInput.concat(` ${label}`);
	}
	switch (interaction.options.getString('display')) {
		case "max":
			var rollResult = getRollString(rollInput, true, true);
			break;
		case "individual":
			var rollResult = getRollString(rollInput, false, false);
			break;
		case "verbose":
			var rollResult = getRollString(rollInput, true, false);
			break;
		default:
			var rollResult = getRollString(rollInput, false, true);
			break;
	}
	interaction.reply(`Roll Result:\n\`${rollResult}\``);
}
