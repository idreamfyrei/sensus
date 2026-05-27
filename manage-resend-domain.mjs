import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  console.error("❌ RESEND_API_KEY is not set in your .env file.");
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);
const DOMAIN_NAME = process.env.DOMAIN || 'sensus.saumyagrawal.in';

async function main() {
  console.log(`\n📧 Resend Domain Manager for ${DOMAIN_NAME}`);
  console.log("-----------------------------------------");
  console.log("1. Add/Create domain");
  console.log("2. List all domains");
  console.log("3. Verify domain (requires ID)");
  console.log("4. Delete domain (requires ID)");
  console.log("-----------------------------------------");

  rl.question("Choose an option (1-4): ", async (choice) => {
    try {
      if (choice === '1') {
        console.log(`Adding ${DOMAIN_NAME} to Resend...`);
        const { data, error } = await resend.domains.create({ name: DOMAIN_NAME });
        if (error) throw error;
        console.log("✅ Domain added! Here are your DNS records to add in Hostinger:");
        console.log(JSON.stringify(data, null, 2));
      } 
      else if (choice === '2') {
        console.log("Listing domains...");
        const { data, error } = await resend.domains.list();
        if (error) throw error;
        console.log(JSON.stringify(data, null, 2));
      } 
      else if (choice === '3') {
        rl.question("Enter the Domain ID to verify: ", async (id) => {
          console.log(`Verifying domain ${id}...`);
          const { data, error } = await resend.domains.verify(id);
          if (error) throw error;
          console.log("✅ Verification triggered:", data);
          rl.close();
        });
        return; // wait for inner callback
      }
      else if (choice === '4') {
        rl.question("Enter the Domain ID to delete: ", async (id) => {
          console.log(`Deleting domain ${id}...`);
          const { data, error } = await resend.domains.remove(id);
          if (error) throw error;
          console.log("✅ Domain deleted:", data);
          rl.close();
        });
        return; // wait for inner callback
      } else {
        console.log("Invalid choice.");
      }
    } catch (error) {
      console.error("❌ Error:", error.message || error);
    }
    
    rl.close();
  });
}

main();
