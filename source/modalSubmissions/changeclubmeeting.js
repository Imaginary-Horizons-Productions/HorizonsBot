const { Interaction } = require('discord.js');
const ModalSubmission = require('../classes/ModalSubmission.js');
const { getClubDictionary, updateClub, updateClubDetails, updateList, clubInviteBuilder } = require('../helpers.js');

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

		if (fields.fields.has("timeslot.nextMeeting")) {
			const unparsedValue = fields.getTextInputValue("timeslot.nextMeeting");
			const nextMeetingInput = parseInt(unparsedValue);
			if (nextMeetingInput) {
				club.timeslot.nextMeeting = nextMeetingInput;
			} else {
				errors["timeslot.nextMeeting"] = `Could not interpret ${unparsedValue} as integer`;
			}
		}
		if (fields.fields.has("timeslot.message")) {
			const reminderMessageInput = fields.getTextInputValue("timeslot.message");
			club.timeslot.message = reminderMessageInput;
		}
		if (fields.fields.has("timeslot.periodCount")) {
			const unparsedValue = fields.getTextInputValue("timeslot.periodCount");
			const periodCountInput = parseInt(unparsedValue);
			if (periodCountInput) {
				club.timeslot.periodCount = periodCountInput;
			} else {
				errors["timeslot.periodCount"] = `Could not interpret ${unparsedValue} as integer`;
			}
		}
		if (fields.fields.has("timeslot.periodUnits")) {
			const periodUnitsInput = fields.getTextInputValue("timeslot.periodUnits");
			if (["d", "w"].includes(periodUnitsInput)) {
				club.timeslot.periodUnits = periodUnitsInput;
			} else {
				errors["timeslot.periodUnits"] = `Input ${periodUnitsInput} did not match "d" (days) or "w" (weeks)`;
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