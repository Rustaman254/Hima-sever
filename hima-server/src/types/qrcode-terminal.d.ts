declare module "qrcode-terminal" {
    interface QRCodeOptions {
        small?: boolean;
    }

    function generate(
        text: string,
        options?: QRCodeOptions,
        callback?: (error: Error | null, qrcode: string) => void
    ): void;

    export = { generate };
}
