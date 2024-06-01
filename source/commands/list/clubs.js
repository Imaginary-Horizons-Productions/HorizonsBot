const { CommandInteraction } = require("discord.js");
const { buildListMessagePayload } = require("../../engines/referenceEngine");

/**
 * @param {CommandInteraction} interaction
 * @param {...unknown} args
 */
async function executeSubcommand(interaction, ...args) {
	buildListMessagePayload(interaction.guild.memberCount, "club").then(messageOptions => {
		messageOptions.ephemeral = true;
		interaction.reply(messageOptions);
	}).catch(console.error);
};

module.exports = {
	data: {
		name: "clubs",
		description: "Get the list of clubs on the server"
	},
	executeSubcommand
};
