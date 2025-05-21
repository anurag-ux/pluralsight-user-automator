
import Papa from 'papaparse';

export interface CsvUser {
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

export const parseCSV = (file: File): Promise<CsvUser[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse<any>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const users = results.data.map((row: any) => {
          // Normalize field names (handling different possible column names)
          return {
            email: row.email || row.Email || row['Email Address'] || row.email_address || '',
            firstName: row.firstName || row['First Name'] || row.first_name || '',
            lastName: row.lastName || row['Last Name'] || row.last_name || '',
            role: row.role || row.Role || '',
          };
        }).filter((user: CsvUser) => user.email);
        
        resolve(users);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

export const generateCsvDownload = (data: any[], filename: string): void => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
