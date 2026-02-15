import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Eye, User, Calendar, Building2, Stethoscope, ClipboardList, Printer, Award, UserCheck, Shield, Heart, TestTube, Syringe } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface HealthRecord {
  id: string;
  title: string;
  date: string;
  type: 'Medical Report' | 'Lab Report' | 'Certificate' | 'Assessment' | 'Prescription' | 'Checkup';
  student: string;
  studentRoll: string;
  doctor: string;
  department: string;
  summary: string;
  details: string[];
  recommendations?: string[];
  validUntil?: string;
  status?: 'approved' | 'pending' | 'completed';
}

// Comprehensive health records including medical reports, certificates, and checkups
const DUMMY_HEALTH_RECORDS: HealthRecord[] = [
  // Medical Reports
  {
    id: '1',
    title: 'Annual Health Checkup Report',
    date: '2026-01-10',
    type: 'Medical Report',
    student: 'Rahul Sharma',
    studentRoll: '21CS1001',
    doctor: 'Dr. Rajesh Kumar',
    department: 'General Medicine',
    summary: 'Comprehensive annual health evaluation completed. Overall health status: Good.',
    details: [
      'Blood Pressure: 120/80 mmHg (Normal)',
      'Heart Rate: 72 bpm (Normal)',
      'BMI: 22.5 (Healthy Range)',
      'Vision: 6/6 both eyes',
      'Hearing: Normal bilateral',
      'Respiratory Function: Normal',
      'No significant abnormalities detected'
    ],
    recommendations: [
      'Continue regular exercise routine',
      'Maintain balanced diet',
      'Follow-up checkup in 12 months'
    ],
    status: 'completed'
  },
  {
    id: '2',
    title: 'Complete Blood Count (CBC) Report',
    date: '2026-01-08',
    type: 'Lab Report',
    student: 'Priya Patel',
    studentRoll: '21EC2002',
    doctor: 'Dr. Priya Sharma',
    department: 'Pathology',
    summary: 'Complete Blood Count and Lipid Profile analysis - All values within normal limits.',
    details: [
      'Hemoglobin: 13.5 g/dL (Normal: 12-16 g/dL)',
      'WBC Count: 7,500 /μL (Normal: 4,500-11,000 /μL)',
      'Platelet Count: 250,000 /μL (Normal: 150,000-400,000 /μL)',
      'Total Cholesterol: 180 mg/dL (Desirable: <200 mg/dL)',
      'HDL Cholesterol: 55 mg/dL (Good: >40 mg/dL)',
      'LDL Cholesterol: 100 mg/dL (Optimal: <100 mg/dL)',
      'Triglycerides: 125 mg/dL (Normal: <150 mg/dL)',
      'Fasting Blood Sugar: 95 mg/dL (Normal: 70-100 mg/dL)',
      'RBC Count: 4.8 million/μL (Normal)',
      'Hematocrit: 42% (Normal: 36-48%)'
    ],
    recommendations: [
      'All parameters within normal limits',
      'Repeat lipid profile after 6 months',
      'Continue healthy lifestyle'
    ],
    status: 'completed'
  },
  {
    id: '3',
    title: 'Liver Function Test (LFT)',
    date: '2026-01-05',
    type: 'Lab Report',
    student: 'Amit Verma',
    studentRoll: '22ME3010',
    doctor: 'Dr. Suresh Menon',
    department: 'Biochemistry',
    summary: 'Liver Function Test performed - Normal hepatic function observed.',
    details: [
      'SGPT (ALT): 28 U/L (Normal: 7-56 U/L)',
      'SGOT (AST): 24 U/L (Normal: 10-40 U/L)',
      'Alkaline Phosphatase: 72 U/L (Normal: 44-147 U/L)',
      'Total Bilirubin: 0.8 mg/dL (Normal: 0.1-1.2 mg/dL)',
      'Direct Bilirubin: 0.2 mg/dL (Normal: 0-0.3 mg/dL)',
      'Total Protein: 7.2 g/dL (Normal: 6.0-8.3 g/dL)',
      'Albumin: 4.0 g/dL (Normal: 3.5-5.0 g/dL)'
    ],
    recommendations: [
      'Normal liver function',
      'Avoid excessive alcohol consumption',
      'Annual follow-up recommended'
    ],
    status: 'completed'
  },
  // Medical Certificates
  {
    id: '4',
    title: 'Medical Leave Certificate',
    date: '2026-01-12',
    type: 'Certificate',
    student: 'Sneha Reddy',
    studentRoll: '22CE4004',
    doctor: 'Dr. Rajesh Kumar',
    department: 'General Medicine',
    summary: 'Medical leave certificate issued for viral fever and respiratory infection.',
    details: [
      'Diagnosis: Acute Viral Fever with Upper Respiratory Tract Infection',
      'Leave Period: January 10, 2026 to January 12, 2026',
      'Duration: 3 days',
      'Treatment: Prescribed antipyretics and antibiotics',
      'Symptoms: High fever (102°F), sore throat, cough, body ache',
      'Certificate Number: MLC/2026/001234',
      'Issued for academic leave purposes'
    ],
    recommendations: [
      'Complete bed rest during leave period',
      'Take prescribed medications as directed',
      'Drink plenty of fluids',
      'Follow-up if symptoms persist'
    ],
    validUntil: '2026-01-12',
    status: 'approved'
  },
  {
    id: '5',
    title: 'Fitness Certificate - Sports',
    date: '2026-01-05',
    type: 'Certificate',
    student: 'Vikram Singh',
    studentRoll: '23EE5005',
    doctor: 'Dr. Anil Reddy',
    department: 'Sports Medicine',
    summary: 'Cleared for participation in inter-college athletics and swimming events.',
    details: [
      'Cardiovascular Assessment: Fit for strenuous activity',
      'Musculoskeletal Examination: No limitations',
      'ECG: Normal sinus rhythm',
      'Exercise Tolerance Test: Excellent performance',
      'Blood Pressure Response: Appropriate',
      'Sports Category: Athletics, Swimming, Basketball',
      'Certificate Number: FC/SPORTS/2026/0089',
      'No contraindications for competitive sports'
    ],
    recommendations: [
      'Proper warm-up and cool-down exercises mandatory',
      'Adequate hydration during events',
      'Report any chest pain, palpitations or unusual symptoms immediately',
      'Carry this certificate during all sports events'
    ],
    validUntil: '2026-06-30',
    status: 'approved'
  },
  {
    id: '6',
    title: 'Fitness Certificate - NSS Camp',
    date: '2025-12-28',
    type: 'Certificate',
    student: 'Kavitha Nair',
    studentRoll: '22CS2006',
    doctor: 'Dr. Priya Sharma',
    department: 'General Medicine',
    summary: 'Medically fit to participate in NSS special camp activities.',
    details: [
      'General Health: Good',
      'Physical Fitness: Satisfactory for camp activities',
      'No chronic illnesses or conditions that prevent participation',
      'Vaccination Status: Up to date',
      'Certificate Number: FC/NSS/2026/0156',
      'Valid for: NSS Special Camp 2026'
    ],
    recommendations: [
      'Carry personal medications if any',
      'Report any health concerns to camp medical team',
      'Stay hydrated and follow safety guidelines'
    ],
    validUntil: '2026-02-15',
    status: 'approved'
  },
  // Health Checkups
  {
    id: '7',
    title: 'Pre-Admission Health Screening',
    date: '2025-08-15',
    type: 'Checkup',
    student: 'Deepika Joshi',
    studentRoll: '25CS1008',
    doctor: 'Dr. Lakshmi Devi',
    department: 'Preventive Medicine',
    summary: 'Mandatory pre-admission health screening completed successfully.',
    details: [
      'Height: 165 cm',
      'Weight: 58 kg',
      'BMI: 21.3 (Normal)',
      'Blood Group: B Positive',
      'Vision Test: 6/6 both eyes',
      'Color Vision: Normal (Ishihara test passed)',
      'Hearing Test: Normal bilateral',
      'Dental Examination: No cavities, good oral hygiene',
      'Chest X-Ray: Normal',
      'Urine Analysis: No abnormalities'
    ],
    recommendations: [
      'Fit for hostel and campus activities',
      'Update vaccinations as per schedule',
      'Annual health checkup recommended'
    ],
    status: 'completed'
  },
  {
    id: '8',
    title: 'COVID-19 Vaccination Certificate',
    date: '2025-12-15',
    type: 'Certificate',
    student: 'Arun Kumar',
    studentRoll: '22ME3003',
    doctor: 'Dr. Suresh Menon',
    department: 'Immunization',
    summary: 'COVID-19 vaccination completed with booster dose.',
    details: [
      'Vaccine: Covishield (Oxford-AstraZeneca)',
      'Dose: Booster (3rd Dose)',
      'Batch Number: BATCH2025-XYZ456',
      'Administration Site: Left Deltoid',
      'Previous Doses: Dose 1 (Jan 2021), Dose 2 (Apr 2021)',
      'No immediate adverse reactions observed',
      'Certificate ID: COV-2025-789012',
      'Beneficiary Reference ID: COWIN-XXXXXXXX'
    ],
    recommendations: [
      'Observe for any delayed reactions',
      'Continue following COVID-19 safety protocols',
      'Carry vaccination certificate for travel'
    ],
    validUntil: '2026-12-15',
    status: 'approved'
  },
  {
    id: '9',
    title: 'Annual Flu Vaccination',
    date: '2026-01-02',
    type: 'Checkup',
    student: 'Meera Krishnan',
    studentRoll: '21EC1009',
    doctor: 'Dr. Kavitha Rao',
    department: 'Immunization',
    summary: 'Seasonal influenza vaccination administered successfully.',
    details: [
      'Vaccine: Quadrivalent Influenza Vaccine',
      'Batch Number: FLU2026-QIV-001',
      'Administration Site: Right Deltoid',
      'Observation Period: 15 minutes - No reactions',
      'Certificate Number: VAC/FLU/2026/0234'
    ],
    recommendations: [
      'Mild soreness at injection site is normal',
      'Contact health center if fever develops',
      'Annual vaccination recommended'
    ],
    status: 'completed'
  },
  {
    id: '10',
    title: 'Mental Wellness Assessment',
    date: '2025-11-28',
    type: 'Assessment',
    student: 'Rajesh Menon',
    studentRoll: '23ME1007',
    doctor: 'Dr. Lakshmi Devi',
    department: 'Counseling & Mental Health',
    summary: 'Routine mental wellness evaluation as part of first-year student support program.',
    details: [
      'PHQ-9 Score: 4 (Minimal depression)',
      'GAD-7 Score: 3 (Minimal anxiety)',
      'Academic Adjustment: Good',
      'Social Integration: Satisfactory',
      'Sleep Pattern: Regular, 7-8 hours',
      'Stress Coping: Adequate mechanisms in place',
      'Support System: Strong family and peer support'
    ],
    recommendations: [
      'Continue participation in extracurricular activities',
      'Practice stress management techniques like meditation',
      'Open door policy - counselor available anytime',
      'Follow-up assessment in next semester'
    ],
    status: 'completed'
  },
  {
    id: '11',
    title: 'Dental Checkup & Cleaning',
    date: '2025-11-20',
    type: 'Checkup',
    student: 'Ananya Sharma',
    studentRoll: '22CS2011',
    doctor: 'Dr. Ramesh Iyer',
    department: 'Dental Care',
    summary: 'Routine dental examination and professional cleaning completed.',
    details: [
      'Oral Hygiene Status: Good',
      'Teeth Present: 32 (Full set)',
      'Cavities: None detected',
      'Gum Health: Healthy, no bleeding on probing',
      'Scaling and Polishing: Completed',
      'Fluoride Treatment: Applied',
      'X-Ray (if taken): No hidden caries detected'
    ],
    recommendations: [
      'Brush twice daily with fluoride toothpaste',
      'Floss once daily',
      'Limit sugary foods and beverages',
      'Next dental checkup in 6 months'
    ],
    status: 'completed'
  },
  {
    id: '12',
    title: 'Eye Examination Report',
    date: '2025-11-15',
    type: 'Medical Report',
    student: 'Sanjay Gupta',
    studentRoll: '21ME1012',
    doctor: 'Dr. Sunita Rao',
    department: 'Ophthalmology',
    summary: 'Comprehensive eye examination for screen time assessment.',
    details: [
      'Visual Acuity (Right): 6/9 (Mild myopia)',
      'Visual Acuity (Left): 6/6 (Normal)',
      'Color Vision: Normal (Ishihara test)',
      'Intraocular Pressure: Right 14 mmHg, Left 15 mmHg (Normal)',
      'Fundus Examination: Normal optic disc and retina',
      'Prescription: -0.75D (Right eye only)',
      'No signs of digital eye strain syndrome'
    ],
    recommendations: [
      'Use prescribed corrective lenses for reading and screen work',
      '20-20-20 rule: Every 20 min, look 20 feet away for 20 seconds',
      'Reduce screen brightness in low light',
      'Annual eye examination recommended'
    ],
    status: 'completed'
  },
  // Prescriptions
  {
    id: '13',
    title: 'Prescription - General Checkup',
    date: '2026-01-15',
    type: 'Prescription',
    student: 'Karthik Reddy',
    studentRoll: '22EE3013',
    doctor: 'Dr. Rajesh Kumar',
    department: 'General Medicine',
    summary: 'Prescription for common cold and mild fever treatment.',
    details: [
      'Paracetamol 500mg - 1 tablet thrice daily for 3 days',
      'Cetirizine 10mg - 1 tablet once daily at night for 5 days',
      'Vitamin C 500mg - 1 tablet daily for 7 days',
      'Steam Inhalation - Twice daily',
      'Warm water gargles - 3-4 times daily',
      'Plenty of fluids and rest advised'
    ],
    recommendations: [
      'Complete the course of medications',
      'Return if symptoms worsen or fever persists beyond 3 days',
      'Avoid cold beverages'
    ],
    status: 'completed'
  },
  {
    id: '14',
    title: 'Allergy Testing Results',
    date: '2025-10-25',
    type: 'Lab Report',
    student: 'Neha Pillai',
    studentRoll: '23EC3014',
    doctor: 'Dr. Priya Sharma',
    department: 'Allergy & Immunology',
    summary: 'Skin prick test and IgE panel for suspected environmental allergies.',
    details: [
      'Dust Mites: Positive (Moderate reaction)',
      'Pollen (Grass): Positive (Mild reaction)',
      'Pollen (Tree): Negative',
      'Peanuts: Negative',
      'Shellfish: Negative',
      'Milk Products: Negative',
      'Pet Dander (Cat/Dog): Positive (Mild)',
      'Total IgE: 180 IU/mL (Mildly elevated, Normal: <100 IU/mL)'
    ],
    recommendations: [
      'Avoid exposure to dust; use air purifier in room',
      'Use allergen-proof bedding covers',
      'Take antihistamines during high pollen season',
      'Carry emergency contact information',
      'No food restrictions required',
      'Consider allergen immunotherapy for long-term relief'
    ],
    status: 'completed'
  },
  {
    id: '15',
    title: 'Thyroid Function Test',
    date: '2026-01-18',
    type: 'Lab Report',
    student: 'Pooja Mehta',
    studentRoll: '21CS1015',
    doctor: 'Dr. Suresh Menon',
    department: 'Endocrinology',
    summary: 'Thyroid function assessment - Euthyroid state confirmed.',
    details: [
      'TSH: 2.5 mIU/L (Normal: 0.4-4.0 mIU/L)',
      'Free T4: 1.2 ng/dL (Normal: 0.8-1.8 ng/dL)',
      'Free T3: 3.0 pg/mL (Normal: 2.3-4.2 pg/mL)',
      'Anti-TPO Antibodies: Negative',
      'Clinical Assessment: No thyroid enlargement, no nodules'
    ],
    recommendations: [
      'Normal thyroid function',
      'No medication required',
      'Repeat test annually or if symptoms develop',
      'Maintain adequate iodine intake'
    ],
    status: 'completed'
  }
];

