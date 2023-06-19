const { entrypoints } = require("uxp");
const {
  exportAllArtboards,
  exportCurrentArtboard,
  linkGithub,
} = require("./lib/commands/index");
entrypoints.setup({
  commands: {
    exportAllArtboards: {
      run(data, rootNode) {
        exportAllArtboards(data, rootNode);
      },
    },
    exportCurrentArtboard: {
      run(data) {
        exportCurrentArtboard(data);
      },
    },
    linkGithub,
  },
});
