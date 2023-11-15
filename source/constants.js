const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { guildId, topicCategoryId } = require('../config/auth.json');

module.exports = {
	// JS Constants
	MAX_SET_TIMEOUT: 2 ** 31 - 1,

	// Discord constants
	discordIconURL: "https://cdn.discordapp.com/attachments/618523876187570187/1110265047516721333/discord-mark-blue.png",

	// Config
	guildId,
	topicCategoryId,

	// Internal Convention
	SAFE_DELIMITER: "→",
	imaginaryHorizonsIconURL: "https://cdn.discordapp.com/icons/353575133157392385/c78041f52e8d6af98fb16b8eb55b849a.png",
	voiceChannelOptions: {
		"private": (guild, modRoleId, host) => ({
			type: ChannelType.GuildVoice,
			permissionOverwrites: [
				{
					id: guild.client.user,
					allow: [PermissionFlagsBits.ViewChannel]
				},
				{
					id: modRoleId,
					allow: [PermissionFlagsBits.ViewChannel],
					type: 0
				},
				{
					id: guild.id,
					deny: [PermissionFlagsBits.ViewChannel],
					type: 0
				},
				{
					id: host,
					allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageEvents]
				}
			]
		}),
		"stage": (guild, modRoleId, host) => ({
			type: ChannelType.GuildStageVoice,
			permissionOverwrites: [
				{
					id: host,
					allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageEvents]
				}
			]
		})
	}
};