const getRecordTypeBadgeColor = (type: string) => {
  switch (type) {
    case 'Medical Report': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'Lab Report': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    case 'Certificate': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'Assessment': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    case 'Prescription': return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300';
    case 'Checkup': return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getRecordIcon = (type: string) => {
  switch (type) {
    case 'Medical Report': return Stethoscope;
    case 'Lab Report': return TestTube;
    case 'Certificate': return Award;
    case 'Assessment': return ClipboardList;
    case 'Prescription': return FileText;
    case 'Checkup': return UserCheck;
    default: return FileText;
  }
};

const HealthRecordsSection = () => {
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const handleView = (record: HealthRecord) => {
    setSelectedRecord(record);
    setIsViewOpen(true);
  };

  const handleDownload = (record: HealthRecord) => {
    toast.success(`Downloading ${record.title}...`, {
      description: `Document for ${record.student} (${record.studentRoll})`
    });
    
    const content = `
${record.title.toUpperCase()}
${'='.repeat(50)}

Student: ${record.student}
Roll Number: ${record.studentRoll}
Date: ${format(new Date(record.date), 'MMMM d, yyyy')}
Doctor: ${record.doctor}
Department: ${record.department}

SUMMARY
-------
${record.summary}

DETAILS
-------
${record.details.map(d => `• ${d}`).join('\n')}

${record.recommendations ? `RECOMMENDATIONS
---------------
${record.recommendations.map(r => `• ${r}`).join('\n')}` : ''}

${record.validUntil ? `Valid Until: ${format(new Date(record.validUntil), 'MMMM d, yyyy')}` : ''}

---
NIT Warangal Health Centre
This is a computer-generated document.
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${record.title.replace(/\s+/g, '_')}_${record.studentRoll}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = async () => {
    if (!selectedRecord) return;
    const { printDocument, getNitwHeaderHtml } = await import('@/lib/print/printDocument');
    const docId = `HR-${selectedRecord.id.padStart(4, '0')}`;

    const bodyHtml = `
      ${getNitwHeaderHtml(selectedRecord.type.toUpperCase())}
      <div class="doc-title">
        <h3>${selectedRecord.title.toUpperCase()}</h3>
        <p class="cert-no">Date: ${format(new Date(selectedRecord.date), 'MMMM d, yyyy')}</p>
      </div>
      <div class="info-grid" style="margin-bottom:16px;">
        <div class="info-item"><span class="info-label">Patient:</span><span>${selectedRecord.student}</span></div>
        <div class="info-item"><span class="info-label">Roll Number:</span><span>${selectedRecord.studentRoll}</span></div>
        <div class="info-item"><span class="info-label">Doctor:</span><span>${selectedRecord.doctor}</span></div>
        <div class="info-item"><span class="info-label">Department:</span><span>${selectedRecord.department}</span></div>
      </div>
      <div class="section">
        <div class="section-title">Summary</div>
        <p style="font-size:13px;">${selectedRecord.summary}</p>
      </div>
      <div class="section">
        <div class="section-title">Details</div>
        <ul style="font-size:12px;padding-left:20px;">
          ${selectedRecord.details.map(d => `<li style="margin-bottom:4px;">${d}</li>`).join('')}
        </ul>
      </div>
      ${selectedRecord.recommendations ? `
      <div class="section">
        <div class="section-title">Recommendations</div>
        <ul style="font-size:12px;padding-left:20px;">
          ${selectedRecord.recommendations.map(r => `<li style="margin-bottom:4px;">${r}</li>`).join('')}
        </ul>
      </div>` : ''}
      ${selectedRecord.validUntil ? `<p style="font-size:12px;margin-top:12px;"><strong>Valid Until:</strong> ${format(new Date(selectedRecord.validUntil), 'MMMM d, yyyy')}</p>` : ''}
      <div class="signature-section">
        <div class="signature-box">
          <div class="emblem-area">
            <img src="/nitw-emblem.png" alt="NIT Warangal" />
            <p class="emblem-label">Official Emblem</p>
          </div>
        </div>
        <div class="signature-box" style="text-align:right;">
          <div class="online-signature">${selectedRecord.doctor}</div>
          <div class="signature-line">
            <strong>${selectedRecord.doctor}</strong><br/>
            ${selectedRecord.department}<br/>
            <span class="doctor-type">Health Centre, NIT Warangal</span>
          </div>
        </div>
      </div>
    `;

    await printDocument({
      title: `${selectedRecord.title} - ${selectedRecord.student}`,
      bodyHtml,
      documentId: docId,
      documentType: selectedRecord.type,
    });

    toast.success('Print dialog opened');
  };

  const getFilteredRecords = () => {
    if (activeTab === 'all') return DUMMY_HEALTH_RECORDS;
    return DUMMY_HEALTH_RECORDS.filter(record => {
      switch (activeTab) {
        case 'reports': return record.type === 'Medical Report';
        case 'labs': return record.type === 'Lab Report';
        case 'certificates': return record.type === 'Certificate';
        case 'checkups': return record.type === 'Checkup' || record.type === 'Assessment';
        case 'prescriptions': return record.type === 'Prescription';
        default: return true;
      }
    });
  };

  const filteredRecords = getFilteredRecords();

  const getTabCount = (tabType: string) => {
    if (tabType === 'all') return DUMMY_HEALTH_RECORDS.length;
    return DUMMY_HEALTH_RECORDS.filter(record => {
      switch (tabType) {
        case 'reports': return record.type === 'Medical Report';
        case 'labs': return record.type === 'Lab Report';
        case 'certificates': return record.type === 'Certificate';
        case 'checkups': return record.type === 'Checkup' || record.type === 'Assessment';
        case 'prescriptions': return record.type === 'Prescription';
        default: return true;
      }
    }).length;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Health Records & Documents
          </CardTitle>
          <CardDescription>Medical reports, certificates, lab results, checkups, and prescriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-3 lg:grid-cols-6 mb-4">
              <TabsTrigger value="all" className="text-xs sm:text-sm">
                All ({getTabCount('all')})
              </TabsTrigger>
              <TabsTrigger value="reports" className="text-xs sm:text-sm">
                <Stethoscope className="h-3 w-3 mr-1 hidden sm:inline" />
                Reports ({getTabCount('reports')})
              </TabsTrigger>
              <TabsTrigger value="labs" className="text-xs sm:text-sm">
                <TestTube className="h-3 w-3 mr-1 hidden sm:inline" />
                Labs ({getTabCount('labs')})
              </TabsTrigger>
              <TabsTrigger value="certificates" className="text-xs sm:text-sm">
                <Award className="h-3 w-3 mr-1 hidden sm:inline" />
                Certificates ({getTabCount('certificates')})
              </TabsTrigger>
              <TabsTrigger value="checkups" className="text-xs sm:text-sm">
                <UserCheck className="h-3 w-3 mr-1 hidden sm:inline" />
                Checkups ({getTabCount('checkups')})
              </TabsTrigger>
              <TabsTrigger value="prescriptions" className="text-xs sm:text-sm">
                <FileText className="h-3 w-3 mr-1 hidden sm:inline" />
                Prescriptions ({getTabCount('prescriptions')})
              </TabsTrigger>
            </TabsList>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No records found in this category</p>
                </div>
              ) : (
                filteredRecords.map((record) => {
                  const IconComponent = getRecordIcon(record.type);
                  return (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{record.title}</p>
                          <p className="text-sm text-muted-foreground">{record.student} ({record.studentRoll})</p>
                          <p className="text-xs text-muted-foreground sm:hidden">
                            {format(new Date(record.date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                        <div className="hidden md:flex flex-col items-end gap-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRecordTypeBadgeColor(record.type)}`}>
                            {record.type}
                          </span>
                          {record.status && (
                            <Badge variant={record.status === 'approved' ? 'default' : 'secondary'} className="text-xs">
                              {record.status}
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground hidden sm:inline">
                          {format(new Date(record.date), 'MMM d, yyyy')}
                        </span>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleView(record)}
                            title="View Document"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownload(record)}
                            title="Download Document"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* View Document Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedRecord && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <DialogTitle className="text-xl">{selectedRecord.title}</DialogTitle>
                    <DialogDescription>
                      {format(new Date(selectedRecord.date), 'MMMM d, yyyy')}
                    </DialogDescription>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRecordTypeBadgeColor(selectedRecord.type)}`}>
                      {selectedRecord.type}
                    </span>
                    {selectedRecord.status && (
                      <Badge variant={selectedRecord.status === 'approved' ? 'default' : 'secondary'}>
                        {selectedRecord.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4 print:text-black">
                {/* Patient & Doctor Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Patient</span>
                    </div>
                    <p className="font-medium">{selectedRecord.student}</p>
                    <p className="text-sm text-muted-foreground">{selectedRecord.studentRoll}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Stethoscope className="h-4 w-4" />
                      <span>Attending Doctor</span>
                    </div>
                    <p className="font-medium">{selectedRecord.doctor}</p>
                    <p className="text-sm text-muted-foreground">{selectedRecord.department}</p>
                  </div>
                </div>

                {/* Summary */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Summary</h4>
                  <p className="text-sm">{selectedRecord.summary}</p>
                </div>

                {/* Details */}
                <div>
                  <h4 className="font-semibold mb-3">Details</h4>
                  <ul className="space-y-2">
                    {selectedRecord.details.map((detail, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                {selectedRecord.recommendations && (
                  <div className="p-4 border-l-4 border-primary bg-primary/5 rounded-r-lg">
                    <h4 className="font-semibold mb-2">Recommendations</h4>
                    <ul className="space-y-1">
                      {selectedRecord.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <span className="text-primary">→</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Validity */}
                {selectedRecord.validUntil && (
                  <div className="flex items-center gap-2 p-3 bg-accent/50 rounded-lg">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      Valid Until: {format(new Date(selectedRecord.validUntil), 'MMMM d, yyyy')}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t print:hidden">
                  <Button onClick={() => handleDownload(selectedRecord)} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-muted-foreground pt-4 border-t">
                  <p>NIT Warangal Health Centre</p>
                  <p>This is a computer-generated document</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HealthRecordsSection;
