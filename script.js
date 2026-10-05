/**
 * ==============================================================================
 * MI DIARIO PERSONAL - LÓGICA PRINCIPAL DE LA APLICACIÓN (script.js)
 * Aplicación Web Responsiva, Accesible (WCAG 2.2 AA) y Offline-First (PWA)
 * ==============================================================================
 * 
 * NOTAS SOBRE LA API Y SINCRONIZACIÓN EN PRODUCCIÓN:
 * ------------------------------------------------------------------------------
 * 1. API UTILIZADA: JSONPlaceholder (https://jsonplaceholder.typicode.com/posts)
 *    JSONPlaceholder es un servicio de simulación REST API. Las peticiones HTTP
 *    de tipo POST, PUT y DELETE devuelven respuestas exitosas (ej. HTTP status 201
 *    o 200), pero NO persisten realmente los cambios en sus servidores.
 *    Esto es ideal para probar la lógica de sincronización offline/online de esta
 *    aplicación.
 * 
 * 2. CONFIGURACIÓN PARA UN BACKEND REAL EN PRODUCCIÓN:
 *    En un entorno de producción, las constantes de endpoints en 'ModuloSincronizacion'
 *    deberán apuntar a tu API real (ejemplo: 'https://mi-api-real.com/api/diario').
 *    Las respuestas contendrán el ID real generado por la base de datos del backend.
 * 
 * 3. SEGURIDAD Y HASHING DE CONTRASEÑAS:
 *    Para fines didácticos del cliente web, se utiliza la API nativa de JavaScript
 *    Web Crypto (crypto.subtle.digest) para realizar un hash SHA-256 de las contraseñas
 *    antes de almacenarlas en IndexedDB. En producción, la autenticación y el hashing
 *    seguro (mediante algoritmos como bcrypt o Argon2) DEBE realizarse SIEMPRE en el backend.
 * ==============================================================================
 */

'use strict';

/* ==============================================================================
   1. MÓDULO INDEXEDDB (ModuloIndexedDB)
   Gestión de la base de datos persistente en el navegador (DiarioDB)
   ============================================================================== */
const ModuloIndexedDB = (() => {
    const DB_NAME = 'DiarioDB';
    const DB_VERSION = 1;
    let dbInstance = null;

    /**
     * Abre o crea la base de datos IndexedDB con los almacenes requeridos.
     * @returns {Promise<IDBDatabase>} Instancia de la base de datos.
     */
    const abrirDB = () => {
        return new Promise((resolve, reject) => {
            if (dbInstance) {
                return resolve(dbInstance);
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Almacén 1: usuarios (keyPath: "usuario")
                if (!db.objectStoreNames.contains('usuarios')) {
                    db.createObjectStore('usuarios', { keyPath: 'usuario' });
                }

                // Almacén 2: entradas (keyPath: "id", autoIncrement: true)
                if (!db.objectStoreNames.contains('entradas')) {
                    const storeEntradas = db.createObjectStore('entradas', { keyPath: 'id', autoIncrement: true });
                    storeEntradas.createIndex('usuario', 'usuario', { unique: false });
                }

                // Almacén 3: pendientes (cola de sincronización offline, keyPath: "id", autoIncrement: true)
                if (!db.objectStoreNames.contains('pendientes')) {
                    db.createObjectStore('pendientes', { keyPath: 'id', autoIncrement: true });
                }
            };

            request.onsuccess = (event) => {
                dbInstance = event.target.result;
                resolve(dbInstance);
            };

            request.onerror = (event) => {
                console.error('Error al abrir IndexedDB:', event.target.error);
                reject('Error al acceder a la base de datos local IndexedDB.');
            };
        });
    };

    /**
     * Guarda un objeto en el almacén especificado.
     */
    const guardarEnDB = async (storeName, data) => {
        const db = await abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(`Error al guardar en ${storeName}: ${e.target.error}`);
        });
    };

    /**
     * Lee todos los registros del almacén especificado.
     */
    const leerDeDB = async (storeName) => {
        const db = await abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(`Error al leer de ${storeName}: ${e.target.error}`);
        });
    };

    /**
     * Obtiene un registro específico por su clave primaria.
     */
    const obtenerDeDB = async (storeName, key) => {
        const db = await abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(`Error al obtener registro de ${storeName}: ${e.target.error}`);
        });
    };

    /**
     * Actualiza un registro existente en el almacén especificado.
     */
    const actualizarEnDB = async (storeName, data) => {
        const db = await abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(`Error al actualizar en ${storeName}: ${e.target.error}`);
        });
    };

    /**
     * Elimina un registro por su clave primaria.
     */
    const eliminarDeDB = async (storeName, key) => {
        const db = await abrirDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve(true);
            request.onerror = (e) => reject(`Error al eliminar de ${storeName}: ${e.target.error}`);
        });
    };

    return {
        abrirDB,
        guardarEnDB,
        leerDeDB,
        obtenerDeDB,
        actualizarEnDB,
        eliminarDeDB
    };
})();


/* ==============================================================================
   2. MÓDULO DE VALIDACIÓN Y ACCESIBILIDAD ARIA (ModuloValidacion)
   RegExp, retroalimentación visual (.ok, .error) y accesibilidad
   ============================================================================== */
