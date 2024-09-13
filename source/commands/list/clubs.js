const { CommandInteraction } = require("discord.js");
const { buildClubListPayload } = require("../../engines/referenceEngine");

/**
 * @param {CommandInteraction} interaction
 * @param {...unknown} args
 */
async function executeSubcommand(interaction, ...args) {
	buildClubListPayload().then(messageOptions => {
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
