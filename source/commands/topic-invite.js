const Command = require('../classes/Command.js');
const { ButtonStyle } = require('discord.js');
const { ButtonBuilder, ActionRowBuilder } = require('@discordjs/builders');
const { embedTemplateBuilder } = require('../engines/messageEngine.js');
const { getTopicIds } = require('../engines/channelEngine.js');

const options = [
	{ type: "User", name: "invitee", description: "The user to invite (copy-paste from another channel)", required: true, choices: [] },
	{ type: "Channel", name: "channel", description: "The topic channel", required: true, choices: [] }
];
const subcomands = [];
module.exports = new Command("topic-invite", "Invite a user to a topic", "none", options, subcomands);

/** Invite users to the given topic
 * @param {import('discord.js').Interaction} interaction
 */
module.exports.execute = (interaction) => {
	let channel = interaction.options.getChannel("channel");
	if (getTopicIds().includes(channel.id)) {
		let invitee = interaction.options.getUser("invitee");
		let embed = embedTemplateBuilder()
			.setDescription(`${invitee} has invited you to the following opt-in channel on Imaginary Horizons.`)
			.addField(channel.name, `${channel.topic ? channel.topic : "Description not yet set"}`);
		if (!invitee.bot) {
			const joinButton = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId(`join-${channel.id}`)
						.setLabel(`Join ${channel.name}`)
						.setStyle(ButtonStyle.Success)
				);
			invitee.send({ embeds: [embed], components: [joinButton] }).then(message => {
				interaction.reply({ content: "An invite has been sent!", ephemeral: true });
			}).catch(console.error);
		} else {
			interaction.reply({ content: "If you would like to add a bot to a topic, speak with a moderator.", ephemeral: true })
				.catch(console.error);
		}
	} else {
		interaction.reply({ content: `The mentioned channel doesn't seem to be a topic channel.`, ephemeral: true })
			.catch(console.error);
	}
}
