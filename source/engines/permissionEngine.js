const { GuildMember } = require("discord.js");
const { getModIds, getClubDictionary } = require("../helpers");
const { getTopicIds } = require("./channelEngine");

/** Get the array of all club and topic text channel ids */
exports.getManagedChannels = function () {
	return getTopicIds().concat(Object.keys(getClubDictionary()));
}

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
	return club && (club.hostId === userId || exports.isModerator(member));
}