const ModuloValidacion = (() => {

    // Expresiones Regulares obligatorias requeridas en la especificación:
    const reglasRegExp = {
        // Nombre: mínimo 3 letras, solo letras y espacios
        nombre: /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]{3,}$/,
        // Edad: número entre 5 y 120
        edad: /^(1[0-1][0-9]|[1-9][0-9]|[5-9]|120)$/,
        // Usuario: mínimo 3 caracteres, sin espacios
        usuario: /^\S{3,}$/,
        // Correo: formato válido de e-mail
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        // Contraseña: mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número
        password: /^(?=.*\d)(?=.*[A-Z])(?=.*[a-z]).{8,}$/,
        // Título de entrada: al menos 3 caracteres
        titulo: /^.{3,}$/,
        // Contenido de entrada: al menos 5 caracteres (soporta saltos de línea \n)
        contenido: /^[\s\S]{5,}$/
    };

    // Mensajes descriptivos de error para el usuario
    const mensajesError = {
        nombre: 'El nombre debe contener al menos 3 letras y solo espacios.',
        edad: 'Por favor ingresa una edad válida entre 5 y 120 años.',
        usuario: 'El nombre de usuario debe tener mínimo 3 caracteres sin espacios.',
        email: 'Ingresa un correo electrónico con formato válido (ejemplo@dominio.com).',
        password: 'La contraseña debe incluir mínimo 8 caracteres, una mayúscula, una minúscula y un número.',
        confirmPassword: 'Las contraseñas no coinciden.',
        titulo: 'El título de la entrada debe tener al menos 3 caracteres.',
        contenido: 'El contenido de la entrada debe tener al menos 5 caracteres.'
    };

    /**
     * Valida dinámicamente un campo individual y actualiza clases y atributos ARIA.
     * @param {HTMLInputElement|HTMLTextAreaElement} input Campo a validar.
     * @param {Object} camposAdicionales Opcional, para comparar valores.
     * @returns {boolean} Es válido o no.
     */
    const validarCampo = (input, camposAdicionales = {}) => {
        if (!input) return false;

        const id = input.id;
        const valor = input.value.trim();
        const smallError = document.getElementById(`error-${id}`);
        let esValido = true;
        let mensaje = '';

        // Determinación del tipo de validación según el campo
        if (id === 'regConfirmPassword') {
            const passVal = camposAdicionales.passwordValue || document.getElementById('regPassword')?.value || '';
            esValido = valor.length >= 8 && valor === passVal;
            mensaje = esValido ? '' : mensajesError.confirmPassword;
        } else if (id === 'regNombre') {
            esValido = reglasRegExp.nombre.test(valor);
            mensaje = esValido ? '' : mensajesError.nombre;
        } else if (id === 'regEdad') {
            esValido = reglasRegExp.edad.test(valor);
            mensaje = esValido ? '' : mensajesError.edad;
        } else if (id === 'regUsuario' || id === 'loginUsuario') {
            esValido = reglasRegExp.usuario.test(valor);
            mensaje = esValido ? '' : mensajesError.usuario;
        } else if (id === 'regEmail') {
            esValido = reglasRegExp.email.test(valor);
            mensaje = esValido ? '' : mensajesError.email;
        } else if (id === 'regPassword') {
            esValido = reglasRegExp.password.test(valor);
            mensaje = esValido ? '' : mensajesError.password;
        } else if (id === 'loginPassword') {
            esValido = valor.length > 0;
            mensaje = esValido ? '' : 'Por favor ingresa tu contraseña.';
        } else if (id === 'entradaTitulo') {
            esValido = reglasRegExp.titulo.test(valor);
            mensaje = esValido ? '' : mensajesError.titulo;
        } else if (id === 'entradaContenido') {
            esValido = reglasRegExp.contenido.test(valor);
            mensaje = esValido ? '' : mensajesError.contenido;
        }

        // Aplicación de Estados Visuales (.ok, .error) y Atributos ARIA
        if (esValido) {
            input.classList.remove('error');
            input.classList.add('ok');
            input.setAttribute('aria-invalid', 'false');
            if (smallError) {
                smallError.textContent = '';
            }
        } else {
            input.classList.remove('ok');
            input.classList.add('error');
            input.setAttribute('aria-invalid', 'true');
            if (smallError) {
                smallError.textContent = mensaje;
            }
        }

        return esValido;
    };

    /**
     * Limpia la validación visual y mensajes de un formulario completo.
     */
    const limpiarFormulario = (formElement) => {
        if (!formElement) return;
        const inputs = formElement.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.classList.remove('ok', 'error');
            input.removeAttribute('aria-invalid');
            const smallError = document.getElementById(`error-${input.id}`);
            if (smallError) smallError.textContent = '';
        });
        formElement.reset();
    };

    return {
        validarCampo,
        limpiarFormulario
    };
})();


/* ==============================================================================
   3. MÓDULO DE AUTENTICACIÓN Y USUARIOS (ModuloUsuarios)
   Registro, login, hash de contraseña y gestión de Web Storage
   ============================================================================== */
