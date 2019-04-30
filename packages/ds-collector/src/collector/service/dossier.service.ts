import { Observable } from "rxjs";
import { map, mergeMap } from "rxjs/operators";
import { DSDossier, DSDossierItem } from "../../demarche-simplifiee";
import { logger } from "../../util";
import { asTimestamp } from "../../util/converter";
import { DSDossierRecord } from "../model";
import { dossierRepository } from "../repository";

class DossierService {

    public findOne(procedureId: string, dossierId: string): Observable<DSDossierRecord | null> {
        return dossierRepository.findByDSKey(this.getDSKey(procedureId, dossierId)).pipe(
            map((res) => {
                if (res.length === 0) {
                    return null;
                }
                return res[0];
            })
        );
    }

    public shouldBeUpdated(procedureId: string, dossier: DSDossierItem): Observable<boolean> {
        return dossierRepository.findByDSKey(this.getDSKey(procedureId, dossier.id)).pipe(
            map((records: DSDossierRecord[]) => {
                if (records.length === 0) {
                    return true;
                }
                const record = records[0];

                const itemTimestamp = asTimestamp(dossier.updated_at);
                const dossierTimestamp = record.metadata.updated_at;
                if (dossierTimestamp == null || itemTimestamp == null) {
                    return true;
                }
                return dossierTimestamp < itemTimestamp;
            })
        )
    }

    public saveOrUpdate(procedureId: string | number, dossier: DSDossier): Observable<DSDossierRecord> {
        const wifDossier: DSDossierRecord = {
            ds_data: dossier,
            ds_key: `${procedureId}-${dossier.id}`,
            metadata: {
                created_at: asTimestamp(dossier.created_at),
                processed_at: asTimestamp(dossier.processed_at),
                received_at: asTimestamp(dossier.received_at),
                state: dossier.state,
                updated_at: asTimestamp(dossier.updated_at),
            }
        }
        return dossierRepository.findByDSKey(wifDossier.ds_key).pipe(
            mergeMap((res: DSDossierRecord[]) => {
                if (res.length === 0) {
                    logger.debug(`[WIFDSDossierService.saveOrUpdate] add dossier for ds_key ${wifDossier.ds_key}`)
                    return dossierRepository.add(wifDossier);
                } else {
                    const record: DSDossierRecord = res[0];
                    logger.debug(`[WIFDossierService.saveOrUpdate] update dossier for ds_key ${wifDossier.ds_key}`)
                    Object.assign(record, wifDossier);
                    return dossierRepository.update(record.id || '', record);
                }
            })
        )
    }

    private getDSKey(procedureId: string, dossierId: string) {
        return `${procedureId}-${dossierId}`;
    }
}

export const dossierService = new DossierService();
