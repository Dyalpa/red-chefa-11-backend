const express = require('express');
const SQLiteCloud = require('@sqlitecloud/drivers');
const cors = require('cors');
const helmet = require('helmet');
const app = express();
const port = 3000;
const validator = require('validator');
const moment = require('moment');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

app.use(cors());
app.use(helmet()); // Usar helmet para configurar CSP automáticamente
app.use(express.json());

let db;

const connectToDatabase = () => {
    db = new SQLiteCloud.Database('sqlitecloud://chou0cqink.sqlite.cloud:8860/RedChefa11?apikey=FjGs3gl1NGl8QOiel0k7s7Fwt4EhjoN6paM2MYtYhm0', (err) => {
        if (err) {
            console.error('Error al conectar a la base de datos SQLite Cloud:', err);
            setTimeout(connectToDatabase, 5000);
        } else {
            console.log('Conectado a la base de datos SQLite Cloud');
            db.all('SELECT 1', [], (err, rows) => {
                if (err) {
                    console.error('Error al realizar consulta de prueba:', err);
                } else {
                    console.log('Consulta de prueba exitosa:', rows);
                }
            });
        }
    });

    db.on('error', (err) => {
        console.error('Error en la base de datos:', err);
    });

    db.on('close', () => {
        console.log('Conexión cerrada, intentando reconectar...');
        connectToDatabase();
    });
};

connectToDatabase();

app.get('/', (req, res) => {
    res.send('API de Red Chefa 11');
});

