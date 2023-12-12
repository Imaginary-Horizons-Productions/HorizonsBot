const { CommandInteraction, MessageFlags } = require("discord.js");
const { saveModData, noAts } = require("../../engines/permissionEngine");

/**
 * @param {CommandInteraction} interaction
 * @param {[string]} args
 */
async function executeSubcommand(interaction, ...[userId]) {
	// Allow the given user from using /at-channel
	if (noAts.includes(userId)) {
		noAts.splice(noAts.findIndex(id => id === userId), 1);
		interaction.reply({ content: `@silent <@${userId}> can use \`/at-channel\` again.`, flags: MessageFlags.SuppressNotifications });
		saveModData();
	} else {
		interaction.reply({ content: `<@${userId}> is not restricted from using \`/at-channel\`.`, ephemeral: true });
	}
};

module.exports = {
	data: {
		name: "allow",
		description: "(moderator) Re-allow a user to use /at-channel",
		optionsInput: [
			{ type: "User", name: "user", description: "The user's mention", required: true, choices: [] }
		]
	},
	executeSubcommand
};
