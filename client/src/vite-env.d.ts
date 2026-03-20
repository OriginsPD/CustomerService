/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** LAN IP shown in the kiosk page warning (e.g. "192.168.0.6") */
  readonly VITE_PUBLIC_HOST: string;
  /** API proxy target override for Docker */
  readonly VITE_API_TARGET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
