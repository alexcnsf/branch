const { db } = require('../config/firebase');
const { collection, addDoc } = require('firebase/firestore');

const communities = [
  {
    name: 'Bouldering',
    image: 'https://plus.unsplash.com/premium_photo-1672280952013-b791997f652e?q=80&w=2942&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    members: [],
    availability: [false, false, false, false, false, false, false],
    description: 'Join our bouldering community to connect with fellow climbers, share tips, and find climbing partners.'
  },
  {
    name: 'Surfing',
    image: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    members: [],
    availability: [false, false, false, false, false, false, false],
    description: 'Catch waves with our surfing community. Share surf spots, conditions, and find surf buddies.'
  },
  {
    name: 'Hiking',
    image: 'https://images.unsplash.com/photo-1547483238-f400e65ccd56?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    members: [],
    availability: [false, false, false, false, false, false, false],
    description: 'Explore trails and mountains with fellow hikers. Share routes, tips, and organize group hikes.'
  },
  {
    name: 'Fishing',
    image: 'https://images.unsplash.com/photo-1532015917327-c7c46aa1d930?q=80&w=2880&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    members: [],
    availability: [false, false, false, false, false, false, false],
    description: 'Connect with anglers, share fishing spots, and plan fishing trips together.'
  }
];

const populateCommunities = async () => {
  try {
    const communitiesRef = collection(db, 'communities');
    
    for (const community of communities) {
      await addDoc(communitiesRef, community);
      console.log(`Added community: ${community.name}`);
    }
    
    console.log('All communities added successfully!');
  } catch (error) {
    console.error('Error adding communities:', error);
  }
};

module.exports = populateCommunities; 