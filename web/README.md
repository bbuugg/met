# live

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## Arco Design Theme Customization

This project customizes the Arco Design theme to match the MeetingPage.vue style:

- Custom CSS variables in `src/assets/arco-theme.css`
- Theme switching support for both light and dark modes
- Custom component styles that match the overall design language
- Automatic theme synchronization with the application's theme service

To modify the Arco Design theme:

1. Edit `src/assets/arco-theme.css` to adjust CSS variables
2. The theme automatically syncs with the application's light/dark mode
3. Custom component styles are applied through CSS classes

The customization includes:
- Primary, success, warning, and error color palettes
- Background, text, and border colors for both light and dark themes
- Custom styling for buttons, inputs, cards, and modals
- Smooth transitions and hover effects that match the MeetingPage.vue design
