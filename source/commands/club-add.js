const { PermissionFlagsBits: { ViewChannel, ManageMessages, ManageChannels, ManageEvents }, ChannelType, MessageFlags } = require('discord.js');
const Command = require('../classes/Command.js');
const { Club } = require('../classes/Club.js');
const { updateClub, updateList } = require('../engines/referenceEngine.js');
const { clubEmbedBuilder } = require('../engines/messageEngine.js');
const { modRoleId } = require('../engines/permissionEngine.js');

const options = [{ type: "User", name: "club-host", description: "The user's mention", required: true, choices: [] }]
const subcommands = [];
module.exports = new Command("club-add", "Set up a club (a text and voice channel)", false, "moderator", 3000, options, subcommands);

/** Create a new club including a text and voice channel in the receiving channel's category and set the mentioned user as host
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = (interaction) => {
	let host = interaction.options.getUser("club-host");
	let channelManager = interaction.guild.channels;
	let categoryId = interaction.channel.parentId;

	channelManager.create({
		name: "new-club-text",
		parent: categoryId,
		permissionOverwrites: [
			{
				id: channelManager.client.user,
				allow: [ViewChannel]
			},
			{
				id: modRoleId,
				allow: [ViewChannel],
				type: 0
			},
			{
				id: interaction.guildId,
				deny: [ViewChannel],
				type: 0
			},
			{
				id: host,
				allow: [ViewChannel, ManageMessages]
			},
			{
				id: "536330483852771348",
				allow: [ViewChannel],
				type: 1
			}
		],
		type: ChannelType.GuildText
	}).then(textChannel => {
		channelManager.create({
			name: "New Club Voice",
			parent: categoryId,
			permissionOverwrites: [
				{
					id: channelManager.client.user,
					allow: [ViewChannel]
				},
				{
					id: modRoleId,
					allow: [ViewChannel],
					type: 0
				},
				{
					id: interaction.guildId,
					deny: [ViewChannel],
					type: 0
				},
				{
					id: host,
					allow: [ViewChannel, ManageChannels, ManageEvents]
				}
			],
			type: ChannelType.GuildVoice
		}).then(voiceChannel => {
			const club = new Club(textChannel.id, host.id, voiceChannel.id);
			textChannel.send({ content: `Welcome to your new club's text channel ${host}! As club host, you can pin and delete messages in this channel and configure various settings with \`/club-config\`.` });
			textChannel.send({ content: "When invites are sent with \`/club-invite\`, the invitee will be shown the following embed:", embeds: [clubEmbedBuilder(club)], fetchReply: true, flags: MessageFlags.SuppressNotifications }).then(invitePreviewMessage => {
				invitePreviewMessage.pin();
				club.detailSummaryId = invitePreviewMessage.id;
				updateList(interaction.guild.channels, "club");
				updateClub(club);
			})
			interaction.reply({ content: "The new club has been created.", ephemeral: true });
		}).catch(console.error);
	})
}
