const { CommandInteraction, MessageFlags } = require("discord.js");
const { saveModData, noAts } = require("../../engines/permissionEngine");

/**
 * @param {CommandInteraction} interaction
 * @param {[string]} args
 */
async function executeSubcommand(interaction, ...[userId]) {
	// Prevent the given user from using /at-channel
	if (!noAts.includes(userId)) {
		noAts.push(userId);
		interaction.reply({ content: `<@${userId}> can no longer use \`/at-channel\`.`, flags: MessageFlags.SuppressNotifications });
		saveModData();
	} else {
		interaction.reply({ content: `<@${userId}> is already restricted from using \`/at-channel\`.`, ephemeral: true });
	}
};

module.exports = {
	data: {
		name: "disallow",
		description: "(moderator) Prevent a user from using /at-channel",
		optionsInput: [
			{ type: "User", name: "user", description: "The user's mention", required: true, choices: [] }
		]
	},
	executeSubcommand
};
