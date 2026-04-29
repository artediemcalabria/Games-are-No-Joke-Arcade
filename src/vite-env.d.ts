/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AI_COACH_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
