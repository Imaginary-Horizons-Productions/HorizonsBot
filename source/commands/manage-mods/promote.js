const { CommandInteraction } = require("discord.js");
const { modRoleId, addModerator } = require("../../engines/permissionEngine");

/**
 * @param {CommandInteraction} interaction
 * @param {...unknown} args
 */
async function executeSubcommand(interaction, ...args) {
	const targetUser = interaction.options.getMember("promotee");
	targetUser.roles.add(modRoleId).catch(error => console.error(`HorizonsBot lacks permissions to add roles to ${targetUser.displayName}, but internal state has been updated.`));
	addModerator(targetUser.id);
	interaction.reply(`${targetUser} has been promoted to Moderator.`)
		.catch(console.error);
};

module.exports = {
	data: {
		name: "promote",
		description: "(moderator) Add a user to the moderator list",
		optionsInput: [
			{ type: "User", name: "promotee", description: "The user's mention", required: true, choices: [] },
		]
	},
	executeSubcommand
};
