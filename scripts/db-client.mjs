import 'dotenv/config';import {Pool,neonConfig} from '@neondatabase/serverless';import ws from 'ws';
neonConfig.webSocketConstructor=ws;
export function ownerPool(){const connectionString=process.env.MIGRATION_DATABASE_URL||process.env.DATABASE_URL;if(!connectionString)throw new Error('Set DATABASE_URL or MIGRATION_DATABASE_URL in your private .env.');return new Pool({connectionString,max:2});}
