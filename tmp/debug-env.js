const fs = require('fs');
const dotenv = require('dotenv');
try {
    const envConfig = dotenv.parse(fs.readFileSync('.env'));
    console.log('DATABASE_URL length:', envConfig.DATABASE_URL?.length);
    console.log('DIRECT_URL length:', envConfig.DIRECT_URL?.length);
    console.log('DATABASE_URL ends with quote?', envConfig.DATABASE_URL?.endsWith('"'));
} catch (e) {
    console.error(e);
}
