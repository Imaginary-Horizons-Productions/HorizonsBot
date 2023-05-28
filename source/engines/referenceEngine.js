const { GuildChannelManager, Guild, User, Collection, ChannelType, ActionRowBuilder, StringSelectMenuBuilder, Message, MessageFlags } = require('discord.js');
const { Club, ClubTimeslot } = require("../classes/Club.js");
const { topicCategoryId } = require('../constants');
const { saveObject } = require('../helpers');
const { embedTemplateBuilder } = require("./messageEngine.js");

/**  key: topic, value: petitioner ids
 * @type {Record<string, string[]>} */
let petitions = require('../../config/petitionList.json');

exports.getPetitions = function () {
	return petitions;
}

/** Add a petition to the petition list and update the topic list embed
 * @param {string} petitionListInput
 * @param {GuildChannelManager} channelManager
 */
exports.setPetitions = function (petitionListInput, channelManager) {
	petitions = petitionListInput;
	saveObject(petitions, 'petitionList.json');
	exports.updateList(channelManager, "petition");
}

/** Create a topic channel for a petition if it has enough ids
 * @param {Guild} guild
 * @param {string} topicName
 * @param {User} author
 * @returns {{petitions: number, threshold: number}}
 */
exports.checkPetition = function (guild, topicName, author = null) {
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
		exports.setPetitions(petitions, guild.channels);
	}
	exports.updateList(guild.channels, "petition");
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
	saveObject(topics, 'topicList.json');
	exports.updateList(guild.channels, "petition");
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
		if (!petitions[topicName]) {
			petitions[topicName] = [];
		}

		if (petitions[topicName].length > 0) {
			channel.send(`This channel has been created thanks to: <@${petitions[topicName].join('> <@')}>`);
		}
		delete petitions[topicName];
		exports.addTopic(channel.id, channel.name);
		saveObject(topics, 'topicList.json');
		exports.setPetitions(petitions, guild.channels);
		return channel;
	}).catch(console.error);
}

/** @type {{[clubId: string]: Club}>} */
const clubDictionary = {};
Object.values(require('../../config/clubList.json')).forEach(club => {
	const serializedClub = { ...club, timeslot: Object.assign(new ClubTimeslot, club.timeslot) };
	clubDictionary[club.id] = Object.assign(new Club(), serializedClub);
});

exports.getClubDictionary = function () {
	return clubDictionary;
}

/** Update a club's details in the internal dictionary and in the club list embed
 * @param {Club} club
 */
exports.updateClub = function (club) {
	clubDictionary[club.id] = club;
	saveObject(clubDictionary, 'clubList.json');
}

/** Clean up club information after deletion
 * @param {string} id
 * @param {GuildChannelManager} channelManager
 */
exports.removeClub = function (id, channelManager) {
	delete clubDictionary[id];
	saveObject(clubDictionary, 'clubList.json');
	exports.updateList(channelManager, "club");
}

/** @type {{petition: {channelId: string; messageId: string}, club: {channelId: string; messageId: string;}, rules: {channelId: string; messageId: string;}}} */
exports.referenceMessages = require('../../config/referenceMessageIds.json');

/** Builds the MessageOptions for the specified list message
 * @param {number} memberCount
 * @param {"petition" | "club"} listType
 * @returns {Promise<import('discord.js').BaseMessageOptions>}
 */
