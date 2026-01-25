import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Download, Eye, User, Calendar, Building2, Stethoscope, ClipboardList, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface HealthRecord {
  id: string;
  title: string;
  date: string;
  type: 'Medical Report' | 'Lab Report' | 'Certificate' | 'Assessment';
  student: string;
  studentRoll: string;
  doctor: string;
  department: string;
  summary: string;
  details: string[];
  recommendations?: string[];
  validUntil?: string;
}

// Expanded dummy health records with realistic content
const DUMMY_HEALTH_RECORDS: HealthRecord[] = [
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
    ]
  },
  {
    id: '2',
    title: 'Blood Test Results',
    date: '2026-01-08',
    type: 'Lab Report',
    student: 'Priya Patel',
    studentRoll: '21EC2002',
    doctor: 'Dr. Priya Sharma',
    department: 'Pathology',
    summary: 'Complete Blood Count (CBC) and Lipid Profile analysis.',
    details: [
      'Hemoglobin: 13.5 g/dL (Normal)',
      'WBC Count: 7,500 /μL (Normal)',
      'Platelet Count: 250,000 /μL (Normal)',
      'Total Cholesterol: 180 mg/dL (Desirable)',
      'HDL Cholesterol: 55 mg/dL (Good)',
      'LDL Cholesterol: 100 mg/dL (Optimal)',
      'Triglycerides: 125 mg/dL (Normal)',
      'Fasting Blood Sugar: 95 mg/dL (Normal)'
    ],
    recommendations: [
      'All parameters within normal limits',
      'Repeat lipid profile after 6 months'
    ]
  },
  {
    id: '3',
    title: 'Vaccination Certificate - COVID-19',
    date: '2025-12-15',
    type: 'Certificate',
    student: 'Arun Kumar',
    studentRoll: '22ME3003',
    doctor: 'Dr. Suresh Menon',
    department: 'Immunization',
    summary: 'COVID-19 vaccination completed (Booster dose administered).',
    details: [
      'Vaccine: Covishield (Oxford-AstraZeneca)',
      'Dose: Booster (3rd Dose)',
      'Batch Number: BATCH2025-XYZ456',
      'Administration Site: Left Deltoid',
      'No immediate adverse reactions observed',
      'Certificate ID: COV-2025-789012'
    ],
    validUntil: '2026-12-15'
  },
  {
    id: '4',
    title: 'Fitness Certificate for Sports',
    date: '2025-12-10',
    type: 'Certificate',
    student: 'Sneha Reddy',
    studentRoll: '22CE4004',
    doctor: 'Dr. Anil Reddy',
    department: 'Sports Medicine',
    summary: 'Cleared for participation in inter-college athletics and swimming events.',
    details: [
      'Cardiovascular Assessment: Fit for strenuous activity',
      'Musculoskeletal Examination: No limitations',
      'ECG: Normal sinus rhythm',
      'Exercise Tolerance: Excellent',
      'Sports Category: Athletics, Swimming',
      'No contraindications for competitive sports'
    ],
    recommendations: [
      'Proper warm-up before activities',
      'Adequate hydration during events',
      'Report any chest pain or unusual symptoms immediately'
    ],
    validUntil: '2026-06-10'
  },
  {
    id: '5',
    title: 'Mental Wellness Assessment',
    date: '2025-11-28',
    type: 'Assessment',
    student: 'Vikram Singh',
    studentRoll: '23EE5005',
    doctor: 'Dr. Lakshmi Devi',
    department: 'Counseling & Mental Health',
    summary: 'Routine mental wellness evaluation as part of first-year student support program.',
    details: [
      'PHQ-9 Score: 4 (Minimal depression)',
      'GAD-7 Score: 3 (Minimal anxiety)',
      'Academic Adjustment: Good',
      'Social Integration: Satisfactory',
      'Sleep Pattern: Regular, 7-8 hours',
      'Stress Coping: Adequate mechanisms in place'
    ],
    recommendations: [
      'Continue participation in extracurricular activities',
      'Practice stress management techniques',
      'Open door policy - counselor available anytime',
      'Follow-up assessment in next semester'
    ]
  },
  {
    id: '6',
    title: 'Dental Checkup Report',
    date: '2025-11-20',
    type: 'Medical Report',
    student: 'Kavitha Nair',
    studentRoll: '22CS2006',
    doctor: 'Dr. Ramesh Iyer',
    department: 'Dental Care',
    summary: 'Routine dental examination and cleaning completed.',
    details: [
      'Oral Hygiene Status: Good',
      'Teeth Present: 32 (Full set)',
      'Cavities: None detected',
      'Gum Health: Healthy, no bleeding',
      'Scaling and Polishing: Completed',
      'X-Ray: No hidden issues'
    ],
    recommendations: [
      'Brush twice daily with fluoride toothpaste',
      'Floss once daily',
      'Next dental checkup in 6 months'
    ]
  },
  {
    id: '7',
    title: 'Eye Examination Report',
    date: '2025-11-15',
    type: 'Lab Report',
    student: 'Rajesh Menon',
    studentRoll: '21ME1007',
    doctor: 'Dr. Sunita Rao',
    department: 'Ophthalmology',
    summary: 'Comprehensive eye examination for screen time assessment.',
    details: [
      'Visual Acuity (Right): 6/9 (Mild myopia)',
      'Visual Acuity (Left): 6/6 (Normal)',
      'Color Vision: Normal (Ishihara test)',
      'Intraocular Pressure: 14 mmHg (Normal)',
      'Fundus Examination: Normal',
      'Prescription Updated: -0.75D (Right eye only)'
    ],
    recommendations: [
      'Use prescribed corrective lenses for reading',
      '20-20-20 rule for screen usage',
      'Annual eye examination recommended'
    ]
  },
  {
    id: '8',
    title: 'Allergy Testing Results',
    date: '2025-10-25',
    type: 'Lab Report',
    student: 'Deepika Joshi',
    studentRoll: '23EC3008',
    doctor: 'Dr. Priya Sharma',
    department: 'Allergy & Immunology',
    summary: 'Skin prick test and IgE panel for suspected food allergies.',
    details: [
      'Dust Mites: Positive (Moderate)',
      'Pollen (Grass): Positive (Mild)',
      'Peanuts: Negative',
      'Shellfish: Negative',
      'Milk Products: Negative',
      'Total IgE: 180 IU/mL (Mildly elevated)'
    ],
    recommendations: [
      'Avoid exposure to dust; use air purifier',
      'Take antihistamines during pollen season',
      'Carry emergency contact information',
      'No food restrictions required'
    ]
  }
];

