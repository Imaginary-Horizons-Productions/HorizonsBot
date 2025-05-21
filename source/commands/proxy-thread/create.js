const { CommandInteraction, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const { referenceMessages } = require("../../engines/referenceEngine");
const { pluralKitId } = require("../../constants");

/**
 * @param {CommandInteraction} interaction
 * @param {...unknown} args
 */
async function executeSubcommand(interaction, ...args) {
	const invitee = interaction.options.getMember("invitee");
	if (interaction.member.id === invitee || invitee.user.bot) {
		interaction.reply({ content: "You cannot start a proxy thread where you'd be the only non-bot user.", flags: MessageFlags.Ephemeral });
		return;
	}

	const newMemberIdSet = new Set([interaction.member.id, invitee.id]);
	const threadHub = await interaction.guild.channels.fetch(referenceMessages["proxy-thread-info"].channelId);
	const { threads } = await threadHub.threads.fetchActive();
	const matchingThread = threads.find(async thread => {
		const members = await thread.members.fetch();
		return newMemberIdSet.isSupersetOf(new Set(members.filter(member => !member.user.bot).mapValues(member => member.id)))
	});
	if (matchingThread) {
		interaction.reply({ content: `There is already an active thread open with that set of users: ${matchingThread}`, flags: MessageFlags.Ephemeral });
		return;
	}

	const members = [interaction.member, invitee];
	let threadName = members.map(member => member.user.displayName).join(" ↔ ");
	if (threadName.length > 100) {
		threadName = `${threadName.slice(0, 98)}…`;
	}
	threadHub.threads.create({
		name: threadName,
		type: ChannelType.PrivateThread
	}).then(thread => {
		[...members, pluralKitId].forEach(userResolvable => {
			thread.members.add(userResolvable, "proxy thread created");
		})
		interaction.reply({ content: `${thread} was created!`, flags: MessageFlags.Ephemeral });
		return thread.send({
			content: "Here are the control buttons for this tread:",
			components: [new ActionRowBuilder().addComponents(
				new ButtonBuilder().setCustomId("proxyrename")
					.setStyle(ButtonStyle.Primary)
					.setLabel("Rename the thread"),
				new ButtonBuilder().setCustomId("proxydisband")
					.setStyle(ButtonStyle.Danger)
					.setLabel("Disband the thread")
			)]
		});
	}).then(starterMessage => {
		starterMessage.pin();
	})
};

module.exports = {
	data: {
		name: "create",
		description: "Create a new proxy thread",
		optionsInput: [
			{
				type: "User",
				name: "invitee",
				description: "The first user to invite to the thread",
				required: true
			}
		]
	},
	executeSubcommand
};
