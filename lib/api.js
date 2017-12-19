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
    res.sendStatus(403) ; 
  });


  // Get all data
  router.get('/chartData',(req, res, next) => 
  {
    let list = [] 
    let listDevices = [] ; 

    db.collection('devices').find().sort({ lastConnection: -1 }).toArray(function (error, results) 
    {
      if (error) 
        throw error;

      let nbDevicesDataWait = results.length ; 

      for ( var iDevices = 0 ; iDevices < results.length ; iDevices++ )
      { 
        listDevices[results[iDevices].fullID] = results[iDevices] ;

        db.collection('data').find({ "date": {  $gte: new Date(Date.now() - 12 * 1000 * 60 * 60)}, 'deviceFullID' : results[iDevices].fullID}).sort({'date' : 1}).toArray(function(error, results)
        {
          if (error) 
            throw error;

          if ( results.length > 0 )
          {
            let name = typeof listDevices[results[0].deviceFullID].config.name == "undefined" ? results[0].deviceFullID : listDevices[results[0].deviceFullID].config.name ;
            list.push( {id: results[0].deviceFullID, name: name, values: results.map(function(element) { return {x: new Date(element.date), y: element.data} ;}) } ) ;
          }

          nbDevicesDataWait-- ; 
          if ( nbDevicesDataWait == 0 )
            res.json(list) ; 

        }) ; 
      } 
    }) ;

  });


  // Handle post message to data
  router.post('/data', (req, res, next) =>  
  {
    // ACK the message as quickly as possible if this is not the last message
    if ( req.body.last == false )
    {
      res.sendStatus(200) ;
    }

    db.collection('devices').find({shortID: req.body.id}).toArray(function (error, results) 
    {
      if (error) 
        throw error;

      // A device has been found, 
      if ( results.length > 0 )
      {
        if ( req.body.last == true )
        {
          res.json({shortID: results[0].shortID, config: results[0].config }) ; 
        }

        // If this is not the first message, retrieve the last data added to have a reference for the timstamp
        if ( req.body.first == false )
        {
          db.collection('data').findOne({ 'deviceFullID' : results[0].fullID}, {"sort" : [['date', 'desc']]}, function(error, results)
          {
            if (error) 
              throw error;

            var dateRef = new Date(results.date) ;  

            for ( var iData = 0 ; iData < req.body.noise.length ; iData++ )
            { 
              var dateData = dateRef.getTime() + (iData + 1) * parseInt(req.body.interval) ; 
              dateData = new Date(dateData) ; 
              db.collection("data").insert({'deviceFullID' : results.deviceFullID, 'data' : parseInt(req.body.noise[iData]), 'date' : dateData}, function(err, res) { if (err) throw err; } ) ; 
            }
          }) ;
        }
        // Else, juste write data, taking into account the total number of values to build the timestamp
        else
        {
          for ( var iData = 0 ; iData < req.body.noise.length ; iData++ )
          { 
            db.collection("data").insert({'deviceFullID' : results[0].fullID, 'data' : parseInt(req.body.noise[iData]), 'date' : new Date(Date.now() - (parseInt(req.body.nbElements) - iData) * req.body.interval)}, function(err, res) { if (err) throw err; } ) ; 
          }
        }
      }
      else
      {
        res.sendStatus(200) ; 
        console.log("No device found for shortID " + req.body.id) ;
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