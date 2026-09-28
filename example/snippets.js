/*! Snippet composition for the vpv-panchangam browser demo.
 *  Pure string functions — no DOM, no library access. Exposed as
 *  `window.vpvSnippets` in the browser and via module.exports for tests.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.vpvSnippets = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var PACKAGE = "vpv-panchangam";
  var FALLBACK_VERSION = "0.4.0";
  var BROWSER_ENTRY = "dist/browser/vpv-panchangam.mjs";
  var CDNS = {
    jsdelivr: "https://cdn.jsdelivr.net/npm/",
    unpkg: "https://unpkg.com/",
  };

  // the demo bundle injects package.json's version onto the vpv global; a stale
  // or missing bundle must never break snippet rendering
  function version(vpv) {
    var v = vpv && vpv.version;
    return typeof v === "string" && v ? v : FALLBACK_VERSION;
  }

  function browserUrl(ver, cdn) {
    var base = CDNS[cdn];
    if (!base) throw new Error("unknown cdn: " + cdn);
    return base + PACKAGE + "@" + ver + "/" + BROWSER_ENTRY;
  }

  // types a snippet needs in scope: the result type, plus any extracted value
  function typeNames(spec) {
    var names = [];
    if (spec.type) names.push(spec.type);
    if (spec.extract && spec.extract.type) names.push(spec.extract.type);
    return names;
  }

  function snippetFor(spec, ver, lang) {
    var types = typeNames(spec);
    var header;
    if (lang === "ts") {
      var parts = [spec.fn].concat(
        types.map(function (t) {
          return "type " + t;
        })
      );
      header = "import { " + parts.join(", ") + ' } from "' + PACKAGE + '";';
    } else {
      header = "import { " + spec.fn + ' } from "' + browserUrl(ver, "jsdelivr") + '";';
    }

    var lines = [header, ""];

    var decl = "const " + spec.varName;
    if (lang === "ts" && spec.type) decl += ": " + spec.type;
    lines.push(decl + " = await " + spec.fn + "(" + spec.args + ");");

    if (spec.extract) {
      var ex = "const " + spec.extract.varName;
      if (lang === "ts" && spec.extract.type) ex += ": " + spec.extract.type;
      lines.push(ex + " = " + spec.extract.value + ";");
    }

    if (spec.tail) {
      lines.push("");
      lines.push(spec.tail + " // featured fields read above");
    }

    return lines.join("\n");
  }

  function installBlock(tab, ver) {
    if (tab === "npm") {
      return (
        "npm install " +
        PACKAGE +
        "\n\n" +
        'import { computeDetailedPanchang } from "' +
        PACKAGE +
        '";'
      );
    }
    if (tab === "jsdelivr" || tab === "unpkg") {
      return (
        'import { computeDetailedPanchang } from "' + browserUrl(ver, tab) + '";'
      );
    }
    if (tab === "script") {
      return (
        '<script type="module">\n' +
        "  import * as vpv from " +
        JSON.stringify(browserUrl(ver, "jsdelivr")) +
        ";\n\n" +
        "  // vpv.computeDetailedPanchang, vpv.computeChart, …\n" +
        "  window.vpv = vpv;\n" +
        "</script>"
      );
    }
    throw new Error("unknown install tab: " + tab);
  }

  return {
    PACKAGE: PACKAGE,
    FALLBACK_VERSION: FALLBACK_VERSION,
    version: version,
    browserUrl: browserUrl,
    typeNames: typeNames,
    snippetFor: snippetFor,
    installBlock: installBlock,
  };
});
