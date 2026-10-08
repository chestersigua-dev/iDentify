import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { QueryResult } from 'pg';
export declare class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private pool;
    private isPostgresConnected;
    memoryStore: Record<string, any[]>;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private initDatabase;
    queryWithTenant<T = any>(schoolId: string | null, text: string, params?: any[]): Promise<QueryResult<T>>;
    query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
    isUsingPostgres(): boolean;
    private seedInMemory;
    private simulateQuery;
}
