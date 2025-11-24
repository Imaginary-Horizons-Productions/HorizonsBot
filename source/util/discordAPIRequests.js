const { Message } = require("discord.js");

/** @param {Message} message */
function clearComponents(message) {
	message.edit({ components: [] }).catch(error => {
		if (error.code === "ChannelNotCached") {
			message.client.channels.fetch(message.channel.id).then(channel => {
				message.edit({ components: [] });
			});
		} else {
			console.error(error);
		}
	});
}

module.exports = {
	clearComponents
}
