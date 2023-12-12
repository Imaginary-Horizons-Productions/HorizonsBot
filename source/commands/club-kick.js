const { PermissionsBitField, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { CommandWrapper } = require('../classes');
const { getClubDictionary, updateClub, updateList } = require('../engines/referenceEngine.js');

const mainId = "club-kick";
module.exports = new CommandWrapper(mainId, "Remove a user from a club", PermissionFlagsBits.ManageMessages, false, 3000,
	/** Remove visibility of receiving channel from mentioned user */
	(interaction) => {
		const club = getClubDictionary()[interaction.channelId];
		if (!club) {
			interaction.reply(`Please use the \`/${mainId}\` command from the club's text channel.`)
				.catch(console.error);
			return;
		}

		const user = interaction.options.getUser("target");
		club.userIds = club.userIds.filter(memberId => memberId != user.id);
		updateList(interaction.guild.channels, "club");
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
