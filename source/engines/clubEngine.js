const { Guild, ActionRowBuilder, ButtonBuilder, ButtonStyle, GuildScheduledEventEntityType, TextChannel, channelMention, time, GuildScheduledEventPrivacyLevel, GuildScheduledEventRecurrenceRuleFrequency } = require("discord.js");
const { Club } = require("../classes");
const { timeConversion } = require("../util/mathUtil.js");
const { updateClub, updateListReference, getClub } = require("./referenceEngine.js");
const { clubEmbedBuilder } = require("./messageEngine.js");
const { MAX_SET_TIMEOUT, SAFE_DELIMITER } = require("../constants.js");
const { commandMention, collapseTextToLength } = require("../util/textUtil.js");

/** @type {{[clubId: string]: NodeJS.Timeout}} */
const reminderTimeouts = {};

/** Update a club's details embed in the club text channel
 * @param {Club} club
 * @param {TextChannel} channel
 */
function updateClubDetails(club, channel) {
	channel.messages.fetch(club.detailSummaryId).then(message => {
		message.edit({ content: `You can send out invites with ${commandMention("club-invite")}. Prospective members will be shown the following embed:`, embeds: [clubEmbedBuilder(club)] });
	}).catch(error => {
		if (error.message === "Unknown Message") {
			// message not found
			channel.send({ content: `You can send out invites with ${commandMention("club-invite")}. Prospective members will be shown the following embed:`, embeds: [clubEmbedBuilder(club)] }).then(detailSummaryMessage => {
				detailSummaryMessage.pin();
				club.detailSummaryId = detailSummaryMessage.id;
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
function createClubRecruitmentEvent(club, guild) {
	if (club.getMembershipStatus() === "recruiting" && club.timeslot.nextMeeting) {
		return guild.channels.fetch(club.voiceChannelId).then(voiceChannel => {
			const startTime = club.timeslot.nextMeeting * 1000;
			const eventPayload = {
				name: collapseTextToLength(`Looking for Members! ${club.name}`, 100),
				scheduledStartTime: startTime,
				privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
				entityType: GuildScheduledEventEntityType.Voice,
				description: club.description,
				channel: voiceChannel
			};
			if (club.imageURL) {
				eventPayload.image = club.imageURL;
			}
			if (club.timeslot.repeatType === "weekly") {
				const nextMeetingDate = new Date(startTime);
				const discordDayOfWeek = (nextMeetingDate.getDay() + 6) % 7;
				eventPayload.recurrenceRule = {
					startAt: startTime,
					frequency: GuildScheduledEventRecurrenceRuleFrequency.Weekly,
					interval: 1,
					by_weekday: [discordDayOfWeek]
				};
			}

			return guild.scheduledEvents.create(eventPayload);
		}).then(event => {
			club.timeslot.eventId = event.id;
			updateClub(club);
		});
	}
}

/** Delete the scheduled event associated with a club's next meeting
 * @param {Club} club
 * @param {GuildScheduledEventManager} eventManager
 */
function cancelClubRecruitmentEvent(club, eventManager) {
	if (club.timeslot.eventId) {
		eventManager.delete(club.timeslot.eventId).catch(console.error);
		club.timeslot.eventId = null;
		updateClub(club);
	}
}

/** scheduled actions: send a reminder about the upcoming meeting to the club and create a scheduled event for the meeting after that
 * @param {string} clubId
 * @param {number | null} nextMeetingTimestamp
 * @param {ChannelManager} channelManager
 */
async function scheduleClubReminder(clubId, nextMeetingTimestamp, channelManager) {
	if (!nextMeetingTimestamp) {
		return;
	}
	const msToTimestamp = (nextMeetingTimestamp - timeConversion(1, "d", "s")) * 1000 - Date.now();
	if (msToTimestamp < 1) {
		return;
	}
	if (msToTimestamp <= MAX_SET_TIMEOUT) {
		reminderTimeouts[clubId] = setTimeout(
			async (clubId, channelManager) => {
				const club = getClub(clubId);
				if (club?.timeslot.nextMeeting) {
					await sendClubReminder(clubId, channelManager);
					switch (club.timeslot.repeatType) {
						case "weekly":
							const nextTimestamp = club.timeslot.nextMeeting + timeConversion(1, "w", "s");
							club.timeslot.nextMeeting = nextTimestamp;
							scheduleClubReminder(clubId, nextTimestamp, channelManager);
							break;
						default:
							delete reminderTimeouts[clubId];
							club.timeslot.nextMeeting = null;
					}
					updateClub(club);
					updateClubDetails(club, await channelManager.fetch(club.id));
					updateListReference(channelManager, "club");
				}
			},
			msToTimestamp,
			clubId,
			channelManager);
	} else {
		reminderTimeouts[clubId] = setTimeout(() => {
			scheduleClubReminder(clubId, nextMeetingTimestamp, channelManager);
		}, MAX_SET_TIMEOUT);
	}
}

/** Send a club reminder message
 * @param {string} clubId
 * @param {ChannelManager} channelManager
 */
async function sendClubReminder(clubId, channelManager) {
	const club = getClub(clubId);
	const textChannel = await channelManager.fetch(clubId);
	const reminderPayload = { content: `@everyone Reminder: This club will meet at ${time(club.timeslot.nextMeeting)} tomorrow! ${channelMention(club.voiceChannelId)}` };
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
	createClubRecruitmentEvent,
	cancelClubRecruitmentEvent,
	scheduleClubReminder,
	sendClubReminder,
	clearClubReminder
};
