const express = require('express');
const morgan = require('morgan');
// const fetch = require('whatwg-fetch');
const fs = require('fs');
const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');
// app.use(express.static(__dirname + '/public'));
// app.set('content-type', 'application/javascript');
app.use("/public/images", express.static('public/images'));
app.use(express.urlencoded({ extended: true}));

let urlDB;

const templateVars = {
  urlDB,
  username: "default",
  password: "default",
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
  res.render('pages/index', templateVars);
});

app.get('/register', (req, res) => {
  if (templateVars.username === "default") {
    res.render('pages/register', templateVars);
  } else {
    res.redirect('/urls');
  }
});

app.post('/register', (req, res) => {
  if (req.body.username === "" || req.body.password === "") {
    res.status(400);
    res.send('Please enter a valid email or password.');
  } else {
    getDatabase().then((content) => {
      let userExists = false;
      for (let user in content) {
        if (content[user].username === req.body.username) {
          userExists = true;
        }
      }

      if (!userExists) {
        res.cookie('username', req.body.username);
        //res.cookie('password', req.body.password);
        templateVars.username = req.body.username;
        templateVars.password = req.body.username;
        content[req.body.username] = { 'id': Math.floor(Math.random() * 10000), 'username': req.body.username, 'password': req.body.password, 'urls': {}};

        writeDatabase(content).then(() => {
          res.redirect('/urls');
        });
      } else {
        res.status(403);
        console.log(`User already exists!\n${req.body.username}`);
        res.redirect('/register');
      }
    });
  }
});

app.get('/login', (req, res) => {
  if (templateVars.username === "default") {
    res.render('pages/login', templateVars);
  } else {
    res.redirect('/urls');
  }
});

app.post('/login', (req, res) => {
  if (req.body.username === "" || req.body.password === "") {
    res.status(400);
    res.send('Please enter a valid email or password');
  } else {
    getDatabase().then((content) => {
      if (req.body.password === content[req.body.username].password) {
        res.cookie('user_id', content[req.body.username].id);
        //res.cookie('password', req.body.password);
        templateVars.username = req.body.username;
        templateVars.password = req.body.password;

        urlDB = content[templateVars.username].urls;
        res.redirect('/urls');
      } else {
        console.log(`Incorrect login!\n${req.body.password} !== ${content[req.body.username].password}`);
        res.status(403);
        res.redirect('/login');
      }
    });
  }
});

app.get('/logout', (req, res) => {
  res.clearCookie('user_id');
  //res.clearCookie('password');
  templateVars.username = "default";
  templateVars.password = "default";
  res.redirect('/');
});

app.get('/about', (req, res) => {
  res.render('pages/about', templateVars);
});

app.get('/urls', (req, res) => {
  getDatabase().then((content) => {
    urlDB = content[templateVars.username].urls;
    templateVars.urlDB = urlDB;
    res.render('pages/urls', templateVars);
  });
});

app.post('/urls', (req, res) => {
  getDatabase().then((content) => {
    // templateVars.username === "default" ? urlDB = content.default.urls : urlDB = content[templateVars.username].urls;
    urlDB = content[templateVars.username].urls;
    urlDB[generateRandomString()] = req.body.longURL;
    content[templateVars.username].urls = urlDB;

    writeDatabase(content).then(() => {
      res.redirect('/urls');
    });
  });
});

app.post('/urls/:id/delete', (req, res) => {
  getDatabase().then((content) => {
    delete content[templateVars.username].urls[req.params.id];

    writeDatabase(content).then(() => {
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
    urlDB = content[templateVars.username].urls;
    templateVars.urlDB = urlDB;
    templateVars.param = param;
    res.render('pages/url_id', templateVars);
  });
});

app.post('/urls/:id', (req, res) => {
  const param = req.params.id;
  const urlParam = req.body.newURLLong;
  getDatabase().then((content) => {
    urlDB = content[templateVars.username].urls;
    urlDB[param] = urlParam;
    content[templateVars.username].urls = urlDB;
    writeDatabase(content).then(() => {
      templateVars.urlDB = urlDB;
      templateVars.param = param;
      res.render('pages/url_id', templateVars);
    });
  });
});

app.get('/u/:id', (req, res) => {
  getDatabase().then((content) => {
    // urlDB = content[templateVars.username].urls;
    let idExists = true;
    for (user in content) {
      if (content[user].urls[req.params.id]) {
        res.redirect(content[user].urls[req.params.id]);
        idExists = true;
        break;
      } else {
        idExists = false;
      }
    }

    if (!idExists) {
      res.redirect('/urls');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Tiny App Server listening on port ${PORT}!`);
});