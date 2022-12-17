//#region Imports
const { Client, REST, GatewayIntentBits, Routes } = require("discord.js");
const fsa = require("fs/promises");

const { getCommand, slashData } = require("./commands/_commandDictionary.js");
const { callButton } = require("./buttons/_buttonDictionary.js");
const { callModalSubmission } = require("./modalSubmissions/_modalSubmissionDictionary.js");
const { callSelect } = require("./selects/_selectDictionary.js");
const { listMessages, pinClubsList, getClubDictionary, updateList, getPetitions, setPetitions, checkPetition, getTopicIds, addTopic, removeTopic, removeClub, versionEmbedBuilder, scheduleClubEvent, setClubReminder } = require("./helpers.js");
const { SAFE_DELIMITER, guildId } = require('./constants.js');
const versionData = require('../config/_versionData.json');
//TODONOW pinClubList or pinClubsList
//#endregion

//#region Executing Code
const client = new Client({
	retryLimit: 5,
	presence: {
		activities: [{
			type: "LISTENING",
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
client.on("ready", () => {
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

		// Begin checking for club reminders
		for (let club of Object.values(getClubDictionary())) {
			if (club.timeslot.nextMeeting) {
				setClubReminder(club, channelManager);
				scheduleClubEvent(club, guild);
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

client.on("interactionCreate", interaction => {
	if (interaction.isCommand()) {
		const command = getCommand(interaction.commandName);
		if (!command.managerCommand || !interaction.member.manageable) {
			command.execute(interaction);
		} else {
			interaction.reply(`The \`/${interaction.commandName}\` command is restricted to bot managers (users with permissions above the bot).`)
				.catch(console.error);
		}
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
			pinClubsList(receivedMessage.guild.channels, receivedMessage.channel);
			clubBuriedness = 0;
		}
	}
})

client.on('guildMemberRemove', ({ id: memberId, guild }) => {
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

client.on('channelDelete', ({ id, guild }) => {
	const topics = getTopicIds();
	const clubDictionary = getClubDictionary();
	if (topics?.includes(id)) {
		removeTopic(id, guild);
	} else if (clubDictionary) {
		const clubs = Object.values(clubDictionary);
		if (clubs.map(club => club.voiceChannelId).includes(id)) {
			for (const club of clubs) {
				if (club.voiceChannelId == id) {
					const textChannel = guild.channels.resolve(club.id);
					if (textChannel) {
						textChannel.delete();
						removeClub(club.id);
					}
					break;
				}
			}
		} else if (Object.keys(clubDictionary).includes(id)) {
			const voiceChannel = guild.channels.resolve(clubDictionary[id].voiceChannelId);
			if (voiceChannel) {
				voiceChannel.delete();
				removeClub(id);
			}
		} else {
			return;
		}
		updateList(guild.channels, "clubs"); //TODONOW move into removeClub?
	}
})
//#endregion
