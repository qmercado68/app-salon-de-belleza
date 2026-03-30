export interface AppointmentEmailData {
  salonName: string;
  salonAddress: string;
  salonPhone: string;
  clientName: string;
  clientEmail: string;
  serviceName: string;
  serviceDuration: number;
  appointmentDate: string; // formatted string in Spanish
  hasAllergies: boolean;
}

export function buildEmailHtml(data: AppointmentEmailData): string {
  const allergyNote = data.hasAllergies
    ? `
    <tr>
      <td style="padding: 12px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="background-color: #fff3f0; border-left: 4px solid #e8a0a0; border-radius: 4px;">
          <tr>
            <td style="padding: 12px 16px; font-family: Georgia, serif; font-size: 14px; color: #7a4040;">
              Tu informacion de salud ha sido recibida para tu seguridad.
            </td>
          </tr>
        </table>
      </td>
    </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirmacion de Cita</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fdf6f6; font-family: Georgia, serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background-color: #fdf6f6; padding: 40px 16px;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="600" cellpadding="0" cellspacing="0" border="0"
          style="max-width: 600px; background-color: #ffffff; border-radius: 12px;
                 box-shadow: 0 2px 16px rgba(200,140,140,0.10); overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #e8a0a0 0%, #c97b7b 100%);
                        padding: 36px 24px; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 11px; letter-spacing: 3px;
                         color: #fff3f0; text-transform: uppercase;">
                Confirmacion de Cita
              </p>
              <h1 style="margin: 0; font-size: 28px; font-weight: normal; color: #ffffff;
                          letter-spacing: 1px;">
                ${escapeHtml(data.salonName)}
              </h1>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 28px 24px 8px 24px;">
              <p style="margin: 0; font-size: 16px; color: #5a3a3a; line-height: 1.6;">
                Hola <strong>${escapeHtml(data.clientName)}</strong>,
              </p>
              <p style="margin: 12px 0 0 0; font-size: 15px; color: #7a5a5a; line-height: 1.6;">
                Tu cita ha sido confirmada. Aqui tienes todos los detalles:
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 16px 24px 8px 24px;">
              <hr style="border: none; border-top: 1px solid #f0dada; margin: 0;" />
            </td>
          </tr>

          <!-- Appointment Details -->
          <tr>
            <td style="padding: 8px 24px 16px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- Service -->
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #faeaea;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size: 12px; letter-spacing: 1px; color: #c97b7b;
                                    text-transform: uppercase; font-weight: bold; width: 40%;">
                          Servicio
                        </td>
                        <td style="font-size: 15px; color: #3a2a2a; text-align: right;">
                          ${escapeHtml(data.serviceName)}
                          <span style="font-size: 13px; color: #9a7a7a;">
                            (${data.serviceDuration} min)
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Date -->
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #faeaea;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size: 12px; letter-spacing: 1px; color: #c97b7b;
                                    text-transform: uppercase; font-weight: bold; width: 40%;">
                          Fecha y hora
                        </td>
                        <td style="font-size: 15px; color: #3a2a2a; text-align: right;">
                          ${escapeHtml(data.appointmentDate)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Address -->
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #faeaea;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size: 12px; letter-spacing: 1px; color: #c97b7b;
                                    text-transform: uppercase; font-weight: bold; width: 40%;">
                          Direccion
                        </td>
                        <td style="font-size: 15px; color: #3a2a2a; text-align: right;">
                          ${escapeHtml(data.salonAddress)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Phone -->
                <tr>
                  <td style="padding: 10px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size: 12px; letter-spacing: 1px; color: #c97b7b;
                                    text-transform: uppercase; font-weight: bold; width: 40%;">
                          Telefono
                        </td>
                        <td style="font-size: 15px; color: #3a2a2a; text-align: right;">
                          ${escapeHtml(data.salonPhone)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Allergy note (conditional) -->
          ${allergyNote}

          <!-- Payment reminder -->
          <tr>
            <td style="padding: 8px 24px 24px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background-color: #fdf0f0; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px 20px; font-size: 14px; color: #7a4a4a;
                              line-height: 1.5; text-align: center;">
                    Recuerda que el pago se realiza en efectivo al momento de asistir.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9efef; padding: 20px 24px; text-align: center;
                        border-top: 1px solid #f0dada;">
              <p style="margin: 0 0 4px 0; font-size: 13px; color: #9a7a7a;">
                ${escapeHtml(data.salonName)}
              </p>
              <p style="margin: 0; font-size: 12px; color: #b9a0a0;">
                ${escapeHtml(data.salonAddress)}
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>

</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
