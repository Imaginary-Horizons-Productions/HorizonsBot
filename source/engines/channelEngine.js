const { Collection } = require("discord.js");
const { updateList, saveObject, getPetitions, setPetitions } = require("../helpers");
const { topicCategoryId } = require("../constants.js");

// Collection <channelId, channelName>
const topics = new Collection();

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
	saveObject(exports.getTopicIds(), 'topicList.json');
	updateList(guild.channels, "petition");
}

/** Add the new topic channel topic list to prevent duplicate petitions
 * @param {Guild} guild
 * @param {string} topicName
 * @returns {Promise<TextChannel>}
 */
exports.addTopicChannel = function (guild, topicName) {
	return guild.channels.create({
		name: topicName,
		parent: topicCategoryId,
		type: ChannelType.GuildText
	}).then(channel => {
		const petitions = getPetitions();
		if (!petitions[topicName]) {
			petitions[topicName] = [];
		}

		if (petitions[topicName].length > 0) {
			channel.send(`This channel has been created thanks to: <@${petitions[topicName].join('> <@')}>`);
		}
		delete petitions[topicName];
		addTopic(channel.id, channel.name);
		saveObject(exports.getTopicIds(), 'topicList.json');
		setPetitions(petitions, guild.channels);
		return channel;
	}).catch(console.error);
}
