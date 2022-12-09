const { Interaction, PermissionFlagsBits: { ViewChannel, ManageMessages, ManageChannels, ManageEvents }, ChannelType } = require('discord.js');
const Command = require('../classes/Command.js');
const { Club } = require('../classes/Club.js');
const { isModerator, modRoleId, updateClub, clubInviteBuilder, updateList } = require('../helpers.js');

const options = [{ type: "User", name: "club-leader", description: "The user's mention", required: true, choices: [] }]
const subcommands = [];
module.exports = new Command("club-add", "(moderator) Set up a club (a text and voice channel)", true, options, subcommands);

/** Create a new club including a text and voice channel in the receiving channel's category and set the mentioned user as host
 * @param {Interaction} interaction
 */
module.exports.execute = (interaction) => {
	if (isModerator(interaction.user.id)) {
		let host = interaction.options.getUser("club-leader");
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
				const { embed } = clubInviteBuilder(club, false);
				textChannel.send({ content: "When invites are sent with \`/club-invite\`, the invitee will be shown the following embed:", embeds: [embed], fetchReply: true }).then(invitePreviewMessage => {
					invitePreviewMessage.pin();
					club.detailSummaryId = invitePreviewMessage.id;
					updateList(interaction.guild.channels, "clubs");
					updateClub(club);
				})
				interaction.reply({ content: "The new club has been created.", ephemeral: true });
			}).catch(console.error);
		})
	} else {
		interaction.reply({ content: `Creating new clubs is restricted to Moderators.`, ephemeral: true })
			.catch(console.error);
	}
}
