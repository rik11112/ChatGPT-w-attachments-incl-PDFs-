import pdf from 'pdf-parse';
import { create } from 'xmlbuilder2';

/**
 * this function converts a PDF file data url of type application/pdf into an XML file data url of type text/xml
 * @param dataUrl data URL of the PDF file of type application/pdf
 * @param filename name of the PDF file
 * @returns data URL of the XML file of type text/xml, converted from the PDF file
 */
export async function processPdfDataUrl(dataUrl: string, filename: string): Promise<string> {
    // Step 1: Decode the PDF data URL
    const base64Data = dataUrl.split(',')[1];
    const pdfData = Buffer.from(base64Data, 'base64');

    // Step 2: Parse the PDF
    const pdfDataBuffer = await pdf(pdfData);
    const textContent = pdfDataBuffer.text;

    // Step 3: Convert the extracted information into XML format
    const xmlObj = {
        pdf: {
            filename: filename,
            content: textContent
        }
    };
    const xml = create(xmlObj).end({ prettyPrint: true });

    // Step 4: Encode the XML data into a data URL
    const xmlDataUrl = `data:text/xml;base64,${Buffer.from(xml).toString('base64')}`;

    return xmlDataUrl;
}