exports.buildListMessagePayload = function (memberCount, listType) {
	let description;

	const messageOptions = {
		flags: MessageFlags.SuppressNotifications,
		components: [new ActionRowBuilder()]
	}

	const selectMenu = new StringSelectMenuBuilder().setCustomId(`${listType}List`)
		.setMinValues(1);

	switch (listType) {
		case "petition":
			description = `Here are the topic channels that have been petitioned for. Note that petitions will be converted to lowercase to match with Discord text channels being all lowercase. They will automatically be added when reaching **${Math.ceil(memberCount * 0.05)} petitions** (5% of the server). You can sign onto an already open petition with the select menu under this message (jump to message in pins).\n`;

			for (const topicName in petitions) {
				description += `\n${topicName}: ${petitions[topicName].length} petitioner(s) so far`;
				selectMenu.addOptions([{
					label: topicName,
					value: topicName
				}]);
			}

			if (selectMenu.options.length > 0) {
				selectMenu.setPlaceholder("Select a petition...");
			} else {
				selectMenu.setPlaceholder("No open petitions");
			}
			break;
		case "club":
			description = "Here's a list of the clubs on the server. Learn more about one by typing `/club-invite (club ID)`.\n";

			for (const id in clubDictionary) {
				const club = clubDictionary[id];
				description += `\n__**${club.title}**__ (${club.userIds.length}${club.seats !== -1 ? `/${club.seats}` : ""} Members)\n**ID**: ${club.id}\n**Host**: <@${club.hostId}>\n`;
				if (club.system) {
					description += `**Game**: ${club.system}\n`;
				}
				if (club.timeslot.nextMeeting) {
					description += `**Next Meeting**: <t:${club.timeslot.nextMeeting}>${club.timeslot.periodCount === 0 ? "" : ` repeats every ${club.timeslot.periodCount} ${club.timeslot.periodUnits === "weeks" ? "week(s)" : "day(s)"}`}\n`;
				}
				if (club.isRecruiting()) {
					selectMenu.addOptions([
						{
							label: club.title,
							description: `${club.userIds.length}${club.seats !== -1 ? `/${club.seats}` : ""} Members`,
							value: club.id
						}
					])
				}
			}

			if (selectMenu.options.length > 0) {
				selectMenu.setPlaceholder("Get club details...");
			} else {
				selectMenu.setPlaceholder("No clubs currently recruiting");
			}
			break;
	}

	if (selectMenu.options.length > 0) {
		selectMenu.setMaxValues(selectMenu.options.length);
	} else {
		selectMenu.setDisabled(true)
			.addOptions([{
				label: "no entries",
				value: "no entries"
			}])
			.setMaxValues(1);
	}

	messageOptions.components[0].addComponents(selectMenu);

	if (description.length > 2048) {
		return new Promise((resolve, reject) => {
			let fileText = description;
			fs.writeFile("data/listMessage.txt", fileText, "utf8", error => {
				if (error) {
					console.error(error);
				}
			});
			resolve(messageOptions);
		}).then(messageOptions => {
			messageOptions.files = [{
				attachment: "data/listMessage.txt",
				name: `${listType}List.txt`
			}];
			messageOptions.embeds = [];
			return messageOptions;
		})
	} else {
		return new Promise((resolve, reject) => {
			messageOptions.embeds = [
				embedTemplateBuilder("#f07581")
					.setTitle(`${listType.toUpperCase()} LIST`)
					.setDescription(description)
			];
			messageOptions.files = [];
			resolve(messageOptions);
		})
	}
}

/** Update the club or petition list message
 * @param {GuildChannelManager} channelManager
 * @param {"petition" | "club"} listType
 * @returns {Promise<Message>}
 */
exports.updateList = async function (channelManager, listType) {
	const { channelId, messageId } = exports.referenceMessages[listType];
	if (channelId && messageId) {
		const channel = await channelManager.fetch(channelId).catch(error => {
			if (error.code === 10003) { // Unknown Channel
				exports.referenceMessages[listType].channelId = "";
				exports.referenceMessages[listType].messageId = "";
				saveObject(exports.referenceMessages, "referenceMessageIds.json");
			}
			console.error(error);
		});
		const message = await channel?.messages.fetch(messageId).catch(error => {
			if (error.code === 10008) { // Unknown Message
				exports.referenceMessages[listType].channelId = "";
				exports.referenceMessages[listType].messageId = "";
				saveObject(exports.referenceMessages, "referenceMessageIds.json");
			}
			console.error(error);
		});
		const messageOptions = await exports.buildListMessagePayload(channelManager.guild.memberCount, listType);
		message?.edit(messageOptions);
		if (messageOptions.files.length === 0) {
			message?.removeAttachments();
		}
		return message;
	}
}