const ModuloUsuarios = (() => {

    /**
     * Genera un hash SHA-256 seguro utilizando Web Crypto API.
     */
    const generarHash = async (texto) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(texto);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    /**
     * Registra un nuevo usuario en IndexedDB.
     */
    const registrarUsuario = async (datosUsuario) => {
        const { nombre, edad, usuario, email, password } = datosUsuario;

        // Verificar si el usuario ya existe en IndexedDB
        const usuarioExistente = await ModuloIndexedDB.obtenerDeDB('usuarios', usuario);
        if (usuarioExistente) {
            throw new Error(`El nombre de usuario "${usuario}" ya se encuentra registrado.`);
        }

        // Generar hash de contraseña (didáctico para el cliente web)
        const passwordHash = await generarHash(password);

        const nuevoUsuario = {
            usuario,
            nombre,
            edad: parseInt(edad, 10),
            email,
            passwordHash,
            fechaRegistro: new Date().toISOString()
        };

        await ModuloIndexedDB.guardarEnDB('usuarios', nuevoUsuario);
        return nuevoUsuario;
    };

    /**
     * Inicia sesión validando credenciales contra IndexedDB.
     */
    const iniciarSesion = async (usuario, password, recordarme) => {
        const usuarioDB = await ModuloIndexedDB.obtenerDeDB('usuarios', usuario);
        if (!usuarioDB) {
            throw new Error('El usuario no existe.');
        }

        const inputHash = await generarHash(password);
        if (usuarioDB.passwordHash !== inputHash) {
            throw new Error('Contraseña incorrecta.');
        }

        // Guardar sesión activa en sessionStorage
        sessionStorage.setItem('usuarioActivo', usuario);

        // Guardar preferencia "recordarme" en localStorage
        if (recordarme) {
            localStorage.setItem('usuarioRecordado', usuario);
        } else {
            localStorage.removeItem('usuarioRecordado');
        }

        return usuarioDB;
    };

    /**
     * Cierra la sesión activa actual.
     */
    const cerrarSesion = () => {
        sessionStorage.removeItem('usuarioActivo');
        sessionStorage.removeItem('filtroEntradas');
    };

    /**
     * Obtiene el nombre de usuario de la sesión activa.
     */
    const obtenerUsuarioActivo = () => {
        return sessionStorage.getItem('usuarioActivo');
    };

    return {
        registrarUsuario,
        iniciarSesion,
        cerrarSesion,
        obtenerUsuarioActivo
    };
})();


/* ==============================================================================
   4. MÓDULO DE GESTIÓN DE ENTRADAS DEL DIARIO (ModuloEntradas)
   Operaciones CRUD integrando IndexedDB, Fetch API y Cola Offline
   ============================================================================== */
const ModuloEntradas = (() => {

    const ENDPOINT_POSTS = 'https://jsonplaceholder.typicode.com/posts';

    /**
     * Crea una nueva entrada en IndexedDB y la envía a la API o la encola si está offline.
     */
    const crearEntrada = async (titulo, contenido) => {
        const usuarioActivo = ModuloUsuarios.obtenerUsuarioActivo();
        if (!usuarioActivo) throw new Error('No hay una sesión activa.');

        const fechaActual = new Date().toISOString();

        // 1. Guardar localmente en IndexedDB
        const nuevaEntradaData = {
            titulo,
            contenido,
            fecha: fechaActual,
            usuario: usuarioActivo,
            synced: false
        };

        const idLocal = await ModuloIndexedDB.guardarEnDB('entradas', nuevaEntradaData);
        nuevaEntradaData.id = idLocal;

        // 2. Procesar Sincronización (Online/Offline)
        if (navigator.onLine) {
            try {
                const respuesta = await fetch(ENDPOINT_POSTS, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
                    body: JSON.stringify({
                        title: titulo,
                        body: contenido,
                        userId: usuarioActivo
                    })
                });

                if (respuesta.ok) {
                    nuevaEntradaData.synced = true;
                    await ModuloIndexedDB.actualizarEnDB('entradas', nuevaEntradaData);
                    ModuloUI.notificar('Entrada guardada y sincronizada correctamente.', 'success');
                } else {
                    throw new Error('Respuesta no satisfactoria del servidor remoto.');
                }
            } catch (err) {
                console.warn('Error en POST remoto. Encolando operación offline:', err);
                await ModuloSincronizacion.agregarPendiente('POST', ENDPOINT_POSTS, {
                    title: titulo,
                    body: contenido,
                    userId: usuarioActivo,
                    localId: idLocal
                });
                ModuloUI.notificar('Guardado localmente. Se sincronizará al reconectar Internet.', 'warning');
            }
        } else {
            await ModuloSincronizacion.agregarPendiente('POST', ENDPOINT_POSTS, {
                title: titulo,
                body: contenido,
                userId: usuarioActivo,
                localId: idLocal
            });
            ModuloUI.notificar('Modo Offline: Guardado localmente. Se sincronizará al reconectar.', 'warning');
        }

        return nuevaEntradaData;
    };

    /**
     * Obtiene y renderiza todas las entradas pertenecientes al usuario activo.
     */
    const listarEntradas = async (filtroTexto = '') => {
        const usuarioActivo = ModuloUsuarios.obtenerUsuarioActivo();
        if (!usuarioActivo) return;

        const todasLasEntradas = await ModuloIndexedDB.leerDeDB('entradas');

        // Filtrar entradas solo del usuario logueado
        let entradasUsuario = todasLasEntradas.filter(e => e.usuario === usuarioActivo);

        // Aplicar filtro de búsqueda si existe
        if (filtroTexto.trim() !== '') {
            const query = filtroTexto.toLowerCase();
            entradasUsuario = entradasUsuario.filter(e => 
                e.titulo.toLowerCase().includes(query) || 
                e.contenido.toLowerCase().includes(query)
            );
        }

        // Ordenar por fecha descendente
        entradasUsuario.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        ModuloUI.renderizarEntradas(entradasUsuario, filtroTexto);
    };

    /**
     * Actualiza una entrada existente.
     */
    const actualizarEntrada = async (id, titulo, contenido) => {
        const usuarioActivo = ModuloUsuarios.obtenerUsuarioActivo();
        const entradaOriginal = await ModuloIndexedDB.obtenerDeDB('entradas', id);

        if (!entradaOriginal) throw new Error('Entrada no encontrada.');

        const entradaActualizada = {
            ...entradaOriginal,
            titulo,
            contenido,
            fechaModificacion: new Date().toISOString(),
            synced: false
        };

        // 1. Actualizar IndexedDB
        await ModuloIndexedDB.actualizarEnDB('entradas', entradaActualizada);

        const urlPut = `${ENDPOINT_POSTS}/${id}`;

        // 2. Intentar PUT a la API o agregar a pendientes
        if (navigator.onLine) {
            try {
                const respuesta = await fetch(urlPut, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
                    body: JSON.stringify({
                        id: id,
                        title: titulo,
                        body: contenido,
                        userId: usuarioActivo
                    })
                });

                if (respuesta.ok) {
                    entradaActualizada.synced = true;
                    await ModuloIndexedDB.actualizarEnDB('entradas', entradaActualizada);
                    ModuloUI.notificar('Entrada actualizada y sincronizada en el servidor.', 'success');
                } else {
                    throw new Error('Falló respuesta PUT.');
                }
            } catch (err) {
                await ModuloSincronizacion.agregarPendiente('PUT', urlPut, {
                    id: id,
                    title: titulo,
                    body: contenido,
                    userId: usuarioActivo
                });
                ModuloUI.notificar('Actualizado localmente. Se sincronizará al reconectar.', 'warning');
            }
        } else {
            await ModuloSincronizacion.agregarPendiente('PUT', urlPut, {
                id: id,
                title: titulo,
                body: contenido,
                userId: usuarioActivo
            });
            ModuloUI.notificar('Modo Offline: Actualizado localmente. Se sincronizará al reconectar.', 'warning');
        }
    };

    /**
     * Elimina una entrada de IndexedDB y procesa su eliminación remota.
     */
    const eliminarEntrada = async (id) => {
        await ModuloIndexedDB.eliminarDeDB('entradas', id);

        const urlDelete = `${ENDPOINT_POSTS}/${id}`;

        if (navigator.onLine) {
            try {
                const respuesta = await fetch(urlDelete, { method: 'DELETE' });
                if (respuesta.ok) {
                    ModuloUI.notificar('Entrada eliminada correctamente.', 'info');
                } else {
                    throw new Error('Error en respuesta DELETE servidor.');
                }
            } catch (err) {
                await ModuloSincronizacion.agregarPendiente('DELETE', urlDelete, { id });
                ModuloUI.notificar('Eliminado localmente. Se sincronizará la eliminación al reconectar.', 'warning');
            }
        } else {
            await ModuloSincronizacion.agregarPendiente('DELETE', urlDelete, { id });
            ModuloUI.notificar('Modo Offline: Eliminado localmente. Se sincronizará al reconectar.', 'warning');
        }

        const filtro = sessionStorage.getItem('filtroEntradas') || '';
        await listarEntradas(filtro);
    };

    return {
        crearEntrada,
        listarEntradas,
        actualizarEntrada,
        eliminarEntrada
    };
})();


