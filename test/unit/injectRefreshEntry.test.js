const injectRefreshEntry = require('../../lib/utils/injectRefreshEntry');

const ErrorOverlayEntry = require.resolve('../../client/ErrorOverlayEntry');
const ReactRefreshEntry = require.resolve('../../client/ReactRefreshEntry');

const DEFAULT_OPTIONS = {
  overlay: {
    entry: ErrorOverlayEntry,
  },
};

describe('injectRefreshEntry', () => {
  it('should add entries to a string', () => {
    expect(injectRefreshEntry('test.js', DEFAULT_OPTIONS)).toStrictEqual([
      'test.js',
      ReactRefreshEntry,
      ErrorOverlayEntry,
    ]);
  });

  it('should add entries to an array', () => {
    expect(injectRefreshEntry(['test.js'], DEFAULT_OPTIONS)).toStrictEqual([
      'test.js',
      ReactRefreshEntry,
      ErrorOverlayEntry,
    ]);
  });

  it('should add entries to an object', () => {
    expect(
      injectRefreshEntry(
        {
          main: 'test.js',
          vendor: ['react', 'react-dom'],
        },
        DEFAULT_OPTIONS
      )
    ).toStrictEqual({
      main: ['test.js', ReactRefreshEntry, ErrorOverlayEntry],
      vendor: [ReactRefreshEntry, ErrorOverlayEntry, 'react', 'react-dom'],
    });
  });

  it.skipIf(
    WEBPACK_VERSION !== 5,
    'should add entries to an object using entry description',
    () => {
      expect(
        injectRefreshEntry(
          {
            main: {
              dependOn: 'vendors',
              import: 'test.js',
            },
            vendor: ['react', 'react-dom'],
          },
          DEFAULT_OPTIONS
        )
      ).toStrictEqual({
        main: {
          dependOn: 'vendors',
          import: ['test.js', ReactRefreshEntry, ErrorOverlayEntry],
        },
        vendor: [ReactRefreshEntry, ErrorOverlayEntry, 'react', 'react-dom'],
      });
    }
  );

  it('should add entries to a synchronous function', () => {
    const returnedEntry = injectRefreshEntry(() => 'test.js', DEFAULT_OPTIONS);
    expect(typeof returnedEntry).toBe('function');
    expect(returnedEntry()).resolves.toStrictEqual([
      'test.js',
      ReactRefreshEntry,
      ErrorOverlayEntry,
    ]);
  });

  it('should add entries to an asynchronous function', () => {
    const returnedEntry = injectRefreshEntry(() => Promise.resolve('test.js'), DEFAULT_OPTIONS);
    expect(typeof returnedEntry).toBe('function');
    expect(returnedEntry()).resolves.toStrictEqual([
      'test.js',
      ReactRefreshEntry,
      ErrorOverlayEntry,
    ]);
  });

  it('should add entries to a function returning an object', () => {
    const returnedEntry = injectRefreshEntry(
      () => ({
        main: 'test.js',
        vendor: ['react', 'react-dom'],
      }),
      DEFAULT_OPTIONS
    );
    expect(typeof returnedEntry).toBe('function');
    expect(returnedEntry()).resolves.toStrictEqual({
      main: ['test.js', ReactRefreshEntry, ErrorOverlayEntry],
      vendor: [ReactRefreshEntry, ErrorOverlayEntry, 'react', 'react-dom'],
    });
  });

  it('should not append overlay entry when unused', () => {
    expect(injectRefreshEntry('test.js', {})).toStrictEqual(['test.js', ReactRefreshEntry]);
  });

  it('should append legacy WDS entry when required', () => {
    expect(
      injectRefreshEntry('test.js', {
        overlay: {
          entry: ErrorOverlayEntry,
          useLegacyWDSSockets: true,
        },
      })
    ).toStrictEqual([
      'test.js',
      ReactRefreshEntry,
      require.resolve('../../client/LegacyWDSSocketEntry'),
      ErrorOverlayEntry,
    ]);
  });

  it('should append resource queries to the overlay entry when specified', () => {
    expect(
      injectRefreshEntry('test.js', {
        overlay: {
          entry: ErrorOverlayEntry,
          sockHost: 'localhost',
          sockPath: '/socket',
          sockPort: '9000',
        },
      })
    ).toStrictEqual([
      'test.js',
      ReactRefreshEntry,
      `${ErrorOverlayEntry}?sockHost=localhost&sockPath=/socket&sockPort=9000`,
    ]);
  });

  it('should append overlay entry for a string after socket-related entries', () => {
    expect(injectRefreshEntry('webpack-dev-server/client', DEFAULT_OPTIONS)).toStrictEqual([
      'webpack-dev-server/client',
      ReactRefreshEntry,
      ErrorOverlayEntry,
    ]);
  });

  it('should append overlay entry for an array after socket-related entries while keeping original relative order', () => {
    expect(
      injectRefreshEntry(['setup-env.js', 'webpack-dev-server/client', 'test.js'], DEFAULT_OPTIONS)
      ).toStrictEqual([
        'test.js',
        ReactRefreshEntry,
        'setup-env.js',
        'webpack-dev-server/client',
        ErrorOverlayEntry,
    ]);
  });

  it('should throw when non-parsable entry is received', () => {
    expect(() => injectRefreshEntry(1, DEFAULT_OPTIONS)).toThrowErrorMatchingInlineSnapshot(
      `"[React Refresh] Failed to parse the Webpack \`entry\` object!"`
    );
  });
});
