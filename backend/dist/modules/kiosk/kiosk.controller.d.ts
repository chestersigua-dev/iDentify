import { KioskService, KioskScanInput } from './kiosk.service';
export declare class KioskController {
    private readonly kioskService;
    constructor(kioskService: KioskService);
    scanToken(body: KioskScanInput, req: any): Promise<import("./kiosk.service").KioskScanResponse>;
}
