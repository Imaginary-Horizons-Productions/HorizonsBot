const fs = require('fs');
const { Collection, TextChannel, ChannelManager, GuildChannelManager, Message, MessageOptions, Guild, ChannelType, PermissionsBitField, ActionRowBuilder, ButtonBuilder, GuildScheduledEventEntityType, StringSelectMenuBuilder, ButtonStyle, GuildMember } = require('discord.js');
const { Club, ClubTimeslot } = require('./classes/Club');
const { MAX_SET_TIMEOUT } = require('./constants');
const { embedTemplateBuilder, clubEmbedBuilder } = require('./engines/messageEngine');

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

const { noAts, modRoleId } = require("../config/modData.json");
/** @type {string} */
exports.modRoleId = modRoleId;
/** @type {string[]} */
exports.noAts = noAts;

exports.atIds = new Set(); // contains userIds
//#endregion

/** @type {{petition: {channelId: string; messageId: string}, club: {channelId: string; messageId: string;}}} */
exports.listMessages = require('../config/listMessageIds.json');

/**  key: topic, value: petitioner ids
 * @type {Record<string, string[]>} */
const petitions = require('../config/petitionList.json');

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
	exports.updateList(channelManager, "petition");
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
	exports.updateList(channelManager, "club");
}

// {[textChannelId]: timeout}
exports.reminderTimeouts = {};

// {[voiceChannelId]: timeout}
exports.eventTimeouts = {};

// Functions
/** Builds the MessageOptions for the specified list message
 * @param {ChannelManager} channelManager
 * @param {"petition" | "club"} listType
 * @returns {Promise<MessageOptions>}
 */
