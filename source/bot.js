const log = console.log;

console.log = function () {
	log.apply(console, [`<t:${Math.floor(Date.now() / 1000)}> `, ...arguments]);
}

const error = console.error;

console.error = function () {
	error.apply(console, [`<t:${Math.floor(Date.now() / 1000)}> `, ...arguments]);
}

//#region Imports
const { Client, REST, GatewayIntentBits, Routes, ActivityType, Events, MessageFlags } = require("discord.js");
const fsa = require("fs/promises");

const { getCommand, slashData } = require("./commands/_commandDictionary.js");
const { getContextMenu, contextMenuData } = require("./context_menus/_contextMenuDictionary.js");
const { getButton } = require("./buttons/_buttonDictionary.js");
const { getSelect } = require("./selects/_selectDictionary.js");
const { scheduleClubReminder, updateClubDetails, clearClubReminder, cancelClubRecruitmentEvent } = require("./engines/clubEngine.js");
const { deletePingableRole, updateOnboarding, removeAllPetitionsBy, checkAllPetitions, isOptInChannel, deleteOptInChannel } = require("./engines/customizationEngine.js");
const { versionEmbedBuilder, rulesEmbedBuilder, pressKitEmbedBuilder } = require("./engines/messageEngine.js");
const { referenceMessages, getClubDictionary, removeClub, updateListReference } = require("./engines/referenceEngine.js");
const { SAFE_DELIMITER, guildId, commandIds, testGuildId, SKIP_INTERACTION_HANDLING } = require('./constants.js');
const versionData = require('../config/_versionData.json');
const { ensuredPathSave } = require("./util/fileUtil.js");
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
				new REST({ version: 10 }).setToken(require(authPath).token).put(
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
		// Since HorizonsBot is only intended to serve 1 guild, we can cache members on start-up to simplify other fetches
		guild.members.fetch();

		// Post version notes
		if (versionData.patchNotesChannelId) {
			fsa.readFile('./ChangeLog.md', { encoding: 'utf8' }).then(data => {
				let [currentFull, currentMajor, currentMinor, currentPatch] = data.match(/(\d+)\.(\d+)\.(\d+)/);
				let [_lastFull, lastMajor, lastMinor, lastPatch] = versionData.lastPostedVersion.match(/(\d+)\.(\d+)\.(\d+)/);

				if (parseInt(currentMajor) <= parseInt(lastMajor) && parseInt(currentMinor) <= parseInt(lastMinor) && parseInt(currentPatch) <= parseInt(lastPatch)) {
					return;
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
				scheduleClubReminder(club.id, club.timeslot.nextMeeting, channelManager);
			} else {
				club.timeslot.nextMeeting = null;
				club.timeslot.eventId = null;
			}
		}

		// Update reference messages
		if (referenceMessages.petition?.channelId && referenceMessages.petition?.messageId) {
			updateListReference(channelManager, "petition");
		}
		if (referenceMessages.club?.channelId && referenceMessages.club?.messageId) {
			updateListReference(channelManager, "club");
		}
		for (const [referenceType, embed] of [
			["rules", rulesEmbedBuilder()],
			["press-kit", pressKitEmbedBuilder()]
		]) {
			if (referenceMessages[referenceType]?.channelId && referenceMessages[referenceType]?.messageId) {
				channelManager.fetch(referenceMessages[referenceType].channelId).then(channel => {
					channel.messages.fetch(referenceMessages[referenceType].messageId).then(async message => {
						message.edit({ embeds: [await embed] });
					}).catch((error) => {
						if (error.code === 10008) { // Unknown Message
							referenceMessages[referenceType].channelId = "";
							referenceMessages[referenceType].messageId = "";
							ensuredPathSave(referenceMessages, "referenceMessageIds.json");
						}
						console.error(error);
					});
				}).catch((error) => {
					if (error.code === 10008) { // Unknown Message
						referenceMessages[referenceType].channelId = "";
						referenceMessages[referenceType].messageId = "";
						ensuredPathSave(referenceMessages, "referenceMessageIds.json");
					}
					console.error(error);
				});
			}
		}
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
			interaction.reply({ content: `Please wait, the \`/${interaction.commandName}\` context menu option is on cooldown. It can be used again <t:${cooldownTimestamp}:R>.`, flags: MessageFlags.Ephemeral });
			return;
		}

		contextMenu.execute(interaction);
	} else if (interaction.isCommand()) {
		const command = getCommand(interaction.commandName);
		const cooldownTimestamp = command.getCooldownTimestamp(interaction.user.id, interactionCooldowns);
		if (cooldownTimestamp) {
			interaction.reply({ content: `Please wait, the \`/${interaction.commandName}\` command is on cooldown. It can be used again <t:${cooldownTimestamp}:R>.`, flags: MessageFlags.Ephemeral });
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
			interaction.reply({ content: `Please wait, this interaction is on cooldown. It can be used again <t:${cooldownTimestamp}:R>.`, flags: MessageFlags.Ephemeral });
			return;
		}

		interactionWrapper.execute(interaction, args);
	}
})

client.on(Events.MessageCreate, (message) => {
	if (message.channelId === "1521256025053990952") {
		message.member.ban({ deleteMessageSeconds: 30, reason: "posted in honeypot" });
	}
})

client.on(Events.GuildMemberRemove, (guildMember) => {
	// Remove member's clubs
	for (const club of Object.values(getClubDictionary())) {
		if (guildMember.roles.cache.has(club.roleId)) {
			guildMember.guild.channels.fetch(club.id).then(clubTextChannel => {
				if (guildMember.id == club.hostId) {
					clubTextChannel.delete("Club host left server");
					removeClub(club.id, guildMember.guild.channels);
				} else {
					updateClubDetails(club, clubTextChannel);
				}
			})
		}
	}
	updateListReference(guildMember.guild.channels, "club");

	removeAllPetitionsBy(guildMember.id);
	checkAllPetitions(guildMember.guild); // because guild member count has decreased, petitions may now be completed
	updateListReference(guildMember.guild.channels, "petition");
})

client.on(Events.ChannelDelete, ({ id, guild }) => {
	// Check if deleted channel is a topic
	if (isOptInChannel(id)) {
		deleteOptInChannel(id, guild);
	} else {
		const clubDictionary = getClubDictionary();
		for (const clubId in clubDictionary) {
			const club = clubDictionary[clubId];
			if ([clubId, club.voiceChannelId].includes(id)) {
				clearClubReminder(club);
				cancelClubRecruitmentEvent(club, guild.scheduledEvents);
				guild.roles.delete(club.roleId);

				// Check if deleted channel is a club's voice channel
				if (club.voiceChannelId === id) {
					const textChannel = guild.channels.resolve(club.id);
					if (textChannel) {
						textChannel.send({ content: "This club has been archived because its voice channel was deleted." });
					}
				} else {
					// Deleted channel is a club's text channel
					const voiceChannel = guild.channels.resolve(club.voiceChannelId);
					if (voiceChannel) {
						voiceChannel.delete();
					}
				}
				removeClub(clubId, guild.channels);
				return;
			}
		}
	}
})

client.on(Events.GuildRoleDelete, role => {
	deletePingableRole(role);
})
//#endregion
