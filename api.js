const express = require('express');
const  bodyParser  =  require( 'body-parser' );
const { response } = require('express');
const port =  process.env.PORT// local:3002 servidor: process.env.PORT
const app = express()
const jwt = require('jsonwebtoken');
const crypto = require("crypto");
const SECRET = 'ALESSANDRO'
var payload = {}
app.use(express.json());

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json());



app.listen((req,res) =>{
    console.log("servidor Rodando")
})



var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectId;

var DATABASE_URL  = "mongodb+srv://gladson:comentar6507@cluster0.zup2n.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(DATABASE_URL)
var dbo = client.db("PortalRobo") 

const DADOS_CRIPTOGRAFAR = {
    algoritmo : "aes256",
    segredo : "chaves",
    tipo : "hex"
};

function criptografar(senha) {
    const cipher = crypto.createCipher(DADOS_CRIPTOGRAFAR.algoritmo, DADOS_CRIPTOGRAFAR.segredo);
    cipher.update(senha);
    return cipher.final(DADOS_CRIPTOGRAFAR.tipo);
};

var cors = require('cors');

app.use(cors())
   
app.put('/usuario/:id', verifyJWT, (req,response) => {
    const query = {_id :  ObjectID.createFromHexString(req.params.id)}
    console.log(req.body.usuario)
  
    const novosDados = { $set: {
        usuario: req.body.usuario, 
        senha: criptografar(req.body.senha),
        tipo: req.body.tipo
    } 
};
   
        dbo.collection("usuario").updateOne(query, novosDados).then((data => {
        response.json(data)      
    }))     
})

app.post('/usuario', (req,response) => {
    const novosDados = {
        usuario: req.body.usuario, 
        telefone: req.body.telefone,
        senha: criptografar(req.body.senha),
      
    } 
    console.log(novosDados.senha);
    dbo.collection("usuario").insertOne(novosDados).then(() => {
        response.json(novosDados)
   })   
})

app.post('/login',(req,response) => {
    console.log(req.body)
    const pass = criptografar(req.body.senha)
    //const pass = descriptografar(encript)
    console.log('senha descrip... '+JSON.stringify(pass));
 
    dbo.collection("usuario").findOne({usuario: req.body.usuario, senha: pass}).then(data => {
        console.log('retorno '+data); 
        if(data != null)
        {
            const token = jwt.sign({usuario: data._id} , SECRET, {expiresIn: 1000})
            response.json({data, auth: true, token})
            console.log(response)
        }
        else {

            response.json({msg: 'usuario ou senha invalida'})  

        }
    })

})

app.get('/' ,(req, res) => {res.send("BEM VINDO A API DE LOGIN")} )

  app.listen(port, function() {
    console.log(`Server is running at localhost:${port}`)
  })

  function verifyJWT(req, res, next){
    const token = req.headers['x-access-token']
    jwt.verify(token, SECRET, (erro, decoded) => {

        if(erro){
            res.json({msg:'token ausente ou invalido'})
            return false
        }
        payload = decoded.usuario
        next()
    })
  }

  app.get('/RobosUsuario',verifyJWT, (req,response) => {
    
    var query = { $and: [] };

    if (req.query.usuario) { query.$and.push({usuario: req.query.usuario}); }
    if (req.query.descricao) { query.$and.push({descricao: req.query.descricao}); }
    if (req.query.senha) { query.$and.push({senha: req.query.senha}); }

    let page = req.query.page;
    let limit = parseInt(req.query.limit);
    let skip = parseInt(limit) * (page - 1);
    if(query.$and.length == 0){
        query = {}
        console.log(`usuario: ${req.query.usuario} descricao: ${req.query.descricao} senha: ${req.query.senha}`);
    }
        dbo.collection("RobosUsuario").find(query).count().then(count=>{
            dbo.collection("RobosUsuario").find(query).skip(skip).limit(limit).toArray().then((data => {
                response.json({data, total: count % limit == 0 ? count/limit : (Math.floor(count/limit)) + 1 })    
            }))      
            
        })
             
  })


  app.get('/RobosUsuario/:id',verifyJWT, (req,response) => {
    const query = {_id :  ObjectID.createFromHexString(req.params.id)}
    dbo.collection("RobosUsuario").findOne(query).then((data) => {
    response.json(data) 
  })
})

  app.put('/RobosUsuario/:id', verifyJWT, (req,response) => {
    console.log("teste1");

    const query = {_id :  ObjectID.createFromHexString(req.params.id)}  
    const novosDados = { $set: {
        usuario: req.body.usuario, 
        senha: req.body.senha,
        descricao: req.body.descricao,
        qtdInicial : req.body.qtdInicial,
        qtdFinal: req.body.qtdFinal
    } 
};
        console.log("teste");
        dbo.collection("RobosUsuario").updateOne(query, novosDados).then(response.json(req.body))     
})

app.post('/RobosUsuario', verifyJWT, (req,response) => {
            const novosDados = {
                descricao: req.body.descricao,
                usuario: req.body.usuario, 
                senha: req.body.senha,
                qtdInicial : req.body.qtdInicial,
                qtdFinal: req.body.qtdFinal
            } 
           
            dbo.collection("RobosUsuario").insertOne(novosDados).then(() => {
                response.json(req.body)
           })   
    })

  app.delete('/RobosUsuario/:id', verifyJWT,(req, response) => {
        const query = {_id :  ObjectID.createFromHexString(req.params.id)}

        dbo.collection("RobosUsuario").deleteOne(query).then(() => {
        response.json("Excluído com Sucesso!") 
    })   
})
