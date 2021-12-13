import { Database } from '../Database';
import path from 'path';
import { writeFile } from 'fs';

const database = Database.getInstance();

type CreateTableResult = CreateTableDefinition[];
interface CreateTableDefinition {
    Table: string;
    'Create Table': string;
}

database.with(async (conn) => {
    const pQuery = (query: string, args: any[]) =>
        new Promise((resolve, reject) => {
            conn.query(query, args, (error, result) => {
                if (error) return reject(error);
                else return resolve(result);
            });
        });
    const userCreateStatement = await pQuery(`show create table users`, []) as unknown as CreateTableResult;
    const bannedCreateStatement = await pQuery(`show create table banned`, []) as unknown as CreateTableResult;
    const exchangeCreateStatement = await pQuery(`show create table exchange`, []) as unknown as CreateTableResult;

    [
        userCreateStatement, bannedCreateStatement, exchangeCreateStatement
    ].forEach(result => {
        const table = result[0].Table,
        statement = result[0]['Create Table'].replace('CREATE TABLE `', 'CREATE TABLE IF NOT EXISTS `');

        let filepath = path.resolve(process.argv[1], '..', '..','..','src', 'sql', `createTable_${table}.sql`);

        // console.log({ [table]: statement });
        writeFile(filepath, statement, (err)=>{
            if(err) {
                console.error('Unable to write sql statement to file...', {filepath,err});
            }
            console.log(`Wrote ${table} create statement to ${filepath}`);
        })
    })

})