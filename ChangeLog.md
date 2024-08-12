# HorizonsBot Change Log
#### HorizonsBot Version 2.8.0:
- Proxy threads send silenced everyone mentions (then delete them) to simulate DM red bubbles

#### HorizonsBot Version 2.7.0:
## /proxy-thread
This new command bundle allows users to make their own private threads including PluralKit in the #proxy-threads channel (see channel for more info).
- `/proxy-thread create` makes a new private thread
- `/proxy-thread rename` allows any thread member to rename the thread
- `/proxy-thread disband` allows any thread member to disband the thread
- invite new server members to threads by @'ing them

## Other Changes
- Split the `/list` command into subcommands
- Added command links to `/server-rules`, `/press-kit`, `/list clubs`, and `/list petitions`
- Added a note about channels with extra rules in `/server-rules`

#### HorizonsBot Version 2.6.0:
- New command: `/club-skip-meeting` allows club leaders and moderators to cancel the reminder for a club's upcoming meeting and advance the next meeting timestamp if repeated meetings

#### HorizonsBot Version 2.5.1:
- `/roll` now provides more helpful error messages
- Fixed a few crashes
#### HorizonsBot Version 2.5.0:
- Added new functionality to the `/roll` command
	- `#d%` is a shortcut for rolling # d100s (default 1)
	- `2l["Lethal Company", "PlateUp!", "Smithworks"]` will now randomly pick between `Lethal Company`, `PlateUp!`, and `Smithworks` 2 times
	- `4ul[first,second,third,fourth]`will now randomly pick between `first`, `second`, `third`, and `fourth` 4 times without repeats
	- strings can now be concatenated with the + operator, and duplicated with the * operator (number must be first operand)
- Club host commands are now always visible due to conditional visibility not working anymore
- Fixed a crash trying to schedule a deleted club's meeting event
#### HorizonsBot Version 2.4.0:
- Fixed a crash when setting a club's next meeting
- Various refactors and optimzations
#### HorizonsBot Version 2.3.0:
- Clubs can now be "Staged" clubs, which have a stage channel instead of a private voice channel
- Selecting multiple clubs to view the summary of (either from `/list` or the club list) only sends one message now
- Split `/info` back into its previous commands (was practically only causing more UI navigation)
#### HorizonsBot Version 2.2.2:
- Made the type argument of `/at-channel` required
- `/club-invite` provides a more helpful feedback message and can accept multiple users to send info to
- Other minor fixes
#### HorizonsBot Version 2.2.1:
- Fixed mention in `/at-channel` being null when argument is omitted
#### HorizonsBot Version 2.2.0:
- Updated rules and data policy
- Combined `/about`, `/data-policy`, `/press-kit`, `/roles`, & `/rules` into `/info`
- Club events now use the club's image
- Ported `/petition-veto`
- Fixed slash commands being shown twice in the menu
- Some slash commands can now be used in DMs
- All bot interactions now have cooldowns (3s default)
- Added `/at-event` which pings all users interested in a given event
#### HorizonsBot Version 2.1.0:
- Removed opt-in topics handling, please use the Channel & Roles Browser instead
   - Retained `/petition` for text channels
   - Removed topic specific commands: `/join` (use `/club-invite` instead) and `/topic-invite`
   - Renamed commands to indicate their club only functionality:
      - `/leave` -> `/club-leave`
	  - `/remove-user` -> `/club-kick` (this command has been made usable by club hosts)
	  - `/delete` -> `/club-sunset` (this command has been made usable by club hosts)
   - Replaced topic list with petition list in: `/list` and `/pin-list`
- Updated `/press-kit`
- Removed the functionality where HorizonsBot would bump the club list in #clubs-recruiting
- Various system and audit messages no longer send notifications
- Fixed a bug where setting club meeting interval wasn't saving the units
- Fixed a bug where club reminder start event buttons were starting the wrong event
- Fixed a bug where club events wouldn't get updated after changing club settings
#### HorizonsBot Version 2.0.2:
- Fixed club events being scheduled for the current meeting instead of the next meeting
#### HorizonsBot Version 2.0.1:
- Clubs that aren't recruiting are filtered out of the club list select
- Fixed selects (drop downs) crashing the bot
- Fixed club reminder timestamp being for the next next meeting instead of the next meeting
#### HorizonsBot Version 2.0.0:
 - Updated discord.js to v14
 - Embeds have random tips in their footer
 - Combined all club configuration under `/club-config` using Discord UI
 - Removed the annoying behavior where the bot would send reminder messages for meetings less than a day away on start-up/configuration (use new slash command `/club-send-reminder` manually)
#### HorizonsBot Version 1.17.2:
 - Fixed a crash
#### HorizonsBot Version 1.17.1:
 - Removed custom embed system
 - New commands: `/roles`, `/rules`, and `/press-kit`
 - Fixed several bugs and crashes

#### HorizonsBot Version 1.17.0:
- Reorganized several manager commands via subcommands
- Fixed an issue where club reminders weren't getting cleared if meeting times changed

#### HorizonsBot Version 1.16.3:
- Fixed "Join Voice" button in club reminders
- Fixed a crash on generating club reminders
- Fixed an issue where club events wouldn't recreate themselves
- Club timestamps now include day of the week
- Set `/club-next-meeting` and `/club-set-repeat` to require a club leader or moderator
- Other stuff

#### HorizonsBot Version 1.16.2:
- Fixed crash in scheduling club events

#### HorizonsBot Version 1.16.1:
- Many fixes for club reminders
- Other stuff

#### HorizonsBot Version 1.16.0:
- Reenabled custom club reminder messages (use the `reminder-text` option in `/club-set-repeat`)
- Turning off club meeting repeats now cancels the upcoming event and reminder
- Fixed `/commands` sending a file while the commands list still fits in a message
- Automated patch notes and `/version` to check bot changes
- Other stuff

#### HorizonsBot Version 1.15.0:
- Check the repository for version notes pre-history
