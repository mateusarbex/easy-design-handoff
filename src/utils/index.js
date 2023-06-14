const storage = require("uxp").storage;
const fs = require("uxp").storage.localFileSystem;
const application = require("application");
const Dialogs = require("../lib/dialogs");
global.setTimeout = /** @type {any} */ (global.setTimeout || ((fn) => fn()));
const Compress = require("../lib/compress");
const Folder = storage.Folder;

/**
 *
 * @param {string} string
 * @returns {string}
 */

const filterString = (string) => {
  return string.replace(/[\W]+/g, "-");
};

const getDataJSON = async (nodes) => {
  let tempFolder = await fs.getTemporaryFolder();
  tempFolder = await tempFolder.createFolder(
    Math.random().toString(36).slice(2)
  );
  let files = await Promise.all(
    nodes.map((node) =>
      tempFolder.createFile(`${Math.random().toString(36).slice(5)}.svg`)
    )
  );
  await application.createRenditions(
    nodes.map((node, i) => {
      return {
        node: node,
        outputFile: files[i],
        type: application.RenditionType.SVG,
        scale: 2,
        minify: false,
        embedImages: true,
      };
    })
  );
  let len = 100;
  while (len--) {
    await new Promise((res) => res());
  }
  let svgs = await Promise.all(
    files.map(async (f) => {
      let svg = await f.read();
      console.log("before", svg.length);
      let res = await Compress.compressSVG(svg);
      console.log("after", res.svg.length);
      return res.svg;
    })
  );
  let svgList = svgs
    .map((svg, i) => ({
      svg,
      name: nodes[i].name,
    }))
    .filter((s) => s.svg && s.svg !== "null" && s.name);
  return `
      window['__ARTBOARDS__'] = ${JSON.stringify(svgList)}
    `;
};
/**
 *
 * @param {Folder} folder
 * @param {Folder} dist
 */
async function copyFolder(folder, dist) {
  let entries = await folder.getEntries();
  for (const entry of entries) {
    if (entry.isFile) {
      entry
        .copyTo(dist, { overwride: true })
        .catch((err) => console.warn("[warn]", err));
    } else {
      let d = await dist.createFolder(filterString(entry.name));
      copyFolder(/** @type {Folder} */ (entry), d);
    }
  }
}

/**
 *
 * @param {Folder} folder
 */
async function deleteFolder(folder) {
  let entries = await folder.getEntries();
  for (const entry of entries) {
    if (entry.isFile) {
      await entry.delete();
    } else {
      await deleteFolder(/** @type {Folder} */ (entry));
    }
  }
  await folder.delete();
}
/**
 *
 * @param {Folder} folder
 * @param {string} name
 * @param {?number} i
 * @returns {Promise<Folder>}
 */
async function createAutoFolder(folder, name, i = 0) {
  /** @type {Folder} */
  let exportsFolder = undefined;
  try {
    exportsFolder = await folder.createFolder(name + (i ? "_" + i : ""));
  } catch (error) {
    console.error(error);
    return createAutoFolder(folder, name, i + 1);
  }
  return exportsFolder;
}

/**
 *
 * @param {any} nodes
 * @param {string} name
 */
async function saveNodes(nodes, name) {
  name = filterString(name);
  let folder = await fs.getFolder();
  if (!folder) {
    return;
  }
  let pluginFolder = await fs.getPluginFolder();

  let statics = /** @type {Folder} */ (
    await pluginFolder.getEntry("assets/static-plugin")
  );
  /** @type {Folder} */
  let exportsFolder = undefined;
  try {
    exportsFolder = await folder.createFolder(name);
  } catch (error) {
    console.error(error);
    let ret = await Dialogs.confirm(
      `The folder [${name}] already exists, do you want override it?`,
      ""
    );
    if (ret.which === 1) {
      let oldFolder = /** @type {Folder} */ (await folder.getEntry(name));
      await deleteFolder(oldFolder);
      exportsFolder = await folder.createFolder(name);
    } else {
      exportsFolder = await createAutoFolder(folder, name);
    }
  }
  await copyFolder(statics, exportsFolder);
  let dbJson = await getDataJSON(nodes);
  let dist = /** @type {Folder} */ (await exportsFolder.getEntry("dist"));
  let dbFile = await dist.createFile("db.js");
  await dbFile.write(dbJson);
}

module.exports = {
  saveNodes,
  copyFolder,
  filterString,
  deleteFolder,
  getDataJSON,
};