exports.buildListMessagePayload = function (channelManager, listType) {
	let description;

	const messageOptions = {
		components: [new ActionRowBuilder()]
	}

	const selectMenu = new StringSelectMenuBuilder().setCustomId(`${listType}List`)
		.setMinValues(1);

	switch (listType) {
		case "petition":
			description = `Here are the topic channels that have been petitioned for. Note that petitions will be converted to lowercase to match with Discord text channels being all lowercase. They will automatically be added when reaching **${Math.ceil(channelManager.guild.memberCount * 0.05)} petitions** (5% of the server). You can sign onto an already open petition with the select menu under this message (jump to message in pins).\n`;

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
	const { channelId, messageId } = exports.listMessages[listType];
	if (channelId && messageId) {
		const channel = await channelManager.fetch(channelId);
		const message = await channel.messages.fetch(messageId);
		const messageOptions = await exports.buildListMessagePayload(channelManager, listType);
		message.edit(messageOptions);
		if (messageOptions.files.length === 0) {
			message.removeAttachments();
		}
		return message;
	}
}

/** Pins the specified list
 * @param {ChannelManager} channelManager
 * @param {TextChannel} channel
 * @param {"petition" | "club"} listType
 */
exports.pinList = function (channelManager, channel, listType) {
	exports.buildListMessagePayload(channelManager, listType).then(messageOptions => {
		channel.send(messageOptions).then(message => {
			exports.listMessages[listType] = {
				"messageId": message.id,
				"channelId": message.channelId
			}
			exports.saveObject(exports.listMessages, "listMessageIds.json");
			message.pin();
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
	exports.updateList(guild.channels, "petition");
	return {
		petitions: petitionCount,
		threshold
	}
}

/** Add the user to the club (syncing internal tracking and permissions)
 * @param {TextChannel} channel
 * @param {User} user
 */
exports.joinChannel = function (channel, user) {
	if (!user.bot) {
		const { id, permissionOverwrites, guild, name: channelName } = channel;
		const permissionOverwrite = permissionOverwrites.resolve(user.id);
		if (!permissionOverwrite.deny.has(PermissionsBitField.Flags.ViewChannel, false)) {
			const club = exports.getClubDictionary()[id];
			if (!club) {
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
						exports.updateList(guild.channels, "club");
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
			exports.updateList(channel.guild.channels, "club");
			exports.updateClub(club);
		});
	}).catch(error => {
		if (error.message === "Unknown Message") {
			// message not found
			channel.send({ content: "You can send out invites with \`/club-invite\`. Prospective members will be shown the following embed:", embeds: [clubEmbedBuilder(club)], fetchReply: true }).then(detailSummaryMessage => {
				detailSummaryMessage.pin();
				club.detailSummaryId = detailSummaryMessage.id;
				exports.updateList(channel.guild.channels, "club");
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
			exports.updateList(guild.channels, "club");
			exports.updateClub(club);
		});
	}
}

/** The number of ms until the timestamp, but not more than the max allowable setTimeout duration
 * @param {number} timestamp units: seconds
 */
function clampedTimestampToMS(timestamp) {
	return Math.min((timestamp * 1000) - Date.now(), MAX_SET_TIMEOUT);
}

/** Checks if the given unix timestamp can be scheduled to with 1 setTimeout
 * @param {number} timestamp units: seconds
 */
function isTimestampWithinOneTimeout(timestamp) {
	return (timestamp * 1000) - Date.now() <= MAX_SET_TIMEOUT;
}

/** Create a timeout to create a scheduled event for a club after the current event passes
 * @param {string} club
 * @param {string} clubVoiceId
 * @param {number | null} nextMeetingTimestamp
 * @param {Guild} guild
 */
exports.scheduleClubEvent = function (clubId, clubVoiceId, nextMeetingTimestamp, guild) {
	if (isTimestampWithinOneTimeout(nextMeetingTimestamp)) {
		const timeout = setTimeout((timeoutClubId, timeoutGuild) => {
			const club = exports.getClubDictionary()[timeoutClubId];
			if (club?.isRecruiting()) {
				exports.createClubEvent(club, timeoutGuild);
			}
		}, clampedTimestampToMS(nextMeetingTimestamp), clubId, guild);
		exports.eventTimeouts[clubVoiceId] = timeout;
	} else {
		const timeout = setTimeout((timeoutClubId, timeoutGuild) => {
			const club = exports.getClubDictionary()[timeoutClubId];
			if (club) {
				exports.scheduleClubEvent(club.id, club.voiceChannelId, club.timeslot.nextMeeting, timeoutGuild);
			}
		}, MAX_SET_TIMEOUT, clubId, guild);
		exports.eventTimeouts[clubVoiceId] = timeout;
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
 * @param {string} clubId
 * @param {number | null} nextMeetingTimestamp
 * @param {ChannelManager} channelManager
 */
exports.setClubReminder = async function (clubId, nextMeetingTimestamp, channelManager) {
	if (nextMeetingTimestamp) {
		const timeout = setTimeout(
			async (clubId, channelManager) => {
				const club = exports.getClubDictionary()[clubId];
				if (club.timeslot.nextMeeting) {
					if (isTimestampWithinOneTimeout(club.timeslot.nextMeeting - exports.timeConversion(1, "d", "s"))) {
						if (club.timeslot.periodCount) {
							await exports.sendClubReminder(club, channelManager);
							const timeGap = exports.timeConversion(club.timeslot.periodCount, club.timeslot.periodUnits === "weeks" ? "w" : "d", "s");
							club.timeslot.setNextMeeting(club.timeslot.nextMeeting + timeGap);
							exports.updateClub(club);
							exports.scheduleClubEvent(club.id, club.voiceChannelId, club.timeslot.nextMeeting, channelManager.guild);
							exports.setClubReminder(club.id, club.timeslot.nextMeeting, channelManager);
						} else {
							club.timeslot.setEventId(null);
							exports.updateList(channelManager, "club");
							exports.updateClub(club, channelManager);
						}
					} else {
						exports.setClubReminder(club.id, club.timeslot.nextMeeting, channelManager);
					}
				}
			},
			clampedTimestampToMS(nextMeetingTimestamp - exports.timeConversion(1, "d", "s")),
			clubId,
			channelManager);
		exports.reminderTimeouts[clubId] = timeout;
		exports.updateList(channelManager, "club");
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
