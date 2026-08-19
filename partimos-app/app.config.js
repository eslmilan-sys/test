// En local la app se sirve desde la raíz; publicada en GitHub Pages cuelga de un
// subcamino. El camino entra por PARTIMOS_BASE_URL y solo al exportar, para que
// `npx expo start` siga abriendo en la raíz como siempre.
const base = process.env.PARTIMOS_BASE_URL;

module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    ...(base ? { baseUrl: base } : {}),
  },
});
