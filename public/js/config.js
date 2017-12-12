$(function() 
{
	var timeouts = [] ; 

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


});