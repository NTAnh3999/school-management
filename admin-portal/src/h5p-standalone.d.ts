// Ambient module declaration for h5p-standalone. The package ships dist/h5p.d.ts, but that file
// only declares supporting option interfaces (H5PIntegration, H5PContent, etc.) -- it does not
// actually declare the H5P class itself, and package.json has no "types"/"typings" field pointing
// TypeScript at it anyway. Without this declaration, `import { H5P } from "h5p-standalone"`
// resolves to an implicit `any` (TS7016) under this project's strict settings.
declare module "h5p-standalone" {
  interface H5POptions {
    h5pJsonPath: string;
    frameJs: string;
    frameCss: string;
    id?: string;
    librariesPath?: string;
    contentJsonPath?: string;
    frame?: boolean;
    copyright?: boolean;
    export?: boolean;
    icon?: boolean;
    downloadUrl?: string;
    fullScreen?: boolean;
    embed?: boolean;
    embedCode?: string;
    customCss?: string | string[];
    customJs?: string | string[];
    reportingIsEnabled?: boolean;
    xAPIObjectIRI?: string;
  }

  class H5P {
    constructor(el: HTMLElement, options: H5POptions);
  }
}
