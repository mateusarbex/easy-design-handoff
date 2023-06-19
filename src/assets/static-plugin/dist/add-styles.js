var observeDOM = (function () {
  var MutationObserver =
    window.MutationObserver || window.WebKitMutationObserver;

  return function (obj, callback) {
    if (!obj || obj.nodeType !== 1) return;

    if (MutationObserver) {
      // define a new observer
      var mutationObserver = new MutationObserver(callback);

      // have the observer observe for changes in children
      mutationObserver.observe(obj, { childList: true, subtree: true });
      return mutationObserver;
    }

    // browser support fallback
    else if (window.addEventListener) {
      obj.addEventListener("DOMNodeInserted", callback, false);
      obj.addEventListener("DOMNodeRemoved", callback, false);
    }
  };
})();

let shouldChange = 0;

observeDOM(document.body, () => {
  const content = document.querySelector(".content");
  const visible = document.querySelector(".css-68ai3g.visible");
  const fontWeight = document.querySelector("#font-family");

  if (content && visible && !fontWeight) {
    const textToQuery = content.textContent;
    for (let tspan of document.querySelectorAll("text tspan")) {
      if (tspan.textContent === textToQuery) {
        const css = document.querySelector(
          ".css-68ai3g.visible .content > div"
        );
        const spanAttribute = document.createElement("span");
        spanAttribute.id = "font-family";
        spanAttribute.className = "hljs-attribute";
        spanAttribute.textContent = "font-family: ";
        const spanValue = document.createElement("span");
        spanValue.className = "hljs-number";
        spanValue.textContent = getComputedStyle(tspan).fontFamily;

        css.appendChild(spanAttribute);
        css.appendChild(spanValue);
      }
    }
  }
});
