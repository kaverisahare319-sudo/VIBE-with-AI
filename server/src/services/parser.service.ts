const pdf = require('pdf-parse');
import * as mammoth from 'mammoth';

export class ParserService {
  static async parseDocument(buffer: Buffer, mimetype: string): Promise<string> {
    try {
      if (mimetype === 'application/pdf') {
        const data = await pdf(buffer);
        return data.text;
      } else if (
        mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimetype === 'application/msword'
      ) {
        const data = await mammoth.extractRawText({ buffer });
        return data.value;
      }
      return '';
    } catch (error) {
      console.error('Error parsing document:', error);
      return '';
    }
  }
}
