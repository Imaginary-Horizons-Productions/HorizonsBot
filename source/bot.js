//#region Imports
const { Client, REST, GatewayIntentBits, Routes, ActivityType, Events } = require("discord.js");
const fsa = require("fs/promises");

const { getCommand, slashData } = require("./commands/_commandDictionary.js");
const { callButton } = require("./buttons/_buttonDictionary.js");
const { callModalSubmission } = require("./modalSubmissions/_modalSubmissionDictionary.js");
const { callSelect } = require("./selects/_selectDictionary.js");
const { getTopicIds, addTopic, removeTopic } = require("./engines/channelEngine.js");
const { versionEmbedBuilder } = require("./engines/messageEngine.js");
const { isClubHostOrModerator, isModerator } = require("./engines/permissionEngine.js");
const { listMessages, pinClubList, getClubDictionary, updateList, getPetitions, setPetitions, checkPetition, removeClub, scheduleClubEvent, setClubReminder } = require("./helpers.js");
const { SAFE_DELIMITER, guildId } = require('./constants.js');
const versionData = require('../config/_versionData.json');
//#endregion
//#region Executing Code
const client = new Client({
	retryLimit: 5,
	presence: {
		activities: [{
			type: ActivityType.Listening,
			name: "/commands"
		}]
	},
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages]
});

const authPath = "../config/auth.json";

client.login(require(authPath).token)
	.catch(console.error);
//#endregion

//#region Event Handlers
client.on(Events.ClientReady, () => {
	console.log(`Connected as ${client.user.tag}`);

	(async () => {
		try {
			await new REST({ version: 9 }).setToken(require(authPath).token).put(
				Routes.applicationCommands(client.user.id),
				{ body: slashData }
			)
		} catch (error) {
			console.error(error);
		}
	})()

	client.guilds.fetch(guildId).then(guild => {
		// Post version notes
		if (versionData.patchNotesChannelId) {
			fsa.readFile('./ChangeLog.md', { encoding: 'utf8' }).then(data => {
				let [currentFull, currentMajor, currentMinor, currentPatch] = data.match(/(\d+)\.(\d+)\.(\d+)/);
				let [_lastFull, lastMajor, lastMinor, lastPatch] = versionData.lastPostedVersion.match(/(\d+)\.(\d+)\.(\d+)/);

				if (currentMajor <= lastMajor) {
					if (currentMinor <= lastMinor) {
						if (currentPatch <= lastPatch) {
							return;
						}
					}
				}

				versionEmbedBuilder().then(embed => {
					guild.channels.fetch(versionData.patchNotesChannelId).then(patchChannel => {
						patchChannel.send({ embeds: [embed] });
						versionData.lastPostedVersion = currentFull;
						fsa.writeFile('./config/_versionData.json', JSON.stringify(versionData), "utf-8");
					})
				}).catch(console.error);
			});
		}

		// Generate topic collection
		const channelManager = guild.channels;
		require('../config/topicList.json').forEach(id => {
			channelManager.fetch(id).then(channel => {
				addTopic(id, channel.name);
			}).catch(console.error);
		})

		// Start up club reminder and event scheduling
		for (const club of Object.values(getClubDictionary())) {
			const isNextMeetingInFuture = Date.now() < club.timeslot.nextMeeting * 1000;
			if (isNextMeetingInFuture) {
				setClubReminder(club.id, club.timeslot.nextMeeting, channelManager);
				if (club.isRecruiting() && club.timeslot.periodCount) {
					scheduleClubEvent(club.id, club.voiceChannelId, club.timeslot.nextMeeting, guild);
				}
			} else {
				club.timeslot.setNextMeeting(null);
				club.timeslot.setEventId(null);
			}
		}

		// Update pinned lists
		if (listMessages.topics) {
			updateList(channelManager, "topics");
		}

		if (listMessages.clubs) {
			updateList(channelManager, "clubs");
		}
	})
})

client.on(Events.InteractionCreate, interaction => {
	if (interaction.isCommand()) {
		const command = getCommand(interaction.commandName);
		if (command.permissionLevel === "moderator" && !isModerator(interaction.member)) {
			interaction.reply(`\`/${interaction.commandName}\` is a moderator-only command.`);
			return;
		}

		if (command.permissionLevel === "moderator/club host" && !isClubHostOrModerator(interaction.channel.id, interaction.member)) {
			interaction.reply({ content: "\`/${interaction.commandName}\` can only be used by a moderator or a club host in the club's text channel.", ephemeral: true });
			return;
		}

		command.execute(interaction);
	} else {
		const [mainId, ...args] = interaction.customId.split(SAFE_DELIMITER);
		if (interaction.isButton()) {
			callButton(mainId, interaction, args);
		} else if (interaction.isStringSelectMenu()) {
			callSelect(mainId, interaction, args);
		} else if (interaction.isModalSubmit()) {
			callModalSubmission(mainId, interaction, args);
		}
	}
})

let clubBuriedness = 0;

client.on("messageCreate", receivedMessage => {
	//Bump the club list message if it gets buried
	if (listMessages.clubs && receivedMessage.channelId == listMessages.clubs.id) {
		clubBuriedness += 1;
		if (clubBuriedness > 9) {
			receivedMessage.channel.messages.fetch(listMessages.clubs.messageId).then(oldMessage => {
				oldMessage.delete();
			})
			pinClubList(receivedMessage.guild.channels, receivedMessage.channel);
			clubBuriedness = 0;
		}
	}
})

client.on(Events.GuildMemberRemove, ({ id: memberId, guild }) => {
	// Remove member's clubs
	for (const club of Object.values(getClubDictionary())) {
		if (memberId == club.hostId) {
			guild.channels.resolve(club.id).delete("Club host left server");
		} else if (club.userIds.includes(memberId)) {
			club.userIds = club.userIds.filter(id => id != memberId);
			updateList(guild.channels, "clubs");
		}
	}

	// Remove member from petitions and check if member leaving completes any petitions
	const petitions = getPetitions();
	for (const topicName in petitions) {
		petitions[topicName] = petitions[topicName].filter(id => id != memberId);
		setPetitions(petitions, guild.channels);
		checkPetition(guild, topicName);
	}
})

client.on(Events.ChannelDelete, ({ id, guild }) => {
	// Check if deleted channel is a topic
	if (getTopicIds()?.includes(id)) {
		removeTopic(id, guild);
	} else {
		const clubDictionary = getClubDictionary();
		// Check if deleted channel is a club's text channel
		if (id in clubDictionary) {
			const voiceChannel = guild.channels.resolve(clubDictionary[id].voiceChannelId);
			if (voiceChannel) {
				voiceChannel.delete();
				removeClub(id, guild.channels);
			}
			return;
		}

		// Check if deleted channel is a club's voice channel
		for (const club of Object.values(clubDictionary)) {
			if (club.voiceChannelId === id) {
				const textChannel = guild.channels.resolve(club.id);
				if (textChannel) {
					textChannel.delete();
					removeClub(club.id, guild.channels);
				}
				return;
			}
		}
	}
})
//#endregion
