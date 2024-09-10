'use client';

import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import {
    PDFDocumentProxy,
    PDFPageProxy,
} from 'pdfjs-dist/types/src/display/api';

GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.worker.min.mjs';

/**
 * Converts a PDF file to XML format.
 * 
 * @param file - The PDF file to convert. Must be of type application/pdf.
 * @returns A Promise that resolves to the converted XML file.
 * @throws An error if the file type is not application/pdf.
 */
export async function pdfToXml(file: File): Promise<File> {
    if (file.type !== 'application/pdf') {
        throw new Error('File type must be application/pdf');
    }

    console.log('creating filebuffer')
    const arrayBuffer = await file.arrayBuffer();
    console.log('getting document...')
    const pdf: PDFDocumentProxy = await getDocument(new Uint8Array(arrayBuffer))
        .promise;
    let textContent = '';

    console.log('pdf.numPages:', pdf.numPages);

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page: PDFPageProxy = await pdf.getPage(pageNum);
        const textContentItems = await page.getTextContent();
        textContentItems.items.forEach((item: any, index: number) => {
            textContent += item.str + ' ';
        });
        console.log('page:', pageNum, 'done');
    }


    return new File([textContent], file.name.replace('.pdf', '.txt'), {
        type: 'text/txt',
    });
}

/**
 * Converts a list of PDF files to XML format. Ignores files that are not of type application/pdf.
 * 
 * @param files - The list of PDF files to convert.
 * @returns A promise that resolves to the list of converted files.
 */
export async function listPdfToXml(files: File[]): Promise<File[]> {
    const convertedFiles = await Promise.all(files.map(async (file) => {
        if (file.type.toLocaleLowerCase().endsWith('/pdf')) {
            return pdfToXml(file);
        }
        return file;
    }));
    return convertedFiles;
}