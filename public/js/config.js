$(function() 
{
	var timeouts 	= [] ; 
	var iColor 		= 0 ;
	var colors 		= ["#F44336", "#2196F3", "#4CAF50", "#FF9800", "#E91E63", "#03A9F4", "#8BC34A", "#FF5722", "#9C27B0", "#00BCD4", "#CDDC39", "#795548", "#673AB7", "#FFC107", "#3F51B5", "#009688", "#FFEB3B"] ; 

	var maxValueYAxis = 150 ; 


	// Chart definition 
	var chartContext = document.getElementById("chart").getContext('2d');
	var chart = new Chart(chartContext, {
	    type: 'scatter',
	    data: { datasets: [] }, 
	    options: {
	        scales: {
	            xAxes: [{
	                type: 'time',
	                position: 'bottom'
	            }],
	            yAxes: [{
	                ticks: {
	                    beginAtZero:true,
		                min: 0,
		                max: 450
	                },
	            }]
	        },
	        title: {
	            display: true,
	            text: 'Niveaux de bruit'
	        },
			showLines: true,
            spanGaps: true
	    }
	});

	// Make the border of a device card blink, meaning a value changed successfully 
	function blinkCard(id)
	{
		for ( var iTimeout = 0 ; iTimeout < timeouts.length ; iTimeout ++ )
		{
			if ( timeouts[iTimeout].id == id )
				clearTimeout(timeouts[iTimeout].timeout ) ; 
		}

		timeouts.push({id: id, timeout: setTimeout( function() 
		{
			$( "#"+id ).queue(function() { $( this ).addClass( "border-success" ).dequeue(); }).delay( 100 ).queue(function() { $( this ).removeClass( "border-success" ).dequeue(); }).delay( 100 ).queue(function() { $( this ).addClass( "border-success" ).dequeue(); }).delay( 100 ).queue(function() { $( this ).removeClass( "border-success" ).dequeue(); }).delay( 100 ).queue(function() { $( this ).addClass( "border-success" ).dequeue(); }).delay( 100 ).queue(function() { $( this ).removeClass( "border-success" ).dequeue(); }).delay( 100 ) ;
		}, 1500) } ) ; 
	}

	// Change of configuration
	$( "select" ).change(function() 
	{	
		var splitID = $(this).attr("id").split("-") ; 
		
		$.post({
			url:"./", 
			contentType : 'application/json', 
			data: JSON.stringify({ fullID: splitID[1], field: splitID[0], value: $(this)[0].options[$(this)[0].selectedIndex].value }),
			success: function(response) { blinkCard(response.fullID) ; } }) ;
	}) ; 
	$( "input" ).change(function () 
	{
		var splitID = $(this).attr("id").split("-") ; 
		
		$.post( {
			url:"./", 
			contentType : 'application/json', 
			data: JSON.stringify({ fullID: splitID[1], field: splitID[0], value: $(this).val() }),
			success: function(response) { blinkCard(response.fullID) ; } }) ;
	}) ;

	// Navigation management
	$(".nav-item a").click(function ()
	{
		var itemDisplay = $(this).attr('href') ; 

		$(".nav-item a").each(function() 
		{
			if ( $($(this).attr('href')).attr('class').indexOf("d-none") != -1 && $(this).attr('href') == itemDisplay )
			{
				$($(this).attr('href')).removeClass("d-none") ;
				$(this).parent().addClass("active") ; 	
			}
			else if ( $(this).attr('href') != itemDisplay )
			{
				$($(this).attr('href')).addClass("d-none") ;
				$(this).parent().removeClass("active") ;
			}
		}) ; 

	}) ; 


	// Function to refresh the graph : add new series, add new data
	function  refreshGraph()
	{
		$.get({
			url:"./api/chartData/",
			success: function(response)
			{
				for ( var iDevice = 0 ; iDevice < response.length ; iDevice++ )
				{
					var deviceInChart = -1 ; 
					for ( var iSeries = 0 ; iSeries < chart.data.datasets.length && deviceInChart == -1 ; iSeries++ )
					{
						if ( chart.data.datasets[iSeries].id == response[iDevice].id )
						{
							deviceInChart = iSeries ; 
						}
					}

					// Update the max value for the y axis if needed
					for ( var iValue = 0 ; iValue < response[iDevice].values.length ; iValue++ ) 
					{
						if ( response[iDevice].values[iValue].y > maxValueYAxis  )
							maxValueYAxis = response[iDevice].values[iValue].y ; 
					}
					chart.options.scales.yAxes[0].ticks.max = maxValueYAxis + 5 ;

					// If the device is not already displayed on the chart, add it
					if ( deviceInChart == -1)
					{
						chart.data.datasets.push( {
							id: response[iDevice].id, 
							lastDate: new Date(response[iDevice].values[ response[iDevice].values.length - 1 ].x),
							label: response[iDevice].name, 
							data: response[iDevice].values, 
							borderColor: colors[iColor], 
							backgroundColor: "rgba(0,0,0,0)",
				            pointBorderColor: colors[iColor],
				            pointBackgroundColor: colors[iColor],
				            pointBorderWidth: "0",
					    	pointRadius: 0
				        } ) ;
				        iColor = (iColor + 1) % colors.length ; 
					}
					// Update the points if the device is already displayed on the chart
					else
					{
						for ( var iData = 0 ; iData < response[iDevice].values.length ; iData++ )
						{
							var dateData = new Date(response[iDevice].values[iData].x) ; 
							if ( dateData > chart.data.datasets[deviceInChart].lastDate )
							{
								chart.data.datasets[deviceInChart].data.push( response[iDevice].values[iData] ) ;  
							}
						}
						chart.data.datasets[deviceInChart].lastDate = new Date(response[iDevice].values[ response[iDevice].values.length - 1 ].x) ;
						chart.data.datasets[deviceInChart].label 	= response[iDevice].name ; 
					}

				}
			    chart.update();
			}
		}).always( function() { setTimeout(refreshGraph, 5*1000) ;  } ) ;
	}


	function sendDateServer()
	{
		var dateNow = new Date() ; 
		$.post( {
			url:"./date/", 
			contentType : 'application/json', 
			data: JSON.stringify({ date: dateNow } ), 
			success: function(response) { console.log(response) ; } } ) ;

		setTimeout(sendDateServer, 5*1000) ;
	}


	refreshGraph() ; 
	sendDateServer() ; 

	// Send data to endpoint to trigger compilation
	$.post( { url:"./", contentType : 'application/json', data: JSON.stringify({ }) }) ;
	$.post( { url:"./api/device/", contentType : 'application/json', data: JSON.stringify({ }) }) ;
	$.post( { url:"./api/data/", contentType : 'application/json', data: JSON.stringify({ }) }) ;
	$.get( { url:"./api/device/" }) ;
});
