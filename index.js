const express = require('express');
const cors = require('cors')
require('dotenv').config()
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

const app = express()
const port = process.env.PORT || 5000


//middleware
app.use(cors())
app.use(express.json())

///////////////// Database Connection ////////////////

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tie3l.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

/////// Generate API For Client Side ///////
async function server() {
    try {
        await client.connect();

        //databases
        const database = client.db('braskets')
        const basketsCollection = database.collection('items')
        const ordersCollection = database.collection('orders')

        //////////////////////// product Api/////////////////
        //Get API
        app.get('/items', async (req, res) => {
            const cursor = await basketsCollection.find({}).toArray();
            res.send(cursor)
        })

        //POST API
        app.post('/items', async (req, res) => {
            const newItem = req.body;
            const result = await basketsCollection.insertOne(newItem);
            res.json(result)
        })



        //DB TO  all order
        app.get('/allorders', async (req, res) => {
            const cursor = await ordersCollection.find({}).toArray();
            res.json(cursor)
        })


        //load single user data
        app.get('/orders', async (req, res) => {
            const email = req.query.email;
            const query = {email: email}
            const cursor = await ordersCollection.find(query).toArray();
            res.json(cursor)
        })

        //Find which one Admin
        app.get('/orders/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await ordersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({admin: isAdmin})
        })

        ////// Orders Api ///////
        app.post('/orders', async (req, res) => {
            const newOrder = req.body
            console.log(newOrder);
            const result = await ordersCollection.insertOne(newOrder)
            res.json(result)
        })
        //upsert for user
        app.put('/orders', async (req, res) => {
            const order = req.body;
            const filter = { email: order.email }
            const options = { upsert: true };
            const updateDoc = {$set: order };
            const result = await ordersCollection.updateOne(filter, updateDoc, options)
            res.json(result)
        })
        //Add Admin role
        app.put('/orders/admin', async (req, res) => {
            const order = req.body;
            console.log(req.headers);
            const filter = { email: order.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await ordersCollection.updateOne(filter, updateDoc)
            res.json(result)
        })
        //update status
        app.put('/updateStatus/:id', (req, res) => {
            const id = req.params.id;
            const updateStatus = req.body.status;
            const filter = { _id: ObjectId(id) }
            console.log(updateStatus);
            ordersCollection.updateOne(filter, {
                $set: {status: updateStatus},
            })
                .then(result => {
                res.send(result);
            })
        })

        //delete api -user
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.deleteOne(query)
            res.json(result)
        })

        //delete api --admin products
        app.delete('/items/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await basketsCollection.deleteOne(query)
            res.json(result)
        })

    }
    finally {
        // await client.close();
    }
}
server().catch(console.dir);



app.get('/', (req, res) => {
    res.send('baskets are awesome')
})

app.listen(port, () => {
    console.log(`Listening Baskets at: ${port}`);
})
