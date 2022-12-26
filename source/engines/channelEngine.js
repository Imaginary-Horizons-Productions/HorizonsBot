const { getTopicIds, getClubDictionary } = require("../helpers");

/** Get the array of all club and topic text channel ids
 * @returns {string[]}
 */
exports.getManagedChannels = function () {
	return getTopicIds().concat(Object.keys(getClubDictionary()));
}
