const OutscraperClient = require('outscraper');

const client = new OutscraperClient('ZDdjZTRmODU1YmU4NDhiMThmOGQwOWFhYzI4Mzg5NWR8Zjg3ODE3NzQxYw');

async function test() {
  try {
    console.log('Testing Outscraper API...');
    const results = await client.googleMapsSearch(
      ['coffee San Francisco'],
      10,
      'en',
      'US',
      {
        extractEmails: true,
        extractPhones: true,
        extractWebsites: true,
      }
    );

    console.log('Results type:', typeof results);
    console.log('Results:', JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
