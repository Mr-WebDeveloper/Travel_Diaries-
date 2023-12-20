import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "webdev",
  password: "mkmk@2020"
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;



async function checkUserColor(id){
  const user_id = id;
  const result = await db.query("SELECT color FROM users Where id = ($1)",[user_id]);
  return result.rows[0];
}


async function checkUsers(){
  const result = await db.query("SELECT * FROM users ");
  return result.rows;
}

async function checkVisisted(id) {
  const user_id = id;
  const result = await db.query("SELECT country_code FROM visited_countries WHERE user_id = ($1)", [user_id]);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}
app.get("/", async (req, res) => {
  var id = currentUserId;

  const usercolors = await checkUserColor(id);
  const countries = await checkVisisted(id);
  const users = await checkUsers();

  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: usercolors.color,
  });
});

app.post("/add", async (req, res) => {
  const input = req.body["country"];
  const user_id = currentUserId;
  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode, user_id]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});


app.post("/user", async (req, res) => {
  const id = req.body.user;
  const adduser = req.body.add;
  if(adduser)
  {
    res.render("new.ejs");
  }
  else{
    currentUserId = id;
    res.redirect("/");
  }

});

app.post("/new", async (req, res) => {
  const name = req.body.name;
  const color = req.body.color;
  const result = await db.query("INSERT INTO users (name, color) VALUES ($1, $2) RETURNING (name, color)", [name, color]);
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
