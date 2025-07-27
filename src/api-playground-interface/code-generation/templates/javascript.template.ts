export class JavaScriptTemplate {
  getName(): string {
    return 'JavaScript (fetch)';
  }

  getDescription(): string {
    return 'Modern JavaScript using fetch API';
  }

  getFilename(requestData: any): string {
    return 'api-request.js';
  }

  generate(requestData: any): string {
    const { url, method, headers, body, queryParams, pathParams } = requestData;
    let finalUrl = url;

    // Replace path parameters
    if (pathParams) {
      Object.entries(pathParams).forEach(([key, value]) => {
        finalUrl = finalUrl.replace(`{${key}}`, encodeURIComponent(String(value)));
      });
    }

    // Add query parameters
    if (queryParams && Object.keys(queryParams).length > 0) {
      const queryString = new URLSearchParams(queryParams).toString();
      finalUrl += (finalUrl.includes('?') ? '&' : '?') + queryString;
    }

    let code = `// OnChain Sage Labs API Request
const apiUrl = '${finalUrl}';

const options = {
  method: '${method.toUpperCase()}',
  headers: {
`;

    // Add headers
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        code += `    '${key}': '${value}',\n`;
      });
    }

    code += `  },
`;

    // Add body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && body) {
      if (typeof body === 'object') {
        code += `  body: JSON.stringify(${JSON.stringify(body, null, 2)}),\n`;
      } else {
        code += `  body: '${body}',\n`;
      }
    }

    code += `};

async function makeRequest() {
  try {
    const response = await fetch(apiUrl, options);
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    
    const data = await response.json();
    console.log('Success:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Execute the request
makeRequest();`;

    return code;
  }
}
```

### code-generation/templates/python.template.ts
```typescript
export class PythonTemplate {
  getName(): string {
    return 'Python (requests)';
  }

  getDescription(): string {
    return 'Python using requests library';
  }

  getFilename(requestData: any): string {
    return 'api_request.py';
  }

  generate(requestData: any): string {
    const { url, method, headers, body, queryParams, pathParams } = requestData;
    let finalUrl = url;

    // Replace path parameters
    if (pathParams) {
      Object.entries(pathParams).forEach(([key, value]) => {
        finalUrl = finalUrl.replace(`{${key}}`, String(value));
      });
    }

    let code = `#!/usr/bin/env python3
"""
OnChain Sage Labs API Request
"""

import requests
import json

# API endpoint
url = '${finalUrl}'

`;

    // Add headers
    if (headers && Object.keys(headers).length > 0) {
      code += `# Headers
headers = {
`;
      Object.entries(headers).forEach(([key, value]) => {
        code += `    '${key}': '${value}',\n`;
      });
      code += `}

`;
    }

    // Add query parameters
    if (queryParams && Object.keys(queryParams).length > 0) {
      code += `# Query parameters
params = {
`;
      Object.entries(queryParams).forEach(([key, value]) => {
        code += `    '${key}': '${value}',\n`;
      });
      code += `}

`;
    }

    // Add body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && body) {
      if (typeof body === 'object') {
        code += `# Request body
data = ${JSON.stringify(body, null, 4).replace(/"/g, "'")}

`;
      } else {
        code += `# Request body
data = '${body}'

`;
      }
    }

    // Build the request call
    code += `try:
    response = requests.${method.toLowerCase()}(
        url,`;

    if (headers) {
      code += `
        headers=headers,`;
    }

    if (queryParams) {
      code += `
        params=params,`;
    }

    if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && body) {
      if (typeof body === 'object') {
        code += `
        json=data,`;
      } else {
        code += `
        data=data,`;
      }
    }

    code += `
        timeout=30
    )
    
    # Check if request was successful
    response.raise_for_status()
    
    # Parse JSON response
    result = response.json()
    print('Success:')
    print(json.dumps(result, indent=2))
    
except requests.exceptions.RequestException as e:
    print(f'Error: {e}')
except json.JSONDecodeError as e:
    print(f'JSON decode error: {e}')
    print(f'Response text: {response.text}')`;

    return code;
  }
}
```

### code-generation/templates/curl.template.ts
```typescript
export class CurlTemplate {
  getName(): string {
    return 'cURL';
  }

