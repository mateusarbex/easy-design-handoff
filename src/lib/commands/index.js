const { saveNodes, Utf8ArrayToStr } = require("../../utils/index");
const { alert, prompt } = require("../dialogs");
const secureStorage = require("uxp").storage.secureStorage;

const exportCurrentArtboard = async (selection) => {
  const items = selection.itemsIncludingLocked;
  if (!items.length) {
    return alert("No nodes are selected, please select some nodes.");
  }
  await saveNodes(items, document.name || items[0].name || "inker8-exports");
};

const exportAllArtboards = async (data, rootNode) => {
  const items = [];

  rootNode.children.forEach((child, i) => {
    items[i] = child;
  });

  if (!items.length) {
    return alert("No artboards are in document, please create some artboards.");
  }
  await saveNodes(items, rootNode.name || items[0].name || "inker8-exports");
};

const linkGithub = async () => {
  const placeholdervalue =
    Utf8ArrayToStr(await secureStorage.getItem("github")) || "Link to github";
  try {
    const result = await prompt(
      "Link export to github repository",
      "Enter an url to provide link between export and a github repository",
      placeholdervalue,
      ["Cancel", "Connect"]
    );
    if (result.value) {
      await secureStorage.setItem("github", result.value);
      return alert("Github repository was linked sucessfully!");
    }
  } catch (e) {
    return alert("Could not link github repository");
  }
};

module.exports = {
  exportAllArtboards,
  exportCurrentArtboard,
  linkGithub,
};
