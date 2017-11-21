import React, {Component} from 'react';
import * as superagent from 'superagent';
import 'isomorphic-fetch';
import {LineChart} from 'react-d3';

export default class extends Component {

  static async getInitialProps ({ req }) 
  {
    if (req) 
    {
      // If `req` is defined, we're rendering on the server and should use
      // MongoDB directly. You could also use the REST API, but that's slow
      // and inelegant.
      const { db } = req
      // Note that `db` above comes from express middleware
      const listDevices = await db.collection('devices').find().sort({ lastConnection: -1 }).toArray()
      var list = [] 
      
      for ( var iDevices = 0 ; iDevices < listDevices.length ; iDevices++ )
      {
        var currentList = { 'fullID' : listDevices[iDevices].fullID, 'shortID' : listDevices[iDevices].shortID, 'lastConnection' : listDevices[iDevices].lastConnection } 
        const listData  = await db.collection('data').find({ "date": {  $gte: new Date(Date.now() - 1 * 1000 * 60 * 60)}, 'deviceFullID' : listDevices[iDevices].fullID}).sort({'date' : 1}).toArray()
        currentList.data = listData ; 
        list.push(currentList)
      }

      return { list }
    }

    // Otherwise, we're rendering on the client and need to use the API
    var { list } = await superagent.get('http://localhost:3000/api')
      .then(res => res.body)
    return { list }
  }

  constructor() 
  {
    super();
    this.state= {
      test: "Coucou list"
    };
  }

  render() 
  {
    var deviceData = this.props.list ;

    var lineData = [] ;
    for ( var iDevice = 0 ; iDevice < deviceData.length ; iDevice++ )
    {
      if ( deviceData[iDevice].data.length > 0 )
      {
        var line = {name: deviceData[iDevice].fullID, values: [] } ;
        for ( var iData = 0 ; iData < deviceData[iDevice].data.length ; iData++  )
        {
          line.values.push({x: new Date(deviceData[iDevice].data[iData].date), y: deviceData[iDevice].data[iData].data }) ; 
        }
        
        lineData.push(line) ; 
      }

    }

    return (
        <div>
          <LineChart
            data={lineData}
            width={1500}
            height={800}
          />
        </div>
    );
  }

  /* ... */
}