  getDescription(): string {
    return 'Command line cURL request';
  }

  getFilename(requestData: any): string {
    return 'api-request.sh';
  }

  generate(requestData: any): string {
    const { url, method, headers, body, queryParams, pathParams } = requestData;
    let finalUrl = url;

    // Replace path parameters
    if (pathParams) {
      Object.entries(pathParams).forEach(([key, value]) => {
        finalUrl = finalUrl.replace(`{${key}}`, encodeURIComponent(String(value)));
      });
    }

    // Add query parameters
    if (queryParams && Object.keys(queryParams).length > 0) {
      const queryString = new URLSearchParams(queryParams).toString();
      finalUrl += (finalUrl.includes('?') ? '&' : '?') + queryString;
    }

    let code = `#!/bin/bash
# OnChain Sage Labs API Request

curl -X ${method.toUpperCase()} \\
  '${finalUrl}' \\`;

    // Add headers
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        code += `
  -H '${key}: ${value}' \\`;
      });
    }

    // Add body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && body) {
      code += `
  -H 'Content-Type: application/json' \\`;
      
      if (typeof body === 'object') {
        code += `
  -d '${JSON.stringify(body)}' \\`;
      } else {
        code += `
  -d '${body}' \\`;
      }
    }

    code += `
  --compressed \\
  --show-error \\
  --fail \\
  --location \\
  --max-time 30`;

    return code;
  }
}
```

### code-generation/templates/php.template.ts
```typescript
export class PhpTemplate {
  getName(): string {
    return 'PHP (cURL)';
  }

  getDescription(): string {
    return 'PHP using cURL extension';
  }

  getFilename(requestData: any): string {
    return 'api_request.php';
  }

  generate(requestData: any): string {
    const { url, method, headers, body, queryParams, pathParams } = requestData;
    let finalUrl = url;

    // Replace path parameters
    if (pathParams) {
      Object.entries(pathParams).forEach(([key, value]) => {
        finalUrl = finalUrl.replace(`{${key}}`, String(value));
      });
    }

    let code = `<?php
/**
 * OnChain Sage Labs API Request
 */

// API endpoint
$url = '${finalUrl}';

`;

    // Add query parameters
    if (queryParams && Object.keys(queryParams).length > 0) {
      code += `// Query parameters
$queryParams = array(
`;
      Object.entries(queryParams).forEach(([key, value]) => {
        code += `    '${key}' => '${value}',\n`;
      });
      code += `);

$url .= '?' . http_build_query($queryParams);

`;
    }

    // Initialize cURL
    code += `// Initialize cURL
$ch = curl_init();

// Set cURL options
curl_setopt_array($ch, array(
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_CUSTOMREQUEST => '${method.toUpperCase()}',`;

    // Add headers
    if (headers && Object.keys(headers).length > 0) {
      code += `
    CURLOPT_HTTPHEADER => array(`;
      Object.entries(headers).forEach(([key, value]) => {
        code += `
        '${key}: ${value}',`;
      });
      code += `
    ),`;
    }

    // Add body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && body) {
      if (typeof body === 'object') {
        code += `
    CURLOPT_POSTFIELDS => json_encode(${JSON.stringify(body, null, 4).replace(/"/g, "'")}),`;
      } else {
        code += `
    CURLOPT_POSTFIELDS => '${body}',`;
      }
    }

    code += `
));

// Execute request
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);

// Close cURL
curl_close($ch);

// Handle response
if ($error) {
    echo "cURL Error: " . $error . "\\n";
} else {
    echo "HTTP Status Code: " . $httpCode . "\\n";
    
    if ($httpCode >= 200 && $httpCode < 300) {
        echo "Success:\\n";
        $data = json_decode($response, true);
        echo json_encode($data, JSON_PRETTY_PRINT) . "\\n";
    } else {
        echo "Error Response:\\n";
        echo $response . "\\n";
    }
}

?>`;

    return code;
  }
}
```

## 6. Analytics Module

### analytics/entities/api-usage.entity.ts
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('api_usage')
@Index(['apiKey', 'endpoint', 'timestamp'])
export class ApiUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  apiKey: string;

  @Column()
  endpoint: string;

  @Column()
  method: string;

  @Column()
  statusCode: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  responseTime: number;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  timestamp: Date;
}