import * as XLSX from 'xlsx';

export interface ParsedRow {
  rowNumber: number;
  student_name: string;
  student_id: string;
  degree: string;
  field_of_study: string;
  graduation_date: string;
  gpa?: number | null;
  honors?: string;
  expiry_date?: string | null;
  errors: string[];
}

export interface ParseResult {
  rows: ParsedRow[];
  totalRows: number;
  validRows: number;
  errorRows: number;
  columnMapping: Record<string, string>;
}

const EXPECTED_FIELDS = [
  'student_name',
  'student_id',
  'degree',
  'field_of_study',
  'graduation_date',
  'gpa',
  'honors',
  'expiry_date',
] as const;

const FIELD_ALIASES: Record<string, string> = {
  'student name': 'student_name',
  'name': 'student_name',
  'full name': 'student_name',
  'fullname': 'student_name',
  'student id': 'student_id',
  'id number': 'student_id',
  'student number': 'student_id',
  'id': 'student_id',
  'field of study': 'field_of_study',
  'field': 'field_of_study',
  'major': 'field_of_study',
  'graduation date': 'graduation_date',
  'grad date': 'graduation_date',
  'date': 'graduation_date',
  'expiry date': 'expiry_date',
  'expiration date': 'expiry_date',
  'expires': 'expiry_date',
  'valid until': 'expiry_date',
};

export function parseSpreadsheet(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

        if (jsonData.length === 0) {
          reject(new Error('The file contains no data rows'));
          return;
        }

        // Auto-detect column mapping
        const headers = Object.keys(jsonData[0]);
        const columnMapping: Record<string, string> = {};
        
        for (const header of headers) {
          const normalized = header.toLowerCase().trim();
          if (EXPECTED_FIELDS.includes(normalized as any)) {
            columnMapping[normalized] = header;
          } else if (FIELD_ALIASES[normalized]) {
            columnMapping[FIELD_ALIASES[normalized]] = header;
          }
        }

        // Parse rows
        const rows: ParsedRow[] = jsonData.map((row, index) => {
          const rowNumber = index + 2;
          const errors: string[] = [];
          
          const getField = (field: string): string => {
            const mappedHeader = columnMapping[field];
            return mappedHeader ? String(row[mappedHeader] ?? '').trim() : '';
          };

          const student_name = getField('student_name');
          const student_id = getField('student_id');
          const degree = getField('degree');
          const field_of_study = getField('field_of_study');
          const graduation_date = getField('graduation_date');
          const gpaStr = getField('gpa');
          const honors = getField('honors');
          const expiry_date_str = getField('expiry_date');

          // Validate required fields
          if (!student_name) errors.push('Missing student name');
          if (!student_id) errors.push('Missing student ID');
          if (!degree) errors.push('Missing degree');
          if (!field_of_study) errors.push('Missing field of study');
          if (!graduation_date) errors.push('Missing graduation date');

          // Validate types
          let gpa: number | null = null;
          if (gpaStr) {
            gpa = parseFloat(gpaStr);
            if (isNaN(gpa) || gpa < 0 || gpa > 4) {
              errors.push('GPA must be a number between 0 and 4');
              gpa = null;
            }
          }

          // Parse dates
          let parsedGradDate = '';
          try {
            const d = new Date(graduation_date);
            if (!isNaN(d.getTime())) {
              parsedGradDate = d.toISOString().split('T')[0];
            }
          } catch {
            // Keep as-is
          }

          let parsedExpiryDate: string | null = null;
          if (expiry_date_str) {
            try {
              const d = new Date(expiry_date_str);
              if (!isNaN(d.getTime())) {
                parsedExpiryDate = d.toISOString().split('T')[0];
              }
            } catch {
              errors.push('Invalid expiry date format');
            }
          }

          return {
            rowNumber,
            student_name,
            student_id,
            degree,
            field_of_study,
            graduation_date: parsedGradDate || graduation_date,
            gpa,
            honors: honors || undefined,
            expiry_date: parsedExpiryDate,
            errors,
          };
        });

        const validRows = rows.filter(r => r.errors.length === 0);
        const errorRows = rows.filter(r => r.errors.length > 0);

        resolve({
          rows,
          totalRows: rows.length,
          validRows: validRows.length,
          errorRows: errorRows.length,
          columnMapping,
        });
      } catch (err) {
        reject(new Error('Failed to parse file. Please ensure it is a valid .csv or .xlsx file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });
}
