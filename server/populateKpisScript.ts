// Script to populate comprehensive KPI datasets
import { db } from "./db";
import { dashboardKpis } from "@shared/schema";
import { 
  generateComprehensiveAdminKpis,
  generateComprehensiveRachelKpis,
  generateComprehensiveJohnKpis,
  generateComprehensiveBrokerKpis
} from "./comprehensiveKpiDatasets";

export async function populateComprehensiveKpisScript() {
  try {
    console.log('🚀 Starting comprehensive KPI population script...');
    
    // Generate sample data for testing
    const sampleEmails: any[] = [];
    const sampleActivities: any[] = Array.from({length: 10}, (_, i) => ({
      id: i + 1,
      activity: `Sample activity ${i + 1}`,
      persona: ['admin', 'rachel', 'john', 'broker'][i % 4],
      status: ['completed', 'pending', 'open'][i % 3]
    }));
    const sampleSubmissions: any[] = [];
    const sampleCommercialSubmissions: any[] = Array.from({length: 5}, (_, i) => ({
      id: i + 1,
      submissionId: `CP-${Date.now()}-${i}`,
      status: ['processing', 'completed', 'in_progress'][i % 3]
    }));

    // Clear existing KPIs
    console.log('🧹 Clearing existing dashboard KPIs...');
    await db.delete(dashboardKpis);

    // Generate comprehensive KPI datasets for all personas
    console.log('📊 Generating comprehensive KPI datasets...');
    const adminKpis = generateComprehensiveAdminKpis(sampleEmails, sampleActivities, sampleSubmissions);
    const rachelKpis = generateComprehensiveRachelKpis(sampleEmails, sampleActivities, sampleSubmissions, sampleCommercialSubmissions);
    const johnKpis = generateComprehensiveJohnKpis(sampleActivities);
    const brokerKpis = generateComprehensiveBrokerKpis(sampleEmails, sampleActivities, sampleSubmissions);

    // Combine all KPIs
    const allKpis = [...adminKpis, ...rachelKpis, ...johnKpis, ...brokerKpis];
    
    console.log(`📈 Inserting ${allKpis.length} comprehensive KPIs into database...`);
    console.log(`   - Admin: ${adminKpis.length} KPIs`);
    console.log(`   - Rachel: ${rachelKpis.length} KPIs`);
    console.log(`   - John: ${johnKpis.length} KPIs`);
    console.log(`   - Broker: ${brokerKpis.length} KPIs`);

    // Insert all KPIs into database
    for (const kpi of allKpis) {
      await db.insert(dashboardKpis).values({
        kpiName: kpi.kpiName,
        currentValue: kpi.currentValue,
        previousValue: kpi.previousValue,
        target: kpi.target,
        unit: kpi.unit,
        category: kpi.category,
        trend: kpi.trend,
        context: kpi.context,
        displayContext: kpi.displayContext,
        priority: kpi.priority,
        viewCategory: kpi.viewCategory,
        personaRelevance: kpi.personaRelevance
      });
    }

    console.log('✅ Comprehensive KPI database population completed successfully!');
    
    // Verify the data
    const totalKpis = await db.select().from(dashboardKpis);
    console.log(`🔍 Verification: ${totalKpis.length} KPIs inserted`);
    
    // Show breakdown by persona and context
    const mainDashboardKpis = totalKpis.filter(kpi => kpi.context === 'main_dashboard');
    const insightsTabKpis = totalKpis.filter(kpi => kpi.context === 'insights_tab');
    
    console.log(`   - Main Dashboard: ${mainDashboardKpis.length} KPIs (Priority 1-4)`);
    console.log(`   - Insights Tab: ${insightsTabKpis.length} KPIs (Priority 5+)`);
    
    return {
      success: true,
      totalKpis: allKpis.length,
      breakdown: {
        admin: adminKpis.length,
        rachel: rachelKpis.length,
        john: johnKpis.length,
        broker: brokerKpis.length
      },
      contexts: {
        mainDashboard: mainDashboardKpis.length,
        insightsTab: insightsTabKpis.length
      }
    };
  } catch (error) {
    console.error('❌ Error populating comprehensive KPIs:', error);
    throw error;
  }
}

// Execute the script
if (require.main === module) {
  populateComprehensiveKpisScript()
    .then((result) => {
      console.log('🎉 Script completed successfully:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}