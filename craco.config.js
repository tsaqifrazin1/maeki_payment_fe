module.exports = {
  webpack: {
    configure: {
      ignoreWarnings: [
        function ignoreSourcemapsLoaderWarnings(warning) {
          return (
            warning.module &&
            warning.module.resource.includes('node_modules') &&
            warning.details &&
            warning.details.includes('source-map-loader')
          );
        },
      ],
    },
  },
  eslint: {
    enable: false, // 👈 This completely disables ESLint checks
  },
}; 
