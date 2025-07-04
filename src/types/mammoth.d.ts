declare module 'mammoth' {
    interface ConversionOptions {
        arrayBuffer?: ArrayBuffer;
        path?: string;
        buffer?: Buffer;
    }

    interface ConversionResult {
        value: string;
        messages: any[];
    }

    function convertToHtml(options: ConversionOptions): Promise<ConversionResult>;

    export { convertToHtml };
    export default { convertToHtml };
} 