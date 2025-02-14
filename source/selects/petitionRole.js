const { MessageFlags } = require('discord.js');
const { SelectWrapper } = require('../classes/InteractionWrapper.js');
const { checkRolePetition } = require('../engines/customizationEngine.js');
const { updateListReference } = require('../engines/referenceEngine.js');
const { listifyEN } = require('../util/textUtil.js');

const mainId = "petitionRole";
module.exports = new SelectWrapper(mainId, 3000,
	/** Have the user petition for the selected topics */
	(interaction, args) => {
		if (interaction.values.length > 1) {
			const petitionResultMap = {};
			interaction.values.forEach(petition => {
				const stats = checkRolePetition(interaction.guild, petition, interaction.user);
				if (stats.result in petitionResultMap) {
					petitionResultMap[stats.result].push(stats);
				} else {
					petitionResultMap[stats.result] = [stats];
				}
			})
			const segments = [];
			if (petitionResultMap.signatureAdded?.length > 0) {
				segments.push(`### Petitions Signed\n- ${petitionResultMap.signatureAdded.map(stats => `**${stats.name}**: ${stats.threshold - stats.petitionCount} more signatures needed`).join("\n- ")}`);
			}
			if (petitionResultMap.duplicateSignature?.length > 0) {
				segments.push(`### Already Signed\n${listifyEN(petitionResultMap.duplicateSignature.map(stats => stats.name))}`);
			}
			if (petitionResultMap.petitionFulfilled?.length > 0) {
				segments.push(`### Petitions Fulfilled\n${listifyEN(petitionResultMap.petitionFulfilled.map(stats => stats.name))}`);
			}
			interaction.reply({ content: segments.join("\n"), flags: [MessageFlags.Ephemeral] });
		} else {
			const stats = checkRolePetition(interaction.guild, interaction.values[0], interaction.user);
			switch (stats.result) {
				case "signatureAdded":
					interaction.reply({ content: `Your petition has been recorded. ${stats.threshold - stats.petitionCount} more petitions are needed to create the role.`, flags: [MessageFlags.Ephemeral] });
					break;
				case "duplicateSignature":
					interaction.reply({ content: `You've already petitioned for a ${interaction.values[0]} Pingable Role.`, flags: [MessageFlags.Ephemeral] });
					break;
				case "petitionFulfilled":
					interaction.reply({ content: `The ${interaction.values[0]} Pingable Role has been created and given to petitioners.`, flags: [MessageFlags.Ephemeral] });
					break;
			}
		}
		updateListReference(interaction.guild.channels, "petition");
	}
);
