$(function() 
{
	$( "select" ).change(function() 
	{	
		$.post( {url:"./", contentType : 'application/json', data: JSON.stringify({ fullID: $(this).attr("id").split("-")[1], field: $(this).attr("id").split("-")[0], value: $(this)[0].options[$(this)[0].selectedIndex].value }) } );
	}) ; 


	$( "input" ).change(function () 
	{
		$.post( {url:"./", contentType : 'application/json', data: JSON.stringify({ fullID: $(this).attr("id").split("-")[1], field: $(this).attr("id").split("-")[0], value: $(this).val() }) } );
	}) ;


});