app.get('/usuarios', (req, res) => {
    db.all('SELECT * FROM Usuarios', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.get('/medicamentos', (req, res) => {
    db.all('SELECT * FROM Medicamentos', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// REGISTO DE USUARIOS
app.post('/usuarios', (req, res) => {
    const { nombre, correo, clave, tipo_usuario} = req.body;

    // Sanitizar y formatear datos
    const sanitizedNombre = validator.escape(nombre);
    const sanitizedCorreo = validator.escape(correo);
    const sanitizedClave = bcrypt.hashSync(validator.escape(clave), 8); // Encriptar la clave
    const sanitizedTipoUsuario = validator.escape(tipo_usuario);

    const query = `
        INSERT INTO usuarios (nombre, correo, clave, tipo_usuario)
        VALUES ('${sanitizedNombre}', '${sanitizedCorreo}', '${sanitizedClave}', '${sanitizedTipoUsuario}')
    `;

    db.run(query, function (err) {
        if (err) {
            console.error('Error al registrar el usuario:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        console.log('Usuario registrado con ID:', this.lastID);
        res.json({ usuario_id: this.lastID });
    });
});

//INICIO DE SESION

app.post('/login', (req, res) => {
    const { correo, clave } = req.body;

    const sanitizedCorreo = validator.escape(correo);
    const sanitizedClave = validator.escape(clave);

    const query = `SELECT * FROM usuarios WHERE correo = '${sanitizedCorreo}'`;
    db.get(query, [], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Usuario no encontrado' });
            return;
        }

        const passwordIsValid = bcrypt.compareSync(sanitizedClave, row.clave);
        if (!passwordIsValid) {
            res.status(401).json({ error: 'Contraseña incorrecta' });
            return;
        }

        const token = jwt.sign({ id: row.id }, 'secret', { expiresIn: 86400 }); // 24 horas
        res.status(200).json({ auth: true, token });
    });
});


// REGISTO DE MEDICAMENTOS
app.post('/medicamentos', (req, res) => {
    const { nombre, presentacion, cantidad, fecha_entrega, dosis, frecuencia, especialidad } = req.body;

    // Sanitizar y formatear datos
    const sanitizedNombre = validator.escape(nombre);
    const sanitizedPresentacion = validator.escape(presentacion);
    const sanitizedEspecialidad = validator.escape(especialidad);
    const sanitizedCantidad = validator.toInt(String(cantidad));
    const sanitizedDosis = validator.toInt(String(dosis));
    const sanitizedFrecuencia = validator.toInt(String(frecuencia));
    const formattedFechaEntrega = moment(fecha_entrega).format('YYYY-MM-DD'); // Formatear la fecha

    const values = [sanitizedNombre, sanitizedPresentacion, sanitizedCantidad, formattedFechaEntrega, sanitizedDosis, sanitizedFrecuencia, sanitizedEspecialidad];
    console.log('Valores para la consulta:', values);

    const query = `
        INSERT INTO medicamentos (nombre, presentacion, cantidad, fecha_entrega, dosis, frecuencia, especialista)
        VALUES ('${sanitizedNombre}', '${sanitizedPresentacion}', ${sanitizedCantidad}, '${formattedFechaEntrega}', ${sanitizedDosis}, ${sanitizedFrecuencia}, '${sanitizedEspecialidad}')
    `;

    db.run(query, function (err) {
        if (err) {
            console.error('Error al registrar el medicamento:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        console.log('Medicamento registrado con ID:', this.lastID);
        res.json({ medicamento_id: this.lastID });
    });
});

// REGISTO DE ALIMENTOS
app.post('/alimentos', (req, res) => {
    const { nombre, presentacion, cantidad, fecha_compra} = req.body;

    // Sanitizar y formatear datos
    const sanitizedNombre = validator.escape(nombre);
    const sanitizedPresentacion = validator.escape(presentacion);
    const sanitizedCantidad = validator.toInt(String(cantidad));
    const formattedFechaCompra = moment(fecha_compra).format('YYYY-MM-DD'); // Formatear la fecha

    const values = [sanitizedNombre, sanitizedPresentacion, sanitizedCantidad, formattedFechaCompra];
    console.log('Valores para la consulta:', values);

    const query = `
        INSERT INTO alimentos (nombre, presentacion, cantidad, fecha_compra)
        VALUES ('${sanitizedNombre}', '${sanitizedPresentacion}', ${sanitizedCantidad}, '${formattedFechaCompra}')`;

    db.run(query, function (err) {
        if (err) {
            console.error('Error al registrar el artículo:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        console.log('Artículo registrado con ID:', this.lastID);
        res.json({ alimento_id: this.lastID });
    });
});

// REGISTO DE CITAS
app.post('/citas', (req, res) => {
    const { especialista, fecha, hora, observacion } = req.body;

    // Sanitizar y formatear datos
    const sanitizedEspecialista = validator.escape(especialista);
    const sanitizedObservacion = validator.escape(observacion);
    const sanitizedHora = validator.escape(hora) + ':00'; // Añadir segundos si no están presentes
    const formattedFecha = moment(fecha).format('YYYY-MM-DD'); // Formatear la fecha

    const query = `
        INSERT INTO Citas (especialista, fecha, hora, observacion)
        VALUES ('${sanitizedEspecialista}', '${formattedFecha}', '${sanitizedHora}', '${sanitizedObservacion}')
    `;
    console.log('Valores para la consulta:', [sanitizedEspecialista, formattedFecha, sanitizedHora, sanitizedObservacion]);

    db.run(query, function (err) {
        if (err) {
            console.error('Error al registrar la cita:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        console.log('Cita registrada con ID:', this.lastID);
        res.json({ cita_id: this.lastID });
    });
});

// REGISTO DE NOVEDADES
app.post('/novedades', (req, res) => {
    const { tipo_de_novedad, fecha, hora, descripcion, prioridad} = req.body;

    // Sanitizar y formatear datos
    const sanitizedTipoNovedad = validator.escape(tipo_de_novedad);
    const sanitizedPrioridad = validator.escape(prioridad);
    const sanitizedDescripcion = validator.escape(descripcion);
    const sanitizedHoraNovedad = validator.escape(hora) + ':00'; // Añadir segundos si no están presentes
    const formattedFechaNovedad = moment(fecha).format('YYYY-MM-DD'); // Formatear la fecha

    const query = `
        INSERT INTO Novedades (tipo_de_novedad, fecha, hora, descripcion, prioridad)
        VALUES ('${sanitizedTipoNovedad}', '${formattedFechaNovedad}', '${sanitizedHoraNovedad}', '${sanitizedDescripcion}', '${sanitizedPrioridad}')
    `;
    console.log('Valores para la consulta:', [sanitizedTipoNovedad, formattedFechaNovedad, sanitizedHoraNovedad, sanitizedDescripcion, sanitizedPrioridad]);

    db.run(query, function (err) {
        if (err) {
            console.error('Error al registrar la cita:', err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        console.log('Novedad registrada con ID:', this.lastID);
        res.json({ novedad_id: this.lastID });
    });
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});


