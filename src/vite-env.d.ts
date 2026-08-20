/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MIRA_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
