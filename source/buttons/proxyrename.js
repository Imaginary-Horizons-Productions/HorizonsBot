const { ButtonWrapper } = require('../classes');
const { TextInputStyle, ModalBuilder, TextInputBuilder, ActionRowBuilder } = require('discord.js');
const { timeConversion } = require('../util/mathUtil');
const { SKIP_INTERACTION_HANDLING, SAFE_DELIMITER } = require('../constants');

const mainId = "proxyrename";
module.exports = new ButtonWrapper(mainId, 3000,
	(interaction, args) => {
		const modalCustomId = `${SKIP_INTERACTION_HANDLING}${SAFE_DELIMITER}${interaction.id}`;
		interaction.showModal(new ModalBuilder().setCustomId(modalCustomId)
			.setTitle("Rename Thread")
			.setComponents(
				new ActionRowBuilder().addComponents(
					new TextInputBuilder().setCustomId("title")
						.setLabel("New Name")
						.setValue(interaction.channel.name)
						.setStyle(TextInputStyle.Short)
						.setMinLength(1)
						.setMaxLength(100)
						.setPlaceholder("1-100 characters")
				)
			));
		interaction.awaitModalSubmit({ filter: submission => submission.customId === modalCustomId, time: timeConversion(5, "m", "ms") }).then(modalSubmission => {
			const newName = modalSubmission.fields.fields.get("title").value;
			interaction.channel.setName(newName);
			modalSubmission.reply(`${interaction.member} renamed this thread to **${newName}**.`);
		})
	}
);
