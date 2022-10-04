const express = require('express');
const morgan = require('morgan');
// const fetch = require('whatwg-fetch');
const fs = require('fs');
const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs')
app.use("/public/images", express.static('public/images'));
app.use(express.urlencoded({ extended: true}));

let urlDB;

const templateVars = {
  urlDB,
  username: undefined,
  password: undefined
};

const getDatabase = () => {
  return new Promise((resolve, reject) => {
    fs.readFile('./users/database.txt', (error, body) => {
      resolve(JSON.parse(body));
    });
  });
};
getDatabase().then((content) => {
  urlDB = content;
});

const writeDatabase = (obj) => {
  return new Promise((resolve, reject) => {
    fs.writeFile('./users/database.txt', JSON.stringify(obj), (error) => {
      if (!error) resolve();
    });
  });
};

// const validate = (url) => {
//   fetch(url).then(() => {
//     document.getElementById("newURL").submit();
//   }).catch(() => {
//     console.log("bad url");
//   });
// };

const generateRandomString = () => {
  return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
}

app.get('/', (req, res) => {
  const mascots = [
    { name: 'Sammy', organization: "DigitalOcean", birth_year: 2012},
    { name: 'Tux', organization: "Linux", birth_year: 1996},
    { name: 'Moby Dock', organization: "Docker", birth_year: 2013}
  ];
  const tagline = "No programming concept is complete without a cute animal mascot!";

  templateVars.mascots = mascots;
  templateVars.tagline = tagline;

  res.render('pages/index', templateVars);
});

app.get('/login', (req, res) => {
  res.render('pages/login', templateVars);
});

app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.cookie('password', req.body.password);
  templateVars.username = req.body.username;
  templateVars.password = req.body.password;
  getDatabase().then((content) => {
    urlDB = content;
    res.redirect('/urls'); // Render user specific urls later
  });
});

app.get('/logout', (req, res) => {
  res.clearCookie('username');
  res.clearCookie('password');
  templateVars.username = undefined;
  templateVars.password = undefined;
  res.redirect('/');
});

app.get('/about', (req, res) => {
  res.render('pages/about', templateVars);
});

app.get('/urls', (req, res) => {
  getDatabase().then((content) => {
    urlDB = content;
    templateVars.urlDB = urlDB;
    res.render('pages/urls', templateVars);
  });
});

app.post('/urls', (req, res) => {
  getDatabase().then((content) => {
    urlDB = content;
    urlDB[generateRandomString()] = req.body.longURL;
    writeDatabase(urlDB).then(() => {
      res.redirect('/urls');
    });
  });
});

app.post('/urls/:id/delete', (req, res) => {
  getDatabase().then((content) => {
    urlDB = content;
    delete urlDB[req.params.id];
    writeDatabase(urlDB).then(() => {
      res.redirect('/urls');
    });
  });
});

app.get('/urls/new', (req, res) => {
  res.render('pages/url_new', templateVars);
});

app.get('/urls/:id', (req, res) => {
  const param = req.params.id;
  getDatabase().then((content) => {
    urlDB = content;
    templateVars.urlDB = urlDB;
    templateVars.param = param;
    res.render('pages/url_id', templateVars);
  });
});

app.post('/urls/:id', (req, res) => {
  const param = req.params.id;
  const urlParam = req.body.newURLLong;
  getDatabase().then((content) => {
    urlDB = content;
    urlDB[param] = urlParam;
    writeDatabase(urlDB).then(() => {
      templateVars.urlDB = urlDB;
      templateVars.param = param;
      res.render('pages/url_id', templateVars);
    });
  });
});

app.get('/u/:id', (req, res) => {
  getDatabase().then((content) => {
    urlDB = content;
    if (urlDB[req.params.id]) {
      res.redirect(urlDB[req.params.id])
    } else {
      res.redirect('/urls');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});