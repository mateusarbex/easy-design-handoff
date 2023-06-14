const { saveNodes } = require("../../utils/index");

const exportCurrentArtboard = async (selection) => {
  const items = selection.itemsIncludingLocked;
  if (!items.length) {
    return Dialogs.alert("No nodes are selected, please select some nodes.");
  }
  await saveNodes(items, document.name || items[0].name || "inker8-exports");
};

const exportAllArtboards = async () => {
  const items = [];

  document.children.forEach((child, i) => {
    items[i] = child;
  });
  if (!items.length) {
    return Dialogs.alert(
      "No artboards are in document, please create some artboards."
    );
  }
  await saveNodes(items, document.name || items[0].name || "inker8-exports");
};

module.exports = {
  exportAllArtboards,
  exportCurrentArtboard,
};
