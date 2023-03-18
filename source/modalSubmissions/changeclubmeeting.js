const { Interaction } = require('discord.js');
const ModalSubmission = require('../classes/ModalSubmission.js');
const { clubEmbedBuilder } = require('../engines/messageEngine.js');
const { getClubDictionary, updateClub, updateClubDetails, updateList, clearClubReminder, cancelClubEvent, setClubReminder, createClubEvent, scheduleClubEvent } = require('../helpers.js');

const YEAR_IN_MS = 31556926000;

const id = "changeclubmeeting";
module.exports = new ModalSubmission(id,
	/** Set the meeting time/repetition properties for the club with provided id
	 * @param {Interaction} interaction
	 * @param {Array<string>} args
	 */
	async (interaction, [clubId]) => {
		const club = getClubDictionary()[clubId];
		const { fields } = interaction;
		const errors = {};

		if (fields.fields.has("nextMeeting")) {
			const unparsedValue = fields.getTextInputValue("nextMeeting");
			const nextMeetingInput = parseInt(unparsedValue);
			if (!nextMeetingInput) {
				errors.nextMeeting = `The timestamp given for the next meeting (${unparsedValue}) could not be interpreted as an integer.`;
			} else {
				const now = Date.now();
				if (now > nextMeetingInput * 1000) {
					errors.nextMeeting = `The timestamp given for the next meeting (${nextMeetingInput}) is in the past.`;
				} else if (nextMeetingInput * 1000 > now + (5 * YEAR_IN_MS)) {
					errors.nextMeeting = "Discord does not allow the creation of events 5 years in the future. Please schedule your next meeting later.";
				} else {
					club.timeslot.setNextMeeting(nextMeetingInput);
					clearClubReminder(club.id);
					cancelClubEvent(club, interaction.guild.scheduledEvents);

					await createClubEvent(club, interaction.guild);
					if (club.isRecruiting() && club.timeslot.periodCount) {
						scheduleClubEvent(club, interaction.guild);
					}
					setClubReminder(club, interaction.guild.channels);
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
			if (periodCountInput) {
				club.timeslot.periodCount = periodCountInput;
			} else {
				errors.periodCount = `Could not interpret ${unparsedValue} as integer`;
			}
		}
		if (fields.fields.has("periodUnits")) {
			const periodUnitsInput = fields.getTextInputValue("periodUnits");
			if (["days", "weeks"].includes(periodUnitsInput)) {
				club.timeslot.periodUnits = periodUnitsInput;
			} else {
				errors.periodUnits = `Input ${periodUnitsInput} did not match "days" or "weeks"`;
			}
		}
		updateClubDetails(club, interaction.channel);
		updateList(interaction.guild.channels, "clubs");
		updateClub(club);

		const payload = { embeds: [clubEmbedBuilder(club)] };
		if (Object.keys(errors).length > 0) {
			payload.content = Object.keys(errors).reduce((errorMessage, field) => {
				return errorMessage + `${field} - ${errors[field]}`
			}, "The following settings were not set because they encountered errors:\n")
		}
		interaction.update(payload);
	});
