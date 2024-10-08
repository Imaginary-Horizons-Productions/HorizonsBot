const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { ButtonWrapper } = require('../classes');
const { getClubDictionary, updateClub, updateListReference } = require('../engines/referenceEngine.js');
const { updateClubDetails, cancelClubEvent, createClubEvent, scheduleClubReminderAndEvent, clearClubReminder } = require('../engines/clubEngine.js');
const { clubEmbedBuilder } = require('../engines/messageEngine.js');
const { timeConversion } = require('../util/mathUtil.js');
const { SKIP_INTERACTION_HANDLING, SAFE_DELIMITER } = require('../constants.js');

const YEAR_IN_MS = 31556926000;

const mainId = "changeclubmeeting";
module.exports = new ButtonWrapper(mainId, 3000,
	/** Set the meeting time/repetition properties for the club with provided id */
	(interaction, [clubId]) => {
		const club = getClubDictionary()[clubId];
		const modalCustomId = `${SKIP_INTERACTION_HANDLING}${SAFE_DELIMITER}${interaction.id}`;
		const modal = new ModalBuilder().setCustomId(modalCustomId)
			.setTitle("Club Meeting Time Settings")
			.addComponents(
				new ActionRowBuilder().addComponents(
					new TextInputBuilder().setCustomId("nextMeeting")
						.setLabel("Schedule Next Meeting")
						.setValue(club.timeslot.nextMeeting?.toString() ?? "")
						.setStyle(TextInputStyle.Short)
						.setMaxLength(10) // number of digits in 2^32
						.setRequired(false)
						.setPlaceholder("The Unix Timestamp (seconds since Jan 1st 1970)")
				),
				new ActionRowBuilder().addComponents(
					new TextInputBuilder().setCustomId("message")
						.setLabel("Reminder Message")
						.setValue(club.timeslot.message ?? "")
						.setStyle(TextInputStyle.Paragraph)
						.setMaxLength(1990)
						.setRequired(false)
						.setPlaceholder("Default: 'Reminder: This club will meet at <timezone converted time> tomorrow! <Link to voice>'")
				),
				new ActionRowBuilder().addComponents(
					new TextInputBuilder().setCustomId("periodCount")
						.setLabel("Repeating Meetings Count")
						.setValue((club.timeslot.periodCount ?? "").toString())
						.setStyle(TextInputStyle.Short)
						.setMaxLength(1024)
						.setRequired(false)
						.setPlaceholder('The number part of "every X days/weeks"')
				),
				new ActionRowBuilder().addComponents(
					new TextInputBuilder().setCustomId("periodUnit")
						.setLabel("Repeating Meetings Unit")
						.setValue(club.timeslot.periodUnits ?? "")
						.setStyle(TextInputStyle.Short)
						.setRequired(false)
						.setPlaceholder('"days" or "weeks"')
				)
			);
		interaction.showModal(modal);
		interaction.awaitModalSubmit({ filter: submission => submission.customId === modalCustomId, time: timeConversion(5, "m", "ms") }).then(modalSubmission => {
			const { fields } = modalSubmission;
			const errors = {};

			if (fields.fields.has("nextMeeting")) {
				const unparsedValue = fields.getTextInputValue("nextMeeting");
				if (unparsedValue) {
					const nextMeetingInput = parseInt(unparsedValue);
					if (!nextMeetingInput) {
						errors.nextMeeting = `The timestamp given for the next meeting (${unparsedValue}) could not be interpreted as an integer.`;
					} else {
						const now = Date.now();
						if (now > nextMeetingInput * 1000) {
							errors.nextMeeting = `The timestamp given for the next meeting (${nextMeetingInput}) is in the past (<t:${nextMeetingInput}>).`;
						} else if (nextMeetingInput * 1000 > now + (5 * YEAR_IN_MS)) {
							errors.nextMeeting = "Discord does not allow the creation of events 5 years in the future. Please schedule your next meeting later.";
						} else {
							club.timeslot.setNextMeeting(nextMeetingInput);
						}
					}
				}

				if (errors.nextMeeting) {
					club.timeslot.setNextMeeting(null);
					club.timeslot.setEventId(null);
				}
			}
			if (fields.fields.has("message")) {
				const reminderMessageInput = fields.getTextInputValue("message");
				club.timeslot.message = reminderMessageInput;
			}
			if (fields.fields.has("periodCount")) {
				const unparsedValue = fields.getTextInputValue("periodCount");
				const periodCountInput = parseInt(unparsedValue);
				if (!isNaN(periodCountInput)) {
					club.timeslot.periodCount = periodCountInput;
				} else if (unparsedValue === "" || unparsedValue === "0") {
					club.timeslot.periodCount = 0;
				} else {
					errors.periodCount = `Could not interpret ${unparsedValue} as integer`;
				}
			}
			if (fields.fields.has("periodUnit")) {
				const periodUnitsInput = fields.getTextInputValue("periodUnit");
				if (["days", "weeks"].includes(periodUnitsInput.toLowerCase())) {
					club.timeslot.periodUnits = periodUnitsInput;
				} else {
					errors.periodUnits = `Input ${periodUnitsInput} did not match "days" or "weeks"`;
				}
			}

			cancelClubEvent(club, modalSubmission.guild.scheduledEvents);
			createClubEvent(club, modalSubmission.guild);
			clearClubReminder(club.id);
			scheduleClubReminderAndEvent(club.id, club.timeslot.nextMeeting, modalSubmission.guild.channels);

			updateClubDetails(club, modalSubmission.channel);
			updateListReference(modalSubmission.guild.channels, "club");
			updateClub(club);

			const payload = { embeds: [clubEmbedBuilder(club)] };
			if (Object.keys(errors).length > 0) {
				payload.content = Object.keys(errors).reduce((errorMessage, field) => {
					return errorMessage + `${field} - ${errors[field]}`
				}, "The following settings were not set because they encountered errors:\n")
			} else {
				payload.content = "";
			}
			modalSubmission.update(payload);
		}).catch(console.error);
	}
);
