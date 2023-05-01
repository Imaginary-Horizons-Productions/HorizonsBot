const fs = require('fs');
const { Collection, TextChannel, ChannelManager, GuildChannelManager, Message, MessageOptions, Guild, ChannelType, PermissionsBitField, ActionRowBuilder, ButtonBuilder, GuildScheduledEventEntityType, StringSelectMenuBuilder, ButtonStyle, GuildMember } = require('discord.js');
const { Club, ClubTimeslot } = require('./classes/Club');
const { MAX_SET_TIMEOUT } = require('./constants');
const { embedTemplateBuilder, clubEmbedBuilder } = require('./engines/messageEngine');
const { getTopicIds, getTopicNames, addTopic } = require('./engines/channelEngine');

/** Convert an amount of time from a starting unit to a different one
 * @param {number} value
 * @param {"w" | "d" | "h" | "m" | "s" | "ms"} startingUnit
 * @param {"w" | "d" | "h" | "m" | "s" | "ms"} resultUnit
 * @returns {number}
 */
exports.timeConversion = function (value, startingUnit, resultUnit) {
	const unknownUnits = [];
	let msPerStartUnit = 1;
	switch (startingUnit.toLowerCase()) {
		case "w":
			msPerStartUnit *= 7;
		case "d":
			msPerStartUnit *= 24;
		case "h":
			msPerStartUnit *= 60;
		case "m":
			msPerStartUnit *= 60;
		case "s":
			msPerStartUnit *= 1000;
		case "ms":
			msPerStartUnit *= 1;
			break;
		default:
			unknownUnits.push(startingUnit);
	}

	let msPerResultUnit = 1;
	switch (resultUnit.toLowerCase()) {
		case "w":
			msPerResultUnit *= 7;
		case "d":
			msPerResultUnit *= 24;
		case "h":
			msPerResultUnit *= 60;
		case "m":
			msPerResultUnit *= 60;
		case "s":
			msPerResultUnit *= 1000;
		case "ms":
			msPerResultUnit *= 1;
			break;
		default:
			unknownUnits.push(resultUnit);
	}
	if (!unknownUnits.length) {
		return value * msPerStartUnit / msPerResultUnit;
	} else {
		throw new Error(`Unknown unit used: ${unknownUnits.join(", ")} (allowed units: ms, s, m, h, d, w)`)
	}
}

//#region moderation
let moderatorIds = require('../config/modData.json').modIds; // [userId]

exports.getModIds = function () {
	return moderatorIds;
}

/** Save the modData object to file
 */
