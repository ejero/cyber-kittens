const express = require('express');
const app = express();
const { User, Kitten } = require('./db');
const jwt = require('jsonwebtoken');
const SALT_COUNT = 10;
const {JWT_SECRET = 'neverTell' } = process.env;


app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.get('/', async (req, res, next) => {
  try {
    res.send(`
      <h1>Welcome to Cyber Kittens!</h1>
      <p>Cats are available at <a href="/kittens/1">/kittens/:id</a></p>
      <p>Create a new cat at <b><code>POST /kittens</code></b> and delete one at <b><code>DELETE /kittens/:id</code></b></p>
      <p>Log in via POST /login or register via POST /register</p>
    `);
  } catch (error) {
    console.error(error);
    next(error)
  }
});

// Verifies token with jwt.verify and sets req.user
// TODO - Create authentication middleware

const setUser = async(req, res, next) => {         
  const auth = req.header('Authorization');
  if(!auth){
      res.sendStatus(401) 
  } else {
      const [, token] = auth.split(' ');
      try{
          const userObj = jwt.verify(token, JWT_SECRET);
          req.user = userObj;
          next(); 
      } catch(error) {
          res.sendStatus(401)
      }
  }
}


// POST /register
// OPTIONAL - takes req.body of {username, password} and creates a new user with the hashed password

// POST /login
// OPTIONAL - takes req.body of {username, password}, finds user by username, and compares the password with the hashed version from the DB

// GET /kittens/:id
// TODO - takes an id and returns the cat with that id
app.get('/kittens/:id', setUser, async(req, res, next) => {

  try{
    const foundCat = await Kitten.findByPk(req.params.id);
    if(!req.user){
        res.sendStatus(401);
        next()
    } else if(foundCat.id !== req.user.id) {
      res.sendStatus(401);
      next();
    }else {
      const {age, name, color} =  foundCat;
      res.send({name, age, color});
      // res.send({age: foundCat.age, name: foundCat.name, color: foundCat.color});
    }
  }catch(error){
    console.error(error);
    next(error);
  }
})

// POST /kittens
// TODO - takes req.body of {name, age, color} and creates a new cat with the given name, age, and color
app.post('/kittens',setUser, async (req, res, next) => { // Step 7
  // TODO - Require a user and set the puppy's ownerId
  const {age, name, color} = req.body;
  const kat = await Kitten.create({age, name, color, ownerId:req.user.id});
  
  if(!req.user){
    res.sendStatus(401);
    next();
  } else {
    res.status(201).send({age: kat.age, color:kat.color, name:kat.name});
  }
});

// DELETE /kittens/:id
// TODO - takes an id and deletes the cat with that id



// error handling middleware, so failed tests receive them
app.use((error, req, res, next) => {
  console.error('SERVER ERROR: ', error);
  if(res.statusCode < 400) res.status(500);
  res.send({error: error.message, name: error.name, message: error.message});
});

// we export the app, not listening in here, so that we can run tests
module.exports = app;
