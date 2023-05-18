const { PermissionsBitField, MessageFlags } = require('discord.js');
const Command = require('../classes/Command.js');
const { updateList, updateClub, getClubDictionary } = require('../helpers.js');

const id = "club-kick";
const options = [
	{ type: "User", name: "target", description: "The user's mention", required: true, choices: [] },
	{ type: "Boolean", name: "ban", description: "Prevent the user from rejoining?", required: false, choices: [] }
];
const subcomands = [];
module.exports = new Command(id, "Remove a user from a club", "moderator/club host", options, subcomands);

/** Remove visibility of receiving channel from mentioned user
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = (interaction) => {
	const club = getClubDictionary()[interaction.channelId];
	if (!club) {
		interaction.reply(`Please use the \`/${id}\` command from the club's text channel.`)
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
