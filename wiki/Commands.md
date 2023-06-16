## General Commands
These commands are general use utilities for the server.
### /at-channel
> Cooldown: 300 second(s)

Send a ping to the current channel
#### message

The text of the notification
#### type (optional)
> Choices: Only online users in this channel, All users in this channel

Who to notify
### /timestamp
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
> Cooldown: 3 second(s)

Roll any number of dice with any number of sides
#### dice

The dice to roll in #d# format
#### display (optional)
> Choices: Result only, Compare to max total roll, Result for each die, Compare each die to max roll

Choose output display option
#### label (optional)

Text after the roll
### /petition
> Cooldown: 3 second(s)

Petition for a topic text channel
#### topic-name

Make sure the topic doesn't already exist
## Informantional Commands
Use these commands to learn more about this server or HorizonsBot.
### /info
> Cooldown: 3 second(s)

Get info about the server or HorizonsBot
#### horizonsbot-credits (optional)

Get the HorizonsBot credits
#### server-rules (optional)

Get the server rules
#### horizonsbot-data-policy (optional)

See what data HorizonsBot collects and what it does with it
#### roles-rundown (optional)

See what the roles on the server mean and how to get them
#### press-kit (optional)

Get info on Imaginary Horizons as a brand
### /commands
> Cooldown: 3 second(s)

List HorizonsBot's commands
#### page (optional)
> Choices: General Commands, Informational Commands, Topic Commands, Club Commands, Moderation Commands

Pick a single page of commands to view
### /list
> Cooldown: 3 second(s)

Get the petition or club list
#### list-type
> Choices: Get the list of open topic petitions, Get the list of clubs on the server

The list to get
### /version
> Cooldown: 3 second(s)

Get HorizonsBot's version notes
#### full-notes

Get the file with the full version notes?
### /petition-check
> Cooldown: 3 second(s)

Check how many more petitions a topic needs
#### topic

The petition to check
## Club Commands
Clubs are private text and voice channels that include organization utilities like automatic reminders.
### /club-invite
> Cooldown: 3 second(s)

Send a user (default: self) an invite to a club
#### club-id (optional)

The club text channel's id
#### invitee (optional)

The user's mention
### /club-kick
> Cooldown: 3 second(s)

Remove a user from a club
#### target

The user's mention
#### ban (optional)

Prevent the user from rejoining?
### /club-leave
> Cooldown: 3 second(s)

Leave this club
### /club-send-reminder
> Cooldown: 3 second(s)

Re-post the reminder message for the club's next meeting
### /club-config
> Cooldown: 3 second(s)

Change the configuration of the current club
### /club-update-host
> Cooldown: 3 second(s)

Promote another user to club host
#### user

The user's mention
### /club-add
> Cooldown: 3 second(s)

(moderator) Set up a club (a text and voice channel)
#### club-host

The user's mention
### /club-sunset
> Cooldown: 3 second(s)

Delete a club on a delay
#### delay

Number of hours to delay deleting the club
## Moderation Commands
Commands for moderators. Required permissions are listed in (parenthesis) at the beginning of the description.
### /at-permission
> Cooldown: 3 second(s)

(moderator) Disallow/Re-allow a user to use /at-channel
#### disallow (optional)

(moderator) Prevent a user from using /at-channel
#### allow (optional)

(moderator) Re-allow a user to use /at-channel
### /petition-veto
> Cooldown: 3 second(s)

(moderator) Veto a petition
#### topic

The petition to close
### /topic-add
> Cooldown: 3 second(s)

(moderator) Set up a topic
#### topic-name

The new topic
### /manage-mods
> Cooldown: 3 second(s)

(moderator) Promote/demote a user to moderator
#### promote (optional)

(moderator) Add a user to the moderator list
#### demote (optional)

(moderator) Remove a user from the moderator list
### /post-reference
> Cooldown: 3 second(s)

(moderator) Post a reference message in this channel
#### reference
> Choices: the petiton list, the club list, the rules embed, the press kit

which message to post
