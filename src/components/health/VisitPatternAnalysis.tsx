import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Activity, TrendingUp, User, Calendar, ArrowRight, CheckCircle } from 'lucide-react';

interface Visit {
  id: string;
  visit_date: string;
  reason_category: string;
  reason_subcategory: string | null;
  medical_officers: {
    name: string;
    designation: string;
  } | null;
}

interface VisitPatternAnalysisProps {
  visits: Visit[];
  studentName: string;
}

const COLORS = {
  medical_illness: '#3b82f6',
  injury: '#ef4444',
  mental_wellness: '#8b5cf6',
  vaccination: '#10b981',
  routine_checkup: '#f59e0b',
  other: '#6b7280'
};

const CATEGORY_LABELS: Record<string, string> = {
  medical_illness: 'Medical Illness',
  injury: 'Injury',
  mental_wellness: 'Mental Wellness',
  vaccination: 'Vaccination',
  routine_checkup: 'Routine Check-up',
  other: 'Other'
};

const VisitPatternAnalysis = ({ visits, studentName }: VisitPatternAnalysisProps) => {
  const analysis = useMemo(() => {
    if (visits.length === 0) return null;

    // Group by category
    const categoryCount: Record<string, number> = {};
    const subcategoryCount: Record<string, Record<string, number>> = {};
    const doctorCount: Record<string, { name: string; count: number }> = {};
    const monthlyVisits: Record<string, number> = {};

    visits.forEach((visit) => {
      // Category count
      categoryCount[visit.reason_category] = (categoryCount[visit.reason_category] || 0) + 1;

      // Subcategory count
      if (visit.reason_subcategory) {
        if (!subcategoryCount[visit.reason_category]) {
          subcategoryCount[visit.reason_category] = {};
        }
        subcategoryCount[visit.reason_category][visit.reason_subcategory] = 
          (subcategoryCount[visit.reason_category][visit.reason_subcategory] || 0) + 1;
      }

      // Doctor count
      if (visit.medical_officers) {
        const doctorName = visit.medical_officers.name;
        if (!doctorCount[doctorName]) {
          doctorCount[doctorName] = { name: doctorName, count: 0 };
        }
        doctorCount[doctorName].count++;
      }

      // Monthly visits
      const month = new Date(visit.visit_date).toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyVisits[month] = (monthlyVisits[month] || 0) + 1;
    });

    // Find most frequent category
    const sortedCategories = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a);
    
    const primaryCategory = sortedCategories[0];
    const secondaryCategories = sortedCategories.slice(1).filter(([_, count]) => count >= primaryCategory[1] * 0.25);

    // Find most frequent subcategory for primary category
    const primarySubcategories = subcategoryCount[primaryCategory[0]] || {};
    const topSubcategory = Object.entries(primarySubcategories)
      .sort(([, a], [, b]) => b - a)[0];

    // Find most frequent doctor for primary category
    const topDoctor = Object.values(doctorCount)
      .sort((a, b) => b.count - a.count)[0];

    // Calculate average visits per semester (assuming 6 months)
    const dateRange = visits.length > 0 
      ? (new Date(visits[0].visit_date).getTime() - new Date(visits[visits.length - 1].visit_date).getTime()) / (1000 * 60 * 60 * 24 * 30)
      : 1;
    const avgPerSemester = Math.round((visits.length / Math.max(dateRange, 1)) * 6);

    // Prepare chart data
    const pieData = Object.entries(categoryCount).map(([category, count]) => ({
      name: CATEGORY_LABELS[category] || category,
      value: count,
      color: COLORS[category as keyof typeof COLORS] || COLORS.other
    }));

    const barData = Object.entries(monthlyVisits)
      .slice(-6)
      .map(([month, count]) => ({ month, visits: count }));

    return {
      totalVisits: visits.length,
      primaryCategory: {
        name: CATEGORY_LABELS[primaryCategory[0]] || primaryCategory[0],
        count: primaryCategory[1],
        percentage: Math.round((primaryCategory[1] / visits.length) * 100)
      },
      secondaryCategories: secondaryCategories.map(([cat, count]) => ({
        name: CATEGORY_LABELS[cat] || cat,
        count
      })),
      topSubcategory: topSubcategory ? { name: topSubcategory[0], count: topSubcategory[1] } : null,
      topDoctor,
      avgPerSemester,
      pieData,
      barData,
      categoryCount
    };
  }, [visits]);

  if (!analysis || visits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Visit Pattern Analysis
          </CardTitle>
          <CardDescription>No visit data available for analysis</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Flow Chart Visualization */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Primary Health Centre Flow
          </CardTitle>
          <CardDescription>Visualizing the most common visit pattern</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            {/* Flow Start */}
            <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full">
              <User className="h-4 w-4" />
              <span className="font-medium">{studentName}</span>
            </div>
            
            <div className="h-8 w-0.5 bg-primary/30" />

            {/* Total Visits */}
            <div className="px-4 py-2 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Visit History Analyzed</p>
              <p className="font-bold text-lg">{analysis.totalVisits} Total Visits</p>
            </div>

            <div className="h-8 w-0.5 bg-primary/30" />

            {/* Primary Category */}
            <div className="px-6 py-4 bg-card border-2 border-primary rounded-xl text-center max-w-md">
              <Badge className="mb-2" style={{ backgroundColor: COLORS[Object.keys(analysis.categoryCount).find(k => CATEGORY_LABELS[k] === analysis.primaryCategory.name) as keyof typeof COLORS] }}>
                {analysis.primaryCategory.percentage}% of visits
              </Badge>
              <p className="font-bold text-lg">Most Frequent: {analysis.primaryCategory.name}</p>
              <p className="text-sm text-muted-foreground">{analysis.primaryCategory.count} visits</p>
            </div>

            <div className="h-8 w-0.5 bg-primary/30" />

            {/* Top Subcategory */}
            {analysis.topSubcategory && (
              <>
                <div className="px-4 py-3 bg-secondary rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Typical Presentation</p>
                  <p className="font-medium">{analysis.topSubcategory.name}</p>
                </div>
                <div className="h-8 w-0.5 bg-primary/30" />
              </>
            )}

            {/* Top Doctor */}
            {analysis.topDoctor && (
              <>
                <div className="px-4 py-3 bg-accent rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Commonly Seen By</p>
                  <p className="font-medium">{analysis.topDoctor.name}</p>
                  <p className="text-xs text-muted-foreground">{analysis.topDoctor.count} consultations</p>
                </div>
                <div className="h-8 w-0.5 bg-primary/30" />
              </>
            )}

            {/* Conclusion */}
            <div className="px-6 py-4 bg-card border-2 border-green-500 rounded-xl text-center max-w-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-bold">Analysis Summary</span>
              </div>
              <div className="space-y-1 text-sm">
                <p>• Average {analysis.avgPerSemester} visits per semester</p>
                <p>• Primary reason: {analysis.primaryCategory.name}</p>
                {analysis.topSubcategory && (
                  <p>• Typical issue: {analysis.topSubcategory.name}</p>
                )}
              </div>
            </div>

            {/* Secondary Paths */}
            {analysis.secondaryCategories.length > 0 && (
              <>
                <div className="h-4 w-0.5 bg-muted-foreground/30" />
                <div className="px-4 py-2 bg-muted/50 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Also visits for:</p>
                  <div className="flex flex-wrap gap-2 justify-center mt-1">
                    {analysis.secondaryCategories.map((cat) => (
                      <Badge key={cat.name} variant="outline">
                        {cat.name} ({cat.count})
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Visit Reasons Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analysis.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {analysis.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Visit Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.barData}>
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="visits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VisitPatternAnalysis;
