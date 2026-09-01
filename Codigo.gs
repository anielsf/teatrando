const ESQUEMA_DB = {
  CARTELERAS: {
    nombre: 'Carteleras',
    columnas: ['ID', 'Obra', 'Funcion', 'Fecha', 'Hora', 'URL_Imagen', 'Precio_USD', 'Genero', 'Sala', 'Sinopsis', 'Reparto']
  },
  INTERACCIONES: {
    nombre: 'Interacciones',
    columnas: ['ID_Obra', 'Tipo', 'Valor', 'Fecha_Registro']
  },
  USUARIOS: {
    nombre: 'Usuarios',
    columnas: ['ID_Usuario', 'Nombre', 'Email', 'Password', 'Fecha_Registro', 'Rol', 'Plan_Suscripcion']
  },
  TICKETS: {
    nombre: 'Tickets',
    columnas: [
      'Ticket_ID', 'ID_Usuario', 'Nombre_Cliente', 'Email_Cliente',
      'Obra', 'Funcion', 'Sala', 'Asiento', 'Fecha_Funcion', 'Hora_Funcion',
      'Precio_USD', 'Precio_VES', 'Tasa_BCV', 'Ref_Pago', 'Fecha_Emision', 'Hora_Emision'
    ]
  }
};

function doGet() {
  verificarEstructuraDB(ESQUEMA_DB.CARTELERAS.nombre, ESQUEMA_DB.CARTELERAS.columnas);
  verificarEstructuraDB(ESQUEMA_DB.INTERACCIONES.nombre, ESQUEMA_DB.INTERACCIONES.columnas);
  verificarEstructuraDB(ESQUEMA_DB.USUARIOS.nombre, ESQUEMA_DB.USUARIOS.columnas);
  verificarEstructuraDB(ESQUEMA_DB.TICKETS.nombre, ESQUEMA_DB.TICKETS.columnas);

  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('TEATROMANÍA - Plataforma Teatral')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function verificarEstructuraDB(nombreHoja, encabezados) {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(nombreHoja);

  if (!hoja) {
    hoja = libro.insertSheet(nombreHoja);
    hoja.appendRow(encabezados);
    hoja.getRange(1, 1, 1, encabezados.length).setFontWeight("bold");
  }
  return hoja;
}

function normalizarEmail_(valor) {
  return (valor || "").toString().trim().toLowerCase();
}

function formatearCeldaFechaHora_(valor, patron) {
  if (valor instanceof Date) {
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), patron);
  }
  return (valor || "").toString();
}

