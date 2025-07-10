export const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ??
  (import.meta.env.DEV
    ? ''
    : 'https://api.porto.blainemalone.com')