exports.saveModData = function () {
	exports.saveObject({ modIds: moderatorIds, noAts: exports.noAts }, "modData.json");
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

exports.modRoleId = require("../config/auth.json").modRoleId;

exports.noAts = require("../config/modData.json").noAts; // [userId]

exports.atIds = new Set(); // contains userIds
//#endregion

// {[type]: {messageId: string, channelId: string}}
exports.listMessages = require('../config/listMessageIds.json');

let petitions = require('../config/petitionList.json');
/** Get the dictionary relating topic petitions to their arrays of petitioner ids
 * @returns {Record<string, string[]>} Record<petition, petitionerId[]>
 */
exports.getPetitions = function () {
	return petitions;
}

/** Add a petition to the petition list and update the topic list embed
 * @param {string} petitionListInput
 * @param {GuildChannelManager} channelManager
 */
exports.setPetitions = function (petitionListInput, channelManager) {
	petitions = petitionListInput;
	exports.saveObject(petitions, 'petitionList.json');
	exports.updateList(channelManager, "topics");
}

const clubDictionary = {};
Object.values(require('../config/clubList.json')).forEach(club => {
	const serializedClub = { ...club, timeslot: Object.assign(new ClubTimeslot, club.timeslot) };
	clubDictionary[club.id] = Object.assign(new Club(), serializedClub);
});
/** Get the dictionary relating club text channel id to club class instances
 * @returns {Record<string, Club>} Record<clubId, Club>
 */
exports.getClubDictionary = function () {
	return clubDictionary;
}

/** Update a club's details in the internal dictionary and in the club list embed
 * @param {Club} club
 */
exports.updateClub = function (club) {
	clubDictionary[club.id] = club;
	exports.saveObject(clubDictionary, 'clubList.json');
}

/** Clean up club information after deletion
 * @param {string} id
 * @param {ChannelManager} channelManager
 */
exports.removeClub = function (id, channelManager) {
	delete clubDictionary[id];
	exports.saveObject(clubDictionary, 'clubList.json');
	exports.updateList(channelManager, "clubs");
}

// {[textChannelId]: timeout}
exports.reminderTimeouts = {};

// {[voiceChannelId]: timeout}
exports.eventTimeouts = {};

// Functions
/** Update the club or topics list message
 * @param {GuildChannelManager} channelManager
 * @param {"topics" | "clubs"} listType
 * @returns {Promise<Message>}
 */
exports.updateList = async function (channelManager, listType) {
	const { channelId, messageId } = exports.listMessages[listType];
	if (channelId && messageId) {
		const channel = await channelManager.fetch(channelId);
		const message = await channel.messages.fetch(messageId);
		const messageOptions = await (listType == "topics" ? exports.topicListBuilder : exports.clubListBuilder)(channelManager);
		message.edit(messageOptions);
		if (messageOptions.files.length === 0) {
			message.removeAttachments();
		}
		return message;
	}
}

/** Create the ActionRowBuilder containing the selects for joining clubs/topics and adding to petitions
 * @param {"topics" | "petitions" | "clubs"} listType
 * @returns {ActionRowBuilder}
 */
function listSelectBuilder(listType) {
	let selectCutomId = "";
	let placeholderText = "";
	const entries = [];

	switch (listType) {
		case "topics":
			selectCutomId = "topicList";

			let topicNames = getTopicNames();
			let topicIds = getTopicIds();
			for (let i = 0; i < topicNames.length; i++) {
				entries.push({
					label: topicNames[i],
					value: topicIds[i]
				})
			}

			if (entries.length > 0) {
				placeholderText = "Select a topic...";
			} else {
				placeholderText = "No topics yet";
			}
			break;
		case "petitions":
			selectCutomId = "petitionList";
			for (const petition in exports.getPetitions()) {
				entries.push({
					label: petition,
					value: petition
				})
			}

			if (entries.length > 0) {
				placeholderText = "Select a petition...";
			} else {
				placeholderText = "No open petitions";
			}
			break;
		case "clubs":
			selectCutomId = "clubList";

			for (const club of Object.values(exports.getClubDictionary())) {
				if (club.isRecruiting()) {
					entries.push({
						label: club.title,
						description: `${club.userIds.length}${club.seats !== -1 ? `/${club.seats}` : ""} Members`,
						value: club.id
					});
				}
			}

			if (entries.length > 0) {
				placeholderText = "Get club details...";
			} else {
				placeholderText = "No clubs currently recruiting";
			}
			break;
	}

	return new ActionRowBuilder().addComponents(
		new StringSelectMenuBuilder()
			.setCustomId(selectCutomId)
			.setPlaceholder(placeholderText)
			.setDisabled(entries.length < 1)
			.addOptions(entries.length > 0 ? entries : [{
				label: "no entries",
				value: "no entries"
			}])
			.setMinValues(1)
			.setMaxValues(entries.length > 0 ? entries.length : 1)
	);
}

/** Create the MessageOptions for the topic list message
 * @param {GuildChannelManager} channelManager
 * @returns {Promise<MessageOptions>}
 */
exports.topicListBuilder = function (channelManager) {
	const messageOptions = {};

	// Select Menus
	messageOptions.components = [listSelectBuilder("topics"), listSelectBuilder("petitions")];

	// Generate Message Body
	let description = "Here's a list of the opt-in topic channels for the server. Join them by using `/join` or by using the select menu under this message (jump to message in pins).\n";
	let topics = getTopicIds();

	for (let i = 0; i < topics.length; i += 1) {
		let id = topics[i];
		let channel = channelManager.resolve(id);
		if (channel) {
			description += `\n__${channel.name}__${channel.topic ? ` ${channel.topic}` : ""}`;
		}
	}

	let petitionNames = Object.keys(petitions);
	let petitionText = `Here are the topic channels that have been petitioned for. Note that petitions will be converted to lowercase to match with Discord text channels being all lowercase. They will automatically be added when reaching **${Math.ceil(channelManager.guild.memberCount * 0.05)} petitions** (5% of the server). You can sign onto an already open petition with the select menu under this message (jump to message in pins).\n`;
	if (petitionNames.length > 0) {
		petitionNames.forEach(topicName => {
			petitionText += `\n${topicName}: ${petitions[topicName].length} petitioner(s) so far`;
		})
	}

	if (description.length > 2048 || petitionText.length > 1024) {
		return new Promise((resolve, reject) => {
			let fileText = description;
			if (petitionNames.length > 0) {
				fileText += `\n\n${petitionText}`;
			}

			fs.writeFile("data/TopicChannels.txt", fileText, "utf8", error => {
				if (error) {
					console.error(error);
				}
			});
			resolve(messageOptions);
		}).then(() => {
			messageOptions.embeds = [];
			messageOptions.files = [{
				attachment: "data/TopicChannels.txt",
				name: "TopicChannels.txt"
			}];
			return messageOptions;
		})
	} else {
		return new Promise((resolve, reject) => {
			let embed = embedTemplateBuilder()
				.setTitle("Topic Channels")
				.setDescription(description)
				.setFooter({ text: "Please do not make bounties to vote for your petitions." });

			if (petitionNames.length > 0) {
				embed.addFields({ name: "Petitioned Channels", value: petitionText })
			}
			messageOptions.embeds = [embed];
			messageOptions.files = [];
			resolve(messageOptions);
		})
	}
}

/** Pin the topics list message
 * @param {GuildChannelManager} channelManager
 * @param {TextChannel} channel
 */
exports.pinTopicsList = function (channelManager, channel) {
	exports.topicListBuilder(channelManager).then(messageOptions => {
		channel.send(messageOptions).then(message => {
			exports.listMessages.topics = {
				"messageId": message.id,
				"channelId": message.channelId
			}
			exports.saveObject(exports.listMessages, "listMessageIds.json");
			message.pin();
		})
	}).catch(console.error);
}

/** Create the MessageOptions for the club list message
 * @returns {Promise<MessageOptions>}
 */
exports.clubListBuilder = function () {
	const messageOptions = {};

	messageOptions.components = [listSelectBuilder("clubs")];

	let description = "Here's a list of the clubs on the server. Learn more about one by typing `/club-invite (club ID)`.\n";
	let clubs = exports.getClubDictionary();

	Object.keys(clubs).forEach(id => {
		let club = clubs[id];
		description += `\n__**${club.title}**__ (${club.userIds.length}${club.seats !== -1 ? `/${club.seats}` : ""} Members)\n**ID**: ${club.id}\n**Host**: <@${club.hostId}>\n`;
		if (club.system) {
			description += `**Game**: ${club.system}\n`;
		}
		if (club.timeslot.nextMeeting) {
			description += `**Next Meeting**: <t:${club.timeslot.nextMeeting}>${club.timeslot.periodCount === 0 ? "" : ` repeats every ${club.timeslot.periodCount} ${club.timeslot.periodUnits === "weeks" ? "week(s)" : "day(s)"}`}\n`;
		}
	})

	if (description.length > 2048) {
		return new Promise((resolve, reject) => {
			let fileText = description;
			fs.writeFile("data/ClubChannels.txt", fileText, "utf8", error => {
				if (error) {
					console.error(error);
				}
			});
			resolve(messageOptions);
		}).then(messageOptions => {
			messageOptions.files = [{
				attachment: "data/ClubChannels.txt",
				name: "ClubChannels.txt"
			}];
			messageOptions.embeds = [];
			return messageOptions;
		})
	} else {
		return new Promise((resolve, reject) => {
			messageOptions.embeds = [
				embedTemplateBuilder("#f07581")
					.setTitle("Clubs")
					.setDescription(description)
			];
			messageOptions.files = [];
			resolve(messageOptions);
		})
	}
}

/** Pin the club list message
 * @param {GuildChannelManager} channelManager
 * @param {TextChannel} channel
 */
exports.pinClubList = function (channelManager, channel) {
	exports.clubListBuilder(channelManager).then(messageOptions => {
		channel.send(messageOptions).then(message => {
			exports.listMessages.clubs = {
				"messageId": message.id,
				"channelId": message.channelId
			}
			message.pin();
			exports.saveObject(exports.listMessages, "listMessageIds.json");
		})
	}).catch(console.error);
}

/** Create a topic channel for a petition if it has enough ids
 * @param {Guild} guild
 * @param {string} topicName
 * @param {User} author
 * @returns {{petitions: number, threshold: number}}
 */
exports.checkPetition = function (guild, topicName, author = null) {
	let petitions = exports.getPetitions();
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
	exports.updateList(guild.channels, "topics");
	return {
		petitions: petitionCount,
		threshold
	}
}

/** Create a topic channel
 * @param {Guild} guild
 * @param {string} topicName
 * @returns {Promise<TextChannel>}
 */
exports.addTopicChannel = function (guild, topicName) {
	return guild.channels.create({
		name: topicName,
		parent: "581886288102424592",
		permissionOverwrites: [
			{
				id: guild.client.user.id,
				allow: [PermissionsBitField.Flags.ViewChannel],
				type: 1
			},
			{
				id: exports.modRoleId,
				allow: [PermissionsBitField.Flags.ViewChannel],
				type: 0
			},
			{
				id: guild.id,
				deny: [PermissionsBitField.Flags.ViewChannel],
				type: 0
			}
		],
		type: ChannelType.GuildText
	}).then(channel => {
		const petitions = exports.getPetitions();
		if (!petitions[topicName]) {
			petitions[topicName] = [];
		}

		// Make channel viewable by petitioners, and BountyBot
		guild.members.fetch({
			user: petitions[topicName].concat(["536330483852771348"])
		}).then(allowedCollection => {
			allowedCollection.mapValues(member => {
				channel.permissionOverwrites.create(member.user, {
					[PermissionsBitField.Flags.ViewChannel]: true
				});
			})

			if (petitions[topicName].length > 0) {
				channel.send(`This channel has been created thanks to: <@${petitions[topicName].join('> <@')}>`);
			}
			delete petitions[topicName];
			addTopic(channel.id, channel.name);
			exports.saveObject(getTopicIds(), 'topicList.json');
			exports.setPetitions(petitions, guild.channels);
		})
		return channel;
	}).catch(console.error);
}

/** Add the user to the topic/club channel (syncing internal tracking and permissions)
 * @param {TextChannel} channel
 * @param {User} user
 */
exports.joinChannel = function (channel, user) {
	if (!user.bot) {
		const { id, permissionOverwrites, guild, name: channelName } = channel;
		let permissionOverwrite = permissionOverwrites.resolve(user.id);
		if (!permissionOverwrite || !permissionOverwrite.deny.has(PermissionsBitField.Flags.ViewChannel, false)) {
			if (getTopicIds().includes(id)) {
				permissionOverwrites.create(user, {
					[PermissionsBitField.Flags.ViewChannel]: true
				}).then(() => {
					channel.send(`Welcome to ${channelName}, ${user}!`);
				}).catch(console.error);
			} else if (Object.keys(exports.getClubDictionary()).includes(id)) {
				let club = exports.getClubDictionary()[id];
				if (club.seats === -1 || club.isRecruiting()) {
					if (club.hostId != user.id && !club.userIds.includes(user.id)) {
						club.userIds.push(user.id);
						permissionOverwrites.create(user, {
							[PermissionsBitField.Flags.ViewChannel]: true
						}).then(() => {
							guild.channels.resolve(club.voiceChannelId).permissionOverwrites.create(user, {
								[PermissionsBitField.Flags.ViewChannel]: true
							})
							channel.send(`Welcome to ${channelName}, ${user}!`);
						})
						exports.updateClubDetails(club, channel);
						exports.updateList(guild.channels, "clubs");
						exports.updateClub(club);
					} else {
						user.send(`You are already in ${club.title}.`)
							.catch(console.error);
					}
				} else {
					user.send(`${club.title} is already full.`)
						.catch(console.error);
				}
			}
		} else {
			user.send(`You are currently banned from ${channelName}. Speak to a Moderator if you believe this is in error.`)
				.catch(console.error);
		}
	}
}

/** Update a club's details embed in the club text channel
 * @param {Club} club
 * @param {TextChannel} channel
 */
exports.updateClubDetails = (club, channel) => {
	channel.messages.fetch(club.detailSummaryId).then(message => {
		message.edit({ content: "You can send out invites with \`/club-invite\`. Prospective members will be shown the following embed:", embeds: [clubEmbedBuilder(club)], fetchReply: true }).then(detailSummaryMessage => {
			detailSummaryMessage.pin();
			club.detailSummaryId = detailSummaryMessage.id;
			exports.updateList(channel.guild.channels, "clubs");
			exports.updateClub(club);
		});
	}).catch(error => {
		if (error.message === "Unknown Message") {
			// message not found
			channel.send({ content: "You can send out invites with \`/club-invite\`. Prospective members will be shown the following embed:", embeds: [clubEmbedBuilder(club)], fetchReply: true }).then(detailSummaryMessage => {
				detailSummaryMessage.pin();
				club.detailSummaryId = detailSummaryMessage.id;
				exports.updateList(channel.guild.channels, "clubs");
				exports.updateClub(club);
			});
		} else {
			console.error(error);
		}
	});
}

/** Create a GuildScheduledEvent for the club's next meeting
 * @param {Club} club
 * @param {Guild} guild
 */
exports.createClubEvent = function (club, guild) {
	if (club.isRecruiting()) {
		return guild.channels.fetch(club.voiceChannelId).then(voiceChannel => {
			return guild.scheduledEvents.create({
				name: club.title,
				scheduledStartTime: club.timeslot.nextMeeting * 1000,
				privacyLevel: 2,
				entityType: GuildScheduledEventEntityType.Voice,
				description: club.description,
				channel: voiceChannel
			})
		}).then(event => {
			club.timeslot.setEventId(event.id);
			exports.updateList(guild.channels, "clubs");
			exports.updateClub(club);
		});
	}
}

/** Create a timeout to create a scheduled event for a club after the current event passes
 * @param {Club} club
 * @param {Guild} guild
 */
exports.scheduleClubEvent = function (club, guild) {
	const msToNextMeeting = (club.timeslot.nextMeeting * 1000) - Date.now();
	if (msToNextMeeting <= MAX_SET_TIMEOUT) {
		let timeout = setTimeout((clubId, timeoutGuild) => {
			const club = exports.getClubDictionary()[clubId];
			if (club?.isRecruiting()) {
				exports.createClubEvent(club, timeoutGuild);
			}
		}, msToNextMeeting, club.id, guild);
		exports.eventTimeouts[club.voiceChannelId] = timeout;
	} else {
		const timeout = setTimeout((timeoutClub, timeoutGuild) => {
			exports.scheduleClubEvent(timeoutClub, timeoutGuild);
		}, MAX_SET_TIMEOUT, club, guild);
		exports.eventTimeouts[club.voiceChannelId] = timeout;
	}
}

/** Delete the scheduled event associated with a club's next meeting
 * @param {Club} club
 * @param {GuildScheduledEventManager} eventManager
 */
exports.cancelClubEvent = function (club, eventManager) {
	if (club.timeslot.eventId) {
		eventManager.delete(club.timeslot.eventId).catch(console.error);
		club.timeslot.eventId = null;
	}
	if (exports.eventTimeouts[club.voiceChannelId]) {
		clearTimeout(exports.eventTimeouts[club.voiceChannelId]);
		delete exports.eventTimeouts[club.voiceChannelId];
	}
}

/** Set a timeout to send a reminder message to the given club a day before its next meeting
 * @param {Club} club
 * @param {ChannelManager} channelManager
 */
exports.setClubReminder = async function (club, channelManager) {
	if (club.timeslot.nextMeeting) {
		const timeout = setTimeout(
			reminderWaitLoop,
			calculateReminderMS(club.timeslot.nextMeeting),
			club,
			channelManager);
		exports.reminderTimeouts[club.id] = timeout;
		exports.updateList(channelManager, "clubs");
	}
}

/** The number of ms until a day before the next meeting, but not more than the max allowable setTimeout duration
 * @param {number} timestamp The unix timestamp of the next meeting (in seconds)
 */
function calculateReminderMS(timestamp) {
	return Math.min((timestamp * 1000) - exports.timeConversion(1, "d", "ms") - Date.now(), MAX_SET_TIMEOUT);
}

/** If the club reminder would be set for further than the a max signed int ms in the future (max allowable setTimeout duration), try to set the club reminder again later
 * @param {Club} club
 * @param {ChannelManager} channelManager
 */
async function reminderWaitLoop(club, channelManager) {
	if (club.timeslot.nextMeeting) {
		if (calculateReminderMS(club.timeslot.nextMeeting) < MAX_SET_TIMEOUT) {
			if (club.timeslot.periodCount) {
				await exports.sendClubReminder(club, channelManager);
				const timeGap = exports.timeConversion(club.timeslot.periodCount, club.timeslot.periodUnits === "weeks" ? "w" : "d", "s");
				club.timeslot.setNextMeeting(club.timeslot.nextMeeting + timeGap);
				exports.updateClub(club);
				exports.scheduleClubEvent(club, channelManager.guild);
				exports.setClubReminder(club, channelManager);
			} else {
				club.timeslot.setEventId(null);
				exports.updateList(channelManager, "clubs");
				exports.updateClub(club, channelManager);
			}
		} else {
			exports.setClubReminder(club, channelManager);
		}
	}
}

/** Send a club reminder message
 * @param {Club} club
 * @param {ChannelManager} channelManager
 */
exports.sendClubReminder = async (club, channelManager) => {
	const textChannel = await channelManager.fetch(club.id);
	// NOTE: defaultReminder.length (without interpolated length) must be less than or equal to 55 characters so it fits in the config modal placeholder with its wrapper (100 characters)
	const defaultReminder = `Reminder: This club will meet at <t:${club.timeslot.nextMeeting}> in <#${club.voiceChannelId}>!`;
	const reminderPayload = {
		content: `@everyone ${club.timeslot.message ? club.timeslot.message : defaultReminder}`,
	};
	if (club.timeslot.eventId) {
		const event = await channelManager.guild.scheduledEvents.fetch(club.timeslot.eventId).catch(console.error);
		if (event) {
			reminderPayload.components = [new ActionRowBuilder({
				components: [
					new ButtonBuilder({
						customId: 'startevent',
						label: "Start Event",
						emoji: "👑",
						style: ButtonStyle.Primary,
					})
				]
			})]
		}
	}
	return textChannel.send(reminderPayload);
}

/** Clears the timeout for an upcoming club meeting reminder message
 * @param {string} channelId
 */
exports.clearClubReminder = async function (channelId) {
	if (exports.reminderTimeouts[channelId]) {
		clearTimeout(exports.reminderTimeouts[channelId]);
		delete exports.reminderTimeouts[channelId];
	}
}

/** Stringify an entity to JSON then save it at `.\config\${fileName}`
 * @param {*} entity
 * @param {string} fileName
 */
exports.saveObject = function (entity, fileName) {
	let filePath = `./config/`;
	if (!fs.existsSync(filePath)) {
		fs.mkdirSync(filePath);
	}
	filePath += fileName;
	let textToSave = '';
	if (entity instanceof Collection) {
		textToSave = [];
		Array.from(entity.values).forEach(value => {
			textToSave.push([entity.findKey(checkedValue => checkedValue === value), value]);
		})
		textToSave = JSON.stringify(textToSave);
	} else if (typeof entity == 'object' || typeof entity == 'number') {
		textToSave = JSON.stringify(entity);
	} else {
		textToSave = entity;
	}

	fs.writeFile(filePath, textToSave, 'utf8', (error) => {
		if (error) {
			console.error(error);
		}
	})
}
