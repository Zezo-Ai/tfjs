/**
 * @license
 * Copyright 2020 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

const karmaTypescriptConfig = {
  tsconfig: 'tsconfig.json',
  coverageOptions: {instrumentation: false},
  bundlerOptions: {
    sourceMap: true,
    transforms: [
      require('karma-typescript-es6-transform')({
        presets: [
          // ensure we get es5 by adding IE 11 as a target
          ['@babel/env', {targets: {browsers: ['defaults', 'IE 11']}}]
        ]
      }),
    ]
  }
};

// Enable coverage reports and instrumentation under KARMA_COVERAGE=1 env
const coverageEnabled = !!process.env.KARMA_COVERAGE;
if (coverageEnabled) {
  karmaTypescriptConfig.coverageOptions.instrumentation = true;
  karmaTypescriptConfig.coverageOptions.exclude = /_test\.ts$/;
  karmaTypescriptConfig.reports = {html: 'coverage', 'text-summary': ''};
}

const devConfig = {
  singleRun: true,
  frameworks: ['jasmine', 'karma-typescript'],
  files: [
    {pattern: './node_modules/@babel/polyfill/dist/polyfill.js'},
    'integration_tests/setup_test.ts',
    {pattern: 'integration_tests/**/*.ts'},
    {
      pattern: 'integration_tests/*_data/**/*',
      watched: true,
      included: false,
      served: true,
      nocache: true
    },
    {
      pattern: 'integration_tests/metadata/**/*',
      watched: true,
      included: false,
      served: true,
      nocache: true
    },
    // Serve program bundles as files
    {
      pattern: 'custom_module/*/dist/**/*',
      watched: true,
      included: false,
      served: true,
      nocache: true
    },
    // Serve model assets as files
    {
      pattern: 'custom_module/*/model/**/*',
      watched: true,
      included: false,
      served: true,
      nocache: true
    },
    // Serve wasm files
    {
      pattern: 'node_modules/@tensorflow/tfjs-backend-wasm/wasm-out/*.wasm',
      watched: true,
      included: false,
      served: true,
    },
  ],
  basePath: '',
  proxies: {
    '/base/node_modules/karma-typescript/dist/client/tfjs-backend-wasm.wasm':
        '/base/node_modules/@tensorflow/tfjs-backend-wasm/wasm-out/tfjs-backend-wasm.wasm',
    '/base/node_modules/karma-typescript/dist/client/tfjs-backend-wasm-simd.wasm':
        '/base/node_modules/@tensorflow/tfjs-backend-wasm/wasm-out/tfjs-backend-wasm-simd.wasm',
    '/base/node_modules/karma-typescript/dist/client/tfjs-backend-wasm-threaded-simd.wasm':
        '/base/node_modules/@tensorflow/tfjs-backend-wasm/wasm-out/tfjs-backend-wasm-threaded-simd.wasm',
  },
  exclude: ['integration_tests/custom_bundle_test.ts'],
  include: ['integration_tests/**/*.ts'],
  preprocessors: {
    '**/*.ts': ['karma-typescript'],  // *.tsx for React Jsx
  },
  karmaTypescriptConfig,
  reporters: ['spec', 'karma-typescript']
};

const browserstackConfig = {
  ...devConfig,
  // TODONT: do not use `hostname: 'bs-local.com'. This is automatically changed
  // by BrowserStack when necessary (i.e. on ios safari). Setting it manually
  // breaks WASM file serving.
  // See https://www.browserstack.com/question/39574
  singleRun: true,
  port: 9200
};

const chromeWebgpuFlags = [
  '--enable-unsafe-webgpu',  // Can be removed after WebGPU release
  '--use-webgpu-adapter=swiftshader',
  // https://github.com/tensorflow/tfjs/issues/7631
  '--disable-vulkan-fallback-to-gl-for-testing',
];

module.exports = function(config) {
  const args = [];

  if (config.testEnv) {
    args.push('--testEnv', config.testEnv);
  }
  if (config.flags) {
    args.push('--flags', config.flags);
  }
  if (config.grep) {
    args.push('--grep', config.grep);
  }
  if (config.tags) {
    args.push('--tags', config.tags);
  }

  let extraConfig = null;

  if (config.browserstack) {
    extraConfig = browserstackConfig;
  } else {
    extraConfig = devConfig;
  }

  config.set({
    ...extraConfig,
    reporters: [
      'spec',
      'jasmine-order',
    ],
    browsers: ['ChromeHeadless'],
    browserStack: {
      username: process.env.BROWSERSTACK_USERNAME,
      accessKey: process.env.BROWSERSTACK_KEY,
      timeout: 1800,
      tunnelIdentifier: `e2e_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    },
    captureTimeout: 3e5,
    reportSlowerThan: 500,
    browserNoActivityTimeout: 3e5,
    browserDisconnectTimeout: 3e5,
    browserDisconnectTolerance: 0,
    browserSocketTimeout: 1.2e5,
    customLaunchers: {
      bs_chrome_mac: {
        base: 'BrowserStack',
        browser: 'chrome',
        browser_version: 'latest',
        os: 'OS X',
        os_version: 'High Sierra',
        flags: chromeWebgpuFlags,
      },
      bs_firefox_mac: {
        base: 'BrowserStack',
        browser: 'firefox',
        browser_version: 'latest',
        os: 'OS X',
        os_version: 'High Sierra'
      },
      bs_safari_mac: {
        base: 'BrowserStack',
        browser: 'safari',
        browser_version: 'latest',
        os: 'OS X',
        os_version: 'Mojave'
      },
      bs_ios_12: {
        base: 'BrowserStack',
        device: 'iPhone XS',
        os: 'ios',
        os_version: '12.3',
        real_mobile: true
      },
      bs_android_10: {
        base: 'BrowserStack',
        device: 'Google Pixel 4 XL',
        os: 'android',
        os_version: '10.0',
        real_mobile: true
      },
      win_10_chrome: {
        base: 'BrowserStack',
        browser: 'chrome',
        browser_version: '101.0',
        os: 'Windows',
        os_version: '10',
        flags: chromeWebgpuFlags,
      }
    },
    client: {jasmine: {random: false}, args: args, captureConsole: true},
    logLevel: 'info'
  });
};
