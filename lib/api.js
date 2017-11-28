const Archetype = require('archetype-js');
//const BookType = require('./book');
//const { ObjectId } = require('mongodb');
const express = require('express');

/* Organization of the database :
 *  - a collection containing the devices : full ID (MAC address), short ID (4 characters), timestamp last data 
 *  - a collection containing the measures : device ID, noise
 **/
 const base64 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/" ;

module.exports = db => {
  const router = express.Router();

  // Wrap an async function so we catch any errors that might occur
  const wrapAsync = handler => (req, res) => handler(req)
    .then(result => res.json(result))
    .catch(error => res.status(500).json({ error: error.message }))

  // Handle post message to root
  router.post('/', (req, res, next) =>  {
    const message = {
      "message": "Coucou post"
    };
    res.status(200).json(message);
  });


  // Get all devices
  router.get('/data',(req, res, next) => 
  {
    return db.collection('data').find().toArray(function(err, results) 
      {
        res.json(results);
        return results;
      });
  });


  // Handle post message to data
  router.post('/data', (req, res, next) =>  
  {
    // ACK the message as quickly as possible, then add the data to the database
    res.sendStatus(200) ;

    db.collection('devices').find({shortID: req.body.id}).toArray(function (error, results) 
      {
        if (error) 
          throw error;

        // A device has been found, 
        if ( results.length > 0 )
        {
          for ( var iData = req.body.noise.length - 1 ; iData >= 0 ; iData-- )
          { 
            db.collection("data").insert({'deviceFullID' : results[0].fullID, 'data' : parseInt(req.body.noise[iData]), 'date' : new Date(Date.now() - iData * req.body.interval)}, function(err, res) { if (err) throw err; } ) ; 
          }
        } 
      }) ;
  });


  // Get all devices
  router.get('/device',(req, res, next) => 
  {
    return db.collection('devices').find().toArray(function(err, results) 
      {
        res.json(results);
        return results;
      });
  });


  // Get a specific device
  router.get('/device/:uid',(req, res, next) => 
  {
    return db.collection('devices').find({shortID:req.params.uid}).toArray(function(err, results) {
      res.json(results);
      return results;
    });
  });


  // Handle post message to device. If the device already exists, return its short ID, else add it and create a short ID
  router.post('/device', (req, res, next) =>  
  {
    // Search for a device with this full ID
    db.collection('devices').find({fullID: req.body.id}).toArray(function (error, results) 
      {
        if (error) 
          throw error;

        var shortID = '', alreadyInDB = false ;  
        var message = {shortID: ""} ; 

        // A device has been found, 
        if ( results.length > 0 )
        {
          message.shortID = results[0].shortID ; 
          message.config  = results[0].config ; 
          db.collection("devices").updateOne({'_id' : results[0]._id}, { $set: { 'lastConnection': new Date() } }, function(err, res) { if (err) throw err; } ) ; 
        } 
        else
        {
          var idBinary = parseInt(req.body.id).toString(2) ; 
          idBinary = "000000000000000000000000000000000000".substr(0, 36 - idBinary.length ) + idBinary ;
          for ( var iChar = 0 ; iChar < 6 ; iChar++ )
          {
            message.shortID += base64[ parseInt(idBinary.substr(iChar*6, 6), 2) ] ; 
          }
          db.collection('devices').insert({'fullID' : req.body.id, 'shortID' : message.shortID, 'lastConnection' : new Date() }) ; 
        }
 
        res.status(200).json(message);
      }
    ); 

  });


  // Handle get message for the config : return the entire config from the database
  router.post('/config', (req, res, next) =>  
  {
    db.collection('devices').find({shortID: req.body.id}).toArray(function (error, results) 
      {
        if (error) 
          throw error;

        var shortID = '', alreadyInDB = false ; 

        // A device has been found, 
        if ( results.length > 0 )
        {
          shortID     = results[0].shortID ; 
          res.status(200).json(results[0].config) ; 
        } 
        else
        {
          res.sendStatus(201) ;
        }
      }) ;
  });

  return router;
}