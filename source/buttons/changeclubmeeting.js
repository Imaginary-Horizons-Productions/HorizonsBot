const { Interaction, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const Button = require('../classes/Button.js');
const { SAFE_DELIMITER } = require('../constants.js');
const { getClubDictionary } = require('../helpers.js');

const id = "changeclubmeeting";
module.exports = new Button(id,
	/** Opens a modal to change the meeting time/repetition the club
	 * @param {Interaction} interaction
	 * @param {Array<string>} args
	 */
	(interaction, [clubId]) => {
		const club = getClubDictionary()[clubId];
		const modal = new ModalBuilder().setCustomId(`setclub${SAFE_DELIMITER}${clubId}`)
			.setTitle("Club Meeting Time Settings")
			.addComponents(
				new ActionRowBuilder().addComponents(
					new TextInputBuilder().setCustomId("nextMeeting")
						.setLabel("Schedule Next Meeting")
						.setValue(club.timeslot.nextMeeting)
						.setStyle(TextInputStyle.Short)
						.setMinLength(1)
						.setMaxLength(100)
						.setRequired(false)
						.setPlaceholder("The Unix Timestamp (seconds since Jan 1st 1970)")
				),
				new ActionRowBuilder().addComponents(
					new TextInputBuilder().setCustomId("message")
						.setLabel("Reminder Message")
						.setValue(club.timeslot.message)
						.setStyle(TextInputStyle.Paragraph)
						.setMaxLength(1990)
						.setRequired(false)
						.setPlaceholder("Default Message - Reminder: This club about this time tomorrow (<timezone converted time>)! <Link to voice channel>") //TODONOW mention voice channel instead of button
				),
				new ActionRowBuilder().addComponents(
					new TextInputBuilder().setCustomId("periodCount")
						.setLabel("Repeating Meetings Count")
						.setValue(club.timeslot.periodCount)
						.setStyle(TextInputStyle.Short)
						.setMaxLength(1024)
						.setRequired(false)
						.setPlaceholder('The number part of "every X days/weeks"')
				),
				new ActionRowBuilder().addComponents(
					new TextInputBuilder().setCustomId("periodUnit")
						.setLabel("Repeating Meetings Unit")
						.setValue(club.timeslot.periodUnits)
						.setStyle(TextInputStyle.Short)
						.setRequired(false)
						.setPlaceholder('"d" for day(s) or "w" for week(s)')
				)
			);
		interaction.showModal(modal);
	});
