const { PermissionsBitField, MessageFlags, InteractionContextType } = require('discord.js');
const { CommandWrapper } = require('../classes');
const { updateClub, updateListReference, getClub } = require('../engines/referenceEngine.js');
const { isClubHostOrModerator } = require('../engines/permissionEngine.js');

const mainId = "club-kick";
module.exports = new CommandWrapper(mainId, "Remove a user from a club", null, [InteractionContextType.Guild], 3000,
	/** Remove visibility of receiving channel from mentioned user */
	(interaction) => {
		if (!isClubHostOrModerator(interaction.channelId, interaction.member)) {
			interaction.reply({ content: `\`/${interaction.commandName}\` can only be used by a moderator or a club host in the club's text channel.`, flags: MessageFlags.Ephemeral });
			return;
		}

		const club = getClub(interaction.channelId);
		const user = interaction.options.getUser("target");
		club.userIds = club.userIds.filter(memberId => memberId != user.id);
		updateListReference(interaction.guild.channels, "club");
		updateClub(club);
		if (interaction.options.getBoolean("ban")) {
			interaction.channel.permissionOverwrites.create(user.id, { [PermissionsBitField.Flags.ViewChannel]: false }, `Banned by ${interaction.user}`);
			interaction.reply({ content: `${user} has been banned from this club.`, flags: MessageFlags.SuppressNotifications })
				.catch(console.error);
		} else {
			interaction.channel.permissionOverwrites.delete(user, `Kicked by ${interaction.user}`);
			interaction.reply({ content: `${user} has been kicked from this club.`, flags: MessageFlags.SuppressNotifications })
				.catch(console.error);
		}
	}
).setOptions(
	{ type: "User", name: "target", description: "The user's mention", required: true, choices: [] },
	{ type: "Boolean", name: "ban", description: "Prevent the user from rejoining?", required: false, choices: [] }
);
