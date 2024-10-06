const log = console.log;

console.log = function () {
	log.apply(console, [`<t:${Math.floor(Date.now() / 1000)}> `, ...arguments]);
}

const error = console.error;

console.error = function () {
	error.apply(console, [`<t:${Math.floor(Date.now() / 1000)}> `, ...arguments]);
}

//#region Imports
const { Client, REST, GatewayIntentBits, Routes, ActivityType, Events } = require("discord.js");
const fsa = require("fs/promises");

const { getCommand, slashData } = require("./commands/_commandDictionary.js");
const { getContextMenu, contextMenuData } = require("./context_menus/_contextMenuDictionary.js");
const { getButton } = require("./buttons/_buttonDictionary.js");
const { getSelect } = require("./selects/_selectDictionary.js");
const { scheduleClubReminderAndEvent, updateClubDetails } = require("./engines/clubEngine.js");
const { deletePingableRole, updateOnboarding, removeAllPetitionsBy, checkAllPetitions, isOptInChannel, deleteOptInChannel } = require("./engines/customizationEngine.js");
const { versionEmbedBuilder, rulesEmbedBuilder, pressKitEmbedBuilder } = require("./engines/messageEngine.js");
const { referenceMessages, getClubDictionary, removeClub, updateListReference } = require("./engines/referenceEngine.js");
const { ensuredPathSave } = require("./util/fileUtil.js");
const { SAFE_DELIMITER, guildId, commandIds, testGuildId, SKIP_INTERACTION_HANDLING } = require('./constants.js');
const versionData = require('../config/_versionData.json');
//#endregion
//#region Executing Code
/** @type {Map<string, Map<string, number>>} */
const interactionCooldowns = new Map();

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
		(() => {
			try {
				new REST({ version: 9 }).setToken(require(authPath).token).put(
					Routes.applicationCommands(client.user.id),
					{ body: slashData.concat(contextMenuData) }
				).then(commands => {
					for (const command of commands) {
						commandIds[command.name] = command.id;
					}
				})
			} catch (error) {
				console.error(error);
			}
		})()
	} else {
		client.application.commands.fetch({ guildId: testGuildId }).then(commandCollection => {
			commandCollection.each(command => {
				commandIds[command.name] = command.id;
			})
		})
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

		updateOnboarding(guild);

		// Start up club reminder and event scheduling
		const channelManager = guild.channels;
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
			updateListReference(channelManager, "petition");
		}
		if (referenceMessages.club?.channelId && referenceMessages.club?.messageId) {
			updateListReference(channelManager, "club");
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

client.on(Events.InteractionCreate, interaction => {
	if (interaction.customId?.startsWith(SKIP_INTERACTION_HANDLING)) {
		return;
	}

	if (interaction.isAutocomplete()) {
		const command = getCommand(interaction.commandName);
		const focusedOption = interaction.options.getFocused(true);
		const choices = command.autocomplete?.[focusedOption.name](focusedOption.value.toLowerCase()) ?? [];
		interaction.respond(choices.slice(0, 25));
	} else if (interaction.isContextMenuCommand()) {
		const contextMenu = getContextMenu(interaction.commandName);
		const cooldownTimestamp = contextMenu.getCooldownTimestamp(interaction.user.id, interactionCooldowns);
		if (cooldownTimestamp) {
			interaction.reply({ content: `Please wait, the \`/${interaction.commandName}\` context menu option is on cooldown. It can be used again <t:${cooldownTimestamp}:R>.`, ephemeral: true });
			return;
		}

		contextMenu.execute(interaction);
	} else if (interaction.isCommand()) {
		const command = getCommand(interaction.commandName);
		const cooldownTimestamp = command.getCooldownTimestamp(interaction.user.id, interactionCooldowns);
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
		}
		const interactionWrapper = getter(mainId);
		const cooldownTimestamp = interactionWrapper.getCooldownTimestamp(interaction.user.id, interactionCooldowns);

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

	removeAllPetitionsBy(memberId);
	checkAllPetitions(guild); // because guild member count has decreased, petitions may now be completed
	updateListReference(guild.channels, "petition");
})

client.on(Events.ChannelDelete, ({ id, guild }) => {
	// Check if deleted channel is a topic
	if (isOptInChannel(id)) {
		deleteOptInChannel(id, guild);
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

client.on(Events.GuildRoleDelete, role => {
	deletePingableRole(role);
})
//#endregion
