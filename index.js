require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 3000;

// Connexion à PostgreSQL
const pool = new Pool({
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: process.env.DATABASE_PORT,
});

pool.query(`
  CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT NOT NULL
  )
`)
  .then(() => console.log("La table articles a été créée ou existe déjà."))
  .catch(err => console.error(`Une erreur s'est produite lors de la création de la table articles : ${err}`));


app.use(express.json());




app.get("/", (req, res) => {
  res.send("Bienvenue dans l'API de gestion des articles !");
});


app.get("/articles", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM articles ORDER BY id ASC");
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Aucun article trouvé." });
    }
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ message: `Erreur lors de la récupération des articles : ${err}` });
  }
});


app.post("/articles", async (req, res) => {
  try {
    const { title, content, author } = req.body;

    const result = await pool.query(
      "INSERT INTO articles (title, content, author) VALUES ($1, $2, $3) RETURNING *",
      [title, content, author]
    );
    res.status(201).json({ message: "Article créé avec succès.", article: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: `Erreur lors de la création de l'article : ${err}` });
  }
});


app.patch("/articles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, author } = req.body;

    const fields = [];
    const values = [];
    let query = "UPDATE articles SET ";

    if (title) {
      fields.push(`title = $${fields.length + 1}`);
      values.push(title);
    }
    if (content) {
      fields.push(`content = $${fields.length + 1}`);
      values.push(content);
    }
    if (author) {
      fields.push(`author = $${fields.length + 1}`);
      values.push(author);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "Aucun champ fourni pour la mise à jour." });
    }

    query += fields.join(", ") + ` WHERE id = $${fields.length + 1} RETURNING *`;
    values.push(id);

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Article non trouvé." });
    }

    res.status(200).json({ message: "Article mis à jour avec succès.", article: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: `Erreur lors de la mise à jour de l'article : ${err}` });
  }
});


app.delete("/articles/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("DELETE FROM articles WHERE id = $1 RETURNING *", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Article non trouvé." });
    }

    res.status(200).json({ message: "Article supprimé avec succès.", article: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: `Erreur lors de la suppression de l'article : ${err}` });
  }
});


app.listen(port, () => console.log(`Le serveur écoute sur http://localhost:${port}`));
