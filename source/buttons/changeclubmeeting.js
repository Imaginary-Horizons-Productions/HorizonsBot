const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const Button = require('../classes/Button.js');
const { SAFE_DELIMITER } = require('../constants.js');
const { getClubDictionary } = require('../engines/referenceEngine.js');

const id = "changeclubmeeting";
module.exports = new Button(id, 3000,
	/** Opens a modal to change the meeting time/repetition the club */
	(interaction, [clubId]) => {
		const club = getClubDictionary()[clubId];
		const modal = new ModalBuilder().setCustomId(`${id}${SAFE_DELIMITER}${clubId}`)
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
	});
