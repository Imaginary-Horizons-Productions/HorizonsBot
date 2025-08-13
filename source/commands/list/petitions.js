const { CommandInteraction, MessageFlags } = require("discord.js");
const { buildPetitionListPayload } = require("../../engines/referenceEngine");

/**
 * @param {CommandInteraction} interaction
 * @param {...unknown} args
 */
async function executeSubcommand(interaction, ...args) {
	const messageOptions = buildPetitionListPayload(interaction.guild.memberCount);
	messageOptions.flags |= MessageFlags.Ephemeral;
	interaction.reply(messageOptions);
};

module.exports = {
	data: {
		name: "petitions",
		description: "Get the list of open topic petitions"
	},
	executeSubcommand
};
