const { PermissionFlagsBits, InteractionContextType, MessageFlags, OverwriteType } = require('discord.js');
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
		const auditLogReason = `club host changed from id: ${interaction.user.id} to id: ${newHost.id}`;
		club.hostId = newHost.id;
		interaction.channel.permissionOverwrites.delete(interaction.user, auditLogReason);
		interaction.channel.permissionOverwrites.create(newHost, { [PermissionFlagsBits.ManageMessages]: true, [PermissionFlagsBits.PinMessages]: true }, { reason: auditLogReason, type: OverwriteType.Member });
		interaction.guild.channels.fetch(club.voiceChannelId).then(voiceChannel => {
			voiceChannel.permissionOverwrites.delete(interaction.user, auditLogReason);
			voiceChannel.permissionOverwrites.create(newHost, { [PermissionFlagsBits.ManageChannels]: true, [PermissionFlagsBits.ManageEvents]: true }, { reason: auditLogReason, type: OverwriteType.Member });
		})
		interaction.reply(`This club is now hosted by ${newHost}.`)
			.catch(console.error);
		updateClubDetails(club, interaction.channel);
		updateListReference(interaction.guild.channels, "club");
		updateClub(club);
	}
).setOptions(
	{ type: "User", name: "user", description: "The user's mention", required: true, choices: [] }
);
