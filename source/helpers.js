const fs = require('fs');
const { Collection, EmbedBuilder, MessageSelectMenu, TextChannel, ChannelManager, GuildChannelManager, Message, MessageOptions, Guild, ChannelType, PermissionsBitField, ActionRowBuilder, ButtonBuilder, MessagePayload } = require('discord.js');
const { Club, ClubTimeslot } = require('./classes/Club');
const { MAX_SIGNED_INT } = require('./constants');
const { randomEmbedFooter, embedTemplateBuilder } = require('./engines/messageEngine');

/** Convert an amount of time from a starting unit to a different one
 * @param {number} value
 * @param {"w" | "d" | "h" | "m" | "s" | "ms"} startingUnit
 * @param {"w" | "d" | "h" | "m" | "s" | "ms"} resultUnit
 * @returns {number} result
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

/** Save the modData object to file
 */
exports.saveModData = function () {
	exports.saveObject({ modIds: moderatorIds, noAts: exports.noAts }, "modData.json");
}

/** Determines if the id belongs to a moderator
 * @param {string} id
 * @returns {boolean}
 */
exports.isModerator = function (id) {
	return moderatorIds.includes(id);
}

/** Add a user's id to the list of moderator ids
 * @param {string} id
 */
exports.addModerator = function (id) {
	moderatorIds.push(id);
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

// {[type]: {[messageId]: number, [channelId]: number}}
exports.listMessages = require('../config/listMessageIds.json');

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

let petitions = require('../config/petitionList.json');
/** Get the dictionary relating topic petitions to their arrays of petitioner ids
 * @returns {object} {name: User.id[]}
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
 * @returns {{[TextChannel.id]: Club}} { [TextChannel.id]: Club }
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
 */
exports.removeClub = function (id) {
	delete clubDictionary[id];
	exports.saveObject(clubDictionary, 'clubList.json');
}

// {[textChannelId]: timeout}
exports.reminderTimeouts = {};

// {[voiceChannelId]: timeout}
exports.eventTimeouts = {};

// Functions
/** Get the array of all club and topic text channel ids
 * @returns {string[]}
 */
exports.getManagedChannels = function () {
	return exports.getTopicIds().concat(Object.keys(exports.getClubDictionary()));
}

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
 * @param {"topics" | "clubs"} listType
 * @returns {ActionRowBuilder}
 */
function listSelectBuilder(listType) {
	let selectCutomId = "";
	let placeholderText = "";
	let entries = [];

	switch (listType) {
		case "topics":
			selectCutomId = "topicList";

			let topicNames = exports.getTopicNames();
			let topicIds = exports.getTopicIds();
			for (let i = 0; i < topicNames.length; i++) {
				entries.push({
					label: topicNames[i],
					description: "",
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
			for (const petition of Object.keys(exports.getPetitions())) {
				entries.push({
					label: petition,
					description: "",
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

			entries = Object.values(exports.getClubDictionary()).map(club => {
				return {
					label: club.title,
					description: `${club.userIds.length}${club.seats !== -1 ? `/${club.seats}` : ""} Members`,
					value: club.id
				}
			})

			if (entries.length > 0) {
				placeholderText = "Get club details...";
			} else {
				placeholderText = "No clubs yet";
			}
			break;
	}

	return new ActionRowBuilder().addComponents(
		new MessageSelectMenu()
			.setCustomId(selectCutomId)
			.setPlaceholder(placeholderText)
			.setDisabled(disableSelect)
			.addOptions(entries.length > 0 ? entries : [{
				label: "no entries",
				description: "",
				value: "no entries"
			}])
			.setMinValues(1)
			.setMaxValues(entries.length)
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
	let topics = exports.getTopicIds();

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

	//TODONOW use MessageEmbed.length instead
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
				embed.addField("Petitioned Channels", petitionText)
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
			exports.saveObject(exports.listMessages, "listMessageIDs.json");
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
			description += `**Next Meeting**: <t:${club.timeslot.nextMeeting}>${club.timeslot.periodCount === 0 ? "" : ` repeats every ${club.timeslot.periodCount} ${club.timeslot.periodUnits === "w" ? "week(s)" : "day(s)"}`}\n`;
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
exports.pinClubsList = function (channelManager, channel) {
	exports.clubListBuilder(channelManager).then(messageOptions => {
		channel.send(messageOptions).then(message => {
			exports.listMessages.clubs = {
				"messageId": message.id,
				"channelId": message.channelId
			}
			message.pin();
			exports.saveObject(exports.listMessages, "listMessageIDs.json");
		})
	}).catch(console.error);
}

/** Create a topic channel for a petition if it has enough ids
 * @param {Guild} guild
 * @param {string} topicName
 * @param {User} author
 * @returns {void}
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
	if (petitions[topicName].length > guild.memberCount * 0.05) {
		exports.addTopicChannel(guild, topicName);
	} else {
		exports.setPetitions(petitions, guild.channels);
	}
	exports.updateList(guild.channels, "topics");
}

/** Create a topic channel
 * @param {Guild} guild
 * @param {string} topicName
 * @returns {Promise<TextChannel>}
 */
exports.addTopicChannel = function (guild, topicName) {
	return guild.channels.create({
		name: topicName,
		parent: "656186659758407691",
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
		var petitions = exports.getPetitions();
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
			exports.addTopic(channel.id, channel.name);
			exports.saveObject(exports.getTopicIds(), 'topicList.json');
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
		if (!permissionOverwrite || !permissionOverwrite.deny.has("VIEW_CHANNEL", false)) {
			if (exports.getTopicIds().includes(id)) {
				permissionOverwrites.create(user, {
					"VIEW_CHANNEL": true
				}).then(() => {
					channel.send(`Welcome to ${channelName}, ${user}!`);
				}).catch(console.error);
			} else if (Object.keys(exports.getClubDictionary()).includes(id)) {
				let club = exports.getClubDictionary()[id];
				if (club.seats === -1 || club.isRecruiting()) {
					if (club.hostId != user.id && !club.userIds.includes(user.id)) {
						club.userIds.push(user.id);
						permissionOverwrites.create(user, {
							"VIEW_CHANNEL": true
						}).then(() => {
							guild.channels.resolve(club.voiceChannelId).permissionOverwrites.create(user, {
								"VIEW_CHANNEL": true
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

/** Generate the invite MessageOptions
 * @param {Club} club
 * @param {boolean} includeJoinButton
 * @returns {MessageOptions}
 */
exports.clubInviteBuilder = function (club, includeJoinButton) {
	// Generate Embed
	const fields = [{ name: "Club Host", value: `<@${club.hostId}>` }];
	if (club.system) {
		fields.push({ name: "Game", value: club.system });
	}
	if (club.timeslot.nextMeeting) {
		fields.push({
			name: "Next Meeting",
			value: `<t:${club.timeslot.nextMeeting}:F>${club.timeslot.periodCount === 0 ? "" : ` repeats every ${club.timeslot.periodCount} ${club.timeslot.periodUnits === "w" ? "week(s)" : "day(s)"}`}`
		});
	}

	const embed = embedTemplateBuilder()
		.setTitle(`__**${club.title}**__ (${club.userIds.length}${club.seats !== -1 ? `/${club.seats}` : ""} Members)`)
		.setDescription(club.description)
		.addFields(fields)
		.setImage(club.imageURL || null)
		.setColor(club.color || null);

	// Generate Components
	const uiComponents = [];
	if (includeJoinButton) {
		uiComponents.push(new ActionRowBuilder().addComponents(...new ButtonBuilder().setCustomId(`join-${club.id}`).setLabel(`Join ${club.title}`).setStyle("SUCCESS")));
	}

	return { embeds: [embed], components: uiComponents };
}

/** Send the recipient an invitation to the club
 * @param {Interaction} interaction
 * @param {string} clubId
 * @param {User} recipient
 */
exports.clubInvite = function (interaction, clubId, recipient) {
	let club = exports.getClubDictionary()[clubId];
	if (club) {
		if (!recipient) {
			recipient = interaction.user;
		}
		if (!recipient.bot) {
			if (recipient.id !== club.hostId && !club.userIds.includes(recipient.id)) {
				recipient.send(exports.clubInviteBuilder(club, true)).then(() => {
					interaction.reply({ content: "Club details have been sent.", ephemeral: true });
				}).catch(console.error);
			} else {
				interaction.reply({ content: "If the club details are not pinned, the club leader can have them reposted and pinned with `/club-details`.", ephemeral: true })
					.catch(console.error);
			}
		}
	} else {
		interaction.reply({ content: `The club you indicated could not be found. Please check for typos!`, ephemeral: true })
			.catch(console.error);
	}
}

/** Update a club's details embed in the club text channel
 * @param {Club} club
 * @param {TextChannel} channel
 */
exports.updateClubDetails = (club, channel) => {
	channel.messages.fetch(club.detailSummaryId).then(message => {
		const { embeds, components } = exports.clubInviteBuilder(club, false);
		message.edit({ content: "You can send out invites with \`/club-invite\`. Prospective members will be shown the following embed:", embeds, components, fetchReply: true }).then(detailSummaryMessage => {
			detailSummaryMessage.pin();
			club.detailSummaryId = detailSummaryMessage.id;
			exports.updateList(channel.guild.channels, "clubs");
			exports.updateClub(club);
		});
	}).catch(error => {
		if (error.message === "Unknown Message") {
			// message not found
			const { embeds, components } = exports.clubInviteBuilder(club, false);
			channel.send({ content: "You can send out invites with \`/club-invite\`. Prospective members will be shown the following embed:", embeds, components, fetchReply: true }).then(detailSummaryMessage => {
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

/** If the club isn't recruiting or the next meeting time is in the past clear the next meeting time instead of creating a GuildScheduledEvent
 * @param {Club} club
 * @param {Guild} guild
 */
exports.createClubEvent = function (club, guild) {
	if (club.timeslot.nextMeeting * 1000 > Date.now()) {
		guild.channels.fetch(club.voiceChannelId).then(voiceChannel => {
			return guild.scheduledEvents.create({
				name: club.title,
				scheduledStartTime: club.timeslot.nextMeeting * 1000,
				privacyLevel: 2,
				entityType: "VOICE",
				description: club.description,
				channel: voiceChannel
			})
		}).then(event => {
			club.timeslot.setEventId(event.id);
			exports.updateList(guild.channels, "clubs");
			exports.updateClub(club);
		});
	} else {
		club.timeslot.setNextMeeting(null);
		club.timeslot.setEventId("");
		exports.updateList(guild.channels, "clubs");
		exports.updateClub(club);
		console.error(`Skipping scheduling Event in past via ${new Error().stack}`);
	}
}

/** Create a timeout to create a scheduled event for a club after the current event passes
 * @param {Club} club
 * @param {Guild} guild
 */
exports.scheduleClubEvent = function (club, guild) {
	if (club.isRecruiting()) {
		let timeout = setTimeout((clubId, timeoutGuild) => {
			const club = exports.getClubDictionary()[clubId];
			if (club?.isRecruiting()) {
				exports.createClubEvent(club, timeoutGuild);
			}
		}, (club.timeslot.nextMeeting * 1000) - Date.now(), club.id, guild);
		exports.eventTimeouts[club.voiceChannelId] = timeout;
	}
}

/** Delete the scheduled event associated with a club's next meeting
 * @param {string} voiceChannelId
 * @param {string} eventId
 * @param {GuildScheduledEventManager} eventManager
 */
exports.cancelClubEvent = function (voiceChannelId, eventId, eventManager) {
	if (eventId) {
		eventManager.delete(eventId);
	}
	if (exports.eventTimeouts[voiceChannelId]) {
		clearTimeout(exports.eventTimeouts[voiceChannelId]);
		delete exports.eventTimeouts[voiceChannelId];
	}
}

/** Set a timeout to send a reminder message to the given club a day before its next meeting
 * @param {Club} club
 * @param {ChannelManager} channelManager
 */
exports.setClubReminder = async function (club, channelManager) {
	if (club.timeslot.nextMeeting) {
		let timeout = setTimeout(
			reminderWaitLoop,
			calculateReminderMS(club.timeslot.nextMeeting),
			club,
			channelManager);
		exports.reminderTimeouts[club.id] = timeout;
		exports.updateList(channelManager, "clubs");
		exports.updateClub(club);
	}
}

/** The number of ms until a day before the next meeting, but not more than the max allowable setTimeout duration
 * @param {number} timestamp The unix timestamp of the next meeting (in seconds)
 * @returns
 */
function calculateReminderMS(timestamp) {
	return Math.min((timestamp * 1000) - exports.timeConversion(1, "d", "ms") - Date.now(), MAX_SIGNED_INT);
}

/** If the club reminder would be set for further than the a max signed int ms in the future (max allowable setTimeout duration), try to set the club reminder again later
 * @param {Club} club
 * @param {ChannelManager} channelManager
 */
function reminderWaitLoop(club, channelManager) {
	if (club.timeslot.nextMeeting) {
		if (calculateReminderMS(club.timeslot.nextMeeting) < MAX_SIGNED_INT) {
			channelManager.fetch(club.id).then(async textChannel => {
				const components = [];
				let invite;
				if (club.timeslot.eventId) {
					invite = await (await channelManager.guild.scheduledEvents.fetch(club.timeslot.eventId)).channel.createInvite();
				}
				if (invite?.url) {
					components.push(new ActionRowBuilder().addComponents(
						new ButtonBuilder()
							.setLabel("Join Voice")
							.setStyle("LINK")
							.setURL(invite.url)
					))
				}
				textChannel.send({
					content: `@everyone ${club.timeslot.message ? club.timeslot.message : `Reminder: This club about this time tomorrow (<t:${club.timeslot.nextMeeting}:t>)!`}`,
					components
				});
			});
			if (club.timeslot.periodCount) {
				const timeGap = exports.timeConversion(club.timeslot.periodCount, club.timeslot.periodUnits, "s");
				club.timeslot.setNextMeeting(club.timeslot.nextMeeting + timeGap);
				exports.scheduleClubEvent(club, channelManager.guild);
				exports.setClubReminder(club, channelManager);
			} else {
				club.timeslot.setEventId("");
				exports.updateList(channelManager, "clubs");
				exports.updateClub(club, channelManager);
			}
		} else {
			exports.setClubReminder(club, channelManager);
		}
	}
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

/** Stringify an entity to JSON then save it at `.\Config\${fileName}`
 * @param {*} entity
 * @param {string} fileName
 */
exports.saveObject = function (entity, fileName) {
	var filePath = `./`;
	filePath += 'Config/' + fileName;
	if (!fs.existsSync('./Config')) {
		fs.mkdirSync('./Config');
	}
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

/** The version embed should contain the last version's changes, known issues, and project links
 * @returns {EmbedBuilder}
 */
exports.versionEmbedBuilder = function () {
	return fs.promises.readFile('./ChangeLog.md', { encoding: 'utf8' }).then(data => {
		const dividerRegEx = /####/g;
		const changesStartRegEx = /\.\d+:/g;
		const knownIssuesStartRegEx = /### Known Issues/g;
		let titleStart = dividerRegEx.exec(data).index;
		changesStartRegEx.exec(data);
		let knownIssuesStart;
		let knownIssueStartResult = knownIssuesStartRegEx.exec(data);
		if (knownIssueStartResult) {
			knownIssuesStart = knownIssueStartResult.index;
		}
		let knownIssuesEnd = dividerRegEx.exec(data).index;

		let embed = embedTemplateBuilder()
			.setTitle(data.slice(titleStart + 5, changesStartRegEx.lastIndex))
			.setURL('https://discord.gg/bcE3Syu')
			.setThumbnail('https://cdn.discordapp.com/attachments/545684759276421120/734099622846398565/newspaper.png')
			.setFooter(randomEmbedFooter());

		if (knownIssuesStart && knownIssuesStart < knownIssuesEnd) {
			// Known Issues section found
			embed.setDescription(data.slice(changesStartRegEx.lastIndex, knownIssuesStart))
				.addField(`Known Issues`, data.slice(knownIssuesStart + 16, knownIssuesEnd))
		} else {
			// Known Issues section not found
			embed.setDescription(data.slice(changesStartRegEx.lastIndex, knownIssuesEnd));
		}

		return embed.addFields({ name: "Other Discord Bots", value: "Check out other Imaginary Horizons Productions bots or commission your own on the [IHP GitHub](https://github.com/Imaginary-Horizons-Productions)" });
	})
}
