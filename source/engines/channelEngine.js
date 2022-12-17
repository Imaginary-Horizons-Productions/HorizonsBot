/** Get the array of all club and topic text channel ids
 * @returns {string[]}
 */
exports.getManagedChannels = function () {
	return exports.getTopicIds().concat(Object.keys(exports.getClubDictionary()));
}
