import libre from 'libreoffice-convert';
import { promisify } from 'util';
import fs from 'fs/promises';

declare module 'libreoffice-convert' {
    export function convertAsync(
        input: Buffer,
        outputExt: string,
        filter: undefined
    ): Promise<Buffer>;
}

// This is non-blocking, tested in /test-scripts/libreoffice/convertLibCheckNonBlocking.ts
libre.convertAsync = promisify(libre.convert);

/**
 * Processes a PDF data URL in parallel with this application using libre office and converts it to an XML data URL.
 * 
 * @param dataUrl - The PDF data URL to process.
 * @returns A Promise that resolves to the XML data URL.
 */
export async function processPdfDataUrl(dataUrl: string): Promise<string> {
    // Step 1: Decode the PDF data URL
    const base64Data = dataUrl.split(',')[1];
    const pdfBuffer = Buffer.from(base64Data, 'base64');

    // Step 2: convert the PDF buffer to an XML buffer
    const xmlBuffer = await libre.convertAsync(pdfBuffer, '.xml', undefined);

    // @ts-ignore
    await fs.writeFile(`output/test-${new Date().toISOString().replace(/[:.]/g, '-')}.xml`, xmlBuffer);

    // Step 3: Encode the XML buffer into a data URL
    const xmlDataUrl = `data:text/xml;base64,${xmlBuffer.toString('base64')}`;

    return xmlDataUrl;
}