const { Client, GatewayIntentBits, Events, MessageFlags, ActivityType } = require("discord.js");
const { getClubDictionary, updateClub } = require("../source/engines/referenceEngine");
const { commandMention } = require("../source/util/textUtil");
const { guildId } = require("../source/constants");

const client = new Client({
	retryLimit: 5,
	presence: {
		activities: [{
			type: ActivityType.Custom,
			name: "Migrating Club Summaries to new Format"
		}]
	},
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const authPath = "../config/auth.json";

client.login(require(authPath).token)
	.catch(console.error);

client.on(Events.ClientReady, async () => {
	console.log(`Connected as ${client.user.tag} for migration v2.10.0-2`);
	const guild = await client.guilds.fetch(guildId);
	for (const club of Object.values(getClubDictionary())) {
		const clubChannel = await guild.channels.fetch(club.id);
		const summaryMessage = await clubChannel.messages.fetch(club.detailSummaryId);
		if (summaryMessage.content) {
			await summaryMessage.delete();
			await clubChannel.send({ content: `Club Summaries have been updated to a new format! When invites are sent with ${commandMention("club-invite")}, the invitee will be shown the following summary:` });
			clubChannel.send({ components: [club.asContainer("info")], flags: MessageFlags.IsComponentsV2 }).then(newDetailSummaryMessage => {
				newDetailSummaryMessage.pin();
				club.detailSummaryId = newDetailSummaryMessage.id;
				updateClub(club);
			});
		}
	}
	client.destroy();
})
