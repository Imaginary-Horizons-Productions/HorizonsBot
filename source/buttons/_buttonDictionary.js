const buttonDictionary = {};

for (const file of [
	"changeclubinfo.js",
	"changeclubmeeting.js",
	"changeclubseats.js",
	"delete.js",
	"join.js",
	"startevent.js"
]) {
	const button = require(`./${file}`);
	buttonDictionary[button.name] = button;
}

/**
 * @param {string} mainId
 * @param {import("discord.js").Interaction} interaction
 * @param {string[]} args
 */
exports.callButton = function (mainId, interaction, args) {
	buttonDictionary[mainId].execute(interaction, args);
}
