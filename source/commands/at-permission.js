const { MessageFlags, PermissionFlagsBits } = require('discord.js');
const { CommandWrapper } = require('../classes/InteractionWrapper.js');
const { noAts, saveModData } = require('../engines/permissionEngine.js');

const mainId = "at-permission";
const options = [];
const subcomands = [
	{
		name: "disallow",
		description: "(moderator) Prevent a user from using /at-channel",
		optionsInput: [
			{ type: "User", name: "user", description: "The user's mention", required: true, choices: [] }
		]
	},
	{
		name: "allow",
		description: "(moderator) Re-allow a user to use /at-channel",
		optionsInput: [
			{ type: "User", name: "user", description: "The user's mention", required: true, choices: [] }
		]
	}
];
module.exports = new CommandWrapper(mainId, "Disallow/Re-allow a user to use /at-channel", PermissionFlagsBits.ManageRoles, false, 3000, options, subcomands,
	(interaction) => {
		const userId = interaction.options.getUser("user").id;
		if (interaction.options.getSubcommand() === "disallow") {
			// Prevent the given user from using /at-channel
			if (!noAts.includes(userId)) {
				noAts.push(userId);
				interaction.reply({ content: `<@${userId}> can no longer use \`/at-channel\`.`, flags: MessageFlags.SuppressNotifications });
				saveModData();
			} else {
				interaction.reply({ content: `<@${userId}> is already restricted from using \`/at-channel\`.`, ephemeral: true });
			}
		} else {
			// Allow the given user from using /at-channel
			if (noAts.includes(userId)) {
				noAts.splice(noAts.findIndex(id => id === userId), 1);
				interaction.reply({ content: `@silent <@${userId}> can use \`/at-channel\` again.`, flags: MessageFlags.SuppressNotifications });
				saveModData();
			} else {
				interaction.reply({ content: `<@${userId}> is not restricted from using \`/at-channel\`.`, ephemeral: true });
			}
		}
	}
);
