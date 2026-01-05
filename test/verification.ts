import { SecurityService } from '../src/common/services/security.service';
import { ContextService } from '../src/common/services/context.service';

async function verify() {
    console.log('Verifying SecurityService...');
    const securityService = new SecurityService();
    const data = 'test-password';
    const { hash, salt } = securityService.hashWithSalt(data);
    console.log(`Hash: ${hash}, Salt: ${salt}`);

    const isValid = securityService.verifyHash(data, hash, salt);
    console.log(`Verification result: ${isValid}`);
    if (!isValid) throw new Error('SecurityService verification failed');

    console.log('Verifying ContextService...');
    const contextService = new ContextService();

    await new Promise<void>((resolve) => {
        contextService.run(() => {
            contextService.set('key', 'value');
            const value = contextService.get('key');
            console.log(`Context value: ${value}`);
            if (value !== 'value') throw new Error('ContextService verification failed');
            resolve();
        });
    });

    console.log('Verification successful!');
}

verify().catch(console.error);
