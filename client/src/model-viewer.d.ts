// Ambient JSX typing for <model-viewer>, the Web Component registered by @google/model-viewer's
// side-effect import. React 19 has no built-in knowledge of this custom element or its
// non-standard kebab-case attributes, so without this declaration <model-viewer> fails to
// type-check under this project's strict: true.
//
// With the "react-jsx" transform (this project's tsconfig), TypeScript resolves JSX intrinsic
// elements via module augmentation on React.JSX (see node_modules/@types/react/jsx-runtime.d.ts,
// whose own IntrinsicElements extends React.JSX.IntrinsicElements) rather than a global JSX
// namespace — the classic-transform `declare global { namespace JSX { ... } }` pattern has no
// effect here and silently fails to type-check <model-viewer> usage.
import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          poster?: string;
          "camera-controls"?: boolean;
          "auto-rotate"?: boolean;
          "shadow-intensity"?: string | number;
          exposure?: string | number;
          ar?: boolean;
        },
        HTMLElement
      >;
    }
  }
}
