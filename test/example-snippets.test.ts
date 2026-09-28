import { describe, it, expect } from "vitest";
import * as ns from "../example/snippets.js";

const snippets = (ns as any).default ?? ns;
const {
  snippetFor,
  installBlock,
  version,
  browserUrl,
  PACKAGE,
  FALLBACK_VERSION,
} = snippets;

const PAN = {
  fn: "computeDetailedPanchang",
  type: "PanchangResponse",
  varName: "p",
  args: '"2026-09-28", 23.1765, 75.7885, "Asia/Kolkata", "en"',
  tail: "p.vara, p.panchang.paksha",
};

const HORA = {
  fn: "computeDetailedPanchang",
  type: "PanchangResponse",
  varName: "p",
  args: '"2026-09-28", 23.1765, 75.7885, "Asia/Kolkata", "en"',
  extract: { varName: "h", type: "Hora", value: "p.hora" },
  tail: "h.day, h.night",
};

describe("version", () => {
  it("uses the injected build version", () => {
    expect(version({ version: "9.9.9" })).toBe("9.9.9");
  });

  it("falls back when the global carries no version", () => {
    expect(version({})).toBe(FALLBACK_VERSION);
    expect(version(null)).toBe(FALLBACK_VERSION);
    expect(version({ version: "" })).toBe(FALLBACK_VERSION);
  });
});

describe("browserUrl", () => {
  it("pins the exact version on jsDelivr", () => {
    expect(browserUrl("0.4.0", "jsdelivr")).toBe(
      "https://cdn.jsdelivr.net/npm/vpv-panchangam@0.4.0/dist/browser/vpv-panchangam.mjs",
    );
  });

  it("pins the exact version on unpkg", () => {
    expect(browserUrl("0.4.0", "unpkg")).toBe(
      "https://unpkg.com/vpv-panchangam@0.4.0/dist/browser/vpv-panchangam.mjs",
    );
  });
});

describe("snippetFor — typescript", () => {
  const out = snippetFor(PAN, "0.4.0", "ts");

  it("imports the function and the result type from the package", () => {
    expect(out).toContain(
      'import { computeDetailedPanchang, type PanchangResponse } from "vpv-panchangam";',
    );
  });

  it("annotates the declaration", () => {
    expect(out).toContain(
      'const p: PanchangResponse = await computeDetailedPanchang("2026-09-28", 23.1765, 75.7885, "Asia/Kolkata", "en");',
    );
  });

  it("never references a CDN", () => {
    expect(out).not.toContain("https://");
  });

  it("keeps the field-access tail", () => {
    expect(out).toContain(
      "p.vara, p.panchang.paksha // featured fields read above",
    );
  });

  it("annotates an extract line and imports its type", () => {
    const h = snippetFor(HORA, "0.4.0", "ts");
    expect(h).toContain(
      'import { computeDetailedPanchang, type PanchangResponse, type Hora } from "vpv-panchangam";',
    );
    expect(h).toContain("const h: Hora = p.hora;");
  });
});

describe("snippetFor — javascript", () => {
  const out = snippetFor(PAN, "0.4.0", "js");

  it("imports the function from the jsDelivr browser bundle", () => {
    expect(out).toContain(
      'import { computeDetailedPanchang } from "https://cdn.jsdelivr.net/npm/vpv-panchangam@0.4.0/dist/browser/vpv-panchangam.mjs";',
    );
  });

  it("carries no type annotations", () => {
    expect(out).not.toContain("type ");
    expect(out).not.toContain(": PanchangResponse");
  });

  it("leaves an unannotated declaration", () => {
    expect(out).toContain(
      'const p = await computeDetailedPanchang("2026-09-28", 23.1765, 75.7885, "Asia/Kolkata", "en");',
    );
  });

  it("leaves an unannotated extract line", () => {
    const h = snippetFor(HORA, "0.4.0", "js");
    expect(h).toContain("const h = p.hora;");
    expect(h).not.toContain("Hora");
  });

  it("omits the trailing comment's type-only tail difference", () => {
    expect(out).toContain(
      "p.vara, p.panchang.paksha // featured fields read above",
    );
  });
});

describe("snippetFor — version threading", () => {
  it("threads the version it is given into the URL", () => {
    expect(snippetFor(PAN, "1.2.3", "js")).toContain(
      "https://cdn.jsdelivr.net/npm/vpv-panchangam@1.2.3/dist/browser/vpv-panchangam.mjs",
    );
  });
});

describe("installBlock", () => {
  it("npm shows the install command and a bare-specifier import", () => {
    const out = installBlock("npm", "0.4.0");
    expect(out).toContain("npm install vpv-panchangam");
    expect(out).toContain(
      'import { computeDetailedPanchang } from "vpv-panchangam";',
    );
  });

  it("jsdelivr shows the pinned browser bundle URL", () => {
    expect(installBlock("jsdelivr", "0.4.0")).toBe(
      'import { computeDetailedPanchang } from "https://cdn.jsdelivr.net/npm/vpv-panchangam@0.4.0/dist/browser/vpv-panchangam.mjs";',
    );
  });

  it("unpkg mirrors the jsDelivr URL on a different host", () => {
    expect(installBlock("unpkg", "0.4.0")).toBe(
      'import { computeDetailedPanchang } from "https://unpkg.com/vpv-panchangam@0.4.0/dist/browser/vpv-panchangam.mjs";',
    );
  });

  it("script shows a paste-ready module tag", () => {
    const out = installBlock("script", "0.4.0");
    expect(out).toContain('<script type="module">');
    expect(out).toContain("</script>");
    expect(out).toContain("window.vpv = vpv;");
    expect(out).toContain(
      'import * as vpv from "https://cdn.jsdelivr.net/npm/vpv-panchangam@0.4.0/dist/browser/vpv-panchangam.mjs";',
    );
  });

  it("threads the version into every tab that carries a URL", () => {
    expect(installBlock("jsdelivr", "2.0.0")).toContain("@2.0.0/");
    expect(installBlock("unpkg", "2.0.0")).toContain("@2.0.0/");
    expect(installBlock("script", "2.0.0")).toContain("@2.0.0/");
  });

  it("rejects an unknown tab", () => {
    expect(() => installBlock("bogus", "0.4.0")).toThrow();
  });
});

describe("package name", () => {
  it("is the published name, not the v0.2.0 name", () => {
    expect(PACKAGE).toBe("vpv-panchangam");
  });
});
