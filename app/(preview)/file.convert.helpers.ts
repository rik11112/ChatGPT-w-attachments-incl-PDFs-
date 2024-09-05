import pdf from 'pdf-parse';
import { create } from 'xmlbuilder2';

// bun install pdf-parse xmlbuilder2 @types/pdf-parse

// Function to convert PDF to XML
export async function convertPdfToXml(pdfFile: File): Promise<File> {
    // Read the PDF file
    const dataBuffer = await pdfFile.arrayBuffer();
    const data = await pdf(Buffer.from(dataBuffer));

    // Create XML structure
    const xmlDoc = create({ version: '1.0' })
        .ele('pdf')
        .ele('content')
        .txt(data.text)
        .up()
        .up()
        .end({ prettyPrint: true });

    // Convert XML string to a File object
    const xmlBlob = new Blob([xmlDoc], { type: 'text/xml' });
    const xmlFile = new File([xmlBlob], 'output.xml', { type: 'text/xml' });

    return xmlFile;
}

function pdfDataURLToFile(dataUrl: string, filename: string): File {
    const arr = dataUrl.split(',');
    const matchResult = arr[0].match(/:(.*?);/);
    const mime = matchResult ? matchResult[1] : null;
    if (!mime) {
        console.error('Invalid data URL');
        throw new Error('Invalid data URL');
    }
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
}


function fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export async function processPdfDataUrl(dataUrl: string, filename: string): Promise<string> {
    // Convert data URL to File
    const pdfFile = pdfDataURLToFile(dataUrl, filename);

    // Call your function to convert PDF to XML
    const xmlContent = await convertPdfToXml(pdfFile);

    // Convert the XML content back to a data URL (if needed)
    const xmlBlob = new Blob([xmlContent], { type: 'text/xml' });
    const xmlFile = new File([xmlBlob], filename, { type: 'text/xml' });
    const xmlDataUrl = await fileToDataURL(xmlFile);

    return xmlDataUrl;
}
