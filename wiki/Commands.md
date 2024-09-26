## /about
> Usable in: DMs, Servers, and Group DMs

> Cooldown: 3 seconds

Get the HorizonsBot credits
## /at-channel
> Usable in: Servers

> Cooldown: 300 seconds

Send a ping to the current channel
### type
> Choices: `Only online users in this channel`, `All users in this channel`

Who to notify
### message
The text of the notification
## /at-event
> Usable in: Servers

> Cooldown: 300 seconds

Send a ping to users interested in an event
### event-id
The id of the event to make an announcement for
### message
The text of the notification
## /at-permission
> Usable in: Servers

> Cooldown: 3 seconds

> Permission Level: ManageRoles

### /at-permission allow
(moderator) Re-allow a user to use /at-channel
### /at-permission disallow
(moderator) Prevent a user from using /at-channel
## /club-add
> Usable in: Servers

> Cooldown: 3 seconds

> Permission Level: ManageChannels

Set up a club (a text and voice channel)
### club-host
The user's mention
### voice-channel-type
> Choices: `stage`, `private`

Stage channels are visible to everyone
## /club-config
> Usable in: Servers

> Cooldown: 3 seconds

Change the configuration of the current club
## /club-invite
> Usable in: DMs, Servers, and Group DMs

> Cooldown: 3 seconds

> Permission Level: SendMessages

Send a user an invite to a club
## /club-kick
> Usable in: Servers

> Cooldown: 3 seconds

Remove a user from a club
### target
The user's mention
### ban (optional)
Prevent the user from rejoining?
## /club-leave
> Usable in: Servers

> Cooldown: 3 seconds

Leave this club
## /club-update-host
> Usable in: Servers

> Cooldown: 3 seconds

Promote another user to club host
### user
The user's mention
## /club-send-reminder
> Usable in: Servers

> Cooldown: 3 seconds

Re-post the reminder message for the club's next meeting
## /club-skip-meeting
> Usable in: Servers

> Cooldown: 3 seconds

Skip the next club meeting, cancelling/resetting reminders
## /club-sunset
> Usable in: Servers

> Cooldown: 3 seconds

Delete a club on a delay
### delay
Number of hours to delay deleting the club
## /commands
> Usable in: DMs, Servers, and Group DMs

> Cooldown: 3 seconds

Get a link to HorizonsBot's commands page
## /create-opt-in-channel
> Usable in: Servers

> Cooldown: 3 seconds

> Permission Level: ManageChannels

Set up an opt-in channel without petitions
### channel-name
Discord forces channel names to lowercase
## /create-pingable-role
> Usable in: Servers

> Cooldown: 3 seconds

> Permission Level: ManageRoles

Set up a Pingable Role without petitions
### role-name
Make sure the role doesn't already exist
## /data-policy
> Usable in: DMs, Servers, and Group DMs

> Cooldown: 3 seconds

Get a link to the HorizonsBot's Data Policy page
## /list
> Usable in: DMs, Servers, and Group DMs

> Cooldown: 3 seconds

### /list clubs
Get the list of clubs on the server
### /list petitions
Get the list of open topic petitions
## /manage-mods
> Usable in: Servers

> Cooldown: 3 seconds

> Permission Level: ManageGuild

### /manage-mods promote
(moderator) Add a user to the moderator list
### /manage-mods demote
(moderator) Remove a user from the moderator list
## /petition-check-channel
> Usable in: Servers

> Cooldown: 3 seconds

Check how many more signatures a channel petition needs
### channel-petition (optional)
The Opt-In Channel petition to check
## /petition-check-role
> Usable in: Servers

> Cooldown: 3 seconds

Check how many more signatures a role petition needs
### role-petition (optional)
The Pingable Role petition to check
## /petition-veto
> Usable in: DMs, Servers, and Group DMs

> Cooldown: 3 seconds

> Permission Level: ManageChannels

Veto a petition
## /petition
> Usable in: Servers

> Cooldown: 3 seconds

> Permission Level: SendMessages

### /petition pingable-role
A role for pinging server members for grouping up
### /petition opt-in-channel
Make sure the channel doesn't already exist
## /post-reference
> Usable in: Servers

> Cooldown: 3 seconds

> Permission Level: ManageChannels

Post a reference message in this channel
### reference
> Choices: `the petiton list`, `the club list`, `the rules embed`, `the press kit`, `the proxy thread hub embed`

which message to post
## /press-kit
> Usable in: Servers

> Cooldown: 3 seconds

Get info on Imaginary Horizons as a brand
## /proxy-thread
> Usable in: Servers

> Cooldown: 3 seconds

> Permission Level: SendMessagesInThreads

### /proxy-thread create
Create a new proxy thread
### /proxy-thread disband
Disband a proxy thread
### /proxy-thread rename
Rename one of your proxy threads
## /roles-rundown
> Usable in: Servers

> Cooldown: 3 seconds

See what the roles on the server mean and how to get them
## /roll
> Usable in: DMs, Servers, and Group DMs

> Cooldown: 3 seconds

> Permission Level: SendMessages

Roll any number of dice with any number of sides
### dice
The dice to roll in #d# format
### display (optional)
> Choices: `Result only`, `Compare to max total roll`, `Result for each die`, `Compare each die to max roll`

Choose output display option
### label (optional)
Text after the roll
## /server-rules
> Usable in: DMs, Servers, and Group DMs

> Cooldown: 3 seconds

Get the server rules
## /set-pingable-role-emoji
> Usable in: Servers

> Cooldown: 3 seconds

> Permission Level: ManageRoles

Set the emoji show with a Pingable Role in Onboarding
### role-id
The role to update in onboarding
### emoji
The emoji to add
## /timestamp
> Usable in: DMs, Servers, and Group DMs

> Cooldown: 3 seconds

Calculate the unix timestamp for a moment in time, which Discord displays with timezones applied
### start (optional)
The timestamp to start from (default: now)
### days-from-start (optional)
86400 seconds
### hours-from-start (optional)
3600 seconds
### minutes-from-start (optional)
60 seconds
## /version
> Usable in: DMs, Servers, and Group DMs

> Cooldown: 3 seconds

Get HorizonsBot's version notes
### notes-length
> Choices: `Last version`, `Full change log`

Get the changes in last version or the full change log
