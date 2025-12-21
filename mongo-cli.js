#!/usr/bin/env node
import { conexion, client, url } from './models/conexion.js';
import readline from 'readline';
import { Table } from 'console-table-printer';

const blue = '\x1b[34m';   // booleanos o null
const purple = '\x1b[35m'; // IDs
const orange = '\x1b[38;5;208m'; // integers/numbers
const green = '\x1b[32m';  // strings
const pastelGreen = '\x1b[38;5;121m';
const red = '\x1b[31m';    // errores
const yellow = '\x1b[38;5;229m';
const skyBlue = '\x1b[36m';// prompt y avisos
const crema = '\x1b[38;5;223m';
const salmon = '\x1b[38;5;173m';
const skyGrey = '\x1b[90m';
const smoke = '\x1b[38;5;255m';
const reset = '\x1b[0m';   // reset

// HELP
const allComands = [
    `${pastelGreen}f${smoke} -- filtro   ${pastelGreen}c${smoke} -- cambio.\n`,
    `${yellow}show dbs${smoke} o ${yellow}show databases${smoke}  -- Lista todas las bases de datos disponibles en el servidor.`,
    `${yellow}show colls${smoke} o ${yellow}show collections${smoke}  -- Lista todas las colleciones disponibles en la base de datos.`,
    `${yellow}use ${skyGrey}<name-db>${smoke} -- Establece o crea la conexión con una base de datos específica.`,
    `${yellow}collection ${skyGrey}<name-coll>${smoke} -- Selecciona la colección (tabla) sobre la cual se actuarán.`,
    `${yellow}state${smoke} -- Puedes ver en que base de datos y collecion estas actuando tus consultas.`,
    `${yellow}reset${smoke} -- Limpia el prompt y vuelve su ubicacion sin DB ni colleccion solo none`,
    `${yellow}dropDatabase${smoke} -- Borra la base de datos seleccionado`,
    `${yellow}find${skyGrey}()${smoke} -- Recupera todos los documentos de la colección seleccionada.`,
    `${yellow}find${skyGrey}()${yellow}.limit${skyGrey}(n)${smoke} -- Realiza una búsqueda con un límite definido.`,
    `${yellow}insertOne${skyGrey}({})${smoke} -- Inserta un único documento en la colección.`,
    `${yellow}insertMany${skyGrey}([{}, {}])${smoke} -- Inserta varios documentos a la vez.`,
    `${yellow}updateOne${skyGrey}({f}, {c})${smoke} -- Busca un documento y aplica modificaciones.`,
    `${yellow}updateMany${skyGrey}({f}, {c})${smoke} -- Modifica todos los que cumplan la condición.`,
    `${yellow}deleteOne${skyGrey}({f})${smoke} -- Elimina el primer documento que coincida.`,
    `${yellow}deleteMany${skyGrey}({f})${smoke} -- Borra todos los documentos que coincidan.`,
    `${yellow}clear${smoke} o ${yellow}cls${smoke} -- Limpia la pantalla de la terminal.`,
    `${yellow}exit${skyGrey}()${smoke} -- Cierra la conexión y finaliza el proceso.`
];

const input = readline.createInterface({ 
    input: process.stdin, 
    output: process.stdout,
    completer: completer 
});
const pregunta = (texto) => new Promise((res) => input.question(texto, res));

let ultimoExito = true; // Por defecto es true
let dbActual = null;
let colActual = null;

function completer(line, callback) {
    const comandosBase = [
        "use ", 
        "collection ", 
        'find()', 
        'insertOne({})', 
        'updateOne({}, {})', 
        'deleteOne({})',
        'exit()'
    ];

    if (dbActual) {
        dbActual.listCollections().toArray()
            .then(colecciones => {
                const sugerencias = colecciones.map(c => `collection('${c.name}')`);
                const completado = [...comandosBase, ...sugerencias];
                const hits = completado.filter((c) => c.startsWith(line));
                callback(null, [hits.length ? hits : completado, line]); 
            })
            .catch(() => callback(null, [comandosBase, line]));
    } else {
        const hits = comandosBase.filter((c) => c.startsWith(line));
        callback(null, [hits.length ? hits : comandosBase, line]);
    }
}

async function mostrarTabla(datos) {
    if (!datos || datos.length === 0) return console.log(yellow + "Sin resultados." + reset);
    
    const table = new Table();
    const MAX_ANCHO =  15;

    datos.forEach((doc) => {
        const { _id, ...resto } = doc;
        
        const filaColoreada = {
            _id: `${purple}${_id.toString()}${reset}`
        };

        Object.keys(resto).forEach(key => {
            let valor = resto[key];
            const tipo = typeof valor;

            if (tipo === 'string') {
                let textoFinal = valor.length > MAX_ANCHO 
                    ? valor.substring(0, MAX_ANCHO) + "..." 
                    : valor;
                
                filaColoreada[key] = `${green}${textoFinal}${reset}`;

            } else if (tipo === 'number') {
                filaColoreada[key] = `${orange}${valor}${reset}`;
            } else if (tipo === 'boolean' || valor === null) {
                filaColoreada[key] = `${blue}${valor}${reset}`;
            } else {
                let stringObj = JSON.stringify(valor);
                let recorte = stringObj.length > MAX_ANCHO 
                    ? stringObj.substring(0, MAX_ANCHO) + "..." 
                    : stringObj;
                filaColoreada[key] = recorte;
            }
        });

        table.addRow(filaColoreada);
    });

    table.printTable();
}

