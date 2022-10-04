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

  res.render('pages/index', {
    mascots,
    tagline
  });
});

app.get('/about', (req, res) => {
  res.render('pages/about');
});

app.get('/urls', (req, res) => {
  getDatabase().then((content) => {
    urlDB = content;
    res.render('pages/urls', { urlDB });
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
  res.render('pages/url_new');
});

app.get('/urls/:id', (req, res) => {
  const param = req.params.id;
  getDatabase().then((content) => {
    urlDB = content;
    res.render('pages/url_id', { urlDB, param });
  });
});

app.post('/urls/:id', (req, res) => {
  const param = req.params.id;
  const urlParam = req.body.newURLLong;
  getDatabase().then((content) => {
    urlDB = content;
    urlDB[param] = urlParam;
    writeDatabase(urlDB).then(() => {
      res.render('pages/url_id', { urlDB, param});
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