const storage = require("uxp").storage;
const fs = require("uxp").storage.localFileSystem;
const secureStorage = require("uxp").storage.secureStorage;
const application = require("application");
const { confirm } = require("../lib/dialogs");
global.setTimeout = /** @type {any} */ (global.setTimeout || ((fn) => fn()));
const Compress = require("../lib/compress");
const Folder = storage.Folder;

/**
 *
 * @param {string} string
 * @returns {string}
 */

const Utf8ArrayToStr = (array) => {
  let out, i, len, c;
  let char2, char3;

  out = "";
  len = array.length;
  i = 0;
  while (i < len) {
    c = array[i++];
    switch (c >> 4) {
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
        // 0xxxxxxx
        out += String.fromCharCode(c);
        break;
      case 12:
      case 13:
        // 110x xxxx   10xx xxxx
        char2 = array[i++];
        out += String.fromCharCode(((c & 0x1f) << 6) | (char2 & 0x3f));
        break;
      case 14:
        // 1110 xxxx  10xx xxxx  10xx xxxx
        char2 = array[i++];
        char3 = array[i++];
        out += String.fromCharCode(
          ((c & 0x0f) << 12) | ((char2 & 0x3f) << 6) | ((char3 & 0x3f) << 0)
        );
        break;
    }
  }

  return out;
};

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
      let res = await Compress.compressSVG(svg);
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

  const folder = await fs.getFolder();
  if (!folder) {
    return;
  }

  const pluginFolder = await fs.getPluginFolder();

  let statics = /** @type {Folder} */ (
    await pluginFolder.getEntry("assets/static-plugin")
  );
  /** @type {Folder} */
  let exportsFolder = undefined;
  try {
    exportsFolder = await folder.createFolder(name);
  } catch (error) {
    console.error(error);
    let ret = await confirm(
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
  const link = Utf8ArrayToStr(await secureStorage.getItem("github"));
  if (link) {
    const gitIgnore = await exportsFolder.createFile(".gitignore");
    await gitIgnore.write("start.sh");
    const gitFile = await exportsFolder.createFile("start.sh");
    await gitFile.write(`
    git init;
    git remote add origin ${link};
    git checkout main;
    git add . &&
    git commit -m "New Export ${new Date().toUTCString()}";
    git pull origin main --rebase;
    if git push --set-upstream origin main; then
      echo success
    else
      echo error;
    fi;
  `);
  }

  let dbJson = await getDataJSON(nodes);
  let dist = /** @type {Folder} */ (await exportsFolder.getEntry("dist"));
  console.log(dist);
  let dbFile = await dist.createFile("db.js");

  await dbFile.write(dbJson);
}

module.exports = {
  saveNodes,
  copyFolder,
  filterString,
  deleteFolder,
  getDataJSON,
  Utf8ArrayToStr,
};
