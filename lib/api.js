const Archetype = require('archetype-js');
//const BookType = require('./book');
//const { ObjectId } = require('mongodb');
const express = require('express');


/* Organization of the database :
 *  - a collection containing the devices : full ID (MAC address), short ID (4 characters), timestamp last data 
 *  - a collection containing the measures : device ID, noise
 **/

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
  router.get('/',(req, res, next) => {
    return db.collection('devices').find().toArray(function(err, results) {
      res.json(results);
      return results;
    });
  });

  // Get a specific device
  router.get('/:uid',(req, res, next) => {
    return db.collection('devices').find({uid:req.params.uid}).toArray(function(err, results) {
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

        // A device has been found, 
        if ( results.length > 0 )
        {
          shortID     = results[0].shortID ; 
          alreadyInDB = true ; 

          db.collection("devices").updateOne({'_id' : results[0]._id}, { $set: { 'lastConnection': new Date() } }, function(err, res) { if (err) throw err; } ) ;
        } 
        else
        {
          db.collection('devices').insert({'fullID' : req.body.id, 'shortID' : req.body.id.slice(0, 5).replace(':', ''), 'lastConnection' : new Date() }) ; 
          shortID = req.body.id.slice(0, 5).replace(':', '') ; 
        }
        const message = {'shortID' : shortID, 'already' : alreadyInDB} ; 
        res.status(200).json(message);
      }
    ); 

  });

  return router;
}