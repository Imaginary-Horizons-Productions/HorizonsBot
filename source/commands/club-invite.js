const { ButtonBuilder, ActionRowBuilder, ButtonStyle, StringSelectMenuBuilder, PermissionFlagsBits, UserSelectMenuBuilder, InteractionContextType, MessageFlags } = require('discord.js');
const { CommandWrapper } = require('../classes');
const { SAFE_DELIMITER, SKIP_INTERACTION_HANDLING } = require('../constants.js');
const { clubEmbedBuilder, disabledSelectRow } = require('../engines/messageEngine.js');
const { getClubDictionary, getClub } = require('../engines/referenceEngine.js');
const { collapseTextToLength } = require('../util/textUtil.js');
const { ButtonLimits } = require('@sapphire/discord.js-utilities');

const mainId = "club-invite";
module.exports = new CommandWrapper(mainId, "Send a user an invite to a club", PermissionFlagsBits.SendMessages, [InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel], 3000,
	async (interaction) => {
		const clubDictionary = getClubDictionary();
		const clubSelectId = `${SKIP_INTERACTION_HANDLING}${SAFE_DELIMITER}club`;
		const userSelectId = `${SKIP_INTERACTION_HANDLING}${SAFE_DELIMITER}users`;
		const clubSelect = new StringSelectMenuBuilder().setCustomId(clubSelectId)
			.setPlaceholder("Select club...");
		for (const id in clubDictionary) {
			const club = clubDictionary[id];
			if (club.isRecruiting()) {
				clubSelect.addOptions(
					{
						label: club.title,
						description: `${club.userIds.length}${club.seats !== -1 ? `/${club.seats}` : ""} Members`,
						value: club.id
					}
				)
			}
		}

		interaction.reply({
			content: "HorizonsBot will send a DM with the selected club's details embed to the selected user. The message will contain a join button if the user isn't already a part of the club.",
			components: [
				new ActionRowBuilder().addComponents(clubSelect),
				disabledSelectRow("Select user...")
			],
			flags: MessageFlags.Ephemeral,
			withResponse: true
		}).then(response => response.resource.message).then(reply => {
			let selectedClubId;
			const collector = reply.createMessageComponentCollector({ max: 2 });
			collector.on("collect", collectedInteraction => {
				switch (collectedInteraction.customId) {
					case clubSelectId:
						[selectedClubId] = collectedInteraction.values;
						collectedInteraction.update({
							components: [
								disabledSelectRow(getClub(selectedClubId).title),
								new ActionRowBuilder().addComponents(
									new UserSelectMenuBuilder().setCustomId(userSelectId)
										.setPlaceholder("Select user...")
								)
							]
						});
						break;
					case userSelectId:
						const club = getClub(selectedClubId);
						const member = collectedInteraction.users.first();
						const components = [];
						if (member.id !== club.hostId && !club.userIds.includes(member.id)) {
							components.push(new ActionRowBuilder(
								{
									components: [
										new ButtonBuilder({
											custom_id: `join${SAFE_DELIMITER}${club.id}`,
											label: collapseTextToLength(`Join ${club.title}`, ButtonLimits.MaximumLabelCharacters),
											style: ButtonStyle.Success
										})
									]
								}
							));
						}
						member.send({ embeds: [clubEmbedBuilder(club)], components });
						collectedInteraction.reply({ content: `Details about and an invite to <#${selectedClubId}> have been sent to ${member}.`, flags: MessageFlags.Ephemeral });
						interaction.deleteReply();
						break;
				}
			})
		})
	}
);
