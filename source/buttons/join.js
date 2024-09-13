const { PermissionsBitField, Message } = require('discord.js');
const { ButtonWrapper } = require('../classes');
const { guildId } = require('../constants.js');
const { updateClubDetails } = require('../engines/clubEngine.js');
const { updateListReference, getClubDictionary } = require('../engines/referenceEngine.js');

const mainId = "join";
module.exports = new ButtonWrapper(mainId, 3000,
	/** Join the club specified in args */
	(interaction, [channelId]) => {
		clearComponents(interaction.message);
		const club = getClubDictionary()[channelId];
		if (!club) {
			interaction.reply("This club doesn't seem to exist.");
			return;
		}

		if (club.hostId === interaction.user.id || club.userIds.includes(interaction.user.id)) {
			interaction.reply(`You are already in ${club.title}.`);
			return;
		}

		if (club.seats !== -1 && !club.isRecruiting()) {
			interaction.reply(`${club.title} is already full.`);
			return;
		}

		interaction.client.guilds.fetch(guildId).then(guild => {
			guild.channels.fetch(channelId).then(clubChannel => {
				const userId = interaction.user.id;
				const { permissionOverwrites, guild, name: channelName } = clubChannel;
				const permissionOverwrite = permissionOverwrites.resolve(userId);
				if (!permissionOverwrite?.deny.has(PermissionsBitField.Flags.ViewChannel, false)) {
					club.userIds.push(userId);
					permissionOverwrites.create(interaction.user, {
						[PermissionsBitField.Flags.ViewChannel]: true
					}).then(() => {
						if (club.voiceType === "private") {
							guild.channels.resolve(club.voiceChannelId).permissionOverwrites.create(interaction.user, {
								[PermissionsBitField.Flags.ViewChannel]: true
							})
						}
						clubChannel.send(`Welcome to ${channelName}, ${interaction.user}!`);
					})
					updateClubDetails(club, clubChannel);
					updateListReference(guild.channels, "club");
					interaction.reply(`You have joined ${clubChannel}!`);
				} else {
					interaction.reply(`You are currently banned from ${channelName}. Speak to a Moderator if you believe this is in error.`);
				}
			});
		})
	}
);

/** @param {Message} message */
function clearComponents(message) {
	message.edit({ components: [] }).catch(error => {
		if (error.code === "ChannelNotCached") {
			message.client.channels.fetch(message.interaction.channelId).then(channel => {
				message.edit({ components: [] });
			});
		} else {
			console.error(error);
		}
	});
}
