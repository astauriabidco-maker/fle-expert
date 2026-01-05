import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

@Injectable()
export class ContextService {
    private readonly als = new AsyncLocalStorage<Map<string, any>>();

    run(callback: () => void) {
        this.als.run(new Map(), callback);
    }

    set(key: string, value: any) {
        const store = this.als.getStore();
        if (store) {
            store.set(key, value);
        }
    }

    get<T>(key: string): T | undefined {
        const store = this.als.getStore();
        return store?.get(key);
    }
}
