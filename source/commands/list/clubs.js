const { CommandInteraction, MessageFlags } = require("discord.js");
const { buildClubListPayload } = require("../../engines/referenceEngine");

/**
 * @param {CommandInteraction} interaction
 * @param {...unknown} args
 */
async function executeSubcommand(interaction, ...args) {
	const messageOptions = buildClubListPayload();
	messageOptions.flags |= MessageFlags.Ephemeral;
	interaction.reply(messageOptions);

};

module.exports = {
	data: {
		name: "clubs",
		description: "Get the list of clubs on the server"
	},
	executeSubcommand
};
