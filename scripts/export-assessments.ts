import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { firebaseConfig } from '../src/firebase/config';
import * as fs from 'fs';
import { questions } from '../src/lib/assessment-data';

async function exportToCSV() {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const assessmentsCollection = collection(db, 'new-assessments');
    const q = query(assessmentsCollection, orderBy('createdAt', 'desc'));

    console.log('Fetching assessments...');
    const querySnapshot = await getDocs(q);
    const assessments: any[] = [];
    querySnapshot.forEach((doc) => {
      assessments.push({ id: doc.id, ...doc.data() });
    });

    if (assessments.length === 0) {
      console.log('No assessments found in "new-assessments" table.');
      process.exit(0);
    }

    console.log(`Found ${assessments.length} assessments. Organizing CSV...`);

    // Define base headers
    const baseHeaders = [
      'ID',
      'תאריך יצירה',
      'שם המוסד',
      'סמל מוסד',
      'שם מנהל/ת',
      'סה"כ אמצעי קצה',
      'ציון כולל',
      'רמת בשלות',
    ];

    // Add question headers
    const questionHeaders: string[] = [];
    questions.forEach((q) => {
      questionHeaders.push(`שאלה ${q.id}: ${q.title}`);
    });

    const headers = [...baseHeaders, ...questionHeaders];

    const escapeCsv = (str: any) => {
      if (str === undefined || str === null) return '""';
      const stringified = String(str).replace(/"/g, '""');
      return `"${stringified}"`;
    };

    const csvRows = [headers.join(',')];

    for (const a of assessments) {
      const row = [
        escapeCsv(a.id),
        escapeCsv(a.createdAt),
        escapeCsv(a.institutionName),
        escapeCsv(a.institutionSymbol),
        escapeCsv(a.principalName),
        escapeCsv(a.totalDevices),
        escapeCsv(a.totalScore),
        escapeCsv(a.level),
      ];

      // Add answers
      questions.forEach((_, index) => {
        const answer = a.answers ? a.answers[index] : '';
        row.push(escapeCsv(answer));
      });

      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');
    // Using BOM (\uFEFF) to ensure Excel opens it correctly with Hebrew (UTF-8)
    fs.writeFileSync('new-assessments-export.csv', '\uFEFF' + csvContent, 'utf8');
    console.log('Exported to new-assessments-export.csv successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error exporting assessments:', error);
    process.exit(1);
  }
}

exportToCSV();
