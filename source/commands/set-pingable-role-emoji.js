const { PermissionFlagsBits } = require('discord.js');
const { CommandWrapper } = require('../classes/index.js');
const { setPingableRoleEmoji, isPingableRoleId, updateOnboarding } = require('../engines/customizationEngine.js');
const { isAnyDiscordEmoji } = require('../util/textUtil.js');

const mainId = "set-pingable-role-emoji";
module.exports = new CommandWrapper(mainId, "Set the emoji show with a Pingable Role in Onboarding", PermissionFlagsBits.ManageRoles, false, 3000,
	(interaction) => {
		const roleId = interaction.options.getString("role-id");
		if (!isPingableRoleId(roleId)) {
			interaction.reply({ content: `**${roleId}** is not the id of a Pingable Role.`, ephemeral: true });
			return;
		}
		const emoji = interaction.options.getString("emoji");
		if (!isAnyDiscordEmoji(emoji)) {
			interaction.reply({ content: `**${emoji}** is not a valid Discord emoji.`, ephemeral: true });
			return;
		}
		setPingableRoleEmoji(roleId, emoji, interaction.guild);
		interaction.reply({ content: `<@&${roleId}>'s emoji in the onboarding question has been set to ${emoji}.`, ephemeral: true });
		updateOnboarding(interaction.guild);
	}
).setOptions(
	{
		type: "String",
		name: "role-id",
		description: "The role to update in onboarding",
		required: true
	},
	{
		type: "String",
		name: "emoji",
		description: "The emoji to add",
		required: true
	}
);
