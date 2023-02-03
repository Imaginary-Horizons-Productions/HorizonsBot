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

	if (interaction.options.getSubcommand() === "promote") {
		// Add a Moderator: add to list, give role and channel permissions
		let promotee = interaction.options.getMember("promotee");
		if (!isModerator(promotee.id)) {
			promotee.roles.add(modRoleId).catch(error => console.error(`HorizonsBot lacks permissions to add roles to ${promotee.displayName}, but internal state has been updated.`));
			addModerator(promotee.id);
			interaction.reply(`${promotee} has been promoted to Moderator.`)
				.catch(console.error);
		} else {
			interaction.reply({ content: `${promotee} is already a Moderator.`, ephemeral: true })
				.catch(console.error);
		}
	} else if (interaction.options.getSubcommand() === "demote") {
		// Remove a Moderator: remove from list, remove role and channel permissions
		let demotee = interaction.options.getMember("demotee");
		if (isModerator(demotee.id)) {
			demotee.roles.remove(modRoleId).catch(error => console.error(`HorizonsBot lacks permissions to remove roles from ${demotee.displayName}, but internal state has been updated.`));
			removeModerator(demotee.id);
			interaction.reply(`${demotee} has been demoted from Moderator.`)
				.catch(console.error);
		} else {
			interaction.reply({ content: `${demotee} is already not a Moderator.`, ephemeral: true })
				.catch(console.error);
		}
	}
}
