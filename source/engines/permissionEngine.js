const { GuildMember } = require("discord.js");
const { getModIds, getClubDictionary } = require("../helpers");

/** Determines if the member is a moderator or can manage the bot
 * @param {GuildMember} member
 */
exports.isModerator = function (member) {
	return getModIds().includes(member.id) || !member.manageable;
}

/** Determines if the user is host of the club with the provided text channel
 * @param {string} channelId
 * @param {GuildMember} member
 */
exports.isClubHostOrModerator = function (channelId, member) {
	const club = getClubDictionary()[channelId];
	return club && (club.hostId === member.id || exports.isModerator(member));
}
