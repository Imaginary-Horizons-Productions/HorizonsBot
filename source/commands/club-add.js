const { ChannelType, MessageFlags, PermissionFlagsBits, InteractionContextType, OverwriteType } = require('discord.js');
const { Club, CommandWrapper } = require('../classes');
const { updateClub, updateListReference } = require('../engines/referenceEngine.js');
const { modRoleId, isModerator } = require('../engines/permissionEngine.js');
const { commandMention } = require('../util/textUtil.js');

const mainId = "club-add";
module.exports = new CommandWrapper(mainId, "Set up a club (a text and voice channel)", PermissionFlagsBits.ManageChannels, [InteractionContextType.Guild], 3000,
	/** Create a new club including a text and voice channel in the receiving channel's category and set the mentioned user as host */
	async (interaction) => {
		if (!isModerator(interaction.member)) {
			interaction.reply(`\`/${interaction.commandName}\` is a moderator-only command.`);
			return;
		}

		const auditLogReason = `new club created by moderator (id: ${interaction.user.id})`;
		const host = interaction.options.getMember("club-host");
		const clubName = interaction.options.getString("club-name") ?? "New Club";

		const memberRole = await interaction.guild.roles.create({ name: `${clubName} Member`, reason: auditLogReason });

		const categoryId = interaction.channel.parentId;
		const textChannel = await interaction.guild.channels.create({
			name: clubName.toLocaleLowerCase().replaceAll(/ /g, "-"),
			parent: categoryId,
			permissionOverwrites: [
				{
					id: interaction.client.user,
					allow: [PermissionFlagsBits.ViewChannel]
				},
				{
					id: modRoleId,
					type: OverwriteType.Role,
					allow: [PermissionFlagsBits.ViewChannel]
				},
				{
					id: interaction.guildId,
					type: OverwriteType.Role,
					deny: [PermissionFlagsBits.ViewChannel]
				},
				{
					id: host,
					allow: [PermissionFlagsBits.PinMessages]
				},
				{
					id: memberRole,
					type: OverwriteType.Role,
					allow: [PermissionFlagsBits.ViewChannel]
				}
			],
			type: ChannelType.GuildText,
			reason: auditLogReason
		});
		const voiceChannel = await interaction.guild.channels.create({
			name: `${clubName} Voice`,
			parent: categoryId,
			type: ChannelType.GuildVoice,
			permissionOverwrites: [
				{
					id: interaction.guild.id,
					deny: [PermissionFlagsBits.Speak],
					type: OverwriteType.Role
				},
				{
					id: memberRole,
					allow: [PermissionFlagsBits.Speak]
				}
			],
			reason: auditLogReason
		});
		const club = new Club(textChannel.id, clubName, memberRole.id, host.id, voiceChannel.id);
		host.send({ content: `A club has been created for you on ${voiceChannel.guild.name}! As club host, you can pin messages in the club's text channel and configure the club's settings with \`/club-config\`.` });
		host.roles.add(memberRole, auditLogReason);
		textChannel.send({ content: `When invites are sent with ${commandMention("club-invite")}, the invitee will be shown the following summary:` });
		const detailSummary = await textChannel.send({ components: [club.asContainer("info", 1)], flags: MessageFlags.SuppressNotifications | MessageFlags.IsComponentsV2 })
		detailSummary.pin();
		club.detailSummaryId = detailSummary.id;
		updateListReference(interaction.guild.channels, "club");
		updateClub(club);
		interaction.reply({ content: `The new club (${textChannel}) has been created.`, flags: MessageFlags.Ephemeral });
	}
).setOptions(
	{ type: "User", name: "club-host", description: "The user's mention", required: true },
	{ type: "String", name: "club-name", description: "A name for the new club", required: false }
);
