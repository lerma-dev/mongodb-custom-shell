import { MongoClient } from 'mongodb';

const url = 'mongodb://localhost:27017';
const client = new MongoClient(url, { 
    serverSelectionTimeoutMS: 2000, // Tiempo máximo para detectar error
    heartbeatFrequencyMS: 1000      // Revisa la conexión cada segundo
});

client.isOnline = false; 
client.on('open', () => { client.isOnline = true; });
client.on('close', () => { client.isOnline = false; });
client.on('reconnect', () => { client.isOnline = true; });

async function conexion(){
    try {
        await client.connect();
        client.isOnline = true;
    } catch (e) {
        client.isOnline = false;
    }
}

export {conexion, client, url};

