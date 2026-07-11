/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

declare const __APP_VERSION__: string

declare module '*.md?raw' {
  const src: string
  export default src
}
