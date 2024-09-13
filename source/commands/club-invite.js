const { ButtonBuilder, ActionRowBuilder, ButtonStyle, StringSelectMenuBuilder, PermissionFlagsBits, UserSelectMenuBuilder } = require('discord.js');
const { CommandWrapper } = require('../classes');
const { SAFE_DELIMITER, SKIP_INTERACTION_HANDLING } = require('../constants.js');
const { clubEmbedBuilder } = require('../engines/messageEngine.js');
const { getClubDictionary } = require('../engines/referenceEngine.js');

const mainId = "club-invite";
module.exports = new CommandWrapper(mainId, "Send a user an invite to a club", PermissionFlagsBits.SendMessages, true, 3000,
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
				new ActionRowBuilder().addComponents(
					new UserSelectMenuBuilder().setCustomId(userSelectId)
						.setPlaceholder("Select user...")
						.setDisabled(true)
				)
			],
			ephemeral: true,
			fetchReply: true
		}).then(reply => {
			let selectedClubId;
			const collector = reply.createMessageComponentCollector({ max: 2 });
			collector.on("collect", collectedInteraction => {
				switch (collectedInteraction.customId) {
					case clubSelectId:
						[selectedClubId] = collectedInteraction.values;
						collectedInteraction.update({
							components: [
								new ActionRowBuilder().addComponents(
									new StringSelectMenuBuilder().setCustomId(clubSelectId)
										.setPlaceholder(getClubDictionary()[selectedClubId].title)
										.setDisabled(true)
										.setOptions({ label: "placeholder", value: "placeholder" })
								),
								new ActionRowBuilder().addComponents(
									new UserSelectMenuBuilder().setCustomId(userSelectId)
										.setPlaceholder("Select user...")
								)
							]
						});
						break;
					case userSelectId:
						const club = getClubDictionary()[selectedClubId];
						const member = collectedInteraction.users.first();
						const components = [];
						if (member.id !== club.hostId && !club.userIds.includes(member.id)) {
							components.push(new ActionRowBuilder(
								{
									components: [
										new ButtonBuilder({
											custom_id: `join${SAFE_DELIMITER}${club.id}`,
											label: `Join ${club.title}`,
											style: ButtonStyle.Success
										})
									]
								}
							));
						}
						member.send({ embeds: [clubEmbedBuilder(club)], components });
						collectedInteraction.reply({ content: `Details about and an invite to <#${selectedClubId}> have been sent to ${member}.`, ephemeral: true });
						interaction.deleteReply();
						break;
				}
			})
		})
	}
);
