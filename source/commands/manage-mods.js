const Command = require('../classes/Command.js');
const { modRoleId, isModerator, addModerator, removeModerator } = require('../helpers.js');

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
module.exports = new Command("manage-mods", "(moderator) Promote/demote a user to moderator", true, options, subcomands);

/**
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = (interaction) => {
	if ((!isModerator(interaction.user.id) && interaction.member.manageable)) {
		interaction.reply({ content: `You must be a Moderator to use the \`${interaction.commandName}\` command.`, ephemeral: true })
			.catch(console.error);
		return;
	}

	const isPromote = interaction.options.getSubcommand() === "promote";
	const targetUser = interaction.options.getMember("promotee") ?? interaction.options.getMember("demotee");
	if (isPromote === isModerator(targetUser.id)) {
		interaction.reply({ content: `${targetUser} is already ${isPromote ? "" : "not "}a Moderator.`, ephemeral: true })
			.catch(console.error);
		return;
	}

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
