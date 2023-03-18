const { GuildMember } = require("discord.js");
const { getTopicIds, getClubDictionary, isModerator } = require("../helpers");

/** Get the array of all club and topic text channel ids */
exports.getManagedChannels = function () {
	return getTopicIds().concat(Object.keys(getClubDictionary()));
}

/** Determines if the user is host of the club with the provided text channel
 * @param {string} channelId
 * @param {GuildMember} member
 */
exports.isClubHostOrModerator = function (channelId, member) {
	const club = getClubDictionary()[channelId];
	return club && (club.hostId === userId || isModerator(member));
}
