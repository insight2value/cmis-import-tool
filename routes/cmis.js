const axios = require('axios');
const express = require('express');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const readline = require('readline');
const router = express.Router();

const createPDFs = async (file) => {
  let headersArray = [], lineArray = [], pdfArray = [];
  console.log(file);

  const fileStream = fs.createReadStream(file.path);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    const splitLine = line.split(',');
    lineArray.push(splitLine);
  }

  for await (const header of lineArray[0]) {
    headersArray.push(header);
  }

  lineArray.splice(0, 1);

  for await (const line of lineArray) {
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(`PDFs/${ file.originalname }_row_${ line[0] }.pdf`));
    line.forEach((item, index) => {
      doc.text(`${ headersArray[index] }=${ item }`);
    });
    doc.end();

    const newFile = {
      title: `${ file.originalname }_row_${ line[0] }.pdf`,
      mimetype: 'application/pdf'
    };

    pdfArray.push(newFile);
  }

  fs.unlinkSync(file.path);
  return pdfArray;
};

const uploadDocument = async (req, file) => {
  const binary = new Buffer.from(fs.readFileSync('PDFs/' + file.title)).toString('base64');
  const postData = `<?xml version='1.0' encoding='UTF-8'?><atom:entry xmlns:atom="http://www.w3.org/2005/Atom" xmlns:cmis="http://docs.oasis-open.org/ns/cmis/core/200908/" xmlns:cmisra="http://docs.oasis-open.org/ns/cmis/restatom/200908/" xmlns:app="http://www.w3.org/2007/app"><atom:title>${ file.title }</atom:title><atom:content type="${ file.mimetype }">${ binary }</atom:content><cmisra:object><cmis:properties><cmis:propertyString propertyDefinitionId="cmis:name" displayName="Name" localName="Name" queryName="cmis:name"><cmis:value>${ file.title }</cmis:value></cmis:propertyString><cmis:propertyString propertyDefinitionId="DocumentTitle" displayName="Document Title" localName="DocumentTitle" queryName="DocumentTitle"><cmis:value>${ file.title }</cmis:value></cmis:propertyString><cmis:propertyId propertyDefinitionId="cmis:objectTypeId" displayName="cmis:objectTypeId" localName="" queryName="cmis:objectTypeId"><cmis:value>cmis:document</cmis:value></cmis:propertyId></cmis:properties></cmisra:object></atom:entry>`;

  try {
    return await axios.post(`http://${ process.env.ICM_URL }/AjaxProxy/proxy/http/${ process.env.ICM_URL }/openfncmis/atom11/${ process.env.ICM_TARGETOS }/children?id=`, postData, {
      headers: {
        Authorization: 'Basic ' + new Buffer.from(`${ process.env.ICM_USER }:${ process.env.ICM_PASS }`).toString('base64')
      }
    });
  } catch (err) {
    console.log('There has been a really long error');
  }
};

const ingestDocuments = async (req, res) => {
  let pdfArray = [];

  for (const file of req.files) {
    pdfArray.push(await createPDFs(file));
  }

  for await (const set of pdfArray) {
    for await (const pdf of set) {
      console.log(pdf);
      // await uploadDocument(req, pdf);
      fs.unlinkSync('PDFs/' + pdf.title);
    }
  }

  res.send(pdfArray);
};

router.use('/upload', ingestDocuments);

module.exports = router;