/* ==============================================================================
   5. MÓDULO DE SINCRONIZACIÓN Y COLA OFFLINE (ModuloSincronizacion)
   Manejo del almacén 'pendientes' e integración con eventos online/offline
   ============================================================================== */
const ModuloSincronizacion = (() => {

    const agregarPendiente = async (tipo, url, data) => {
        const operacion = {
            tipo,
            url,
            data,
            timestamp: Date.now()
        };
        await ModuloIndexedDB.guardarEnDB('pendientes', operacion);
        actualizarBannerPendientes();
    };

    const sincronizarPendientes = async () => {
        if (!navigator.onLine) return;

        const pendientes = await ModuloIndexedDB.leerDeDB('pendientes');
        if (pendientes.length === 0) {
            actualizarBannerPendientes();
            return;
        }

        ModuloUI.notificar(`Conexión reestablecida. Sincronizando ${pendientes.length} operación(es) pendiente(s)...`, 'info');

        let exitosas = 0;

        for (const op of pendientes) {
            try {
                const opcionesFetch = {
                    method: op.tipo,
                    headers: { 'Content-Type': 'application/json; charset=UTF-8' }
                };

                if (op.data && op.tipo !== 'DELETE') {
                    opcionesFetch.body = JSON.stringify(op.data);
                }

                const res = await fetch(op.url, opcionesFetch);

                if (res.ok) {
                    await ModuloIndexedDB.eliminarDeDB('pendientes', op.id);
                    exitosas++;

                    if (op.data && op.data.localId) {
                        const entrada = await ModuloIndexedDB.obtenerDeDB('entradas', op.data.localId);
                        if (entrada) {
                            entrada.synced = true;
                            await ModuloIndexedDB.actualizarEnDB('entradas', entrada);
                        }
                    }
                }
            } catch (err) {
                console.error(`Error al sincronizar operación ${op.id} (${op.tipo}):`, err);
            }
        }

        if (exitosas > 0) {
            ModuloUI.notificar(`✨ Sincronización completada. Se procesaron ${exitosas} cambios pendientes.`, 'success');
            const filtro = sessionStorage.getItem('filtroEntradas') || '';
            ModuloEntradas.listarEntradas(filtro);
        }

        actualizarBannerPendientes();
    };

    const actualizarBannerPendientes = async () => {
        const banner = document.getElementById('bannerPendientes');
        if (!banner) return;

        const pendientes = await ModuloIndexedDB.leerDeDB('pendientes');
        if (pendientes.length > 0) {
            banner.classList.remove('hidden');
        } else {
            banner.classList.add('hidden');
        }
    };

    /**
     * Actualiza el indicador de conexión y solo notifica si es una transición (esEvento = true).
     */
    const actualizarEstadoConexion = (esEvento = false) => {
        const badge = document.getElementById('estadoConexion');
        if (!badge) return;

        if (navigator.onLine) {
            badge.className = 'badge-status online';
            badge.innerHTML = '<span class="status-dot" aria-hidden="true"></span><span class="status-text">Conectado</span>';
            badge.setAttribute('aria-label', 'Estado de la conexión: En línea');
            sincronizarPendientes();
        } else {
            badge.className = 'badge-status offline';
            badge.innerHTML = '<span class="status-dot" aria-hidden="true"></span><span class="status-text">Sin conexión (Offline)</span>';
            badge.setAttribute('aria-label', 'Estado de la conexión: Sin conexión a Internet');
            if (esEvento === true) {
                ModuloUI.notificar('Se ha perdido la conexión a Internet. La aplicación continuará funcionando offline.', 'warning');
            }
        }
    };

    return {
        agregarPendiente,
        sincronizarPendientes,
        actualizarEstadoConexion,
        actualizarBannerPendientes
    };
})();


