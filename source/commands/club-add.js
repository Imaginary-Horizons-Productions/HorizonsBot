const { PermissionFlagsBits: { ViewChannel, ManageMessages }, ChannelType, MessageFlags, PermissionFlagsBits } = require('discord.js');
const Command = require('../classes/Command.js');
const { Club } = require('../classes/Club.js');
const { updateClub, updateList } = require('../engines/referenceEngine.js');
const { clubEmbedBuilder } = require('../engines/messageEngine.js');
const { modRoleId } = require('../engines/permissionEngine.js');
const { voiceChannelOptions } = require('../constants.js');

const options = [
	{ type: "User", name: "club-host", description: "The user's mention", required: true, choices: [] },
	{ type: "String", name: "voice-channel-type", description: "Stage channels are visible to everyone", required: true, choices: [{ name: "stage", value: "stage" }, { name: "private", value: "private" }] }
];
const subcommands = [];
module.exports = new Command("club-add", "Set up a club (a text and voice channel)", false, PermissionFlagsBits.ManageChannels, 3000, options, subcommands);

/** Create a new club including a text and voice channel in the receiving channel's category and set the mentioned user as host
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = (interaction) => {
	const host = interaction.options.getUser("club-host");
	const voiceType = interaction.options.getString("voice-channel-type");
	const channelManager = interaction.guild.channels;
	const categoryId = interaction.channel.parentId;

	channelManager.create({
		name: "new-club",
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
			...voiceChannelOptions[voiceType](interaction.guild, modRoleId, host)
		}).then(voiceChannel => {
			const club = new Club(textChannel.id, host.id, voiceChannel.id, voiceType);
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
