const request = require("request")

const getTopic = (id, ip)=>{
    return new Promise((resolve, reject)=>{
        const url = 'http://192.168.56.101:'+ip+'/books/info/' + id
        request.get({url, json:true}, (error, res)=>{
            if(error) return reject(error)
            if(res.statusCode!=200) return reject(res.body)
            return resolve(res.body.topic)
        })
    })   
}
module.exports = getTopic