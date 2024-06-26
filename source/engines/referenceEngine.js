const { GuildChannelManager, Guild, User, Collection, ChannelType, ActionRowBuilder, StringSelectMenuBuilder, Message, MessageFlags } = require('discord.js');
const { Club, ClubTimeslot } = require("../classes");
const { topicCategoryId } = require('../constants');
const { ensuredPathSave } = require('../helpers');
const { embedTemplateBuilder } = require("./messageEngine.js");
const { commandMention } = require('../util/textUtil.js');

/**  key: topic, value: petitioner ids
 * @type {Record<string, string[]>} */
let petitions = require('../../config/petitionList.json');

function getPetitions() {
	return petitions;
}

/** Add a petition to the petition list and update the topic list embed
 * @param {string} petitionListInput
 * @param {GuildChannelManager} channelManager
 */
function setPetitions(petitionListInput, channelManager) {
	petitions = petitionListInput;
	ensuredPathSave(petitions, 'petitionList.json');
	updateList(channelManager, "petition");
}

/** Create a topic channel for a petition if it has enough ids
 * @param {Guild} guild
 * @param {string} topicName
 * @param {User} author
 * @returns {{petitions: number, threshold: number}}
 */
function checkPetition(guild, topicName, author = null) {
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
		addTopicChannel(guild, topicName);
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
function getTopicIds() {
	return Array.from(topics.keys());
}

/** Get the array of topic channel names
 * @returns {string[]}
 */
function getTopicNames() {
	return Array.from(topics.values());
}

/** Add a new entry to the topic map
 * @param {string} id
 * @param {string} channelName
 */
function addTopic(id, channelName) {
	topics.set(id, channelName);
}

/** Clean up internal state to keep in sync with removing a topic channel
 * @param {string} channelId
 * @param {Guild} guild
 */
function removeTopic(channelId, guild) {
	topics.delete(channelId);
	ensuredPathSave(topics, 'topicList.json');
	updateList(guild.channels, "petition");
}

/** Add the new topic channel topic list to prevent duplicate petitions
 * @param {Guild} guild
 * @param {string} topicName
 * @returns {Promise<TextChannel>}
 */
function addTopicChannel(guild, topicName) {
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
		addTopic(channel.id, channel.name);
		ensuredPathSave(topics, 'topicList.json');
		setPetitions(petitions, guild.channels);
		return channel;
	}).catch(console.error);
}

/** @type {{[clubId: string]: Club}>} */
const clubDictionary = {};
Object.values(require('../../config/clubList.json')).forEach(club => {
	const serializedClub = { ...club, timeslot: Object.assign(new ClubTimeslot, club.timeslot) };
	clubDictionary[club.id] = Object.assign(new Club(), serializedClub);
});

function getClubDictionary() {
	return clubDictionary;
}

/** Update a club's details in the internal dictionary and in the club list embed
 * @param {Club} club
 */
function updateClub(club) {
	clubDictionary[club.id] = club;
	ensuredPathSave(clubDictionary, 'clubList.json');
}

/** Clean up club information after deletion
 * @param {string} id
 * @param {GuildChannelManager} channelManager
 */
function removeClub(id, channelManager) {
	delete clubDictionary[id];
	ensuredPathSave(clubDictionary, 'clubList.json');
	updateList(channelManager, "club");
}

/** @type {{petition: {channelId: string; messageId: string}, club: {channelId: string; messageId: string;}, rules: {channelId: string; messageId: string;}, "press-kit": {channelId: string; messageId: string;}, "proxy-thread-info": {channelId: string; messageId: string;}}} */
let referenceMessages = require('../../config/referenceMessageIds.json');

/** Builds the MessageOptions for the specified list message
 * @param {number} memberCount
 * @param {"petition" | "club"} listType
 * @returns {Promise<import('discord.js').BaseMessageOptions>}
 */
function buildListMessagePayload(memberCount, listType) {
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
		// Max 10 because club summaries are shown as embeds and only 10 embeds fit in a single message
		selectMenu.setMaxValues(Math.min(selectMenu.options.length, 10));
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
					.setTitle(listType === "club" ? `Clubs List (${commandMention("list club")})` : `Open Petitions List (${commandMention("list petition")})`)
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
async function updateList(channelManager, listType) {
	const { channelId, messageId } = referenceMessages[listType];
	if (channelId && messageId) {
		const channel = await channelManager.fetch(channelId).catch(error => {
			if (error.code === 10003) { // Unknown Channel
				referenceMessages[listType].channelId = "";
				referenceMessages[listType].messageId = "";
				ensuredPathSave(referenceMessages, "referenceMessageIds.json");
			}
			console.error(error);
		});
		const message = await channel?.messages.fetch(messageId).catch(error => {
			if (error.code === 10008) { // Unknown Message
				referenceMessages[listType].channelId = "";
				referenceMessages[listType].messageId = "";
				ensuredPathSave(referenceMessages, "referenceMessageIds.json");
			}
			console.error(error);
		});
		const messageOptions = await buildListMessagePayload(channelManager.guild.memberCount, listType);
		message?.edit(messageOptions);
		if (messageOptions.files.length === 0) {
			message?.removeAttachments();
		}
		return message;
	}
}

module.exports = {
	getPetitions,
	setPetitions,
	checkPetition,
	getTopicIds,
	getTopicNames,
	addTopic,
	removeTopic,
	addTopicChannel,
	getClubDictionary,
	updateClub,
	removeClub,
	referenceMessages,
	buildListMessagePayload,
	updateList
};
