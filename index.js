const { faker } = require('@faker-js/faker');
const mysql = require('mysql2');
const express = require("express");
const app = express();
const path = require("path");
const methodOverride = require("method-override");
const { v4: uuidv4 } = require("uuid");

app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.urlencoded({extended : true}));

app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "/views"))

// Create the MySQL connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'delta_app',
    password: 'Littlestuart32@'
});

// Function to generate random user data
let getRandomUser = () => {
    return [
        faker.string.uuid(),
        faker.internet.userName(),
        faker.internet.email(),
        faker.internet.password()
    ];
};

// Home route
app.get("/", (req, res) => {
    const q = `SELECT COUNT(*) AS userCount FROM user;`;  // Added alias for better readability
    try {
        connection.query(q, (err, result) => {
            if (err) throw err;
            let count = result[0].userCount;  // Logs the user count
            res.render("home.ejs", { count });  // Responds with user count
        });
    } catch (err) {
        console.log(err);
        res.send("Some error in DB");
    }
});

//Show route
app.get("/user",(req, res) => {
    const q = `SELECT * FROM user;`;
    try {
        connection.query(q, (err, users) => {
            if (err) throw err;
           res.render("showusers.ejs", { users });
        });
    } catch (err) {
        console.log(err);
        res.send("Some error in DB");
    }
   
});

//Edit route
app.get("/user/:id/edit", (req, res) => {
    let { id } = req.params;
    let q = `SELECT * FROM user WHERE id='${id}'`;
    try {
        connection.query(q, (err, result) => {
            if (err) throw err;
            let user = result[0];
            res.render("edit.ejs", { user });
        });
    } catch (err) {
        console.log(err);
        res.send("Some error in DB");
    }
});

// Update (DB) route
app.patch("/user/:id", (req, res) => {
    let { id } = req.params;
    let {password: formPass, username: newUsername } = req.body;
    let q = `SELECT * FROM user WHERE id='${id}'`;
    try {
        connection.query(q, (err, result) => {
            if (err) throw err;
            let user = result[0];
            if(formPass != user.password) {
                res.send("WRONG password");
            }else {
                let q2 = `UPDATE user SET username='${newUsername}' WHERE id='${id}'`;
                connection.query(q2, (err, result) => {
                    if (err) throw err;
                    res.redirect("/user");
                })
            }
          
        });
    } catch (err) {
        console.log(err);
        res.send("Some error in DB");
    }
});

// Get the form for adding a new user
app.get("/user/new", (req, res) => {
    res.render("newuser.ejs");  // Renders the form to add a new user
});

// Post route to add the new user
app.post("/user/new", (req, res) => {
    let { username, email, password } = req.body;
    let id = uuidv4(); 
    // Query to Insert New User
    let q = `INSERT INTO user (id, username, email, password) VALUES ('${id}','${username}','${email}','${password}')`;
    try {
        connection.query(q, (err, result) => {
            if (err) throw err;
            console.log("added new user");
            res.redirect("/user");  // Redirect to the user list page
        });
    } catch (err) {
        res.send("Some error occurred");
    }
});

//DELETE the user
app.get("/user/:id/delete", (req, res) => {
    let { id } = req.params;
    let q = `SELECT * FROM user WHERE id='${id}'`;
    connection.query(q, (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.send("Some error occurred with DB");
      }
  
      // Check if user was found
      if (result.length === 0) {
        return res.status(404).send("User not found");
      }
  
      let user = result[0];  // Get the first user from the result array
      res.render("delete.ejs", { user });  // Pass user object to EJS template
    });
  });
  
  // Route to handle the deletion after password check
  app.delete("/user/:id", (req, res) => {
    let { id } = req.params;
    let { password } = req.body;
    let q = `SELECT * FROM user WHERE id='${id}'`;
    connection.query(q, (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.send("Some error occurred with DB");
      }
  
      // Check if user exists
      if (result.length === 0) {
        return res.status(404).send("User not found");
      }
  
      let user = result[0];  // Get the user
  
      // Check if the password matches
      if (user.password !== password) {
        return res.send("WRONG Password entered!");
      }
  
      // Delete user if password matches
      let q2 = `DELETE FROM user WHERE id='${id}'`;
      connection.query(q2, (err, result) => {
        if (err) {
          console.error("Error deleting user:", err);
          return res.send("Some error occurred while deleting the user");
        }
  
        console.log("User deleted!");
        res.redirect("/user");  // Redirect after successful deletion
      });
    });
  });

  // Start the server and listen on port 8080
app.listen(8080, () => {
    console.log("Server is listening on port 8080");
});

// Gracefully close the MySQL connection when the app is terminated (CTRL+C)
process.on('SIGINT', () => {
    connection.end(() => {
        console.log('MySQL connection closed');
        process.exit(0);  // Exit the process after closing the connection
    });
});