const getRecordTypeBadgeColor = (type: string) => {
  switch (type) {
    case 'Medical Report': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'Lab Report': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    case 'Certificate': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'Assessment': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getRecordIcon = (type: string) => {
  switch (type) {
    case 'Medical Report': return Stethoscope;
    case 'Lab Report': return ClipboardList;
    case 'Certificate': return FileText;
    case 'Assessment': return ClipboardList;
    default: return FileText;
  }
};

const HealthRecordsSection = () => {
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const handleView = (record: HealthRecord) => {
    setSelectedRecord(record);
    setIsViewOpen(true);
  };

  const handleDownload = (record: HealthRecord) => {
    // Simulate download - in production, this would generate/fetch actual PDF
    toast.success(`Downloading ${record.title}...`, {
      description: `Document for ${record.student} (${record.studentRoll})`
    });
    
    // Create a simulated download
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

  const handlePrint = () => {
    if (!selectedRecord) return;
    window.print();
    toast.success('Print dialog opened');
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Health Records & Documents
          </CardTitle>
          <CardDescription>Recent medical reports, certificates, and assessments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DUMMY_HEALTH_RECORDS.map((record) => {
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
                    <div>
                      <p className="font-medium">{record.title}</p>
                      <p className="text-sm text-muted-foreground">{record.student} ({record.studentRoll})</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRecordTypeBadgeColor(record.type)}`}>
                      {record.type}
                    </span>
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
            })}
          </div>
        </CardContent>
      </Card>

      {/* View Document Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedRecord && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-xl">{selectedRecord.title}</DialogTitle>
                    <DialogDescription>
                      {format(new Date(selectedRecord.date), 'MMMM d, yyyy')}
                    </DialogDescription>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRecordTypeBadgeColor(selectedRecord.type)}`}>
                    {selectedRecord.type}
                  </span>
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
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-800 dark:text-green-300">
                    <Calendar className="h-4 w-4" />
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
