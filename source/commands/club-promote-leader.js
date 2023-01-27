const { PermissionFlagsBits } = require('discord.js');
const Command = require('../classes/Command.js');
const { isModerator, getClubDictionary, updateClub, updateList, updateClubDetails } = require('../helpers.js');

const options = [{ type: "User", name: "user", description: "The user's mention", required: true, choices: [] }];
const subcommands = [];
module.exports = new Command("club-promote-leader", "(club leader or moderator) Promote another user to club leader", true, options, subcommands);

/** Set the decription for the receiving club channel
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = (interaction) => {
	const club = getClubDictionary()[interaction.channelId];
	if (club) {
		if (isModerator(interaction.user.id) || interaction.user.id === club.hostId) {
			let promotee = interaction.options.getUser("user");
			club.hostId = promotee.id;
			interaction.channel.permissionOverwrites.edit(interaction.user, { [PermissionFlagsBits.ViewChannel]: true, [PermissionFlagsBits.ManageMessages]: null }, { type: 1 })
			interaction.channel.permissionOverwrites.edit(promotee, { [PermissionFlagsBits.ViewChannel]: true, [PermissionFlagsBits.ManageMessages]: true }, { type: 1 })
			interaction.guild.channels.fetch(club.voiceChannelId).then(voiceChannel => {
				voiceChannel.permissionOverwrites.edit(interaction.user, { [PermissionFlagsBits.ViewChannel]: true, [PermissionFlagsBits.ManageChannels]: null, [PermissionFlagsBits.ManageEvents]: null }, { type: 1 });
				voiceChannel.permissionOverwrites.edit(promotee, { [PermissionFlagsBits.ViewChannel]: true, [PermissionFlagsBits.ManageChannels]: true, [PermissionFlagsBits.ManageEvents]: true }, { type: 1 });
			})
			interaction.reply(`${promotee} has been promoted to leader of this club.`)
				.catch(console.error);
			updateClubDetails(club, interaction.channel);
			updateList(interaction.guild.channels, "clubs");
			updateClub(club);
		} else {
			interaction.reply({ content: `Promoting a club leader is restricted to the current club leader and Moderators.`, ephemeral: true })
				.catch(console.error);
		}
	} else {
		interaction.reply({ content: `Please promote club leaders from the club channel.`, ephemeral: true })
			.catch(console.error);
	}
}
