/* --- 
  Imports from libraries to handle server comm(express), password hashing(bcrypt),
  cookie encrypting(cookie-session), and file reading and writing(fs)
--- */
const express = require('express');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');
const fs = require('fs');

/* --- Initialize server variables --- */
const app = express();
const PORT = 8080; // default port 8080

/* --- Setup server-side options --- */
app.set('view engine', 'ejs');
app.use("/public/images", express.static('public/images'));
app.use(express.urlencoded({ extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1']
}));
app.use(methodOverride('_method'));

// const xhr = new XMLHttpRequest();
// xhr.onload = onload;
// xhr.open('post', '/urls/:id/delete', true);
// xhr.setRequestHeader('X-HTTP-Method-Override', "DELETE");
// xhr.send();

/* --- Initialize variables to be sent to html/ejs files --- */
let urlDB;
const templateVars = {
  urlDB,
  user_id: "0",
  username: "default",
  password: "default",
};
const analytics = {};

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
const generateRandomString = () => {
  return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
}

/* --- Render home page when requesting '/' --- */
app.get('/', (req, res) => {
  res.render('pages/index', templateVars);
});

/* --- Render register page unless user is already logged in --- */
app.get('/register', (req, res) => {
  if (templateVars.username === "default") {
    res.render('pages/register', templateVars);
  } else {
    res.redirect('/urls');
  }
});

/* --- Write registered user to database --- */
app.post('/register', (req, res) => {
  getDatabase().then((content) => { // First read database, then register new user onto data from file
    let userExists = false;
    for (let user in content) {
      if (content[user].username === req.body.username) {
        userExists = true;
      }
    }

    if (!userExists) { // Double check if the user already exists on the database
      const userID = Math.floor(Math.random() * 10000);
      req.session.user_id = userID;
      templateVars.user_id = userID;
      templateVars.username = req.body.username;
      bcrypt.hash(req.body.password, 10, (err, hash) => { // Hash registered password before recording it ever
        templateVars.password = hash;

        content[userID] = { 'id': userID, 'username': req.body.username, 'password': hash, 'urls': {}}; // Create new user on file database

        writeDatabase(content).then(() => { // Write new database object back to file
          res.redirect('/urls');
        });
      });
    } else {
      res.status(400);
      res.render('pages/error', { "error": res.statusCode });
    }
  });
});

/* --- Render login page if user isn't logged in --- */
app.get('/login', (req, res) => {
  if (templateVars.username === "default") {
    res.render('pages/login', templateVars);
  } else {
    res.redirect('/urls');
  }
});

/* --- Set variables to send to render pages from user inputted login form --- */
app.post('/login', (req, res) => {
  getDatabase().then((content) => {
    let tempID;
    for (let uid in content) {
      if (content[uid].username === req.body.username) {
        tempID = content[uid].id;
        break;
      }
    }
    if (!tempID) {
      res.status(404);
      templateVars["error"] = res.statusCode;
      res.render('pages/error', templateVars);
    } else {
      bcrypt.compare(req.body.password, content[tempID].password, (err, result) => { // Compare entered password to hashed password on file
        if (result) {
          req.session.user_id = tempID;
          templateVars.user_id = tempID;
          templateVars.username = req.body.username;
          templateVars.password = content[templateVars.user_id].password;
  
          urlDB = content[templateVars.user_id].urls;
          res.redirect('/urls');
        } else {
          res.status(401);
          res.render('pages/error', { "error": res.statusCode });
        }
      });
    }
  });
});

/* --- Remove user variables from the object that is passed into our renderings --- */
app.get('/logout', (req, res) => {
  req.session.user_id = "0";
  templateVars.user_id = "0";
  templateVars.username = "default";
  templateVars.password = "default";
  res.redirect('/');
});

/* --- Render the about page when /about is requested --- */
app.get('/about', (req, res) => {
  res.render('pages/about', templateVars);
});

/* --- Render the urls of the specific user. If not logged in, renders the urls of the default account --- */
app.get('/urls', (req, res) => {
  getDatabase().then((content) => {
    urlDB = content[templateVars.user_id].urls;
    templateVars.urlDB = urlDB;
    res.render('pages/urls', templateVars);
  });
});

