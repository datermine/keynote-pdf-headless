const FileUtil = require('./file_util');


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

const populateForm = async (Runtime, formSelector, elements) => {
  const elementPromises = elements.map(element => {
    // Assumes an ID is set.
    const selector = `${formSelector} #${element.name}`;

    if (element.type === 'text') {
      let expression = `document.querySelector("${selector}").value = '${element.value}'`;
      return Runtime.evaluate({expression})
    }

    throw new Error('No idea what to do with element: ' + element.name);
  });
  return Promise.all(elementPromises);
};
exports.populateForm = populateForm;

exports.addFiles = async ({DOM, Runtime, Page}, fileSelector, files) => {
  const {root} =  await DOM.getDocument();
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
