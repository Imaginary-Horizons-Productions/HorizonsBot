const { MessageFlags, PermissionFlagsBits, InteractionContextType } = require('discord.js');
const { CommandWrapper } = require('../classes');
const { getRollString } = require('../engines/rollEngine.js');

const mainId = "roll";
module.exports = new CommandWrapper(mainId, "Roll any number of dice with any number of sides", PermissionFlagsBits.SendMessages, [InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel], 3000,
	/** Roll the specified dice */
	(interaction) => {
		let rollInput = interaction.options.getString('dice');
		const label = interaction.options.getString('label');
		if (label) {
			rollInput = rollInput.concat(` ${label}`);
		}
		try {
			switch (interaction.options.getString('display')) {
				case "max":
					interaction.reply({ content: `Roll Result:\n\`${getRollString(rollInput, true, true)}\``, flags: MessageFlags.SuppressNotifications });
					break;
				case "individual":
					interaction.reply({ content: `Roll Result:\n\`${getRollString(rollInput, false, false)}\``, flags: MessageFlags.SuppressNotifications });
					break;
				case "verbose":
					interaction.reply({ content: `Roll Result:\n\`${getRollString(rollInput, true, false)}\``, flags: MessageFlags.SuppressNotifications });
					break;
				default:
					interaction.reply({ content: `Roll Result:\n\`${getRollString(rollInput, false, true)}\``, flags: MessageFlags.SuppressNotifications });
					break;
			}
		} catch (error) {
			if (typeof error === "string") {
				interaction.reply({ content: error, flags: MessageFlags.Ephemeral });
			} else {
				console.error(error);
				interaction.reply({ content: `An error was encountered with your roll string of: ${rollInput}`, flags: MessageFlags.Ephemeral });
			}
		}
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
