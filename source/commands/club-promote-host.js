const { PermissionFlagsBits } = require('discord.js');
const Command = require('../classes/Command.js');
const { getClubDictionary, updateClub, updateList, updateClubDetails } = require('../helpers.js');

const options = [{ type: "User", name: "user", description: "The user's mention", required: true, choices: [] }];
const subcommands = [];
module.exports = new Command("club-update-host", "Promote another user to club host", "moderator/club host", options, subcommands);

/** Update the club's host to the given user
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = (interaction) => {
	const club = getClubDictionary()[interaction.channelId];
	const newHost = interaction.options.getUser("user");
	club.hostId = newHost.id;
	interaction.channel.permissionOverwrites.edit(interaction.user, { [PermissionFlagsBits.ViewChannel]: true, [PermissionFlagsBits.ManageMessages]: null }, { type: 1 })
	interaction.channel.permissionOverwrites.edit(newHost, { [PermissionFlagsBits.ViewChannel]: true, [PermissionFlagsBits.ManageMessages]: true }, { type: 1 })
	interaction.guild.channels.fetch(club.voiceChannelId).then(voiceChannel => {
		voiceChannel.permissionOverwrites.edit(interaction.user, { [PermissionFlagsBits.ViewChannel]: true, [PermissionFlagsBits.ManageChannels]: null, [PermissionFlagsBits.ManageEvents]: null }, { type: 1 });
		voiceChannel.permissionOverwrites.edit(newHost, { [PermissionFlagsBits.ViewChannel]: true, [PermissionFlagsBits.ManageChannels]: true, [PermissionFlagsBits.ManageEvents]: true }, { type: 1 });
	})
	interaction.reply(`This club is now hosted by ${newHost}.`)
		.catch(console.error);
	updateClubDetails(club, interaction.channel);
	updateList(interaction.guild.channels, "club");
	updateClub(club);
}
