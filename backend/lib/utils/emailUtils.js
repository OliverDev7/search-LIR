function escapeHtml(text = "") {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function buildHTMLEmail(payload = {}) {
    const safe = (v) =>
        (v === undefined || v === null || v === "") ? "<em>No proporcionado</em>" : escapeHtml(String(v));

    const renderArray = (a) =>
        Array.isArray(a) && a.length ? a.map(x => `<li>${escapeHtml(String(x))}</li>`).join("") : "<li><em>No aplica</em></li>";

    return `
    <div style="font-family: Arial, Helvetica, sans-serif; color:#333;">
      <h2 style="color:#0b59a6; margin-bottom:6px;">Formulario de Firmas</h2>
      <p style="color:#555; margin-top:0;">Detalle recibido del usuario:</p>
      <table style="width:100%; border-collapse:collapse;">
        <tbody>
          <tr><td style="padding:8px; background:#f7f7f7; font-weight:600; width:200px;">Nombre</td><td style="padding:8px;">${safe(payload.name)}</td></tr>
          <tr><td style="padding:8px; background:#fafafa; font-weight:600;">Correo</td><td style="padding:8px;">${safe(payload.email)}</td></tr>
          <tr><td style="padding:8px; background:#f7f7f7; font-weight:600;">País</td><td style="padding:8px;">${safe(payload.country)}</td></tr>
          <tr><td style="padding:8px; background:#fafafa; font-weight:600;">Área</td><td style="padding:8px;">${safe(payload.area)}</td></tr>
          <tr><td style="padding:8px; background:#f7f7f7; font-weight:600;">Tipo de firma</td><td style="padding:8px;">${Array.isArray(payload.firmType) ? escapeHtml(payload.firmType.join(', ')) : safe(payload.firmType)}</td></tr>
          
          <!-- Nuevos campos -->
          <tr><td style="padding:8px; background:#fafafa; font-weight:600;">Años en el mercado</td><td style="padding:8px;">${safe(payload.marketYears)}</td></tr>
          <tr><td style="padding:8px; background:#f7f7f7; font-weight:600;">Años experiencia (abogado a cargo)</td><td style="padding:8px;">${safe(payload.leadExperience)}</td></tr>
          <!-- fin nuevos campos -->
          
          <tr><td style="padding:8px; background:#fafafa; font-weight:600;">Otras características</td><td style="padding:8px;"><ul style="margin:0; padding-left:18px;">${renderArray(payload.otherCharacteristics)}</ul></td></tr>
          <tr><td style="padding:8px; background:#f7f7f7; font-weight:600;">Urgencia</td><td style="padding:8px;">${safe(payload.urgency)}</td></tr>
          <tr><td style="padding:8px; background:#fafafa; font-weight:600;">Preferencia cobro</td><td style="padding:8px;">${safe(payload.billingPreference)}</td></tr>
          <tr><td style="padding:8px; background:#f7f7f7; font-weight:600;">Encargo</td><td style="padding:8px;">${safe(payload.assignment)}</td></tr>
          <tr><td style="padding:8px; background:#fafafa; font-weight:600;">Comentarios</td><td style="padding:8px;">${safe(payload.comments)}</td></tr>
          
          <!-- Tabla de firmas guardadas (más profesional) -->
          <tr>
            <td style="padding:8px; background:#f7f7f7; font-weight:600; vertical-align:top;">
              Firmas recomendadas
            </td>
            <td style="padding:8px;">
              ${Array.isArray(payload.savedFirms) && payload.savedFirms.length
            ? `
                    <table style="border-collapse:collapse; width:100%;">
                      <thead>
                        <tr>
                          <th style="border:1px solid #ccc; padding:6px; background:#fafafa; text-align:left;">Nombre</th>
                          <th style="border:1px solid #ccc; padding:6px; background:#fafafa; text-align:left;">País</th>
                          <th style="border:1px solid #ccc; padding:6px; background:#fafafa; text-align:left;">Áreas</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${payload.savedFirms
                .map(
                    (f) => `
                            <tr>
                              <td style="border:1px solid #ccc; padding:6px;">${escapeHtml(f.firm)}</td>
                              <td style="border:1px solid #ccc; padding:6px;">${escapeHtml(f.country)}</td>
                              <td style="border:1px solid #ccc; padding:6px;">
                                ${escapeHtml(
                        f.area.length > 80
                            ? f.area.slice(0, 80) + "..."
                            : f.area
                    )}
                              </td>
                            </tr>
                          `
                )
                .join("")
            }
                      </tbody>
                    </table>
                  `
            : "<em>No hay firmas recomendadas</em>"
        }
            </td>
          </tr>

        </tbody>
      </table>
      <p style="color:#777;font-size:12px;margin-top:10px;">Fecha (ISO): ${new Date().toISOString()}</p>
    </div>
  `;
}

export { escapeHtml, buildHTMLEmail };