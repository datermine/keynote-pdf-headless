'use strict'


const CDP = require('chrome-remote-interface');
const chromeLauncher = require('chrome-launcher');
const FileUtil = require('./file_util');
const HeadlessUtil = require('./headless_util');
const execFile = require('child_process').execFile;

// GLOBALS

const DEBUG_NETWORK = false;
const SIZE_DESKTOP = '1280,800';
const SIZE_MOBILE = '412,732';
const START_URL = 'https://www.icloud.com/';
const ICLOUD_USERNAME = process.argv[2];
const ICLOUD_PASS = process.argv[3];
const FILE_TO_UPLOAD_PATH = process.argv[4];

//// CRUX OF THE FLOW

function doEverything() {
  console.log(`About to log into iCloud: ${ICLOUD_USERNAME} // ${ICLOUD_PASS}`);

  let env;
  launchChrome()
    .then(async chromeInstance => {
      env = await initializeEnvironment(chromeInstance);

      // Optionally look at network requests.
      if (DEBUG_NETWORK) {
        env.Network.requestWillBeSent((params) => {
          console.log('Network.requestWillBeSent: ', params.request.url);
        });
      }
    })
    .then(async () => {
      env.Page.navigate({url: START_URL});
      await env.Page.loadEventFired();

      await HeadlessUtil.captureScreenshot(env.Runtime, env.Page, 'ss.1.png');
      await HeadlessUtil.populateForm(env.Runtime, 'form', [
        {name: 'email', type: 'text', value: ICLOUD_USERNAME},
        {name: 'password', type: 'text', value: ICLOUD_PASS},
      ]);
      await HeadlessUtil.captureScreenshot(env.Runtime, env.Page, 'ss.2.png');
      
      await HeadlessUtil.clickElement(env.Runtime, '#login .btn');
      await env.Page.loadEventFired();

      await HeadlessUtil.captureScreenshot(env.Runtime, env.Page, 'ss.3.png');

      await HeadlessUtil.addFiles(env, '#upload-form #presentation-files', [FILE_TO_UPLOAD_PATH]);

      await HeadlessUtil.captureScreenshot(env.Runtime, env.Page, 'ss.4.png');
      await HeadlessUtil.clickElement(env.Runtime, '#upload-button', true);
      await HeadlessUtil.captureScreenshot(env.Runtime, env.Page, 'ss.5.png');
      await env.Page.loadEventFired();
      await HeadlessUtil.captureScreenshot(env.Runtime, env.Page, 'ss.6.png');

      // TODO(gmike): Nav to presentation
      // TODO(gmike): Export as PDF
    })
    .then(() => {
      console.log('Done crawling. Process.Kill()ing.');
      env.Chrome.kill();
    })
    .catch(function(err) {
      console.log('Error caught:');
      console.log(err);
    });
}

// Main (Baby) Driver.
doEverything();


//// UTILS AND ENV

async function initializeEnvironment(Chrome) {
  let env = {Chrome};

  // Note: Sometimes 'protocol' is called 'client' in documentation.
  const protocol = await CDP({port: Chrome.port});
  env.Page = protocol.Page;
  env.Runtime = protocol.Runtime;
  env.Network = protocol.Network;
  env.DOM = protocol.DOM;

  await Promise.all([
    env.Network.enable(),
    env.Page.enable(),
    env.Runtime.enable(),
  ]);

  return env;
}

function launchChrome(headless=true, size=SIZE_DESKTOP) {
  return chromeLauncher.launch({
    // port: 9222, // Uncomment to force a specific port of your choice.
    chromeFlags: [
      `--window-size=${size}`,
      '--disable-gpu',
      headless ? '--headless' : ''
    ]
  });
}
