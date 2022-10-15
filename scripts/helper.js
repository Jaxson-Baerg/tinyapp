const fs = require('fs');

/* --- Helper function to read from database file --- */
const getDatabase = (userID) => {
  return new Promise((resolve, reject) => {
    fs.readFile('./users/database.txt', (error, body) => {
      if (userID) resolve(JSON.parse(body).userID);
      resolve(JSON.parse(body));
    });
  });
};

/* --- Helper function to write to database file --- */
const writeDatabase = (obj) => {
  return new Promise((resolve, reject) => {
    fs.writeFile('./users/database.txt', JSON.stringify(obj), (error) => {
      if (!error) resolve();
      reject();
    });
  });
};

/* --- Helper function to generate string for short urls --- */
const generateRandomString = (content) => {
  let num = null;
  while (!num) {
    num = Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
    for (user in content) {
      const idList = Object.keys(content[user].urls);
      if (idList.includes(num)) {
        num = null;
      } 
    }
  }
  return num;
}

module.exports = {
  getDatabase,
  writeDatabase,
  generateRandomString
};