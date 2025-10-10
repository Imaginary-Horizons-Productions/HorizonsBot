const { GuildMember } = require("discord.js");
const { ensuredPathSave } = require("../util/fileUtil");
const { getClub } = require("./referenceEngine");

let { modIds, noAts, modRoleId } = require("../../config/modData.json");

/** Save the modData object to file */
function saveModData() {
	ensuredPathSave({ modIds, noAts }, "modData.json");
}

/** Add a user's id to the list of moderator ids
 * @param {string} id
 */
function addModerator(id) {
	if (!modIds.some(existingId => existingId === id)) {
		modIds.push(id);
	}
	saveModData();
}

/** Remove a user's id from the list of moderator ids
 * @param {string} removedId
 */
function removeModerator(removedId) {
	modIds = modIds.filter(id => id != removedId);
	saveModData();
}

/** Determines if the member is a moderator or can manage the bot
 * @param {GuildMember} member
 */
function isModerator(member) {
	return modIds.includes(member.id) || !member.manageable;
}

/** Determines if the user is host of the club with the provided text channel
 * @param {string} channelId
 * @param {GuildMember} member
 */
function isClubHostOrModerator(channelId, member) {
	const club = getClub(channelId);
	return club && (club.hostId === member.id || isModerator(member));
}

module.exports = {
	saveModData,
	addModerator,
	removeModerator,
	modRoleId,
	noAts,
	isModerator,
	isClubHostOrModerator
};
