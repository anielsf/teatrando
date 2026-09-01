/**
 * Componente para renderizar el boleto teatral digital con corte perforado y QR
 */
import { formatUSD, formatVES } from '../utils/helpers.js';

export function createTicketHTML(ticket) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(ticket.ticketId)}`;

  return `
    <div class="boleto-wrap">
      <div class="boleto">
        <div class="boleto-info">
          <div class="boleto-cuerpo">
            <div class="boleto-eyebrow">Código de entrada</div>
            <div class="boleto-codigo">${ticket.ticketId}</div>

            <div class="boleto-eyebrow">Espectáculo</div>
            <div class="boleto-obra">${ticket.obra}</div>
            <div class="boleto-funcion">${ticket.funcion}</div>

            <div class="boleto-grid">
              <div class="boleto-campo"><div class="boleto-eyebrow">Fecha</div><div class="valor">${ticket.fechaFuncion}</div></div>
              <div class="boleto-campo"><div class="boleto-eyebrow">Hora</div><div class="valor">${ticket.horaFuncion}</div></div>
              <div class="boleto-campo"><div class="boleto-eyebrow">Sala</div><div class="valor">${ticket.sala}</div></div>
              <div class="boleto-campo"><div class="boleto-eyebrow">Butaca</div><div class="valor">N.º ${ticket.asiento}</div></div>
              <div class="boleto-campo" style="grid-column: 1 / -1;"><div class="boleto-eyebrow">Cliente</div><div class="valor">${ticket.nombreCliente}</div><div class="valor mono" style="font-weight:400;">${ticket.emailCliente}</div></div>
            </div>

            <div class="boleto-monto">
              <div><div class="boleto-eyebrow">Monto pagado</div><div class="usd">${formatUSD(ticket.precioUSD)}</div></div>
              <div class="text-end"><div class="boleto-eyebrow">Ref. pago</div><div class="ves">${ticket.refPago}</div><div class="ves">Bs. ${ticket.precioVES.toFixed(2)} · Tasa ${ticket.tasaBCV}</div></div>
            </div>

            <div class="boleto-qr-row">
              <span class="boleto-scan">Escanea</span>
              <img src="${qrUrl}" alt="Código QR del boleto" width="130" height="130">
            </div>
          </div>
        </div>

        <div class="boleto-costura"></div>

        <div class="boleto-marca">
          <div>
            <div class="mascara">🎭</div>
            <div class="nombre">TEATRANDO</div>
            <div class="slogan">Vive la escena</div>
          </div>
          <div class="emision">Emitido el ${ticket.fechaEmision || ''}<br>a las ${ticket.horaEmision || ''}</div>
        </div>
      </div>
    </div>
  `;
}

export function renderTicketModal(ticket, onNavigate) {
  const container = document.getElementById('contenido-ticket');
  if (container) {
    container.innerHTML = createTicketHTML(ticket);
  }
  if (onNavigate) {
    onNavigate('vista-checkout-confirmacion');
  }
}
