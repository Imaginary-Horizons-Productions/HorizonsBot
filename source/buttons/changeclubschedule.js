const { ModalBuilder, TextInputBuilder, TextInputStyle, LabelBuilder, StringSelectMenuBuilder } = require('discord.js');
const { ButtonWrapper } = require('../classes/index.js');
const { updateClub, getClub, updateListReference } = require('../engines/referenceEngine.js');
const { updateClubDetails, cancelClubRecruitmentEvent, createClubRecruitmentEvent, scheduleClubReminder, clearClubReminder } = require('../engines/clubEngine.js');
const { timeConversion } = require('../util/mathUtil.js');
const { SKIP_INTERACTION_HANDLING, SAFE_DELIMITER } = require('../constants.js');
const { butIgnoreInteractionCollectorErrors } = require('../util/dAPIResponses.js');
const { clubEmbedBuilder } = require('../engines/messageEngine.js');

const YEAR_IN_MS = 31556926000;

const mainId = "changeclubschedule";
module.exports = new ButtonWrapper(mainId, 3000,
	/** Set the meeting time, repeat type, or reminder message for the club with provided id */
	(interaction, [clubId]) => {
		const club = getClub(clubId);
		const labelNextMeeting = "Next Meeting Timestamp";
		const inputIdNextMeeting = "next-meeting";
		const labelRepeatType = "Repeat Type";
		const inputIdRepeatType = "repeat-type";
		const noRepeatValue = "no-repeat";
		const modal = new ModalBuilder().setCustomId(`${SKIP_INTERACTION_HANDLING}${SAFE_DELIMITER}${interaction.id}`)
			.setTitle("Change Club Schedule")
			.addLabelComponents(
				new LabelBuilder().setLabel(labelNextMeeting)
					.setDescription("Formatted as a Unix Timestamp (the seconds since Jan 1st 1970). Leave empty to turn off.")
					.setTextInputComponent(
						new TextInputBuilder().setCustomId(inputIdNextMeeting)
							.setValue(club.timeslot.nextMeeting?.toString() ?? "")
							.setStyle(TextInputStyle.Short)
							.setMaxLength(10) // number of digits in 2^32
							.setRequired(false)
					),
				new LabelBuilder().setLabel(labelRepeatType)
					.setStringSelectMenuComponent(
						new StringSelectMenuBuilder().setCustomId(inputIdRepeatType)
							.setOptions({ label: "Every week", value: "weekly", default: club.timeslot.repeatType === "weekly" }, { label: "Does not repeat", value: noRepeatValue, default: club.timeslot.repeatType === null })
					)
			);
		interaction.showModal(modal);
		interaction.awaitModalSubmit({ filter: submission => submission.customId === modal.data.custom_id, time: timeConversion(5, "m", "ms") }).then(modalSubmission => {
			const unparsedNextMeeting = modalSubmission.fields.getTextInputValue(inputIdNextMeeting);
			const [unparsedRepeatType] = modalSubmission.fields.getStringSelectValues(inputIdRepeatType);

			const nextMeetingInput = unparsedNextMeeting === "" ? null : parseInt(unparsedNextMeeting);
			const repeatTypeInput = unparsedRepeatType === noRepeatValue ? null : unparsedRepeatType;

			const errors = {};
			const didValuesChange = nextMeetingInput !== club.timeslot.nextMeeting || repeatTypeInput !== club.timeslot.repeatType;

			if (nextMeetingInput === NaN) {
				errors[labelNextMeeting] = `The timestamp given for the next meeting (${unparsedNextMeeting}) could not be interpreted as an integer.`;
			} else if (nextMeetingInput !== null) {
				const now = Date.now();
				if (now > nextMeetingInput * 1000) {
					errors[labelNextMeeting] = `The timestamp given for the next meeting (${nextMeetingInput}) is in the past (<t:${nextMeetingInput}>).`;
				} else if (nextMeetingInput * 1000 > now + (5 * YEAR_IN_MS)) {
					errors[labelNextMeeting] = "Discord does not allow the creation of events further than 5 years in the future.";
				}
			}

			if (repeatTypeInput === "weekly" && !nextMeetingInput) {
				errors[labelRepeatType] = `Setting weekly repeating meetings requires a ${labelNextMeeting} to know what day to repeat on.`;
			}

			if (didValuesChange) {
				cancelClubRecruitmentEvent(club, modalSubmission.guild.scheduledEvents);
				clearClubReminder(club.id);
			}

			if (!(labelNextMeeting in errors)) {
				club.timeslot.nextMeeting = nextMeetingInput;
				if (nextMeetingInput === null) {
					club.timeslot.eventId = null;
				}
			}

			if (!(labelRepeatType in errors)) {
				club.timeslot.repeatType = repeatTypeInput;
			}

			if (didValuesChange) {
				createClubRecruitmentEvent(club, modalSubmission.guild);
				scheduleClubReminder(club.id, club.timeslot.nextMeeting, modalSubmission.guild.channels);
				updateClubDetails(club, modalSubmission.channel);
				updateListReference(modalSubmission.guild.channels, "club");
				updateClub(club);
			}

			const payload = { embeds: [clubEmbedBuilder(club)] };
			if (Object.keys(errors).length > 0) {
				payload.content = Object.keys(errors).reduce((errorMessage, field) => {
					return errorMessage + `${field} - ${errors[field]}`
				}, "The following settings were not set because they encountered errors:\n")
			} else {
				payload.content = "";
			}
			modalSubmission.update(payload);
		}).catch(butIgnoreInteractionCollectorErrors);
	}
);
