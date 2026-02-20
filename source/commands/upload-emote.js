const { InteractionContextType, PermissionFlagsBits, ModalBuilder, LabelBuilder, UserSelectMenuBuilder, TextInputBuilder, FileUploadBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const { CommandWrapper } = require('../classes/index.js');
const { mainTextChannelId, emoteLogThreadId, SKIP_INTERACTION_HANDLING, SAFE_DELIMITER } = require('../constants.js');
const { timeConversion } = require('../util/mathUtil.js');
const { EmojiLimits } = require('@sapphire/discord.js-utilities');

const mainId = "upload-emote";
module.exports = new CommandWrapper(mainId, "Upload and record a user-submitted emoji for BountyBot Community Emotes", PermissionFlagsBits.CreateGuildExpressions, [InteractionContextType.Guild], 3000,
	async (interaction) => {
		const modalCustomId = `${SKIP_INTERACTION_HANDLING}${SAFE_DELIMITER}${interaction.id}`;
		interaction.showModal(new ModalBuilder().setCustomId(modalCustomId)
			.setTitle("Upload an Emoji")
			.addLabelComponents(
				new LabelBuilder().setLabel("Server Member")
					.setUserSelectMenuComponent(
						new UserSelectMenuBuilder().setCustomId("submitter")
							.setPlaceholder("Select emote submitter...")
					),
				new LabelBuilder().setLabel("Level")
					.setTextInputComponent(
						new TextInputBuilder().setCustomId("level")
							.setStyle(TextInputStyle.Short)
					),
				new LabelBuilder().setLabel("Emoji Name")
					.setTextInputComponent(
						new TextInputBuilder().setCustomId("name")
							.setStyle(TextInputStyle.Short)
							.setMaxLength(EmojiLimits.MaximumEmojiNameLength)
					),
				new LabelBuilder().setLabel("Source")
					.setTextInputComponent(
						new TextInputBuilder().setCustomId("source")
							.setStyle(TextInputStyle.Short)
							.setRequired(false)
					),
				new LabelBuilder().setLabel("Image")
					.setFileUploadComponent(
						new FileUploadBuilder().setCustomId("image")
					)
			))
		const modalSubmission = await interaction.awaitModalSubmit({ filter: submission => submission.customId === modalCustomId, time: timeConversion(5, "m", "ms") });
		await modalSubmission.deferReply({ flags: MessageFlags.Ephemeral });
		const mainTextChannel = await modalSubmission.guild.channels.fetch(mainTextChannelId);
		const emoteLogThread = await mainTextChannel.threads.fetch(emoteLogThreadId);

		const submitterCollection = modalSubmission.fields.getSelectedMembers("submitter");
		const level = modalSubmission.fields.getTextInputValue("level");
		const name = modalSubmission.fields.getTextInputValue("name");
		const source = modalSubmission.fields.getTextInputValue("source");
		const imageAttachmentCollection = modalSubmission.fields.getUploadedFiles("image");

		const emoji = await modalSubmission.guild.emojis.create({ attachment: imageAttachmentCollection.first().url, name, reason: `BountyBot Community Emote for ${submitterCollection.first().id}` });

		let logMessage = `${emoji.toString()} ${name} by ${submitterCollection.first()} (Level ${level})`;
		if (source) {
			logMessage += `\nSource: ${source}`;
		}
		emoteLogThread.send({ content: logMessage });

		modalSubmission.editReply({ content: `${emoji.toString()} has been uploaded and recorded!` });
	}
);
