const { PermissionsBitField } = require('discord.js');
const Command = require('../classes/Command.js');
const { getManagedChannels } = require('../engines/permissionEngine.js');
const { updateList, updateClub, getClubDictionary } = require('../helpers.js');

const options = [
	{ type: "User", name: "target", description: "The user's mention", required: true, choices: [] },
	{ type: "Boolean", name: "ban", description: "Prevent the user from rejoining?", required: false, choices: [] }
];
const subcomands = [];
module.exports = new Command("remove-user", "Remove a user from a topic or club", "moderator", options, subcomands);

/** Remove visibility of receiving channel from mentioned user
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = (interaction) => {
	if (!getManagedChannels().includes(interaction.channelId)) {
		interaction.reply(`Please use the \`remove-user\` command from a topic or club channel.`)
			.catch(console.error);
		return;
	}
	const user = interaction.options.getUser("target");
	const club = getClubDictionary()[interaction.channelId];
	if (club) {
		club.userIds = club.userIds.filter(memberId => memberId != user.id);
		updateList(interaction.guild.channels, "clubs");
		updateClub(club);
	}
	if (interaction.options.getBoolean("ban")) {
		interaction.channel.permissionOverwrites.create(user.id, { [PermissionsBitField.Flags.ViewChannel]: false }, `Banned by ${interaction.user}`);
		interaction.reply(`${user} has been banned from this channel.`)
			.catch(console.error);
	} else {
		interaction.channel.permissionOverwrites.delete(user, `Kicked by ${interaction.user}`);
		interaction.reply(`${user} has been kicked from this channel.`)
			.catch(console.error);
	}
}
