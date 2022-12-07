



const express = require('express')
const request = require('request')
const topicFind = require('../utils/topicGet')
const router = express.Router()

//for load balancing
const catalogRep = ["3000", "3005"]
const orderRep = ["3003", "3004"]
let catalogIndex = 0
let orderIndex = 0

//for caching
let cache = new Map()

//get by id
router.use('/books/info/:id',  async (req, res) => {
    const id = req.params.id
    console.log(id);
    if(cache.has('id_'+ id)){
        console.log('found in cache')
        return res.status(200).send(cache.get('id_'+ id))
    } 
    console.log('not in cache')
    catalogIndex>= catalogRep.length -1? catalogIndex =0: catalogIndex+=1
   
    const url = 'http://192.168.56.101:'+catalogRep[catalogIndex]+'/books/info/' + id
    // const url = 'http://'+catalogRep[catalogIndex]+':3000/books/info/' + id
    console.log(url)
    request({ url, json: true }, (error, { body } ={}) => {
        if (error) {
            return res.status(404).send(error)
        }
        console.log('retreived from db')
        cache.set('id_'+body.num, body)
        console.log(cache.size)
        return res.status(200).send(body)
    });
})

//get by topic
router.use('/books/search/:topic', (req, res) => {
    const topic = req.params.topic
    if(cache.has('topic_'+ topic)){
        console.log('found in cache')
        return res.status(200).send(cache.get('topic_'+ topic))
    }
    console.log('not in cache')
    catalogIndex>= catalogRep.length -1? catalogIndex =0: catalogIndex+=1

    const url = 'http://192.168.56.101:'+catalogRep[catalogIndex]+'/books/search/' + topic
    request({ url, json: true }, (error, { body }={}) => {
        if (error) {
            return res.status(404).send(error)
        }
        cache.set('topic_'+topic , body)
        return res.status(200).send(body)
    })
})

//patch a book
router.patch('/books/:id', (req, res) => {
    const id = req.params.id
    catalogIndex>= catalogRep.length-1? catalogIndex =0: catalogIndex+=1
    
    const url = 'http://192.168.56.101:'+catalogRep[catalogIndex]+'/books/' + id
    request({ url, json: true, method: 'PATCH', body: req.body }, (error, { body, statusCode }={}) => {
        if (error) {
            return res.status(404).send(error)
        }
        return res.status(statusCode).send(body)
    })
})

//purchace a book
router.use('/books/purchase/:id', (req, res) => {
    const id = req.params.id
    orderIndex>= orderRep.length-1? orderIndex =0: orderIndex+=1
    const url = 'http://192.168.56.101:'+orderRep[orderIndex]+'/books/purchase/' + id
    request({ url, json: true }, (error, { body } ={}) => {
        if (error) {
            return res.status(500).send(error)
        }
        return res.status(200).send(body)
    })
})

//notified to change 
router.delete('/invalidate/:id', async(req, res) => {
    console.log('book changed, delete from cache')
    const id = parseInt(req.params.id)
    if(cache.has('id_'+id)){
        cache.delete('id_'+id)
    }
    const topic = await topicFind(id, catalogRep[catalogIndex])
    console.log(topic)
    if(cache.has('topic_'+topic)){
        cache.delete('topic_'+topic)
    }
    console.log('current cache size:'+ cache.size)
    res.status(200).send("OK")
})

module.exports = router