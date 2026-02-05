import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'ui';

    // Read the OpenAPI spec
    const specPath = join(process.cwd(), 'openapi.yaml');
    const spec = readFileSync(specPath, 'utf-8');

    // If requesting raw spec
    if (format === 'yaml') {
      return new NextResponse(spec, {
        headers: {
          'Content-Type': 'application/x-yaml',
          'Content-Disposition': 'inline; filename="openapi.yaml"',
        },
      });
    }

    if (format === 'json') {
      // For JSON, we'll need to parse YAML and convert to JSON
      // For now, just point users to use YAML
      return NextResponse.json(
        {
          message: 'JSON format not yet implemented. Use ?format=yaml to get the OpenAPI spec.',
        },
        { status: 501 }
      );
    }

    // Serve Swagger UI
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sokudo API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css">
  <style>
    body {
      margin: 0;
      padding: 0;
    }
    .topbar {
      display: none;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: '/api/docs?format=yaml',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        docExpansion: 'list',
        filter: true,
        persistAuthorization: true,
      });
      window.ui = ui;
    };
  </script>
</body>
</html>
`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error serving API docs:', error);
    return NextResponse.json(
      { error: 'Failed to load API documentation' },
      { status: 500 }
    );
  }
}
