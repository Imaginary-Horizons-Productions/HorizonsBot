const { Interaction } = require('discord.js');
const ModalSubmission = require('../classes/ModalSubmission.js');
const { getClubDictionary, updateClub, updateClubDetails, updateList, clubInviteBuilder, clearClubReminder, cancelClubEvent, setClubReminder, createClubEvent, scheduleClubEvent } = require('../helpers.js');

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
			if (nextMeetingInput) {
				club.timeslot.setNextMeeting(nextMeetingInput);
				clearClubReminder(club.id);
				cancelClubEvent(club.voiceChannelId, club.timeslot.eventId, interaction.guild.scheduledEvents);
				setClubReminder(club, interaction.guild.channels);
				createClubEvent(club, interaction.guild);
				if (club.timeslot.periodCount && club.isRecruiting()) {
					scheduleClubEvent(club, interaction.guild);
				}
			} else {
				errors["nextMeeting"] = `Could not interpret ${unparsedValue} as integer`;
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
				errors["periodCount"] = `Could not interpret ${unparsedValue} as integer`;
			}
		}
		if (fields.fields.has("periodUnits")) {
			const periodUnitsInput = fields.getTextInputValue("periodUnits");
			if (["days", "weeks"].includes(periodUnitsInput)) {
				club.timeslot.periodUnits = periodUnitsInput;
			} else {
				errors["periodUnits"] = `Input ${periodUnitsInput} did not match "days" or "weeks"`;
			}
		}
		updateClubDetails(club, interaction.channel);
		updateList(interaction.guild.channels, "clubs");
		updateClub(club);

		const { embeds } = clubInviteBuilder(club, false);
		const payload = { embeds };
		if (Object.keys(errors).length > 0) {
			payload.content = Object.keys(errors).reduce((errorMessage, field) => {
				return errorMessage + `${field} - ${errors[field]}`
			}, "The following settings were not set because they encountered errors:\n")
		}
		interaction.update(payload);
	});
