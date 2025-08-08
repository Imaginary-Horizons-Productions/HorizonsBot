const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, ComponentType } = require('discord.js');
const { ButtonWrapper, ClubTimeslot } = require('../classes');
const { SKIP_INTERACTION_HANDLING } = require('../constants');
const { timeConversion } = require('../util/mathUtil');
const { getClubDictionary, updateClub, updateListReference } = require('../engines/referenceEngine');
const { cancelClubEvent, clearClubReminder, updateClubDetails } = require('../engines/clubEngine');
const { clubEmbedBuilder } = require('../engines/messageEngine');

const mainId = "clearclubmeeting";
module.exports = new ButtonWrapper(mainId, 3000,
	/** Specs */
	(interaction, [clubId]) => {
		interaction.reply({
			content: "Really clear the next meeting settings?",
			components: [
				new ActionRowBuilder().addComponents(
					new ButtonBuilder().setCustomId(SKIP_INTERACTION_HANDLING)
						.setStyle(ButtonStyle.Danger)
						.setLabel("Clear")
				)
			],
			flags: MessageFlags.Ephemeral,
			withResponse: true
		}).then(response => response.resource.message.awaitMessageComponent({ time: timeConversion(2, "m", "ms"), componentType: ComponentType.Button })).then(collectedInteraction => {
			const club = getClubDictionary()[clubId];
			cancelClubEvent(club, collectedInteraction.guild.scheduledEvents);
			clearClubReminder(club.id);
			updateClubDetails(club, collectedInteraction.channel);
			updateListReference(collectedInteraction.guild.channels, "club");
			club.timeslot = new ClubTimeslot();
			updateClub(club);
			collectedInteraction.update({ components: [] }).then(() => {
				interaction.deleteReply();
			});
			collectedInteraction.channel.send({ content: "This club's next meeting has been cleared." });
		})
	}
);
