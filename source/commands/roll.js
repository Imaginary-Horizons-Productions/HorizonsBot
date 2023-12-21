const { MessageFlags, PermissionFlagsBits } = require('discord.js');
const { CommandWrapper } = require('../classes');
const { getRollString } = require('../engines/rollEngine.js');

const mainId = "roll";
module.exports = new CommandWrapper(mainId, "Roll any number of dice with any number of sides", PermissionFlagsBits.SendMessages, true, 3000,
	/** Roll the specified dice */
	(interaction) => {
		let rollInput = interaction.options.getString('dice');
		const label = interaction.options.getString('label');
		if (label) {
			rollInput = rollInput.concat(` ${label}`);
		}
		let rollResult;
		switch (interaction.options.getString('display')) {
			case "max":
				rollResult = getRollString(rollInput, true, true);
				break;
			case "individual":
				rollResult = getRollString(rollInput, false, false);
				break;
			case "verbose":
				rollResult = getRollString(rollInput, true, false);
				break;
			default:
				rollResult = getRollString(rollInput, false, true);
				break;
		}
		interaction.reply({ content: `Roll Result:\n\`${rollResult}\``, flags: MessageFlags.SuppressNotifications });
	}
).setOptions(
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
);
