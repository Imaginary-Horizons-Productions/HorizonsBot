const { Interaction } = require('discord.js');
const ModalSubmission = require('../classes/ModalSubmission.js');
const { getClubDictionary, updateClub, updateClubDetails, updateList, clubInviteBuilder } = require('../helpers.js');

const id = "setclub";
module.exports = new ModalSubmission(id, //TODONOW split per button
	/** Set the given properties for the club with provided id
	 * @param {Interaction} interaction
	 * @param {Array<string>} args
	 */
	async (interaction, [clubId]) => {
		const club = getClubDictionary()[clubId];
		const { fields } = interaction;
		const errors = {};

		if (fields.fields.has("title")) {
			const titleInput = fields.getTextInputValue("title");
			club.title = titleInput;
			const textChannel = await interaction.guild.channels.fetch(club.id);
			textChannel.setName(titleInput);
			const voiceChannel = await interaction.guild.channels.fetch(club.voiceChannelId);
			voiceChannel.setName(titleInput + " Voice")
		}
		if (fields.fields.has("description")) {
			const descriptionInput = fields.getTextInputValue("description");
			club.description = descriptionInput;
			const textChannel = await interaction.guild.channels.fetch(club.id);
			textChannel.setTopic(descriptionInput);
		}
		["system", "imageURL", "color"].forEach(simpleStringKey => {
			if (fields.fields.has(simpleStringKey)) {
				const value = fields.getTextInputValue(simpleStringKey);
				club[simpleStringKey] = value;
			}
		});
		["seats"].forEach(simpleIntegerKey => {
			if (fields.fields.has(simpleIntegerKey)) {
				const unparsedValue = fields.getTextInputValue(simpleIntegerKey);
				const value = parseInt(unparsedValue);
				if (value) {
					club[simpleIntegerKey] = value;
				} else {
					errors[simpleIntegerKey] = `Could not interpret ${unparsedValue} as integer`;
				}
			}
		})
		//TODONOW isRecruiting (cast to boolean)
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
