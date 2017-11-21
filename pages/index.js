import React, {Component} from 'react';
import * as superagent from 'superagent';
import 'isomorphic-fetch';
import {LineChart} from 'react-d3';

const ReactHeatmap = require('react-heatmap');

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

    var lineData = [], heatData = [] ;
    for ( var iDevice = 0 ; iDevice < deviceData.length ; iDevice++ )
    {
      if ( deviceData[iDevice].data.length > 0 )
      {
        var line = {name: deviceData[iDevice].fullID, values: [] } ;

        for ( var iData = 0 ; iData < deviceData[iDevice].data.length ; iData++  )
        {
          line.values.push({x: new Date(deviceData[iDevice].data[iData].date), y: deviceData[iDevice].data[iData].data }) ; 
          heatData.push({x: Math.random() * 100, y: Math.random() * 100, value: deviceData[iDevice].data[iData].data}) ; 
        }
        
        lineData.push(line) ; 
      }

    }

    return (
        <div>
          <div>
            <LineChart
              data={lineData}
              width={1500}
              height={800}
            />
          </div>

          <div style={{width: 950, height: 850, backgroundImage: `url('https://lh3.googleusercontent.com/5kzwGd1E6wRFFhTQDAQZXj7LFi_epSer1DLXF4-UF3JlROMorWCf0QN2CgftQhcq_CSBt8hOWDwVuNAWeFqyZBKUSFMCYpxz_19IDamHH9ffi86_0bA19OLaXeTAXZcDHe_USj7IeGvamy7PW_5Lq51rEbY-a3luKkGGyLslr9eoDyAKfCG86wFgUzCZlWumo6wGGS0NYq__TrIC9uvkHb1X6fpB43rDjriTVttDPi8PJ4f9LBI4MLUDdslkr44KeK9dENB1CuVsKQzSEJ3LlRNvLBa97wpcLY5A6lqvpyZWtYKTfPFW-fgfWyrUi2s0RaV4OTZZ7Fn5G991sqX9lX0V2erCToJ29pgjXSsaF6qempSJ3EtW9lrWgJE3KOfbrl2qlDqZCh2YsdlYKx-r4cAfr4wrgg8bJwU1oCDyZ2mAHGelNDaU1mDNhZtVgdHqaqlOwMliG8N1UbMghCcWLiVIbEnAm9zSIsc9_HSNyZLxImkYX-MVNrUp1pW2fnfBP8oNcleFHkps7f2YqOGKh8oqh6BKM4CiTxtrNedc0tn8gahTr47NDAk2X8o7lj2SPmp9TYUn1gsvhIejaCB5MCVSOPc4deWDaAbKq7O3=w950-h850-no')`}} >
            <ReactHeatmap max={20} data={heatData} radius={100} />
          </div>
        </div>
    );
  }

  /* ... */
}