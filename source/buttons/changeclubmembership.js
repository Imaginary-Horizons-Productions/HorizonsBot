const { ModalBuilder, TextInputBuilder, TextInputStyle, LabelBuilder, TextDisplayBuilder, MessageFlags, UserSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');
const { ButtonWrapper } = require('../classes/index.js');
const { updateClub, updateListReference, getClub } = require('../engines/referenceEngine.js');
const { updateClubDetails, cancelClubRecruitmentEvent, createClubRecruitmentEvent } = require('../engines/clubEngine.js');
const { timeConversion } = require('../util/mathUtil.js');
const { SKIP_INTERACTION_HANDLING, SAFE_DELIMITER } = require('../constants.js');
const { butIgnoreInteractionCollectorErrors } = require('../util/dAPIResponses.js');

const mainId = "changeclubmembership";
module.exports = new ButtonWrapper(mainId, 3000,
	/** Set the ideal member count for the club with provided id */
	(interaction, [clubId]) => {
		const club = getClub(clubId);
		const labelIdealMemberCount = "Ideal Member Count";
		const inputIdIdIdealMemberCount = "max-members";
		const labelNewClubHost = "Club Host";
		const inputIdNewClubHost = "club-host";
		const modal = new ModalBuilder().setCustomId(`${SKIP_INTERACTION_HANDLING}${SAFE_DELIMITER}${interaction.id}`)
			.setTitle("Change Club Membership")
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent("Ideal Member Count has the following effects:\n- HorizonsBot automatically creates Discord Events for club meetings for clubs below their ideal member count\n- A club is considered full when at or above its ideal member count")
			)
			.addLabelComponents(
				new LabelBuilder()
					.setLabel(labelIdealMemberCount)
					.setDescription("Remember to include the host in the count! Leave empty to turn off.")
					.setTextInputComponent(
						new TextInputBuilder().setCustomId(inputIdIdIdealMemberCount)
							.setValue(club.idealMemberCount?.toString() ?? "")
							.setStyle(TextInputStyle.Short)
							.setRequired(false)
					),
				new LabelBuilder().setLabel(labelNewClubHost)
					.setDescription("Promote another club member to host of this club.")
					.setUserSelectMenuComponent(
						new UserSelectMenuBuilder().setCustomId(inputIdNewClubHost)
							.setPlaceholder("Select a club member...")
							.setRequired(false)
					)
			);
		interaction.showModal(modal);
		interaction.awaitModalSubmit({ filter: submission => submission.customId === modal.data.custom_id, time: timeConversion(5, "m", "ms") }).then(async modalSubmission => {
			const auditLogReason = "club changed membership";

			const unparsedIdealMemberCount = modalSubmission.fields.getTextInputValue(inputIdIdIdealMemberCount);
			const unparsedClubHost = modalSubmission.fields.getSelectedMembers(inputIdNewClubHost);

			const idealMemberCountInput = unparsedIdealMemberCount === "" ? null : parseInt(unparsedIdealMemberCount);
			const clubHostInput = unparsedClubHost === null ? null : unparsedClubHost.first();

			const errors = {};
			const didIdealMemberCountChange = club.idealMemberCount !== idealMemberCountInput;
			const didHostChange = clubHostInput !== null && clubHostInput.id !== club.hostId;
			const didValuesChange = didIdealMemberCountChange || didHostChange;

			if (didIdealMemberCountChange) {
				// Explicit null check because `null < 1` evaluates to `true`
				if (isNaN(idealMemberCountInput) || idealMemberCountInput !== null && idealMemberCountInput < 1) {
					errors[labelIdealMemberCount] = `Could not interpret "${unparsedIdealMemberCount}" as a positive integer.`;
				} else {
					club.idealMemberCount = idealMemberCountInput;
				}
			}

			if (didHostChange) {
				if (clubHostInput.user.bot) {
					errors[labelNewClubHost] = "Bots cannot be apointed as club hosts."
				} else {
					club.hostId = clubHostInput.id;

					modalSubmission.channel.permissionOverwrites.create(clubHostInput, { [PermissionFlagsBits.PinMessages]: true }, { reason: auditLogReason });
					modalSubmission.channel.permissionOverwrites.delete(modalSubmission.member, auditLogReason);

					const clubVoice = await modalSubmission.guild.channels.fetch(club.voiceChannelId);
					clubVoice.permissionOverwrites.create(clubHostInput, { [PermissionFlagsBits.ManageChannels]: true, [PermissionFlagsBits.ManageEvents]: true }, { reason: auditLogReason });
					clubVoice.permissionOverwrites.delete(modalSubmission.member, auditLogReason);
				}
			}

			if (didIdealMemberCountChange) {
				cancelClubRecruitmentEvent(club, modalSubmission.guild.scheduledEvents);
				createClubRecruitmentEvent(club, modalSubmission.guild);
			}
			if (didValuesChange) {
				updateClubDetails(club, modalSubmission.channel);
				updateListReference(modalSubmission.guild.channels, "club");
				updateClub(club);
			}

			modalSubmission.update({ components: [club.asContainer("config", modalSubmission.channel.members.filter(member => member.roles.cache.has(club.roleId)).size)] }).then(() => {
				const errorKeys = Object.keys(errors);
				if (errorKeys.length > 0) {
					modalSubmission.followUp({
						content: errorKeys.reduce((errorMessage, field) => {
							return errorMessage + `${field} - ${errors[field]}`
						}, "The following settings were not set because they encountered errors:\n"),
						flags: MessageFlags.Ephemeral
					})
				}
			});
		}).catch(butIgnoreInteractionCollectorErrors);
	}
);
