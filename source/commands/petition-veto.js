const { PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, InteractionContextType, MessageFlags } = require('discord.js');
const { CommandWrapper } = require('../classes');
const { updateListReference } = require('../engines/referenceEngine.js');
const { isModerator } = require('../engines/permissionEngine.js');
const { getRolePetitions, getChannelPetitions, deleteChannelPetition } = require('../engines/customizationEngine.js');
const { SKIP_INTERACTION_HANDLING, SAFE_DELIMITER } = require('../constants.js');
const { listifyEN } = require('../util/textUtil.js');

const mainId = "petition-veto";
module.exports = new CommandWrapper(mainId, "Veto a petition", PermissionFlagsBits.ManageChannels, [InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel], 3000,
	(interaction) => {
		if (!isModerator(interaction.member)) {
			interaction.reply(`\`/${interaction.commandName}\` is a moderator-only command.`);
			return;
		}

		const channelPetitionOptions = getChannelPetitions().map(petition => ({ label: petition.name, description: `${petition.petitionerIds.length} petition${petition.petitionerIds.length === 1 ? "" : "s"}`, value: petition.name }));
		const rolePetitionOptions = getRolePetitions().map(petition => ({ label: petition.name, description: `${petition.petitionerIds.length} petition${petition.petitionerIds.length === 1 ? "" : "s"}`, value: petition.name }));
		interaction.reply({
			content: "Here are all open channel and Pingable Role petitions:",
			components: [
				new ActionRowBuilder().addComponents(
					new StringSelectMenuBuilder().setCustomId(`${SKIP_INTERACTION_HANDLING}${SAFE_DELIMITER}channel`)
						.setPlaceholder("Select a channel petition...")
						.setDisabled(channelPetitionOptions.length < 1)
						.setOptions(channelPetitionOptions.length > 0 ? channelPetitionOptions : { label: "empty", value: "empty" })
						.setMaxValues(Math.max(channelPetitionOptions.length, 1))
				),
				new ActionRowBuilder().addComponents(
					new StringSelectMenuBuilder().setCustomId(`${SKIP_INTERACTION_HANDLING}${SAFE_DELIMITER}role`)
						.setPlaceholder("Select a Pingable Role petition...")
						.setDisabled(rolePetitionOptions.length < 1)
						.setOptions(rolePetitionOptions.length > 0 ? rolePetitionOptions : { label: "empty", value: "empty" })
						.setMaxValues(Math.max(rolePetitionOptions.length, 1))
				)
			],
			flags: MessageFlags.Ephemeral,
			withResponse: true
		}).then(response => response.resource.message).then(reply => {
			const collector = reply.createMessageComponentCollector({ max: 1 });
			collector.on("collect", collectedInteraction => {
				const [_, petitionType] = collectedInteraction.customId.split(SAFE_DELIMITER);
				switch (petitionType) {
					case "channel":
						const channelPetitions = getChannelPetitions();
						const vetoedChannelPetitions = [];
						for (const vetoedPetition of collectedInteraction.values) {
							if (channelPetitions.some(petition => petition.name === vetoedPetition)) {
								deleteChannelPetition(vetoedPetition);
								vetoedChannelPetitions.push(vetoedPetition);
							}
						}
						if (vetoedChannelPetitions.length > 0) {
							collectedInteraction.reply(`The following channel petitions were vetoed: ${listifyEN(vetoedChannelPetitions)}`)
								.catch(console.error);
							updateListReference(collectedInteraction.guild.channels, "petition");
						} else {
							collectedInteraction.reply({ content: "No valid channel petitions were selected for veto.", flags: MessageFlags.Ephemeral })
								.catch(console.error);
						}
						break;
					case "role":
						const rolePetitions = getRolePetitions();
						const vetoedRolePetitions = [];
						for (const vetoedPetition of collectedInteraction.values) {
							if (rolePetitions.some(petition => petition.name === vetoedPetition)) {
								deleteChannelPetition(vetoedPetition);
								vetoedRolePetitions.push(vetoedPetition);
							}
						}
						if (vetoedRolePetitions.length > 0) {
							collectedInteraction.reply(`The following role petitions were vetoed: ${listifyEN(vetoedRolePetitions)}`)
								.catch(console.error);
							updateListReference(collectedInteraction.guild.channels, "petition");
						} else {
							collectedInteraction.reply({ content: "No valid role petitions were selected for veto.", flags: MessageFlags.Ephemeral })
								.catch(console.error);
						}
						break;
				}
			});

			collector.on("end", () => {
				interaction.deleteReply();
			});
		});
	}
);
