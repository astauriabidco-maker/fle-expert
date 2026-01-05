import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface OfflineProof {
    id?: number; // Auto-incremented by IDB
    tempId: string; // generated UUID for UI tracking
    organizationId: string;
    title: string;
    type: string;
    description: string;
    proofUrl: string;
    createdAt: string;
}

interface FleExpertDB extends DBSchema {
    pending_proofs: {
        key: number;
        value: OfflineProof;
        indexes: { 'by-date': string };
    };
}

const DB_NAME = 'fle-expert-db';
const STORE_NAME = 'pending_proofs';

class OfflineStorageService {
    private dbPromise: Promise<IDBPDatabase<FleExpertDB>>;

    constructor() {
        this.dbPromise = openDB<FleExpertDB>(DB_NAME, 1, {
            upgrade(db) {
                const store = db.createObjectStore(STORE_NAME, {
                    keyPath: 'id',
                    autoIncrement: true,
                });
                store.createIndex('by-date', 'createdAt');
            },
        });
    }

    async saveProof(proof: Omit<OfflineProof, 'id'>): Promise<number> {
        const db = await this.dbPromise;
        return db.add(STORE_NAME, proof);
    }

    async getPendingProofs(): Promise<OfflineProof[]> {
        const db = await this.dbPromise;
        return db.getAllFromIndex(STORE_NAME, 'by-date');
    }

    async removeProof(id: number): Promise<void> {
        const db = await this.dbPromise;
        await db.delete(STORE_NAME, id);
    }

    async countPending(): Promise<number> {
        const db = await this.dbPromise;
        return db.count(STORE_NAME);
    }
}

export const offlineStorage = new OfflineStorageService();
export type { OfflineProof };
