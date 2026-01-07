import * as pdfjsLib from 'pdfjs-dist';

// Use a CDN or local worker. For Vite/Parcel, usually we need to configure the worker.
// A simple way without complex config is pointing to a CDN for the worker.
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const extractTextFromPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += `Page ${i}:\n${pageText}\n\n`;
    }

    return fullText;
};
