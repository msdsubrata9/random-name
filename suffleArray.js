const express = require("express");
const mysql = require("mysql2");
const app = express();
app.use(express.json());
const port = 3000;

// create a MySQL connection
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Subrata@1234",
  database: "mydatabase",
});

let array = [];
let pickedElements = new Set();

// create a POST endpoint to set the array and pick a random element
app.post("/shuffled-array", (req, res) => {
  const { name } = req.body;
  if (!name || !Array.isArray(name) || name.length === 0) {
    res.status(400).send("Invalid array provided");
  } else {
    array = name;
    pickedElements.clear();
    getNextRandomElement(res);
  }
});

// function to get the next random element and store it in the database
function getNextRandomElement(res) {
  let randomIndex;
  do {
    randomIndex = Math.floor(Math.random() * array.length);
  } while (pickedElements.has(randomIndex));
  const pickedElement = array[randomIndex];
  connection.query(
    "SELECT * FROM new_table WHERE name = ?",
    [pickedElement],
    (error, results, fields) => {
      if (error) {
        console.error(error);
        res.status(500).send("Error checking picked element in database");
      } else if (results.length > 0) {
        pickedElements.add(randomIndex);
        if (pickedElements.size === array.length) {
          pickedElements.clear();
          connection.query(
            "DELETE FROM new_table",
            (error, results, fields) => {
              if (error) {
                console.error(error);
                res
                  .status(500)
                  .send("Error resetting picked elements in database");
              } else {
                getNextRandomElement(res);
              }
            }
          );
        } else {
          getNextRandomElement(res);
        }
      } else {
        pickedElements.add(randomIndex);
        connection.query(
          "INSERT INTO new_table (name) VALUES (?)",
          [pickedElement],
          (error, results, fields) => {
            if (error) {
              console.error(error);
              res.status(500).send("Error storing picked element in database");
            } else {
              console.log(pickedElement);
              res.status(200).send(pickedElement);
            }
          }
        );
      }
    }
  );
}

// start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
