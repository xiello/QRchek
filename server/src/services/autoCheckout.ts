import cron from 'node-cron';
import { findEmployeesWithOpenArrivals, createAutoDeparture } from '../models/attendance';

/**
 * Auto-checkout service that runs daily at 8:00 PM
 * Finds all employees with open arrivals and creates departure records
 */
export function startAutoCheckoutJob() {
  // Run daily at 8:00 PM (20:00) - cron format: minute hour day month dayOfWeek
  // '0 20 * * *' means: at minute 0 of hour 20 (8pm) every day
  const job = cron.schedule('0 20 * * *', async () => {
    console.log('🕐 [Auto-Checkout] Running scheduled auto-checkout at 8:00 PM...');
    
    try {
      await runAutoCheckout();
    } catch (error) {
      console.error('❌ [Auto-Checkout] Error during auto-checkout:', error);
    }
  }, {
    timezone: 'Europe/Bratislava' // Slovak timezone
  });
  
  console.log('✅ [Auto-Checkout] Scheduled job initialized (runs daily at 8:00 PM Europe/Bratislava)');
  
  return job;
}

/**
 * Run the auto-checkout process
 */
export async function runAutoCheckout(): Promise<{ processed: number; employees: string[] }> {
  // Get current date and set time to 8:00 PM
  const checkoutTime = new Date();
  checkoutTime.setHours(20, 0, 0, 0); // 8:00 PM
  
  // Find all employees with open arrivals
  const employeesWithOpenArrivals = await findEmployeesWithOpenArrivals();
  
  console.log(`📋 [Auto-Checkout] Found ${employeesWithOpenArrivals.length} employees with open arrivals`);
  
  const processedEmployees: string[] = [];
  
  // Create auto-generated departure for each
  for (const employee of employeesWithOpenArrivals) {
    try {
      await createAutoDeparture(employee.id, employee.name, checkoutTime.toISOString());
      processedEmployees.push(employee.name);
      console.log(`✅ [Auto-Checkout] Created auto-departure for ${employee.name} (${employee.email})`);
    } catch (error) {
      console.error(`❌ [Auto-Checkout] Failed to create auto-departure for ${employee.name}:`, error);
    }
  }
  
  console.log(`✅ [Auto-Checkout] Completed. Processed ${processedEmployees.length} employees`);
  
  return {
    processed: processedEmployees.length,
    employees: processedEmployees
  };
}

/**
 * Manually trigger auto-checkout (for testing or admin use)
 */
export async function triggerAutoCheckout(): Promise<{ processed: number; employees: string[] }> {
  console.log('🔧 [Auto-Checkout] Manual trigger requested...');
  return await runAutoCheckout();
}
