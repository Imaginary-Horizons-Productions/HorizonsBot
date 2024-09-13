const { CommandInteraction } = require("discord.js");
const { buildPetitionListPayload } = require("../../engines/referenceEngine");

/**
 * @param {CommandInteraction} interaction
 * @param {...unknown} args
 */
async function executeSubcommand(interaction, ...args) {
	buildPetitionListPayload(interaction.guild.memberCount).then(messageOptions => {
		messageOptions.ephemeral = true;
		interaction.reply(messageOptions);
	}).catch(console.error);
};

module.exports = {
	data: {
		name: "petitions",
		description: "Get the list of open topic petitions"
	},
	executeSubcommand
};
