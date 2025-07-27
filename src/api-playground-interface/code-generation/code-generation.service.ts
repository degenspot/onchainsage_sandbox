import { Injectable } from '@nestjs/common';
import { JavaScriptTemplate } from './templates/javascript.template';
import { PythonTemplate } from './templates/python.template';
import { CurlTemplate } from './templates/curl.template';
import { PhpTemplate } from './templates/php.template';

@Injectable()
export class CodeGenerationService {
  private templates = {
    javascript: new JavaScriptTemplate(),
    python: new PythonTemplate(),
    curl: new CurlTemplate(),
    php: new PhpTemplate(),
  };

  getSupportedLanguages() {
    return Object.keys(this.templates).map(lang => ({
      id: lang,
      name: this.templates[lang].getName(),
      description: this.templates[lang].getDescription(),
    }));
  }

  generateCode(language: string, requestData: any) {
    const template = this.templates[language];
    if (!template) {
      throw new Error(`Unsupported language: ${language}`);
    }

    return {
      language,
      code: template.generate(requestData),
      filename: template.getFilename(requestData),
    };
  }

  generateAllLanguages(requestData: any) {
    const results = {};
    
    Object.keys(this.templates).forEach(language => {
      try {
        results[language] = this.generateCode(language, requestData);
      } catch (error) {
        results[language] = { error: error.message };
      }
    });

    return results;
  }
}