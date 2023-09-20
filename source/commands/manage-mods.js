const { PermissionFlagsBits } = require('discord.js');
const { CommandWrapper } = require('../classes');
const { modRoleId, addModerator, removeModerator } = require('../engines/permissionEngine.js');

const mainId = "manage-mods";
const options = [];
const subcomands = [
	{
		name: "promote",
		description: "(moderator) Add a user to the moderator list",
		optionsInput: [
			{ type: "User", name: "promotee", description: "The user's mention", required: true, choices: [] },
		]
	},
	{
		name: "demote",
		description: "(moderator) Remove a user from the moderator list",
		optionsInput: [
			{ type: "User", name: "demotee", description: "The user's mention", required: true, choices: [] }
		]
	}
];
module.exports = new CommandWrapper(mainId, "Promote/demote a user to moderator", PermissionFlagsBits.ManageGuild, false, 3000, options, subcomands,
	(interaction) => {
		const isPromote = interaction.options.getSubcommand() === "promote";
		const targetUser = interaction.options.getMember("promotee") ?? interaction.options.getMember("demotee");

		if (isPromote) {
			targetUser.roles.add(modRoleId).catch(error => console.error(`HorizonsBot lacks permissions to add roles to ${targetUser.displayName}, but internal state has been updated.`));
			addModerator(targetUser.id);
			interaction.reply(`${targetUser} has been promoted to Moderator.`)
				.catch(console.error);
		} else {
			targetUser.roles.remove(modRoleId).catch(error => console.error(`HorizonsBot lacks permissions to remove roles from ${targetUser.displayName}, but internal state has been updated.`));
			removeModerator(targetUser.id);
			interaction.reply(`${targetUser} has been demoted from Moderator.`)
				.catch(console.error);
		}
	}
);
