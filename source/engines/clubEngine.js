const { Guild, ActionRowBuilder, ButtonBuilder, ButtonStyle, GuildScheduledEventEntityType } = require("discord.js");
const { Club } = require("../classes");
const { timeConversion } = require("../helpers.js");
const { getClubDictionary, updateClub, updateList } = require("./referenceEngine.js");
const { clubEmbedBuilder } = require("./messageEngine.js");
const { MAX_SET_TIMEOUT, SAFE_DELIMITER } = require("../constants.js");

/** @type {{[clubId: string]: NodeJS.Timeout}} */
const reminderTimeouts = {};

/** Update a club's details embed in the club text channel
 * @param {Club} club
 * @param {TextChannel} channel
 */
function updateClubDetails(club, channel) {
	channel.messages.fetch(club.detailSummaryId).then(message => {
		message.edit({ content: "You can send out invites with \`/club-invite\`. Prospective members will be shown the following embed:", embeds: [clubEmbedBuilder(club)], fetchReply: true }).then(detailSummaryMessage => {
			detailSummaryMessage.pin();
			club.detailSummaryId = detailSummaryMessage.id;
			updateList(channel.guild.channels, "club");
			updateClub(club);
		});
	}).catch(error => {
		if (error.message === "Unknown Message") {
			// message not found
			channel.send({ content: "You can send out invites with \`/club-invite\`. Prospective members will be shown the following embed:", embeds: [clubEmbedBuilder(club)], fetchReply: true }).then(detailSummaryMessage => {
				detailSummaryMessage.pin();
				club.detailSummaryId = detailSummaryMessage.id;
				updateList(channel.guild.channels, "club");
				updateClub(club);
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
function createClubEvent(club, guild) {
	if (club.isRecruiting() && club.timeslot.nextMeeting) {
		return guild.channels.fetch(club.voiceChannelId).then(voiceChannel => {
			const eventPayload = {
				name: club.title,
				scheduledStartTime: club.timeslot.nextMeeting * 1000,
				privacyLevel: 2,
				entityType: GuildScheduledEventEntityType.Voice,
				description: club.description,
				channel: voiceChannel
			};
			if (club.imageURL) {
				eventPayload.image = club.imageURL;
			}
			return guild.scheduledEvents.create(eventPayload);
		}).then(event => {
			club.timeslot.setEventId(event.id);
			updateList(guild.channels, "club");
			updateClub(club);
		});
	}
}

/** Delete the scheduled event associated with a club's next meeting
 * @param {Club} club
 * @param {GuildScheduledEventManager} eventManager
 */
function cancelClubEvent(club, eventManager) {
	if (club.timeslot.eventId) {
		eventManager.delete(club.timeslot.eventId).catch(console.error);
		club.timeslot.setEventId(null);
	}
}

/** scheduled actions: send a reminder about the upcoming meeting to the club and create a scheduled event for the meeting after that
 * @param {string} clubId
 * @param {number | null} nextMeetingTimestamp
 * @param {ChannelManager} channelManager
 */
async function scheduleClubReminderAndEvent(clubId, nextMeetingTimestamp, channelManager) {
	let timeout;
	const msToTimestamp = (nextMeetingTimestamp - timeConversion(1, "d", "s")) * 1000 - Date.now();
	if (msToTimestamp <= MAX_SET_TIMEOUT) {
		timeout = setTimeout(
			async (clubId, channelManager) => {
				const club = getClubDictionary()[clubId];
				if (club?.timeslot.nextMeeting) {
					await sendClubReminder(clubId, channelManager);
					if (club.timeslot.periodCount && club.timeslot.periodUnits) {
						const nextTimestamp = club.timeslot.nextMeeting + timeConversion(club.timeslot.periodCount, club.timeslot.periodUnits === "weeks" ? "w" : "d", "s");
						club.timeslot.setNextMeeting(nextTimestamp);
						await createClubEvent(club, channelManager.guild);
						const clubTextChannel = await channelManager.fetch(club.id);
						updateClubDetails(club, clubTextChannel);
						scheduleClubReminderAndEvent(clubId, nextTimestamp, channelManager);
					} else {
						delete reminderTimeouts[clubId];
						club.timeslot.setNextMeeting(null);
						cancelClubEvent(club, channelManager.guild.scheduledEvents);
						updateClub(club);
					}
					updateList(channelManager, "club");
				}
			},
			msToTimestamp,
			clubId,
			channelManager);
	} else {
		timeout = setTimeout(() => {
			scheduleClubReminderAndEvent(clubId, nextMeetingTimestamp, channelManager);
		}, MAX_SET_TIMEOUT);
	}
	reminderTimeouts[clubId] = timeout;
}

/** Send a club reminder message
 * @param {string} clubId
 * @param {ChannelManager} channelManager
 */
async function sendClubReminder(clubId, channelManager) {
	const club = getClubDictionary()[clubId];
	const textChannel = await channelManager.fetch(clubId);
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
						customId: `startevent${SAFE_DELIMITER}${club.timeslot.eventId}`,
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
async function clearClubReminder(channelId) {
	if (channelId in reminderTimeouts) {
		clearTimeout(reminderTimeouts[channelId]);
		delete reminderTimeouts[channelId];
	}
}

module.exports = {
	updateClubDetails,
	createClubEvent,
	cancelClubEvent,
	scheduleClubReminderAndEvent,
	sendClubReminder,
	clearClubReminder
};
