const FileUtil = require('./file_util');

const sleep = async (ms) => {
  return new Promise(resolve=>{
    setTimeout(resolve, ms);
  });
};
exports.sleep = sleep;

const waitForElement = async (Runtime, selector, debug=false) => {
  // browser code to register and parse mutations
  const browserCode = (selector) => {
      return new Promise((fulfill, reject) => {
          new MutationObserver((mutations, observer) => {
              // add all the new nodes
              const nodes = [];
              mutations.forEach((mutation) => {
                  nodes.push(...mutation.addedNodes);
              });
              // fulfills if at least one node matches the selector
              if (nodes.find((node) => node.matches(selector))) {
                  observer.disconnect();
                  fulfill();
              }
          }).observe(document.body, {
              childList: true
          });
      });
  };

  const expression = `(${browserCode})(${JSON.stringify(selector)})`;
  debug
      && console.log('Waiting for element: ', expression);
  await Runtime.evaluate({
      expression,
      awaitPromise: true
  });
};
exports.waitForElement = waitForElement;

const getPageTitle = async (Runtime) => {
  const expression = "document.querySelector('title').textContent";
  const result = await Runtime.evaluate({expression});
  return result.result.value;
};
exports.getPageTitle = getPageTitle;

const captureScreenshot = async (Runtime, Page, path) => {
  const pageTitle = await getPageTitle(Runtime);
  console.log(`Capturing screenshot (${path}) for page with title: ${pageTitle}`);

  return Page.captureScreenshot()
    .then(async data => {
      return FileUtil.writeBase64ToFile(data.data, path);
    });
};
exports.captureScreenshot = captureScreenshot;

const clickElement = async (Runtime, selector, debug=false) => {
  return new Promise(async (resolve, reject) => {
    const expression = `document.querySelector("${selector}").click()`;
    debug
        && console.log('headless_util: clickElement', expression);
    await Runtime.evaluate({expression});
    resolve();
  });
};
exports.clickElement = clickElement;

const populateForm = async (Runtime, formSelector, elements, debug=false) => {
  const elementPromises = elements.map(element => {
    // Assumes an ID is set.
    const selector = `${formSelector} #${element.name}`;

    if (element.type === 'text') {
      let expression = `document.querySelector("${selector}").value = '${element.value}'`;
      debug
          && console.log('Pop: ', expression);
      return Runtime.evaluate({expression})
    }

    throw new Error('No idea what to do with element: ' + element.name);
  });
  return Promise.all(elementPromises);
};
exports.populateForm = populateForm;

exports.addFiles = async ({DOM, Runtime, Page}, fileSelector, files) => {
  const {root} =  await DOM.getDocument(true);
  const {nodeId: myFileId} = await DOM.querySelector({
      nodeId: root.nodeId,
      selector: fileSelector
  });

 // fill the file input
  await DOM.setFileInputFiles({
      nodeId: myFileId,
      files
  });
};

/**
  //// SNIPPETS 

  const version = await CDP.Version({port: chrome.port});
*/