function obtenerTasaCambio() {
  const cache = CacheService.getScriptCache();
  const tasaGuardada = cache.get("TASA_BCV_USD");
  if (tasaGuardada) return parseFloat(tasaGuardada);

  const url = "https://www.bcv.org.ve/";
  const opciones = {
    muteHttpExceptions: true,
    validateHttpsCertificates: false,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }
  };

  try {
    const respuesta = UrlFetchApp.fetch(url, opciones);
    const html = respuesta.getContentText();

    const posicionDolar = html.indexOf('id="dolar"');
    if (posicionDolar === -1) throw new Error("No se encontró el contenedor id='dolar' en el HTML del BCV.");

    const fragmentoDolar = html.substring(posicionDolar, posicionDolar + 600);
    const match = fragmentoDolar.match(/class=["']strong-tb["']>\s*([\d.,]+)\s*<\/strong>/i);

    if (match && match[1]) {
      const valorLimpio = match[1].trim().replace(/\./g, '').replace(',', '.');
      const tasaNum = parseFloat(valorLimpio);

      if (!isNaN(tasaNum) && tasaNum > 0) {
        cache.put("TASA_BCV_USD", tasaNum.toString(), 1800);
        return tasaNum;
      }
    }
    throw new Error("No se pudo extraer el valor dentro de class='strong-tb'");
  } catch (e) {
    Logger.log("Error al consultar BCV: " + e.toString());
    throw new Error("Error obteniendo tasa del BCV: " + e.message);
  }
}

function obtenerCarteleras() {
  const hojaCarteleras = verificarEstructuraDB(ESQUEMA_DB.CARTELERAS.nombre, ESQUEMA_DB.CARTELERAS.columnas);
  const hojaInteracciones = verificarEstructuraDB(ESQUEMA_DB.INTERACCIONES.nombre, ESQUEMA_DB.INTERACCIONES.columnas);

  const datosCarteleras = hojaCarteleras.getDataRange().getValues();
  const datosInteracciones = hojaInteracciones.getDataRange().getValues();

  const metricas = {};
  for (let i = 1; i < datosInteracciones.length; i++) {
    let idObra = datosInteracciones[i][0] ? datosInteracciones[i][0].toString() : "";
    if (!idObra) continue;

    let tipo = datosInteracciones[i][1];
    let valor = datosInteracciones[i][2];

    if (!metricas[idObra]) metricas[idObra] = { likes: 0, comentarios: [] };

    if (tipo === 'like') metricas[idObra].likes += 1;
    if (tipo === 'comentario') metricas[idObra].comentarios.push(valor.toString());
  }

  const carteleras = [];
  for (let i = 1; i < datosCarteleras.length; i++) {
    let idObra = datosCarteleras[i][0] ? datosCarteleras[i][0].toString() : "";
    if (!idObra) continue;

    let fechaRaw = datosCarteleras[i][3];
    let fechaStr = fechaRaw instanceof Date ? Utilities.formatDate(fechaRaw, Session.getScriptTimeZone(), "yyyy-MM-dd") : (fechaRaw || "").toString();

    let horaRaw = datosCarteleras[i][4];
    let horaStr = horaRaw instanceof Date ? Utilities.formatDate(horaRaw, Session.getScriptTimeZone(), "HH:mm") : (horaRaw || "").toString();

    carteleras.push({
      id: idObra,
      obra: (datosCarteleras[i][1] || "").toString(),
      funcion: (datosCarteleras[i][2] || "").toString(),
      fecha: fechaStr,
      hora: horaStr,
      imagen: (datosCarteleras[i][5] || "").toString(),
      precioUSD: datosCarteleras[i][6] ? parseFloat(datosCarteleras[i][6]) : 0,
      genero: (datosCarteleras[i][7] || "General").toString(),
      sala: (datosCarteleras[i][8] || "Sala Principal").toString(),
      sinopsis: (datosCarteleras[i][9] || "").toString(),
      reparto: (datosCarteleras[i][10] || "").toString(),
      likes: metricas[idObra] ? metricas[idObra].likes : 0,
      comentarios: metricas[idObra] ? metricas[idObra].comentarios : []
    });
  }

  carteleras.sort(function(a, b) {
    return (a.fecha + ' ' + a.hora).localeCompare(b.fecha + ' ' + b.hora);
  });

  return carteleras;
}

function guardarCartelera(datos) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Carteleras');
  let imagenURL = datos.fotoURLActual || "";

  if (datos.fotoBase64) {
    const folders = DriveApp.getFoldersByName('Imagenes_Carteleras');
    let folder = folders.hasNext() ? folders.next() : DriveApp.createFolder('Imagenes_Carteleras');

    const splitBase = datos.fotoBase64.split(',');
    const tipo = splitBase[0].split(';')[0].replace('data:', '');
    const byteCharacters = Utilities.base64Decode(splitBase[1]);
    const blob = Utilities.newBlob(byteCharacters, tipo, 'obra_' + datos.id);

    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    imagenURL = "https://lh3.googleusercontent.com/d/" + file.getId();
  }

  const dataRange = sheet.getDataRange().getValues();
  let filaEditada = -1;

  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][0].toString() === datos.id.toString()) {
      filaEditada = i + 1;
      break;
    }
  }

  const filaDatos = [
    datos.id, datos.obra, datos.funcion, datos.fecha, datos.hora,
    imagenURL, datos.precioUSD, datos.genero, datos.sala, datos.sinopsis, datos.reparto
  ];

  if (filaEditada > -1) {
    sheet.getRange(filaEditada, 1, 1, 11).setValues([filaDatos]);
  } else {
    sheet.appendRow(filaDatos);
  }
  return { success: true };
}

function eliminarCartelera(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Carteleras');
  const data = sheet.getDataRange().getValues();

  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0].toString() === id.toString()) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, mensaje: 'No se encontró el registro indicado.' };
}

