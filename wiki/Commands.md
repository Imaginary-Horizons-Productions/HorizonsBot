### /about

> Usable in DMs: false

> Cooldown: 3 second(s)

Get the HorizonsBot credits
### /at-channel
> Permission Level: ViewChannel

> Usable in DMs: false

> Cooldown: 300 second(s)

Send a ping to the current channel
#### type
> Choices: `Only online users in this channel`, `All users in this channel`

Who to notify
#### message
The text of the notification
### /at-event
> Permission Level: ViewChannel

> Usable in DMs: false

> Cooldown: 300 second(s)

Send a ping to users interested in an event
#### event-id
The id of the event to make an announcement for
#### message
The text of the notification
### /at-permission
> Permission Level: ManageRoles

> Usable in DMs: false

> Cooldown: 3 second(s)

Disallow/Re-allow a user to use /at-channel
#### /undefined disallow
(moderator) Prevent a user from using /at-channel
#### /undefined allow
(moderator) Re-allow a user to use /at-channel
### /club-add
> Permission Level: ManageChannels

> Usable in DMs: false

> Cooldown: 3 second(s)

Set up a club (a text and voice channel)
#### club-host
The user's mention
#### voice-channel-type
> Choices: `stage`, `private`

Stage channels are visible to everyone
### /club-config
> Permission Level: ManageMessages

> Usable in DMs: false

> Cooldown: 3 second(s)

Change the configuration of the current club
### /club-invite

> Usable in DMs: true

> Cooldown: 3 second(s)

Send a user (default: self) an invite to a club
#### club-id (optional)
The club text channel's id
#### invitees (optional)
The mention(s) of the user(s)
### /club-kick
> Permission Level: ManageMessages

> Usable in DMs: false

> Cooldown: 3 second(s)

Remove a user from a club
#### target
The user's mention
#### ban (optional)
Prevent the user from rejoining?
### /club-leave

> Usable in DMs: false

> Cooldown: 3 second(s)

Leave this club
### /club-update-host
> Permission Level: ManageMessages

> Usable in DMs: false

> Cooldown: 3 second(s)

Promote another user to club host
#### user
The user's mention
### /club-send-reminder
> Permission Level: ManageMessages

> Usable in DMs: false

> Cooldown: 3 second(s)

Re-post the reminder message for the club's next meeting
### /club-sunset
> Permission Level: ManageMessages

> Usable in DMs: false

> Cooldown: 3 second(s)

Delete a club on a delay
#### delay
Number of hours to delay deleting the club
### /commands

> Usable in DMs: true

> Cooldown: 3 second(s)

Get a link to HorizonsBot's commands page
### /data-policy

> Usable in DMs: true

> Cooldown: 3 second(s)

Get a link to the HorizonsBot's Data Policy page
### /list

> Usable in DMs: true

> Cooldown: 3 second(s)

Get the petition or club list
#### list-type
> Choices: `Get the list of open topic petitions`, `Get the list of clubs on the server`

The list to get
### /manage-mods
> Permission Level: ManageGuild

> Usable in DMs: false

> Cooldown: 3 second(s)

Promote/demote a user to moderator
#### /undefined promote
(moderator) Add a user to the moderator list
#### /undefined demote
(moderator) Remove a user from the moderator list
### /petition-check

> Usable in DMs: false

> Cooldown: 3 second(s)

Check how many more petitions a topic needs
#### topic
The petition to check
### /petition-veto
> Permission Level: ManageChannels

> Usable in DMs: true

> Cooldown: 3 second(s)

Veto a petition
#### topic
The petition to close
### /petition

> Usable in DMs: false

> Cooldown: 3 second(s)

Petition for a topic text channel
#### topic-name
Make sure the topic doesn't already exist
### /post-reference
> Permission Level: ManageChannels

> Usable in DMs: false

> Cooldown: 3 second(s)

Post a reference message in this channel
#### reference
> Choices: `the petiton list`, `the club list`, `the rules embed`, `the press kit`

which message to post
### /press-kit

> Usable in DMs: false

> Cooldown: 3 second(s)

Get info on Imaginary Horizons as a brand
### /roles-rundown

> Usable in DMs: false

> Cooldown: 3 second(s)

See what the roles on the server mean and how to get them
### /roll
> Permission Level: SendMessages

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
### /server-rules

> Usable in DMs: false

> Cooldown: 3 second(s)

Get the server rules
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
### /topic-add
> Permission Level: ManageChannels

> Usable in DMs: false

> Cooldown: 3 second(s)

Set up a topic
#### topic-name
The new topic
### /version

> Usable in DMs: true

> Cooldown: 3 second(s)

Get HorizonsBot's version notes
#### full-notes
Get the file with the full version notes?
