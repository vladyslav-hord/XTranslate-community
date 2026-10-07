import { join } from "node:path";
import * as sass from "sass";

describe("ShowHideMore layout", () => {
  it("keeps a layout box so a parent disclosure can clip it when collapsed", () => {
    const sourcePath = join(__dirname, "show-hide-more.module.scss");
    const css = sass.compile(sourcePath, { style: "expanded" }).css;
    const componentRule = css.match(/\.ShowHideMore\s*\{([^}]*)\}/)?.[1];
    const collapsedRule = css.match(/\.ShowHideMore:not\(\.expanded\) > :not\(\.toggle\)\s*\{([^}]*)\}/)?.[1];

    expect(componentRule).toBeDefined();
    expect(componentRule).not.toMatch(/display:\s*contents/);
    expect(collapsedRule).toMatch(/padding-block:\s*0/);
    expect(collapsedRule).toMatch(/border-block-width:\s*0/);
  });
});
