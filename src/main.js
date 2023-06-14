const { entrypoints } = require("uxp");
const {
  exportAllArtboards,
  exportCurrentArtboard,
} = require("./lib/commands/index");
entrypoints.setup({
  commands: {
    exportAllArtboards,
    exportCurrentArtboard,
  },
});