function registrarUsuario(datos) {
  const hoja = verificarEstructuraDB(ESQUEMA_DB.USUARIOS.nombre, ESQUEMA_DB.USUARIOS.columnas);
  const data = hoja.getDataRange().getValues();
  const emailNormalizado = normalizarEmail_(datos.email);

  for (let i = 1; i < data.length; i++) {
    if (normalizarEmail_(data[i][2]) === emailNormalizado) {
      return { success: false, mensaje: 'El correo electrónico ya se encuentra registrado.' };
    }
  }

  const userId = 'USR-' + Math.random().toString(36).substr(2, 7).toUpperCase();
  const nombreUsuario = (datos.nombre || "").toString().trim();
  hoja.appendRow([userId, nombreUsuario, emailNormalizado, datos.password, new Date(), 'Consumidor', 'Gratuito']);

  return {
    success: true,
    usuario: { id: userId, nombre: nombreUsuario, email: emailNormalizado, rol: 'Consumidor', plan: 'Gratuito' }
  };
}

function autenticarUsuario(email, password) {
  const hoja = verificarEstructuraDB(ESQUEMA_DB.USUARIOS.nombre, ESQUEMA_DB.USUARIOS.columnas);
  const data = hoja.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][2].toString().toLowerCase() === email.toLowerCase() && data[i][3].toString() === password.toString()) {
      return {
        success: true,
        usuario: {
          id: data[i][0],
          nombre: data[i][1],
          email: data[i][2],
          rol: data[i][5] || 'Consumidor',
          plan: data[i][6] || 'Gratuito'
        }
      };
    }
  }
  return { success: false, mensaje: 'Credenciales inválidas.' };
}

function obtenerComprasUsuario(email) {
  const hoja = verificarEstructuraDB(ESQUEMA_DB.TICKETS.nombre, ESQUEMA_DB.TICKETS.columnas);
  const data = hoja.getDataRange().getValues();
  const compras = [];
  const emailNormalizado = normalizarEmail_(email);

  for (let i = 1; i < data.length; i++) {
    if (normalizarEmail_(data[i][3]) === emailNormalizado) {
      compras.push({
        ticketId: data[i][0],
        userId: data[i][1],
        nombreCliente: data[i][2],
        emailCliente: data[i][3],
        obra: data[i][4],
        funcion: data[i][5],
        sala: data[i][6],
        asiento: data[i][7],
        fechaFuncion: formatearCeldaFechaHora_(data[i][8], "yyyy-MM-dd"),
        horaFuncion: formatearCeldaFechaHora_(data[i][9], "HH:mm"),
        precioUSD: parseFloat(data[i][10]),
        precioVES: parseFloat(data[i][11]),
        tasaBCV: parseFloat(data[i][12]),
        refPago: data[i][13],
        fechaEmision: formatearCeldaFechaHora_(data[i][14], "yyyy-MM-dd"),
        horaEmision: formatearCeldaFechaHora_(data[i][15], "HH:mm:ss")
      });
    }
  }

  compras.sort(function(a, b) {
    return (b.fechaEmision + ' ' + b.horaEmision).localeCompare(a.fechaEmision + ' ' + a.horaEmision);
  });

  return compras;
}

function procesarPagoYGenerarTicket(datosReserva) {
  if (!datosReserva) {
    throw new Error("Los datos de la reserva no fueron recibidos correctamente.");
  }

  const hoja = verificarEstructuraDB(ESQUEMA_DB.TICKETS.nombre, ESQUEMA_DB.TICKETS.columnas);

  const fechaGeneracion = new Date();
  const ticketId = 'TCK-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  const fechaStr = Utilities.formatDate(fechaGeneracion, Session.getScriptTimeZone(), "yyyy-MM-dd");
  const horaStr = Utilities.formatDate(fechaGeneracion, Session.getScriptTimeZone(), "HH:mm:ss");

  const precioUSD = parseFloat(datosReserva.precioUSD) || 0;
  const precioVES = parseFloat(datosReserva.precioVES) || 0;
  const tasaBCV = parseFloat(datosReserva.tasaBCV) || 1;

  hoja.appendRow([
    ticketId,
    datosReserva.userId || 'INVITADO',
    datosReserva.nombreCliente || 'Cliente',
    normalizarEmail_(datosReserva.emailCliente) || 'N/A',
    datosReserva.obra || 'N/A',
    datosReserva.funcion || 'N/A',
    datosReserva.sala || 'N/A',
    datosReserva.asiento || 'N/A',
    datosReserva.fecha || '',
    datosReserva.hora || '',
    precioUSD,
    precioVES,
    tasaBCV,
    datosReserva.refPago || 'N/A',
    fechaStr,
    horaStr
  ]);

  return {
    ticketId: ticketId,
    nombreCliente: datosReserva.nombreCliente,
    emailCliente: normalizarEmail_(datosReserva.emailCliente),
    obra: datosReserva.obra,
    funcion: datosReserva.funcion,
    sala: datosReserva.sala,
    asiento: datosReserva.asiento,
    fechaFuncion: datosReserva.fecha,
    horaFuncion: datosReserva.hora,
    precioUSD: precioUSD,
    precioVES: precioVES,
    tasaBCV: tasaBCV,
    refPago: datosReserva.refPago,
    fechaEmision: fechaStr,
    horaEmision: horaStr
  };
}

