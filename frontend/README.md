# React + TypeScript + Vite

## Supabase email authentication

The frontend talks only to the FastAPI backend; Supabase keys are never put in
browser code. Before starting the app, set `SUPABASE_URL` and
`SUPABASE_ANON_KEY` in `backend/.env`, then configure the following in the
Supabase dashboard:

1. Enable **Confirm email** in Authentication → Providers → Email.
2. Set the Site URL to the frontend URL (normally `http://localhost:5173`).
3. Add that URL to Authentication → URL Configuration → Redirect URLs, then
   set `SUPABASE_EMAIL_REDIRECT_URL=http://localhost:5173` in `backend/.env`.
4. Run [auth_profiles.sql](../supabase/auth_profiles.sql) in the Supabase SQL
   Editor. It creates one `public.profiles` row for each new Auth user.

Leave `VITE_API_URL` empty in local Vite development: its same-origin proxy
forwards API requests to `http://127.0.0.1:8082`, allowing the browser to keep
the HttpOnly session cookie across a normal page refresh. Set `VITE_API_URL`
only when deploying behind a correctly configured same-site API domain.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