async function shell() {
    //Detectar estado desde el objeto client
    const conectado = client.isOnline;
    //Definir colores y sonido basado en el estado
    const colorPrompt = conectado ? green : red;
    const alertaSonora = conectado ? '' : '\u0007';
    const colorFlecha = ultimoExito ? green : red;
    //Definir donde se vera la posicion de la DB y Coll o por defecto none
    const dbDisplay = dbActual ? dbActual.databaseName : 'none';
    const colDisplay = colActual ? colActual.collectionName : 'none';
    //ubicacion de la DB y COL 
    const homeDB =  `${crema}${dbDisplay}`;
    const homeCol =  `.${salmon}${colDisplay}`;
    const ubicacion =  ` ${homeDB}${homeCol}`;
    //prompt de la terminal
    const prompt = `${alertaSonora}${colorPrompt}mongodb${colorFlecha}➜ ${ubicacion}${reset}> `;
    const linea = await pregunta(prompt);
    const comando = linea.trim();

    // Interceptor para cambiar DB: use <nombre>
    if (comando.startsWith('use ')) {
        if (!client.isOnline) {
            console.log(`${red} Error: No hay conexión con el servidor MongoDB.${reset}`);
            return shell();
        }

        const partes = comando.trim().split(/\s+/); 
        const nombreDB = partes[1];

        if (nombreDB) {
            dbActual = client.db(nombreDB);
            colActual = null;
            console.log(`Switched to db: ${pastelGreen}${nombreDB}${reset}`);
        }
        return shell();
    }
    // Interceptor para borrar DB: dropDatabase <nombre>
    if (comando.startsWith('dropDatabase')) { 
        if (!client.isOnline) {
            console.log(`${red}Error: Sin conexión.${reset}`);
            return shell();
        }
        
        if (!dbActual) {
            console.log(`${red} Error:${reset} No hay ninguna base de datos seleccionada. Selecciona una primero con use.`);
            return shell();
        }

        try {
            await dbActual.dropDatabase(); 
            dbActual = null;
            colActual = null;
            console.log(`${pastelGreen} Base de datos eliminada.${reset} Volviendo a estado inicial.`);
        } catch (e) {
            console.log(`${red}Error:${reset} ${e.message}`);
        }
        return shell();
    }
    // Interceptor para cambiar Colección: collection <nombre>
    if (comando.startsWith('collection ')) {
        if (!client.isOnline) {
            console.log(`${red} Error: No hay conexión con el servidor MongoDB.${reset}`);
            return shell();
        }

        if (!dbActual) {
            console.log(`${red} Error:${reset} Selecciona una base de datos primero con use.`);
            return shell();
        }

        const partes = comando.trim().split(/\s+/); 
        const nombreColl = partes[1];

        if (nombreColl && dbActual) {
            colActual = dbActual.collection(nombreColl);
            console.log(`Switched to collection: ${pastelGreen}${nombreColl}${reset}`);
        }

        return shell();
    }

    //comando para ver todos los comandos que se pueden usar
    if (comando === '--help' || comando === '--h'){
        console.log(`\n${skyBlue}=== AYUDA DE MONGO-CLI ===${reset}\n`);
        allComands.forEach(linea => {
            console.log(linea);
        });
        console.log(""); 
        return shell();
    }
    //comando para listar las bases de datos
    if (comando === 'show databases' || comando === 'show dbs'){ 
        if (!client.isOnline) {
            console.log(`${red}Error: No hay conexión con el servidor MongoDB.${reset}`);
            return shell();
        }

        try {
            const result = await client.db().admin().listDatabases();
            
            console.log(`\n${skyBlue}=== BASES DE DATOS ===${reset}`);
            result.databases.forEach(db => {
                console.log(`${smoke}${db.name.padEnd(20)}${reset} ${skyGrey}${db.sizeOnDisk} bytes${reset}`);
            });
            console.log("");
        } catch (e) {
            console.log(`${red}Error al listar bases de datos:${reset} ${e.message}`);
        }
        return shell();
    }
    //comando para listar las colecciones
    if (comando === 'show colls' || comando === 'show collections'){ 
        if (!client.isOnline) {
            console.log(`${red} Error:${reset} No hay conexión con el servidor MongoDB.`);
            return shell();
        }

        if (!dbActual) {
            console.log(`${red} Error:${reset} Selecciona una base de datos primero con use.`);
            return shell();
        }

        try {
            const colecciones = await dbActual.listCollections().toArray();
            
            console.log(`\n${skyBlue}=== colleciones en ${smoke}${dbActual.databaseName}${skyBlue}===${reset}`);
            
            if (colecciones.length === 0) {
                console.log(`${yellow} (No hay colecciones en esta base de datos)${reset}`);
            } else {
                colecciones.forEach(col => {
                    console.log(` ${pastelGreen}- ${col.name}${reset}`);
                });
            }
            console.log("");
        } catch (e) {
            console.log(`${red}Error al listar colecciones:${reset} ${e.message}`);
        }
        return shell();
    }
    //ver el estado de ubicacion y reset tu ubicacion
    if(comando === 'state' || comando === 'reset'){
        if(comando === 'state'){
            console.log(`Ahora estás en: ${homeDB}${homeCol}\n`);
        }else if(comando === 'reset'){
            dbActual = null;
            colActual = null;
            console.clear();
            process.stdout.write('\x1Bc'); // Refuerzo de limpieza

            // 3. Mostramos un mensaje de confirmación
            console.log(`${skyBlue}=== ESTADO REINICIADO ===${reset}`);
        }
        return shell();
    }
    if (comando === 'stats' || comando === 'stats()') {
        if (!dbActual) {
            console.log(`${red} Error:${reset} No hay base de datos seleccionada. Usa use.`);
            return shell();
        }

        try {
            const colecciones = await dbActual.listCollections().toArray();
            console.log(`\n${skyBlue}=== ESTADÍSTICAS DE ${smoke}${dbActual.databaseName}${skyBlue} ===${reset}`);
            
            const resumen = await Promise.all(colecciones.map(async (col) => {
                const conteo = await dbActual.collection(col.name).countDocuments();
                return { "Colección": col.name, "Documentos": conteo };
            }));

            if (resumen.length === 0) {
                console.log(`${yellow}La base de datos está vacía.${reset}`);
            } else {
                resumen.forEach(item => {
                    console.log(`${pastelGreen} ${item.Colección.padEnd(20)}${reset} → ${orange}${item.Documentos}${reset} docs`);
                });
            }
            console.log("");
        } catch (e) {
            console.log(`${red}Error al obtener stats:${reset} ${e.message}`);
        }
        return shell();
    }
    //comando para limpiar pantalla
    if (comando === 'clear' || comando === 'cls' || comando === 'CLS' || comando === 'CLEAR'){ 
        console.clear(); 
        process.stdout.write('\x1Bc');
        return shell(); 
    }
    //comamdo para salir y cerrar conexion
    if (comando === 'exit' || comando === 'exit()' || comando === 'EXIT' || comando === 'EXIT()'){ 
        await client.close(); 
        console.log('Hasta Luego');
        process.exit(0); 
    }

    // Ejecución de MQL
    if (!comando) return shell();
    try {
        if (!client.isOnline) {
            console.log(`${red} Error: No hay conexión con el servidor MongoDB.${reset}`);
            return shell();
        }
        const isCmdMongo = comando.includes('(') || comando.includes('.');
        
        if (isCmdMongo && !colActual) {
            console.log(`${red}Error:${reset} Selecciona una colección primero para ejecutar comandos MQL.`);
            return shell();
        }
        // Si no es comando mongo y no hay coleccion, simplemente ignora y vuelve al shell
        if (!colActual) return shell();
        
        const resultado = await eval(`colActual.${comando}`);
        ultimoExito = true;

        if (resultado && typeof resultado.toArray === 'function') {
            const docs = await resultado.toArray();
        
            const LIMITE_TABLA = 15; 
            const docsFormated = docs.map(doc => ({
                ...doc,
                _id: `${doc._id.toString()}`
            }));

            if (docs.length > LIMITE_TABLA) {
                console.log(`${yellow}Muchos documentos (${docs.length}). Mostrados en formato JSON:${reset}`);
                console.dir(docsFormated, { colors: true, depth: null });
            } else {
                await mostrarTabla(docs);
            }
        } else {
            console.log(pastelGreen +"Operación exitosa: "+ reset);
            console.dir(resultado, { colors: true });
        }
    } catch (e) {
        console.log(`${red}Error:${reset} ${e.message}`);
        ultimoExito = false;
    }
    shell();
}

async function startShell() {
    await conexion();
    console.clear();
    console.log(`${skyBlue}=== MONGO-CLI ===${reset}`);
    if(client.isOnline){
        console.log(`${green} Conectado a ${url}${reset}`);
        console.log("Usa", `${orange}use${reset}`, "para crear o usar base de datos.");
        console.log("Usa", `${orange}collection${reset} `, "para crear o usar collecion.");
        console.log("Usa", `${orange}--help${reset} o ${orange}--h${reset}`, "para ver todos los comandos.\n");
    }else{
        console.log(`${red} Error: No hay conexión con el servidor MongoDB.${reset}`);
        console.log(`Cierra el proceso con ${orange}exit${reset} luego inicia el servicio de mongodb`);
        console.log(`Ya iniciado vuele a ejecutar ${orange}node mongo-cli${reset}\n`)
    }
    shell();
}

startShell();