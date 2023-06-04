const listFonts = () => {
  const fonts = [];

  for (const node of document.querySelectorAll("*")) {
    if (!node.style) continue;

    for (const pseudo of ["", ":before", ":after"]) {
      const fontFamily = getComputedStyle(node, pseudo).fontFamily;

      fonts.push(fontFamily.split(/\n*,\n*/g));
    }
  }
  return [...new Set(fonts)].map((font) =>
    font.replace(/^\s*['"]([^'"]*)['"]\s*$/, "$1").trim()
  );
};

const getFonts = async (fonts) => {
  for (let font of fonts) {
    try {
      const hasFont = document.fonts.check(`1rem ${font}`);
      if (!hasFont) {
        const link = document.createElement("link");
        const href = `https://fonts.googleapis.com/css?family=${font}`;
        await fetch(href, { mode: "no-cors", method: "GET" });
        link.href = href;
        link.rel = "stylesheet";
        document.head.appendChild(link);
      }
    } catch {}
  }
};

const allFonts = listFonts();

getFonts(allFonts);
