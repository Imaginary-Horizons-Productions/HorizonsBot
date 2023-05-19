const { GuildMember } = require("discord.js");
const { saveObject } = require("../helpers");
const { getClubDictionary } = require("./referenceEngine");

const { modIds: moderatorIds, noAts, modRoleId } = require("../../config/modData.json");

/** Save the modData object to file
 */
exports.saveModData = function () {
	saveObject({ modIds: moderatorIds, noAts: exports.noAts }, "modData.json");
}

/** Add a user's id to the list of moderator ids
 * @param {string} id
 */
exports.addModerator = function (id) {
	if (!moderatorIds.some(existingId => existingId === id)) {
		moderatorIds.push(id);
	}
	exports.saveModData();
}

/** Remove a user's id from the list of moderator ids
 * @param {string} removedId
 */
exports.removeModerator = function (removedId) {
	moderatorIds = moderatorIds.filter(id => id != removedId);
	exports.saveModData();
}

/** @type {string} */
exports.modRoleId = modRoleId;
/** @type {string[]} */
exports.noAts = noAts;

/** Determines if the member is a moderator or can manage the bot
 * @param {GuildMember} member
 */
exports.isModerator = function (member) {
	return moderatorIds.includes(member.id) || !member.manageable;
}

/** Determines if the user is host of the club with the provided text channel
 * @param {string} channelId
 * @param {GuildMember} member
 */
exports.isClubHostOrModerator = function (channelId, member) {
	const club = getClubDictionary()[channelId];
	return club && (club.hostId === member.id || exports.isModerator(member));
}
