const { ButtonWrapper } = require('../classes');
const { guildId } = require('../constants.js');
const { updateClubDetails, cancelClubRecruitmentEvent, createClubRecruitmentEvent } = require('../engines/clubEngine.js');
const { updateListReference, getClub } = require('../engines/referenceEngine.js');
const { clearComponents } = require('../util/discordAPIRequests.js');

const mainId = "join";
module.exports = new ButtonWrapper(mainId, 3000,
	/** Join the club specified in args */
	async (interaction, [channelId]) => {
		clearComponents(interaction.message);
		const club = getClub(channelId);
		if (!club) {
			interaction.reply("This club doesn't seem to exist.");
			return;
		}

		const userId = interaction.user.id;
		if (club.bannedUserIds.includes(userId)) {
			interaction.reply(`You are currently banned from ${club.name}. Speak to the club's host if you believe this is in error.`);
			return;
		}

		const membershipRole = await interaction.guild.roles.fetch(club.roleId);
		if (club.hasGuildMember(userId, membershipRole.members)) {
			interaction.reply(`You are already in ${club.name}.`);
			return;
		}

		if (club.getMembershipStatus(membershipRole.members.size) === "full") {
			interaction.reply(`${club.name} is already full.`);
			return;
		}

		const guild = await interaction.client.guilds.fetch(guildId);
		const clubChannel = await guild.channels.fetch(channelId);
		await interaction.member.roles.add(membershipRole, "user joined club");
		clubChannel.send(`Welcome to ${club.name}, ${interaction.user}!`);
		interaction.reply(`You have joined ${clubChannel}!`);
		updateClubDetails(club, clubChannel);
		updateListReference(guild.channels, "club");
		cancelClubRecruitmentEvent(club, interaction.guild.scheduledEvents);
		createClubRecruitmentEvent(club, interaction.guild);
	}
);
