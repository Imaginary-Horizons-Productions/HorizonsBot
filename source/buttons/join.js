const { ButtonWrapper } = require('../classes');
const { guildId } = require('../constants.js');
const { updateClubDetails, cancelClubRecruitmentEvent, createClubRecruitmentEvent } = require('../engines/clubEngine.js');
const { updateListReference, getClub } = require('../engines/referenceEngine.js');

const mainId = "join";
module.exports = new ButtonWrapper(mainId, 3000,
	/** Join the club specified in args */
	async (interaction, [channelId]) => {
		const club = getClub(channelId);
		if (!club) {
			interaction.reply("This club doesn't seem to exist.");
			return;
		}

		const guild = interaction.guild ?? await interaction.client.guilds.fetch(guildId);
		const membershipRole = await guild.roles.fetch(club.roleId);
		interaction.message.edit({ components: [club.asContainer("info", membershipRole.members.size)] });

		if (club.bannedUserIds.includes(interaction.user.id)) {
			interaction.reply(`You are currently banned from ${club.name}. Speak to the club's host if you believe this is in error.`);
			return;
		}

		if (club.hasGuildMember(interaction.user.id, membershipRole.members)) {
			interaction.reply(`You are already in ${club.name}.`);
			return;
		}

		if (club.getMembershipStatus(membershipRole.members.size) === "full") {
			interaction.reply(`${club.name} is already full.`);
			return;
		}

		const clubChannel = await guild.channels.fetch(channelId);
		await (interaction.member ?? await guild.members.fetch(interaction.user.id)).roles.add(membershipRole, "user joined club");
		clubChannel.send(`Welcome to ${club.name}, ${interaction.user}!`);
		interaction.reply(`You have joined ${clubChannel}!`);
		updateClubDetails(club, clubChannel);
		updateListReference(guild.channels, "club");
		cancelClubRecruitmentEvent(club, guild.scheduledEvents);
		createClubRecruitmentEvent(club, guild);
	}
);