/* --- Creates a new short url and adds it to the users url list when the create short url form is submitted and post request sent --- */
app.post('/urls', (req, res) => {
  getDatabase().then((content) => {
    urlDB = content[templateVars.user_id].urls;
    urlDB[generateRandomString()] = req.body.longURL; // Generate random short url and assign it as a key with value of the long url
    content[templateVars.user_id].urls = urlDB;

    writeDatabase(content).then(() => {
      res.redirect('/urls');
    });
  });
});

/* --- Removes a short url data pair when the delete button is clicked and the post request sent --- */
app.delete('/urls/:id/delete', (req, res) => {
  getDatabase().then((content) => {
    delete content[templateVars.user_id].urls[req.params.id];

    writeDatabase(content).then(() => {
      res.redirect('/urls');
    });
  });
});

/* --- Renders the new url form page when the /urls/new request is sent from clicking the new url button --- */
app.get('/urls/new', (req, res) => {
  res.render('pages/url_new', templateVars);
});

/* --- Renders the single short url page based on the id requested in /urls/:id --- */
app.get('/urls/:id', (req, res) => {
  const param = req.params.id;
  getDatabase().then((content) => {
    urlDB = content[templateVars.user_id].urls;
    templateVars.urlDB = urlDB;
    templateVars.param = param;
    if (!analytics[param]) {
      analytics[param] = {};
      analytics[param].created = new Date();
      analytics[param].numVisits = 0;
      analytics[param].uniqueVisits = 0;
      analytics[param].uniqueVisitors = [];
      analytics[param].visits = [];
    }
    templateVars.ana = analytics;
    res.render('pages/url_id', templateVars);
  });
});

/* --- When /urls/:id is requested with POST, update an already created short url with the new long url passed in through the form --- */
app.put('/urls/:id', (req, res) => {
  const param = req.params.id;
  const urlParam = req.body.newURLLong;
  getDatabase().then((content) => {
    urlDB = content[templateVars.user_id].urls;
    urlDB[param] = urlParam;
    content[templateVars.user_id].urls = urlDB; // Modify users url list object, then shove it back into the database
    writeDatabase(content).then(() => {
      templateVars.urlDB = urlDB;
      templateVars.param = param;
      res.redirect(`/urls/${param}`);
    });
  });
});

/* --- Redirects to the long url value pair of key of id passed into GET of /u/:id --- */
app.get('/u/:id', (req, res) => {
  getDatabase().then((content) => {
    let idExists = true;
    for (user in content) { // Ensure any user can directly access any short url
      idList = Object.keys(content[user].urls);
      if (idList.includes(req.params.id)) {
        if (!analytics[req.params.id]) {
          analytics[req.params.id] = {};
        }
        !analytics[req.params.id].numVisits ? analytics[req.params.id].numVisits = 1 : analytics[req.params.id].numVisits++;
        
        let uniV = true;
        if (!analytics[req.params.id].uniqueVisitors) {
          analytics[req.params.id].uniqueVisitors = [];
        }
        for (let user of analytics[req.params.id].uniqueVisitors) {
          if (templateVars.user_id === user) {
            uniV = false;
          }
        }

        if (uniV) {
          !analytics[req.params.id].uniqueVisits ? analytics[req.params.id].uniqueVisits = 1 : analytics[req.params.id].uniqueVisits++;
          !analytics[req.params.id].uniqueVisitors ? analytics[req.params.id].uniqueVisitors = templateVars.user_id : analytics[req.params.id].uniqueVisitors.push(templateVars.user_id);
        }
        !analytics[req.params.id].visits ? analytics[req.params.id].visits = [{time: new Date(), user: templateVars.user_id}] : analytics[req.params.id].visits.push({ time: new Date(), user: templateVars.user_id });
        
        res.redirect(content[user].urls[req.params.id]);
        idExists = true;
        break;
      } else {
        idExists = false;
      }
      console.log(idList.includes(req.params.id));
    }

    if (!idExists) {
      res.redirect('/urls');
    }
  });
});

/* --- Enable server to listen at PORT variable for client requests --- */
app.listen(PORT, () => {
  console.log(`Tiny App Server listening on port ${PORT}!`);
  getDatabase().then((content) => {
    content["0"].urls = { "vj3k2l": "https://www.google.ca" };
    writeDatabase(content);
  });
});