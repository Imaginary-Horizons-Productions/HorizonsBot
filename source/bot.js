//#region Imports
const { Client, REST, GatewayIntentBits, Routes, ActivityType, Events } = require("discord.js");
const fsa = require("fs/promises");

const { getCommand, slashData } = require("./commands/_commandDictionary.js");
const { getButton } = require("./buttons/_buttonDictionary.js");
const { getModal } = require("./modalSubmissions/_modalSubmissionDictionary.js");
const { getSelect } = require("./selects/_selectDictionary.js");
const { scheduleClubReminderAndEvent, updateClubDetails } = require("./engines/clubEngine.js");
const { versionEmbedBuilder, rulesEmbedBuilder, pressKitEmbedBuilder } = require("./engines/messageEngine.js");
const { isClubHostOrModerator, isModerator } = require("./engines/permissionEngine.js");
const { referenceMessages, getClubDictionary, getPetitions, setPetitions, checkPetition, getTopicIds, addTopic, removeTopic, removeClub, updateList } = require("./engines/referenceEngine.js");
const { ensuredPathSave } = require("./helpers.js");
const { SAFE_DELIMITER, guildId } = require('./constants.js');
const versionData = require('../config/_versionData.json');
//#endregion
//#region Executing Code
const cooldowns = new Map();

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

	if (process.argv[2] === "prod") {
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
	}
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
				scheduleClubReminderAndEvent(club.id, club.timeslot.nextMeeting, channelManager);
			} else {
				club.timeslot.setNextMeeting(null);
				club.timeslot.setEventId(null);
			}
		}

		// Update reference messages
		if (referenceMessages.petition?.channelId && referenceMessages.petition?.messageId) {
			updateList(channelManager, "petition");
		}
		if (referenceMessages.club?.channelId && referenceMessages.club?.messageId) {
			updateList(channelManager, "club");
		}
		Object.entries({
			"rules": rulesEmbedBuilder(),
			"press-kit": pressKitEmbedBuilder()
		}).forEach(([referenceType, embed]) => {
			if (referenceMessages[referenceType]?.channelId && referenceMessages[referenceType]?.messageId) {
				channelManager.fetch(referenceMessages[referenceType].channelId).then(channel => {
					channel.messages.fetch(referenceMessages[referenceType].messageId).then(message => {
						message.edit({ embeds: [embed] });
					}).catch(error => {
						if (error.code === 10008) { // Unknown Message
							referenceMessages[referenceType].channelId = "";
							referenceMessages[referenceType].messageId = "";
							ensuredPathSave(referenceMessages, "referenceMessageIds.json");
						}
						console.error(error);
					})
				}).catch(error => {
					if (error.code === 10003) { // Unknown Channel
						referenceMessages[referenceType].channelId = "";
						referenceMessages[referenceType].messageId = "";
						ensuredPathSave(referenceMessages, "referenceMessageIds.json");
					}
					console.error(error);
				})
			}
		})
	})
})

/** returns Unix Timestamp when cooldown will expire or null in case of expired or missing cooldown
 * @param {InteractionWrapper} interactionWrapper
 * @param {string} userId
 */
function getInteractionCooldownTimestamp({ customId, cooldown }, userId) {
	const now = Date.now();

	if (!cooldowns.has(customId)) {
		cooldowns.set(customId, new Map());
	}

	const timestamps = cooldowns.get(customId);
	if (timestamps.has(userId)) {
		const expirationTime = timestamps.get(userId) + cooldown;

		if (now < expirationTime) {
			return Math.round(expirationTime / 1000);
		} else {
			timestamps.delete(userId);
		}
	} else {
		timestamps.set(userId, now);
		setTimeout(() => timestamps.delete(userId), cooldown);
	}
	return null;
}

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

		const cooldownTimestamp = getInteractionCooldownTimestamp(command, interaction.user.id);
		if (cooldownTimestamp) {
			interaction.reply({ content: `Please wait, the \`/${interaction.commandName}\` command is on cooldown. It can be used again <t:${cooldownTimestamp}:R>.`, ephemeral: true });
			return;
		}

		command.execute(interaction);
	} else {
		const [mainId, ...args] = interaction.customId.split(SAFE_DELIMITER);
		let getter;
		if (interaction.isButton()) {
			getter = getButton;
		} else if (interaction.isAnySelectMenu()) {
			getter = getSelect;
		} else if (interaction.isModalSubmit()) {
			getter = getModal;
		}
		const interactionWrapper = getter(mainId);
		const cooldownTimestamp = getInteractionCooldownTimestamp(interactionWrapper, interaction.user.id);

		if (cooldownTimestamp) {
			interaction.reply({ content: `Please wait, this interaction is on cooldown. It can be used again <t:${cooldownTimestamp}:R>.`, ephemeral: true });
			return;
		}

		interactionWrapper.execute(interaction, args);
	}
})

client.on(Events.GuildMemberRemove, ({ id: memberId, guild }) => {
	// Remove member's clubs
	for (const club of Object.values(getClubDictionary())) {
		guild.channels.fetch(club.id).then(clubTextChannel => {
			if (memberId == club.hostId) {
				clubTextChannel.delete("Club host left server");
				removeClub(club.id, guild.channels);
			} else if (club.userIds.includes(memberId)) {
				club.userIds = club.userIds.filter(id => id != memberId);
				updateClubDetails(club, clubTextChannel);
			}
		})
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
