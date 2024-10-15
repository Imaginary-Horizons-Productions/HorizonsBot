const { ContextMenuWrapper, BuildError } = require("../classes");

/** @type {Record<string, ContextMenuWrapper>} */
const CONTEXT_MENU_DICTIONARY = {};
const contextMenuData = [];

for (const file of [
	"Invite_to_Club.js"
]) {
	/** @type {ContextMenuWrapper} */
	const contextMenu = require(`./${file}`);
	if (contextMenu.mainId in CONTEXT_MENU_DICTIONARY) {
		throw new BuildError(`Duplicate context menu custom id: ${contextMenu.mainId}`)
	}
	CONTEXT_MENU_DICTIONARY[contextMenu.mainId] = contextMenu;
	contextMenuData.push(contextMenu.builder.toJSON());
}

/** @param {string} mainId */
function getContextMenu(mainId) {
	return CONTEXT_MENU_DICTIONARY[mainId];
}

module.exports = {
	/** @type {import('discord.js').RESTPostAPIChatInputApplicationCommandsJSONBody[]} */
	contextMenuData,
	getContextMenu
};