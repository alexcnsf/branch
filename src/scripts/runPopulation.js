const populateCommunities = require('./populateCommunities');

// Run the population script
populateCommunities()
  .then(() => {
    console.log('Population script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Population script failed:', error);
    process.exit(1);
  }); 