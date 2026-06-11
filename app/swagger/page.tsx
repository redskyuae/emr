const swaggerUiVersion = '5.32.6';

export default function SwaggerPage() {
  return (
    <main className="min-h-screen bg-white">
      <link
        rel="stylesheet"
        href={`https://unpkg.com/swagger-ui-dist@${swaggerUiVersion}/swagger-ui.css`}
      />
      <div id="swagger-ui" />
      <script
        src={`https://unpkg.com/swagger-ui-dist@${swaggerUiVersion}/swagger-ui-bundle.js`}
        defer
      />
      <script
        src={`https://unpkg.com/swagger-ui-dist@${swaggerUiVersion}/swagger-ui-standalone-preset.js`}
        defer
      />
      <script
        defer
        dangerouslySetInnerHTML={{
          __html: `
            window.addEventListener('load', function () {
              window.SwaggerUIBundle({
                url: '/api/openapi',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                  window.SwaggerUIBundle.presets.apis,
                  window.SwaggerUIStandalonePreset
                ],
                layout: 'StandaloneLayout'
              });
            });
          `,
        }}
      />
    </main>
  );
}
