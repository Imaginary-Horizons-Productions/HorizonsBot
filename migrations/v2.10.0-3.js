const { Client, GatewayIntentBits, Events, ActivityType, ChannelType, PermissionFlagsBits, OverwriteType } = require("discord.js");
const { getClubDictionary, updateClub } = require("../source/engines/referenceEngine");
const { guildId } = require("../source/constants");
const { modRoleId } = require("../source/engines/permissionEngine");

const client = new Client({
	retryLimit: 5,
	presence: {
		activities: [{
			type: ActivityType.Custom,
			name: "Migrating Club Voice Channels to new format"
		}]
	},
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const authPath = "../config/auth.json";

client.login(require(authPath).token)
	.catch(console.error);

client.on(Events.ClientReady, async () => {
	console.log(`Connected as ${client.user.tag} for migration v2.10.0-3`);
	const guild = await client.guilds.fetch(guildId);
	for (const club of Object.values(getClubDictionary())) {
		const auditLogReason = `migration v2.10.0-3 for ${club.name}`;
		const clubVoiceChannel = await guild.channels.fetch(club.voiceChannelId);
		if (clubVoiceChannel && clubVoiceChannel.type === ChannelType.GuildStageVoice) {
			clubVoiceChannel.delete();
		}

		const memberRole = await guild.roles.create({ name: `${clubName} Member`, reason: auditLogReason });
		club.roleId = memberRole.id;

		for (const userId of [club.hostId, ...club.userIds]) {
			guild.members.addRole({ user: userId, role: memberRole, reason: auditLogReason });
		}
		delete club.userIds;

		const textChannel = await guild.channels.edit(club.id, {
			permissionOverwrites: [
				{
					id: client.user,
					allow: [PermissionFlagsBits.ViewChannel]
				},
				{
					id: modRoleId,
					type: OverwriteType.Role,
					allow: [PermissionFlagsBits.ViewChannel]
				},
				{
					id: guild.id,
					type: OverwriteType.Role,
					deny: [PermissionFlagsBits.ViewChannel]
				},
				{
					id: "536330483852771348", // BountyBot
					type: OverwriteType.Member,
					allow: [PermissionFlagsBits.ViewChannel]
				},
				{
					id: club.hostId,
					allow: [PermissionFlagsBits.PinMessages]
				},
				{
					id: memberRole,
					type: OverwriteType.Role,
					allow: [PermissionFlagsBits.ViewChannel]
				}
			],
			reason: auditLogReason
		});

		const voiceChannel = await guild.channels.create({
			name: `${club.name} Voice`,
			parent: textChannel.parentId,
			type: ChannelType.GuildVoice,
			permissionOverwrites: [
				{
					id: guild.id,
					deny: [PermissionFlagsBits.Speak],
					type: OverwriteType.Role
				},
				{
					id: club.hostId,
					allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageEvents]
				},
				{
					id: memberRole,
					allow: [PermissionFlagsBits.Speak]
				}
			],
			reason: auditLogReason
		});
		club.voiceChannelId = voiceChannel.id;

		club.bannedUserIds = [];

		updateClub(club);
	}
	client.destroy();
})
