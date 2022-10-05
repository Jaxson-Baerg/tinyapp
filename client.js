const fetch = require('whatwg-fetch');

const loginSubmit = async () => {
  fetch("http://localhouse:8080/login").then(() => {
    alert("Bad login");
  });
};

document.getElementById("loginInput").addEventListener("submit", loginSubmit);