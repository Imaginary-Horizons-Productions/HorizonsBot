const { PermissionFlagsBits, InteractionContextType, ActionRowBuilder, StringSelectMenuBuilder, userMention, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { UserContextMenuWrapper } = require('../classes');
const { getClubDictionary, getClub } = require('../engines/referenceEngine');
const { SKIP_INTERACTION_HANDLING, SAFE_DELIMITER } = require('../constants');
const { clubEmbedBuilder } = require('../engines/messageEngine');
const { collapseTextToLength } = require('../util/textUtil');
const { ButtonLimits } = require('@sapphire/discord.js-utilities');

const mainId = "Invite to Club";
module.exports = new UserContextMenuWrapper(mainId, PermissionFlagsBits.SendMessages, [InteractionContextType.Guild], 3000,
	(interaction) => {
		if (interaction.targetUser.bot) {
			interaction.reply({ content: "If you'd like at add a bot to your club, please speak with a moderator.", flags: MessageFlags.Ephemeral });
			return;
		}

		const recruitingClubsWithUser = Object.values(getClubDictionary()).filter(club => (club.hostId === interaction.user.id || club.userIds.includes(interaction.user.id)) && club.isRecruiting());
		const clubOptions = recruitingClubsWithUser.map(club => ({ label: club.title, description: club.description.slice(0, 100), value: club.id }));
		if (clubOptions.length < 1) {
			interaction.reply({ content: "You can invite server members to clubs you are a member of that are still recruiting. There don't appear to be any clubs in that list.", flags: MessageFlags.Ephemeral });
			return;
		}

		interaction.reply({
			content: "You can invite others to clubs you host or are a member of.",
			components: [
				new ActionRowBuilder().addComponents(
					new StringSelectMenuBuilder().setCustomId(`${SKIP_INTERACTION_HANDLING}${interaction.id}`)
						.setPlaceholder("Select a club...")
						.setOptions(clubOptions)
						.setDisabled(clubOptions.length < 1)
				)
			],
			flags: MessageFlags.Ephemeral,
			withResponse: true
		}).then(response => response.resource.message).then(reply => {
			const collector = reply.createMessageComponentCollector({ max: 1 });
			collector.on("collect", collectedInteraction => {
				const club = getClub(collectedInteraction.values[0]);
				if (club.hostId === interaction.targetId || club.userIds.includes(interaction.targetId)) {
					collectedInteraction.reply({ content: `${userMention(interaction.targetId)} is already a member of ${club.title}.`, flags: MessageFlags.Ephemeral });
					return;
				}

				if (!club.isRecruiting()) {
					collectedInteraction.reply({ content: `Your invite to ${club.title} was not sent. The club is full!`, flags: MessageFlags.Ephemeral });
					return;
				}

				interaction.targetUser.send({
					embeds: [clubEmbedBuilder(club)],
					components: [
						new ActionRowBuilder().addComponents(
							new ButtonBuilder().setCustomId(`join${SAFE_DELIMITER}${club.id}`)
								.setLabel(collapseTextToLength(`Join ${club.title}`, ButtonLimits.MaximumLabelCharacters))
								.setStyle(ButtonStyle.Success)
						)
					]
				})
				collectedInteraction.reply({ content: `Details about and an invite to ${club.title} have been sent to ${userMention(interaction.targetId)}.`, flags: MessageFlags.Ephemeral });
			})

			collector.on("end", () => {
				interaction.deleteReply();
			})
		})
	}
);
