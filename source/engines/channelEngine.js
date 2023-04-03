const { Collection } = require("discord.js");

// Collection <channelId, channelName>
let topics = new Collection();

/** Get the array of topic channel ids
 * @returns {string[]}
 */
exports.getTopicIds = function () {
	return Array.from(topics.keys());
}

/** Get the array of topic channel names
 * @returns {string[]}
 */
exports.getTopicNames = function () {
	return Array.from(topics.values());
}

/** Get the id of a topic channel with the given name
 * @param {string} channelName
 * @returns {string}
 */
exports.findTopicId = function (channelName) {
	return topics.findKey(checkedName => checkedName === channelName);
}

/** Add a new entry to the topic map
 * @param {string} id
 * @param {string} channelName
 */
exports.addTopic = function (id, channelName) {
	topics.set(id, channelName);
}

/** Clean up internal state to keep in sync with removing a topic channel
 * @param {string} channelId
 * @param {Guild} guild
 */
exports.removeTopic = function (channelId, guild) {
	topics.delete(channelId);
	exports.saveObject(exports.getTopicIds(), 'topicList.json');
	exports.updateList(guild.channels, "topics");
}
