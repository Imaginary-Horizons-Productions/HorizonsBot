## General Commands
These commands are general use utilities for the server.
### /at-channel
> Permission Level: ViewChannel

> Usable in DMs: false

> Cooldown: 300 second(s)

Send a ping to the current channel
#### message
The text of the notification
#### type (optional)
> Choices: `Only online users in this channel`, `All users in this channel`

Who to notify
### /timestamp

> Usable in DMs: true

> Cooldown: 3 second(s)

Calculate the unix timestamp for a moment in time, which Discord displays with timezones applied
#### start (optional)
The timestamp to start from (default: now)
#### days-from-start (optional)
86400 seconds
#### hours-from-start (optional)
3600 seconds
#### minutes-from-start (optional)
60 seconds
### /roll
> Permission Level: ViewChannel

> Usable in DMs: true

> Cooldown: 3 second(s)

Roll any number of dice with any number of sides
#### dice
The dice to roll in #d# format
#### display (optional)
> Choices: `Result only`, `Compare to max total roll`, `Result for each die`, `Compare each die to max roll`

Choose output display option
#### label (optional)
Text after the roll
### /petition
> Permission Level: ViewChannel

> Usable in DMs: false

> Cooldown: 3 second(s)

Petition for a topic text channel
#### topic-name
Make sure the topic doesn't already exist
### /at-event
> Permission Level: ViewChannel

> Usable in DMs: false

> Cooldown: 300 second(s)

Send a ping to users interested in an event
#### event-id
The id of the event to make an announcement for
#### message
The text of the notification
## Informantional Commands
Use these commands to learn more about this server or HorizonsBot.
### /info

> Usable in DMs: false

> Cooldown: 3 second(s)

Get info about the server or HorizonsBot
#### /info horizonsbot-credits
Get the HorizonsBot credits
#### /info server-rules
Get the server rules
#### /info horizonsbot-data-policy
See what data HorizonsBot collects and what it does with it
#### /info roles-rundown
See what the roles on the server mean and how to get them
#### /info press-kit
Get info on Imaginary Horizons as a brand
### /commands

> Usable in DMs: true

> Cooldown: 3 second(s)

List HorizonsBot's commands
#### page (optional)
> Choices: `General Commands`, `Informational Commands`, `Topic Commands`, `Club Commands`, `Moderation Commands`

Pick a single page of commands to view
### /list

> Usable in DMs: true

> Cooldown: 3 second(s)

Get the petition or club list
#### list-type
> Choices: `Get the list of open topic petitions`, `Get the list of clubs on the server`

The list to get
### /version

> Usable in DMs: true

> Cooldown: 3 second(s)

Get HorizonsBot's version notes
#### full-notes
Get the file with the full version notes?
### /petition-check

> Usable in DMs: false

> Cooldown: 3 second(s)

Check how many more petitions a topic needs
#### topic
The petition to check
## Club Commands
Clubs are private text and voice channels that include organization utilities like automatic reminders.
### /club-invite
> Permission Level: ViewChannel

> Usable in DMs: true

> Cooldown: 3 second(s)

Send a user (default: self) an invite to a club
#### club-id (optional)
The club text channel's id
#### invitee (optional)
The user's mention
### /club-kick
> Permission Level: ManageChannels

> Usable in DMs: false

> Cooldown: 3 second(s)

Remove a user from a club
#### target
The user's mention
#### ban (optional)
Prevent the user from rejoining?
### /club-leave
> Permission Level: ViewChannel

> Usable in DMs: false

> Cooldown: 3 second(s)

Leave this club
### /club-send-reminder
> Permission Level: ManageChannels

> Usable in DMs: false

> Cooldown: 3 second(s)

Re-post the reminder message for the club's next meeting
### /club-config
> Permission Level: ManageChannels

> Usable in DMs: false

> Cooldown: 3 second(s)

Change the configuration of the current club
### /club-update-host
> Permission Level: ManageChannels

> Usable in DMs: false

> Cooldown: 3 second(s)

Promote another user to club host
#### user
The user's mention
### /club-add
> Permission Level: ManageChannels

> Usable in DMs: false

> Cooldown: 3 second(s)

Set up a club (a text and voice channel)
#### club-host
The user's mention
### /club-sunset
> Permission Level: ManageChannels

> Usable in DMs: false

> Cooldown: 3 second(s)

Delete a club on a delay
#### delay
Number of hours to delay deleting the club
## Moderation Commands
Commands for moderators. Required permissions are listed in (parenthesis) at the beginning of the description.
### /at-permission
> Permission Level: ManageRoles

> Usable in DMs: true

> Cooldown: 3 second(s)

Disallow/Re-allow a user to use /at-channel
#### /at-permission disallow
(moderator) Prevent a user from using /at-channel
#### /at-permission allow
(moderator) Re-allow a user to use /at-channel
### /petition-veto
> Permission Level: ManageChannels

> Usable in DMs: true

> Cooldown: 3 second(s)

Veto a petition
#### topic
The petition to close
### /topic-add
> Permission Level: ManageChannels

> Usable in DMs: false

> Cooldown: 3 second(s)

Set up a topic
#### topic-name
The new topic
### /manage-mods
> Permission Level: ManageGuild

> Usable in DMs: false

> Cooldown: 3 second(s)

Promote/demote a user to moderator
#### /manage-mods promote
(moderator) Add a user to the moderator list
#### /manage-mods demote
(moderator) Remove a user from the moderator list
### /post-reference
> Permission Level: ManageChannels

> Usable in DMs: false

> Cooldown: 3 second(s)

Post a reference message in this channel
#### reference
> Choices: `the petiton list`, `the club list`, `the rules embed`, `the press kit`

which message to post
