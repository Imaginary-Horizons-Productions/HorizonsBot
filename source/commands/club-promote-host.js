const { PermissionFlagsBits, InteractionContextType, MessageFlags } = require('discord.js');
const { CommandWrapper } = require('../classes/InteractionWrapper.js');
const { updateClubDetails } = require('../engines/clubEngine.js');
const { updateClub, updateListReference, getClub } = require('../engines/referenceEngine.js');
const { isClubHostOrModerator } = require('../engines/permissionEngine.js');

const mainId = "club-update-host";
module.exports = new CommandWrapper(mainId, "Promote another user to club host", null, [InteractionContextType.Guild], 3000,
	/** Update the club's host to the given user */
	(interaction) => {
		if (!isClubHostOrModerator(interaction.channelId, interaction.member)) {
			interaction.reply({ content: `\`/${interaction.commandName}\` can only be used by a moderator or a club host in the club's text channel.`, flags: MessageFlags.Ephemeral });
			return;
		}

		const club = getClub(interaction.channelId);
		const newHost = interaction.options.getUser("user");
		club.hostId = newHost.id;
		interaction.channel.permissionOverwrites.edit(interaction.user, { [PermissionFlagsBits.ViewChannel]: true, [PermissionFlagsBits.ManageMessages]: null }, { type: 1 })
		interaction.channel.permissionOverwrites.edit(newHost, { [PermissionFlagsBits.ViewChannel]: true, [PermissionFlagsBits.ManageMessages]: true }, { type: 1 })
		if (club.voiceType === "private") {
			interaction.guild.channels.fetch(club.voiceChannelId).then(voiceChannel => {
				voiceChannel.permissionOverwrites.edit(interaction.user, { [PermissionFlagsBits.ViewChannel]: true, [PermissionFlagsBits.ManageChannels]: null, [PermissionFlagsBits.ManageEvents]: null }, { type: 1 });
				voiceChannel.permissionOverwrites.edit(newHost, { [PermissionFlagsBits.ViewChannel]: true, [PermissionFlagsBits.ManageChannels]: true, [PermissionFlagsBits.ManageEvents]: true }, { type: 1 });
			})
		}
		interaction.reply(`This club is now hosted by ${newHost}.`)
			.catch(console.error);
		updateClubDetails(club, interaction.channel);
		updateListReference(interaction.guild.channels, "club");
		updateClub(club);
	}
).setOptions(
	{ type: "User", name: "user", description: "The user's mention", required: true, choices: [] }
);
