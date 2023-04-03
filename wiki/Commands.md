## General Commands
These commands are general use utilities for the server.
### /at-channel
Send a ping to the current channel
#### message
The text of the notification
#### type (optional)
Who to notify
### /timestamp
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
Roll any number of dice with any number of sides
#### dice
The dice to roll in #d# format
#### display (optional)
Choose output display option
#### label (optional)
Text after the roll
### /join
Join a topic or club
#### channel
The name/id of the topic or club to join
### /leave
Leave a topic or club
### /petition
Petition for a topic text channel
#### topic-name
Make sure the topic doesn't already exist
## Informantional Commands
Use these commands to learn more about this server or HorizonsBot.
### /rules
Get the server rules
### /commands
List HorizonsBot's commands
#### page (optional)
Pick a single page of commands to view
### /roles
Get a rundown of the server's roles
### /list
Get the topic or club list
#### list-type
The list to get
### /about
Get the HorizonsBot credits
### /version
Get HorizonsBot's version notes
#### full-notes
Get the file with the full version notes?
### /data-policy
Show what user data HorizonsBot collects and how it's used
### /press-kit
Get info on Imaginary Horizons as a brand
## Topic Commands
This server has opt-in topic channels (hidden by default). New topics are automatically generated when enough members /petition for them.
### /topic-add
(moderator) Set up a topic
#### topic-name
The new topic
### /topic-invite
Invite a user to a topic
#### invitee
The user to invite (copy-paste from another channel)
#### channel
The topic channel
### /remove-user
(moderator) Remove a user from a topic or club
#### target
The user's mention
#### ban (optional)
Prevent the user from rejoining?
## Club Commands
Clubs are private text and voice channels that include organization utilities like automatic reminders.
### /club-invite
Send a user (default: self) an invite to a club
#### club-id (optional)
The club text channel's id
#### invitee (optional)
The user's mention
### /club-add
(moderator) Set up a club (a text and voice channel)
#### club-host
The user's mention
### /club-send-reminder
Re-post the reminder message for the club's next meeting
### /club-config
Change the configuration of the current club
### /club-update-host
Promote another user to club host
#### user
The user's mention
## Moderation Commands
Commands for moderators. Required permissions are listed in (parenthesis) at the beginning of the description.
### /at-permission
(moderator) Disallow/Re-allow a user to use /at-channel
#### disallow (optional)
(moderator) Prevent a user from using /at-channel
#### allow (optional)
(moderator) Re-allow a user to use /at-channel
### /petition-check
Check how many more petitions a topic needs
#### topic
The petition to check
### /delete
(moderator) Delete a topic or club on a delay
#### delay
Number of hours to delay deleting the channel
### /manage-mods
(moderator) Promote/demote a user to moderator
#### promote (optional)
(moderator) Add a user to the moderator list
#### demote (optional)
(moderator) Remove a user from the moderator list
### /pin-list
(moderator) Pin the topics or clubs list message in this channel
#### list-type
The list to pin