// --- CREDENCIALES OAUTH2 (Reemplazar con tus variables de entorno o ScriptProperties) ---
const OAUTH_CLIENT_ID = 'TU_OAUTH_CLIENT_ID_AQUI';
const OAUTH_CLIENT_SECRET = 'TU_OAUTH_CLIENT_SECRET_AQUI';

function getOAuthService() {
  return OAuth2.createService('GoogleSSO')
    .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/auth')
    .setTokenUrl('https://accounts.google.com/o/oauth2/token')
    .setClientId(OAUTH_CLIENT_ID)
    .setClientSecret(OAUTH_CLIENT_SECRET)
    .setCallbackFunction('authCallback')
    .setPropertyStore(PropertiesService.getUserProperties())
    .setScope('openid email profile');
}

function getLoginUrl() {
  return getOAuthService().getAuthorizationUrl();
}

function authCallback(request) {
  const service = getOAuthService();
  const authorized = service.handleCallback(request);
  
  if (authorized) {
    const token = service.getIdToken();
    const payload = JSON.parse(Utilities.newBlob(Utilities.base64Decode(token.split('.')[1])).getDataAsString());
    
    const datosSSO = {
      nombre: payload.name,
      email: payload.email
    };
    
    const resultado = autenticarPorSSO(datosSSO);
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Autenticación Exitosa</title></head>
        <body style="background: #170a0d; color: #c9a24b; font-family: sans-serif; text-align: center; padding-top: 15%;">
          <h2>Autenticación exitosa</h2>
          <p style="color: #d8c9b3;">Redirigiendo a la plataforma...</p>
          <script>
            try {
              const sesion = ${JSON.stringify(resultado.usuario)};
              window.opener.postMessage({ type: 'SSO_LOGIN_SUCCESS', payload: sesion }, '*');
              setTimeout(function() { window.close(); }, 1000);
            } catch(e) {
              document.body.innerHTML += '<p>Cierra esta ventana y vuelve a la aplicación.</p>';
            }
          </script>
        </body>
      </html>
    `;
    return HtmlService.createHtmlOutput(html);
  } else {
    return HtmlService.createHtmlOutput('Acceso denegado por el proveedor de identidad.');
  }
}

function autenticarPorSSO(datos) {
  const hoja = verificarEstructuraDB(ESQUEMA_DB.USUARIOS.nombre, ESQUEMA_DB.USUARIOS.columnas);
  const data = hoja.getDataRange().getValues();
  const emailNorm = normalizarEmail_(datos.email);

  for (let i = 1; i < data.length; i++) {
    if (normalizarEmail_(data[i][2]) === emailNorm) {
      return {
        success: true,
        usuario: { 
          id: data[i][0], 
          nombre: data[i][1], 
          email: data[i][2], 
          rol: data[i][5] || 'Consumidor', 
          plan: data[i][6] || 'Gratuito' 
        }
      };
    }
  }

  const userId = 'USR-' + Math.random().toString(36).substr(2, 7).toUpperCase();
  const nombreUsuario = (datos.nombre || "Usuario SSO").toString().trim();
  const rolDefault = 'Consumidor';
  const planDefault = 'Gratuito';

  hoja.appendRow([userId, nombreUsuario, emailNorm, 'SSO-GOOGLE', new Date(), rolDefault, planDefault]);

  return {
    success: true,
    usuario: { 
      id: userId, 
      nombre: nombreUsuario, 
      email: emailNorm, 
      rol: rolDefault, 
      plan: planDefault 
    }
  };
}

function corregirUrlsImagenesExistentes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Carteleras');
  if (!sheet) return;

  const range = sheet.getDataRange();
  const values = range.getValues();

  for (let i = 1; i < values.length; i++) {
    let url = values[i][5].toString();
    if (url.includes('drive.google.com/thumbnail?id=')) {
      let fileId = url.split('id=')[1].split('&')[0];
      let nuevaUrl = 'https://lh3.googleusercontent.com/d/' + fileId;
      sheet.getRange(i + 1, 6).setValue(nuevaUrl);
    }
  }
}