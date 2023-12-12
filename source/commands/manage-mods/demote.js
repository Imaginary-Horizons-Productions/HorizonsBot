const { CommandInteraction } = require("discord.js");
const { modRoleId, removeModerator } = require("../../engines/permissionEngine");

/**
 * @param {CommandInteraction} interaction
 * @param {...unknown} args
 */
async function executeSubcommand(interaction, ...args) {
	const targetUser = interaction.options.getMember("demotee");
	targetUser.roles.remove(modRoleId).catch(error => console.error(`HorizonsBot lacks permissions to remove roles from ${targetUser.displayName}, but internal state has been updated.`));
	removeModerator(targetUser.id);
	interaction.reply(`${targetUser} has been demoted from Moderator.`)
		.catch(console.error);
};

module.exports = {
	data: {
		name: "demote",
		description: "(moderator) Remove a user from the moderator list",
		optionsInput: [
			{ type: "User", name: "demotee", description: "The user's mention", required: true, choices: [] }
		]
	},
	executeSubcommand
};
