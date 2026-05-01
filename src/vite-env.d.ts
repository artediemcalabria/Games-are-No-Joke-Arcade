/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AI_COACH_ENDPOINT?: string;
  readonly VITE_AI_IMAGE_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
