const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { guildId, topicCategoryId, testGuildId } = require('../config/auth.json');

module.exports = {
	// JS Constants
	MAX_SET_TIMEOUT: 2 ** 31 - 1,

	// Discord constants
	serverGuideMention: "<id:guide>",
	channelBrowserMention: "<id:customize>",
	discordIconURL: "https://cdn.discordapp.com/attachments/618523876187570187/1110265047516721333/discord-mark-blue.png",
	MAX_MESSAGE_CONTENT_LENGTH: 2000,
	MAX_EMBED_AUTHOR_NAME_LENGTH: 256,
	MAX_EMBED_TITLE_LENGTH: 256,
	MAX_EMBED_DESCRIPTION_LENGTH: 4096,
	MAX_EMBED_FIELD_COUNT: 25,
	MAX_EMBED_FIELD_NAME_LENGTH: 256,
	MAX_EMBED_FIELD_VALUE_LENGTH: 1024,
	MAX_EMBED_FOOTER_LENGTH: 2048,
	MAX_EMBED_TOTAL_CHARACTERS: 6000,
	MAX_EMBEDS_PER_MESSAGE: 10,
	MAX_MESSAGE_ACTION_ROWS: 5,
	MAX_BUTTONS_PER_ROW: 5,
	MAX_SELECT_OPTIONS: 25,

	// Config
	guildId,
	testGuildId,
	topicCategoryId,
	pluralKitId: "466378653216014359",
	commandIds: {},

	// Internal Convention
	SAFE_DELIMITER: "→",
	SKIP_INTERACTION_HANDLING: "❌",
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
