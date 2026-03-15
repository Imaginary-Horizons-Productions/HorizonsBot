const { ChannelType, MessageFlags, PermissionFlagsBits, InteractionContextType } = require('discord.js');
const { Club, CommandWrapper } = require('../classes');
const { updateClub, updateListReference } = require('../engines/referenceEngine.js');
const { clubEmbedBuilder } = require('../engines/messageEngine.js');
const { modRoleId, isModerator } = require('../engines/permissionEngine.js');
const { commandMention } = require('../util/textUtil.js');

const mainId = "club-add";
module.exports = new CommandWrapper(mainId, "Set up a club (a text and voice channel)", PermissionFlagsBits.ManageChannels, [InteractionContextType.Guild], 3000,
	/** Create a new club including a text and voice channel in the receiving channel's category and set the mentioned user as host */
	(interaction) => {
		if (!isModerator(interaction.member)) {
			interaction.reply(`\`/${interaction.commandName}\` is a moderator-only command.`);
			return;
		}

		const host = interaction.options.getUser("club-host");
		const channelManager = interaction.guild.channels;
		const categoryId = interaction.channel.parentId;

		channelManager.create({
			name: "new-club",
			parent: categoryId,
			permissionOverwrites: [
				{
					id: channelManager.client.user,
					allow: [PermissionFlagsBits.ViewChannel]
				},
				{
					id: modRoleId,
					allow: [PermissionFlagsBits.ViewChannel],
					type: 0
				},
				{
					id: interaction.guildId,
					deny: [PermissionFlagsBits.ViewChannel],
					type: 0
				},
				{
					id: host,
					allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ManageMessages, PermissionFlagsBits.PinMessages]
				},
				{
					id: "536330483852771348",
					allow: [PermissionFlagsBits.ViewChannel],
					type: 1
				}
			],
			type: ChannelType.GuildText
		}).then(textChannel => {
			channelManager.create({
				name: `New Club Voice`,
				parent: categoryId,
				type: ChannelType.GuildVoice,
				permissionOverwrites: [
					{
						id: interaction.guild.client.user,
						allow: [PermissionFlagsBits.ViewChannel]
					},
					{
						id: modRoleId,
						allow: [PermissionFlagsBits.ViewChannel],
						type: 0
					},
					{
						id: interaction.guild.id,
						deny: [PermissionFlagsBits.ViewChannel],
						type: 0
					},
					{
						id: host,
						allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageEvents]
					}
				]
			}).then(voiceChannel => {
				const club = new Club(textChannel.id, host.id, voiceChannel.id);
				textChannel.send({ content: `Welcome to your new club's text channel ${host}! As club host, you can pin and delete messages in this channel and configure various settings with ${commandMention("club-config")}.` });
				textChannel.send({ content: `When invites are sent with ${commandMention("club-invite")}, the invitee will be shown the following embed:`, embeds: [clubEmbedBuilder(club)], flags: MessageFlags.SuppressNotifications }).then(invitePreviewMessage => {
					invitePreviewMessage.pin();
					club.detailSummaryId = invitePreviewMessage.id;
					updateListReference(interaction.guild.channels, "club");
					updateClub(club);
				})
				interaction.reply({ content: "The new club has been created.", flags: MessageFlags.Ephemeral });
			}).catch(console.error);
		})
	}
).setOptions(
	{ type: "User", name: "club-host", description: "The user's mention", required: true }
);
