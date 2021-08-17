module.exports = {
    mongodbMemoryServerOptions: {
      binary: {
        version: '4.0.3',
        skipMD5: true
      },
      instance: { // To use dynamic database name you must pass empty object for instance field
        dbName: 'jest'
      },
      autoStart: false
    }
  };