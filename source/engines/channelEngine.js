const { Collection, ChannelType } = require("discord.js");
const { updateList, saveObject, getPetitions, setPetitions } = require("../helpers");
const { topicCategoryId } = require("../constants.js");

/** Create a topic channel for a petition if it has enough ids
 * @param {Guild} guild
 * @param {string} topicName
 * @param {User} author
 * @returns {{petitions: number, threshold: number}}
 */
exports.checkPetition = function (guild, topicName, author = null) {
	let petitions = getPetitions();
	if (!petitions[topicName]) {
		petitions[topicName] = [];
	}
	if (author) {
		if (!petitions[topicName].includes(author.id)) {
			petitions[topicName].push(author.id);
		} else {
			author.send(`You have already petitioned for ${topicName}.`)
				.catch(console.error)
			return;
		}
	}
	const petitionCount = petitions[topicName].length ?? 0;
	const threshold = Math.ceil(guild.memberCount * 0.05) + 1;
	if (petitionCount >= threshold) {
		exports.addTopicChannel(guild, topicName);
	} else {
		setPetitions(petitions, guild.channels);
	}
	updateList(guild.channels, "petition");
	return {
		petitions: petitionCount,
		threshold
	}
}

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
		exports.addTopic(channel.id, channel.name);
		saveObject(exports.getTopicIds(), 'topicList.json');
		setPetitions(petitions, guild.channels);
		return channel;
	}).catch(console.error);
}