/* ==============================================================================
   6. MÓDULO DE INTERFAZ DE USUARIO Y CONTROLADOR VISTAS (ModuloUI)
   Navegación de vistas, foco accesible (WCAG 2.4.3), renderizado y notificaciones
   ============================================================================== */
const ModuloUI = (() => {

    /**
     * Cambia la vista activa gestionando el foco y el título de página accesibles.
     */
    const mostrarVista = (nombreVista) => {
        const vistas = document.querySelectorAll('.view-section');
        vistas.forEach(v => v.classList.add('hidden'));

        const vistaTarget = document.getElementById(nombreVista);
        if (vistaTarget) {
            vistaTarget.classList.remove('hidden');
        }

        const infoUsuarioHeader = document.getElementById('infoUsuarioHeader');
        const usuarioActivo = ModuloUsuarios.obtenerUsuarioActivo();

        // Actualizar document.title y mover foco al primer campo relevante
        window.scrollTo({ top: 0, behavior: 'instant' });

        if (nombreVista === 'vistaDiario' && usuarioActivo) {
            document.title = 'Mi Diario Personal - Mis Entradas';
            if (infoUsuarioHeader) infoUsuarioHeader.classList.remove('hidden');
            const elNombre = document.getElementById('nombreUsuarioHeader');
            if (elNombre) elNombre.textContent = usuarioActivo;
            const targetFocus = document.getElementById('entradaTitulo');
            if (targetFocus) targetFocus.focus();
        } else if (nombreVista === 'vistaRegistro') {
            document.title = 'Mi Diario Personal - Registro de Usuario';
            if (infoUsuarioHeader) infoUsuarioHeader.classList.add('hidden');
            const targetFocus = document.getElementById('regNombre');
            if (targetFocus) targetFocus.focus();
        } else {
            document.title = 'Mi Diario Personal - Iniciar Sesión';
            if (infoUsuarioHeader) infoUsuarioHeader.classList.add('hidden');
            const targetFocus = document.getElementById('loginUsuario');
            if (targetFocus) targetFocus.focus();
        }
    };

    /**
     * Renderiza las entradas de diario con nombres accesibles únicos y controles de revelado.
     */
    const renderizarEntradas = (entradas, filtroTexto = '') => {
        const contenedor = document.getElementById('contenedorEntradas');
        const mensajeVacio = document.getElementById('mensajeVacio');
        const resumenBusqueda = document.getElementById('resumenBusqueda');
        if (!contenedor) return;

        contenedor.setAttribute('aria-busy', 'true');

        // Actualizar resumen de búsqueda para lectores de pantalla
        if (resumenBusqueda) {
            if (filtroTexto.trim() !== '') {
                resumenBusqueda.textContent = `Se encontraron ${entradas.length} entradas para la búsqueda "${filtroTexto}".`;
            } else {
                resumenBusqueda.textContent = `Se muestran ${entradas.length} entradas en tu diario.`;
            }
        }

        // Eliminar tarjetas previas
        const tarjetas = contenedor.querySelectorAll('.tarjeta-entrada');
        tarjetas.forEach(t => t.remove());

        if (entradas.length === 0) {
            if (mensajeVacio) mensajeVacio.classList.remove('hidden');
        } else {
            if (mensajeVacio) mensajeVacio.classList.add('hidden');

            const fragmento = document.createDocumentFragment();

            entradas.forEach(entrada => {
                const tarjeta = document.createElement('article');
                tarjeta.className = 'tarjeta-entrada';
                tarjeta.setAttribute('data-id', entrada.id);
                tarjeta.setAttribute('aria-labelledby', `titulo-entrada-${entrada.id}`);

                const fechaObj = new Date(entrada.fecha);
                const fechaFormateada = isNaN(fechaObj.getTime()) ? entrada.fecha : 
                    fechaObj.toLocaleDateString('es-ES', { 
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });

                const badgePendiente = !entrada.synced ? `<span class="tarjeta-badge-pendiente">⏳ Pendiente de Sync</span>` : '';

                tarjeta.innerHTML = `
                    <div class="tarjeta-header">
                        <h3 id="titulo-entrada-${entrada.id}" class="tarjeta-titulo">${escaparHTML(entrada.titulo)}</h3>
                        <time class="tarjeta-fecha" datetime="${entrada.fecha}">📅 ${fechaFormateada}</time>
                        ${badgePendiente}
                    </div>
                    <div id="cuerpo-entrada-${entrada.id}" class="tarjeta-body">${escaparHTML(entrada.contenido)}</div>
                    <button type="button" class="btn btn-secondary btn-sm btn-revelar" aria-expanded="false" aria-controls="cuerpo-entrada-${entrada.id}">
                        <span aria-hidden="true">👁️</span> Revelar contenido
                    </button>
                    <div class="tarjeta-footer">
                        <button type="button" class="btn btn-secondary btn-sm btn-editar" aria-label="Editar entrada: ${escaparHTML(entrada.titulo)}">
                            <span aria-hidden="true">✏️</span> Editar
                        </button>
                        <button type="button" class="btn btn-danger btn-sm btn-eliminar" aria-label="Eliminar entrada: ${escaparHTML(entrada.titulo)}">
                            <span aria-hidden="true">🗑️</span> Eliminar
                        </button>
                    </div>
                `;

                fragmento.appendChild(tarjeta);
            });

            contenedor.appendChild(fragmento);
        }

        contenedor.setAttribute('aria-busy', 'false');
    };

    /**
     * Muestra notificaciones Toast con botón de cierre explícito y duración adaptativa.
     */
    const notificar = (mensaje, tipo = 'info') => {
        const toastContainer = document.getElementById('notificacionToast');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${tipo}`;
        toast.setAttribute('role', tipo === 'error' || tipo === 'warning' ? 'alert' : 'status');
        
        toast.innerHTML = `
            <span>${escaparHTML(mensaje)}</span>
            <button type="button" class="btn-close-toast" aria-label="Cerrar notificación">×</button>
        `;

        toastContainer.appendChild(toast);

        const btnCerrar = toast.querySelector('.btn-close-toast');
        let timer = null;

        const cerrar = () => {
            if (timer) clearTimeout(timer);
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        };

        if (btnCerrar) btnCerrar.addEventListener('click', cerrar);

        // Duración más amplia para errores/advertencias (8s) vs info (4s)
        const duracion = (tipo === 'error' || tipo === 'warning') ? 8000 : 4500;
        timer = setTimeout(cerrar, duracion);
    };

    /**
     * Alterna entre el tema claro y oscuro (persistiéndolo en localStorage).
     */
    const alternarTema = (forzarOscuro = null) => {
        const html = document.documentElement;
        const body = document.body;
        const iconoTema = document.getElementById('iconoTema');
        const btnTema = document.getElementById('btnTema');

        let esOscuro = body.classList.contains('dark-theme') || html.classList.contains('dark-theme');
        if (forzarOscuro !== null) {
            esOscuro = !forzarOscuro;
        }

        if (esOscuro) {
            body.classList.remove('dark-theme');
            html.classList.remove('dark-theme');
            localStorage.setItem('temaDiario', 'claro');
            if (iconoTema) iconoTema.textContent = '🌙';
            if (btnTema) btnTema.setAttribute('aria-label', 'Cambiar a tema oscuro');
        } else {
            body.classList.add('dark-theme');
            html.classList.add('dark-theme');
            localStorage.setItem('temaDiario', 'oscuro');
            if (iconoTema) iconoTema.textContent = '☀️';
            if (btnTema) btnTema.setAttribute('aria-label', 'Cambiar a tema claro');
        }
    };

    /**
     * Escapa caracteres HTML para evitar ataques XSS.
     */
    const escaparHTML = (str) => {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    return {
        mostrarVista,
        renderizarEntradas,
        notificar,
        alternarTema
    };
})();


/* ==============================================================================
   7. REGISTRO DE SERVICE WORKER REAL (PWA Offline-First)
   ============================================================================== */
const inicializarServiceWorker = () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('Service Worker de PWA registrado correctamente desde ./sw.js'))
            .catch(err => console.warn('Atención: No se pudo registrar Service Worker:', err));
    }
};


/* ==============================================================================
   8. EVENT LISTENERS E INICIALIZACIÓN DE LA APLICACIÓN
   ============================================================================== */
document.addEventListener('DOMContentLoaded', async () => {

    // A. Inicializar Tema según Preferencia en localStorage
    const temaGuardado = localStorage.getItem('temaDiario');
    if (temaGuardado === 'oscuro') {
        ModuloUI.alternarTema(true);
    }

    // B. Inicializar PWA Service Worker Real
    inicializarServiceWorker();

    // C. Verificar Estado de Conexión Inicial y Listeners Online/Offline
    ModuloSincronizacion.actualizarEstadoConexion(false);
    window.addEventListener('online', () => ModuloSincronizacion.actualizarEstadoConexion(true));
    window.addEventListener('offline', () => ModuloSincronizacion.actualizarEstadoConexion(true));

    // D. Gestión de Sesión Inicial
    const usuarioActivo = ModuloUsuarios.obtenerUsuarioActivo();
    const usuarioRecordado = localStorage.getItem('usuarioRecordado');

    if (usuarioActivo) {
        ModuloUI.mostrarVista('vistaDiario');
        const filtroInicial = sessionStorage.getItem('filtroEntradas') || '';
        const searchInput = document.getElementById('inputBuscarEntrada');
        if (searchInput) searchInput.value = filtroInicial;
        await ModuloEntradas.listarEntradas(filtroInicial);
    } else {
        ModuloUI.mostrarVista('vistaLogin');
        if (usuarioRecordado) {
            const loginUserInput = document.getElementById('loginUsuario');
            const chkRecordarme = document.getElementById('chkRecordarme');
            if (loginUserInput) loginUserInput.value = usuarioRecordado;
            if (chkRecordarme) chkRecordarme.checked = true;
        }
    }

    // E. Event Listeners para Navegación entre Enlaces
    const linkIrLogin = document.getElementById('linkIrLogin');
    const linkIrRegistro = document.getElementById('linkIrRegistro');
    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    const btnTema = document.getElementById('btnTema');

    if (linkIrLogin) {
        linkIrLogin.addEventListener('click', (e) => {
            e.preventDefault();
            ModuloValidacion.limpiarFormulario(document.getElementById('formRegistro'));
            ModuloUI.mostrarVista('vistaLogin');
        });
    }

    if (linkIrRegistro) {
        linkIrRegistro.addEventListener('click', (e) => {
            e.preventDefault();
            ModuloValidacion.limpiarFormulario(document.getElementById('formLogin'));
            ModuloUI.mostrarVista('vistaRegistro');
        });
    }

    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', () => {
            ModuloUsuarios.cerrarSesion();
            ModuloUI.mostrarVista('vistaLogin');
            ModuloUI.notificar('Sesión cerrada correctamente.', 'info');
        });
    }

    if (btnTema) {
        btnTema.addEventListener('click', () => ModuloUI.alternarTema());
    }

    // Alternancia para revelar/ocultar contraseña (Botón "Ojito")
    document.addEventListener('click', (e) => {
        const btnToggle = e.target.closest('.btn-toggle-password');
        if (btnToggle) {
            const wrapper = btnToggle.closest('.password-wrapper');
            const input = wrapper ? wrapper.querySelector('input') : null;
            if (input) {
                const esPassword = input.type === 'password';
                input.type = esPassword ? 'text' : 'password';
                btnToggle.textContent = esPassword ? '🙈' : '👁️';
                btnToggle.setAttribute('aria-label', esPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');
            }
        }
    });

    // F. Validaciones Dinámicas en Tiempo Real (blur, input)
    const inputsAValidar = [
        'regNombre', 'regEdad', 'regUsuario', 'regEmail', 'regPassword', 'regConfirmPassword',
        'loginUsuario', 'loginPassword', 'entradaTitulo', 'entradaContenido'
    ];

    inputsAValidar.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('blur', () => ModuloValidacion.validarCampo(el));
            el.addEventListener('input', () => {
                if (el.classList.contains('error')) {
                    ModuloValidacion.validarCampo(el);
                }
            });
        }
    });

    // G. Manejo del Formulario de Registro (#formRegistro)
    const formRegistro = document.getElementById('formRegistro');
    if (formRegistro) {
        formRegistro.addEventListener('submit', async (e) => {
            e.preventDefault();

            const inputs = ['regNombre', 'regEdad', 'regUsuario', 'regEmail', 'regPassword', 'regConfirmPassword'];
            let todoValido = true;

            inputs.forEach(id => {
                const input = document.getElementById(id);
                const valido = ModuloValidacion.validarCampo(input);
                if (!valido) todoValido = false;
            });

            if (!todoValido) {
                ModuloUI.notificar('Por favor corrige los errores resaltados en el formulario.', 'error');
                return;
            }

            try {
                const datos = {
                    nombre: document.getElementById('regNombre').value,
                    edad: document.getElementById('regEdad').value,
                    usuario: document.getElementById('regUsuario').value,
                    email: document.getElementById('regEmail').value,
                    password: document.getElementById('regPassword').value
                };

                await ModuloUsuarios.registrarUsuario(datos);
                ModuloUI.notificar('🎉 ¡Cuenta creada con éxito! Ahora puedes iniciar sesión.', 'success');
                ModuloValidacion.limpiarFormulario(formRegistro);
                ModuloUI.mostrarVista('vistaLogin');
            } catch (err) {
                ModuloUI.notificar(err.message, 'error');
            }
        });
    }

    // H. Manejo del Formulario de Login (#formLogin)
    const formLogin = document.getElementById('formLogin');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();

            const inputUser = document.getElementById('loginUsuario');
            const inputPass = document.getElementById('loginPassword');
            const chkRecordarme = document.getElementById('chkRecordarme');

            const uValido = ModuloValidacion.validarCampo(inputUser);
            const pValido = ModuloValidacion.validarCampo(inputPass);

            if (!uValido || !pValido) {
                ModuloUI.notificar('Ingresa tu usuario y contraseña.', 'error');
                return;
            }

            try {
                await ModuloUsuarios.iniciarSesion(inputUser.value.trim(), inputPass.value, chkRecordarme.checked);
                ModuloUI.notificar('Bienvenido de nuevo a tu diario personal.', 'success');
                ModuloValidacion.limpiarFormulario(formLogin);
                ModuloUI.mostrarVista('vistaDiario');
                await ModuloEntradas.listarEntradas('');
            } catch (err) {
                ModuloUI.notificar(err.message, 'error');
            }
        });
    }

    // I. Manejo del Formulario de Entradas (#formEntrada - Crear y Editar)
    const formEntrada = document.getElementById('formEntrada');
    const btnCancelarEdicion = document.getElementById('btnCancelarEdicion');
    const inputEntradaId = document.getElementById('entradaId');
    const btnGuardarEntrada = document.getElementById('btnGuardarEntrada');
    const tituloForm = document.getElementById('tituloDiarioForm');

    if (formEntrada) {
        formEntrada.addEventListener('submit', async (e) => {
            e.preventDefault();

            const inputTitulo = document.getElementById('entradaTitulo');
            const inputContenido = document.getElementById('entradaContenido');

            const tValido = ModuloValidacion.validarCampo(inputTitulo);
            const cValido = ModuloValidacion.validarCampo(inputContenido);

            if (!tValido || !cValido) {
                ModuloUI.notificar('Por favor completa los campos obligatorios de la entrada.', 'error');
                return;
            }

            const idModoEdicion = inputEntradaId.value;
            const titulo = inputTitulo.value.trim();
            const contenido = inputContenido.value.trim();

            try {
                if (idModoEdicion) {
                    await ModuloEntradas.actualizarEntrada(parseInt(idModoEdicion, 10), titulo, contenido);
                } else {
                    await ModuloEntradas.crearEntrada(titulo, contenido);
                }

                resetearFormularioEntrada();

                const filtro = sessionStorage.getItem('filtroEntradas') || '';
                await ModuloEntradas.listarEntradas(filtro);
            } catch (err) {
                ModuloUI.notificar('Error al procesar la entrada: ' + err.message, 'error');
            }
        });
    }

    const resetearFormularioEntrada = () => {
        if (!formEntrada) return;
        ModuloValidacion.limpiarFormulario(formEntrada);
        inputEntradaId.value = '';
        if (btnGuardarEntrada) btnGuardarEntrada.innerHTML = '<span aria-hidden="true">💾</span> Guardar entrada';
        if (tituloForm) tituloForm.innerHTML = '<span aria-hidden="true">✍️</span> Nueva Entrada de Diario';
        if (btnCancelarEdicion) btnCancelarEdicion.classList.add('hidden');
    };

    if (btnCancelarEdicion) {
        btnCancelarEdicion.addEventListener('click', resetearFormularioEntrada);
    }

    // J. Event Delegation para Revelar, Editar y Eliminar en las Tarjetas
    const contenedorEntradas = document.getElementById('contenedorEntradas');
    const dialogoConfirmacion = document.getElementById('dialogoConfirmacion');
    const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');
    const btnCancelarEliminar = document.getElementById('btnCancelarEliminar');
    let idEntradaAEliminar = null;
    let elementoDisparadorEliminar = null;

    if (dialogoConfirmacion) {
        dialogoConfirmacion.addEventListener('close', () => {
            idEntradaAEliminar = null;
            if (elementoDisparadorEliminar) {
                try { elementoDisparadorEliminar.focus(); } catch (e) {}
                elementoDisparadorEliminar = null;
            }
        });
    }

    if (contenedorEntradas) {
        contenedorEntradas.addEventListener('click', async (e) => {
            const btnRevelar = e.target.closest('.btn-revelar');
            const btnEditar = e.target.closest('.btn-editar');
            const btnEliminar = e.target.closest('.btn-eliminar');

            // 1. Botón Revelar/Ocultar Contenido
            if (btnRevelar) {
                const tarjeta = btnRevelar.closest('.tarjeta-entrada');
                const cuerpo = tarjeta ? tarjeta.querySelector('.tarjeta-body') : null;
                if (cuerpo) {
                    const estaRevelado = cuerpo.classList.contains('revelado');
                    if (estaRevelado) {
                        cuerpo.classList.remove('revelado');
                        btnRevelar.setAttribute('aria-expanded', 'false');
                        btnRevelar.innerHTML = '<span aria-hidden="true">👁️</span> Revelar contenido';
                    } else {
                        cuerpo.classList.add('revelado');
                        btnRevelar.setAttribute('aria-expanded', 'true');
                        btnRevelar.innerHTML = '<span aria-hidden="true">🙈</span> Ocultar contenido';
                    }
                }
                return;
            }

            // 2. Botón Editar
            if (btnEditar) {
                const tarjeta = btnEditar.closest('.tarjeta-entrada');
                const id = parseInt(tarjeta.getAttribute('data-id'), 10);
                const entrada = await ModuloIndexedDB.obtenerDeDB('entradas', id);

                if (entrada) {
                    const elTitulo = document.getElementById('entradaTitulo');
                    const elContenido = document.getElementById('entradaContenido');

                    document.getElementById('entradaId').value = id;
                    elTitulo.value = entrada.titulo;
                    elContenido.value = entrada.contenido;

                    ModuloValidacion.validarCampo(elTitulo);
                    ModuloValidacion.validarCampo(elContenido);

                    if (btnGuardarEntrada) btnGuardarEntrada.innerHTML = '<span aria-hidden="true">🔄</span> Actualizar entrada';
                    if (tituloForm) tituloForm.innerHTML = '<span aria-hidden="true">✏️</span> Editar Entrada';
                    if (btnCancelarEdicion) btnCancelarEdicion.classList.remove('hidden');

                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    elTitulo.focus();
                }
                return;
            }

            // 3. Botón Eliminar
            if (btnEliminar) {
                const tarjeta = btnEliminar.closest('.tarjeta-entrada');
                idEntradaAEliminar = parseInt(tarjeta.getAttribute('data-id'), 10);
                elementoDisparadorEliminar = btnEliminar;

                if (dialogoConfirmacion) {
                    if (typeof dialogoConfirmacion.showModal === 'function') {
                        dialogoConfirmacion.showModal();
                        if (btnCancelarEliminar) btnCancelarEliminar.focus();
                    } else {
                        if (confirm('¿Estás seguro de que deseas eliminar esta entrada de tu diario?')) {
                            await ModuloEntradas.eliminarEntrada(idEntradaAEliminar);
                            idEntradaAEliminar = null;
                            elementoDisparadorEliminar = null;
                        }
                    }
                }
            }
        });
    }

    if (btnConfirmarEliminar) {
        btnConfirmarEliminar.addEventListener('click', async () => {
            if (idEntradaAEliminar) {
                await ModuloEntradas.eliminarEntrada(idEntradaAEliminar);
                idEntradaAEliminar = null;
            }
            if (dialogoConfirmacion) dialogoConfirmacion.close();
        });
    }

    if (btnCancelarEliminar) {
        btnCancelarEliminar.addEventListener('click', () => {
            if (dialogoConfirmacion) dialogoConfirmacion.close();
        });
    }

    // K. Filtro de Búsqueda de Entradas en Tiempo Real
    const inputBuscar = document.getElementById('inputBuscarEntrada');
    if (inputBuscar) {
        inputBuscar.addEventListener('input', (e) => {
            const texto = e.target.value;
            sessionStorage.setItem('filtroEntradas', texto);
            ModuloEntradas.listarEntradas(texto);
        });
    }

});
