import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class SecurityService {
    private readonly salt = process.env.HASH_SALT || 'ma_cle_secrete_2026';

    /**
     * Generates a SHA-256 hash of the input string with a salt.
     * @param data The data to hash.
     * @param salt The salt to use (optional, generates a random one if not provided).
     * @returns Object containing the hash and the salt used.
     */
    hashWithSalt(data: string, salt?: string): { hash: string; salt: string } {
        const usedSalt = salt || crypto.randomBytes(16).toString('hex');
        const hash = crypto
            .createHmac('sha256', usedSalt)
            .update(data)
            .digest('hex');
        return { hash, salt: usedSalt };
    }

    /**
     * Verifies if the data matches the hash using the provided salt.
     */
    verifyHash(data: string, hash: string, salt: string): boolean {
        const { hash: newHash } = this.hashWithSalt(data, salt);
        return newHash === hash;
    }

    /**
     * Génère une empreinte numérique infalsifiable pour un résultat d'examen
     */
    generateResultHash(userId: string, score: number, date: string): string {
        // On combine les données avec un "sel" pour rendre le hash impossible à deviner
        const dataToHash = `${userId}-${score}-${date}-${this.salt}`;

        return crypto
            .createHash('sha256')
            .update(dataToHash)
            .digest('hex');
    }

    /**
     * Vérifie si un hash correspond bien aux données fournies
     */
    verifyIntegrity(userId: string, score: number, date: string, hashToVerify: string): boolean {
        const generatedHash = this.generateResultHash(userId, score, date);
        return generatedHash === hashToVerify;
    }
}
